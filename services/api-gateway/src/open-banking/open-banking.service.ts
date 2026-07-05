import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import {
  PlaidApi,
  PlaidEnvironments,
  Configuration,
  Products,
  CountryCode,
} from 'plaid'

@Injectable()
export class OpenBankingService {
  private readonly logger = new Logger(OpenBankingService.name)
  private readonly plaid: PlaidApi

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const env = this.config.get('PLAID_ENV') ?? 'sandbox'
    const configuration = new Configuration({
      basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': this.config.getOrThrow('PLAID_CLIENT_ID'),
          'PLAID-SECRET': this.config.getOrThrow('PLAID_SECRET'),
        },
      },
    })
    this.plaid = new PlaidApi(configuration)
  }

  async createLinkToken(userId: string, redirectUri?: string): Promise<{ linkToken: string }> {
    this.logger.log(`Creating link token for user ${userId}${redirectUri ? ` redirect_uri=${redirectUri}` : ''}`)
    try {
      const response = await this.plaid.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: 'Netbank',
        products: [Products.Transactions],
        country_codes: [CountryCode.Gb],
        language: 'en',
        ...(redirectUri ? { redirect_uri: redirectUri } : {}),
      })
      this.logger.log(`Link token created for user ${userId}`)
      return { linkToken: response.data.link_token }
    } catch (err: any) {
      const plaidError = err?.response?.data
      this.logger.error(`Plaid link token error: ${JSON.stringify(plaidError ?? err?.message)}`)
      throw err
    }
  }

  // Serves an HTML page with Plaid's JS SDK for Phase 2 OAuth completion.
  // Phase 2 only — Plaid's *hosted* link page (cdn.plaid.com/link.html) shows a
  // success screen after account selection but never redirects, so onSuccess never
  // fires. Serving our own page gives us the JS callback we need.
  buildLinkPage(linkToken: string, receivedRedirectUri?: string): string {
    const extraConfig = receivedRedirectUri
      ? `receivedRedirectUri: ${JSON.stringify(receivedRedirectUri)},`
      : ''
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0d0d1a; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: -apple-system, sans-serif; }
    #msg { color: rgba(255,255,255,0.4); font-size: 15px; }
    #err { color: #ff6b6b; font-size: 13px; display: none; padding: 0 24px; text-align: center; }
  </style>
</head>
<body>
  <p id="msg">Completing connection…</p>
  <p id="err"></p>
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
    onerror="document.getElementById('err').textContent='Could not load Plaid SDK'; document.getElementById('err').style.display='block'">
  </script>
  <script>
    var handler = Plaid.create({
      token: ${JSON.stringify(linkToken)},
      ${extraConfig}
      onSuccess: function(publicToken, metadata) {
        var inst = (metadata && metadata.institution) || {};
        window.location.href = 'netbank://ob-callback'
          + '?public_token=' + encodeURIComponent(publicToken)
          + '&institution_id=' + encodeURIComponent(inst.institution_id || '')
          + '&institution_name=' + encodeURIComponent(inst.name || 'Bank');
      },
      onExit: function() {
        window.location.href = 'netbank://ob-callback?cancelled=true';
      }
    });
    handler.open();
  </script>
</body>
</html>`
  }

  async exchangePublicToken(
    userId: string,
    publicToken: string,
    institutionId: string,
    institutionName: string,
  ) {
    const exchangeResponse = await this.plaid.itemPublicTokenExchange({ public_token: publicToken })
    const { access_token: accessToken, item_id: itemId } = exchangeResponse.data

    const connection = await this.prisma.openBankingConnection.upsert({
      where: { userId_itemId: { userId, itemId } },
      create: { userId, itemId, institutionId, institutionName, accessToken, status: 'ACTIVE' },
      update: { accessToken, status: 'ACTIVE', cursor: null },
    })

    // Sync accounts immediately
    const accountsResponse = await this.plaid.accountsGet({ access_token: accessToken })
    for (const account of accountsResponse.data.accounts) {
      await this.prisma.openBankingAccount.upsert({
        where: { connectionId_externalId: { connectionId: connection.id, externalId: account.account_id } },
        create: {
          connectionId: connection.id,
          userId,
          externalId: account.account_id,
          accountType: account.type,
          subtype: account.subtype ?? null,
          displayName: account.name,
          currency: account.balances.iso_currency_code ?? 'GBP',
          balance: account.balances.current ?? 0,
          creditLimit: account.balances.limit ?? null,
          providerName: institutionName,
        },
        update: {
          balance: account.balances.current ?? 0,
          creditLimit: account.balances.limit ?? null,
        },
      })
    }

    // Initial transaction sync (non-blocking — fire and forget)
    this.syncConnection(connection.id, accessToken, userId).catch(err =>
      this.logger.error(`Initial sync failed for connection ${connection.id}: ${err.message}`),
    )

    return { success: true, institutionName }
  }

  async getConnections(userId: string) {
    return this.prisma.openBankingConnection.findMany({
      where: { userId },
      include: { accounts: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getTransactions(userId: string, limit = 100) {
    return this.prisma.openBankingTransaction.findMany({
      where: { userId },
      include: { account: { include: { connection: { select: { institutionName: true, status: true } } } } },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
  }

  async syncAll(userId: string) {
    const connections = await this.prisma.openBankingConnection.findMany({
      where: { userId, status: 'ACTIVE' },
    })
    await Promise.allSettled(
      connections.map(conn => this.syncConnection(conn.id, conn.accessToken, userId)),
    )
    return { synced: connections.length }
  }

  async getAccountsSummaryForSabrina(userId: string) {
    const accounts = await this.prisma.openBankingAccount.findMany({
      where: { userId },
      include: { connection: { select: { institutionName: true, status: true } } },
    })
    return accounts.map(a => ({
      displayName: a.displayName,
      type: a.accountType,
      subtype: a.subtype,
      balance: a.balance?.toString(),
      currency: a.currency,
      institution: a.connection.institutionName,
      status: a.connection.status,
    }))
  }

  async getTransactionsSummaryForSabrina(userId: string, limit = 50) {
    const txs = await this.prisma.openBankingTransaction.findMany({
      where: { userId },
      include: { account: { select: { displayName: true, connection: { select: { institutionName: true } } } } },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
    return txs.map(t => ({
      date: t.timestamp,
      description: t.description,
      merchantName: t.merchantName,
      amount: t.amount.toString(),
      currency: t.currency,
      category: t.category,
      account: t.account.displayName,
      institution: t.account.connection.institutionName,
    }))
  }

  private async syncConnection(connectionId: string, accessToken: string, userId: string) {
    const connection = await this.prisma.openBankingConnection.findUnique({ where: { id: connectionId } })
    let cursor = connection?.cursor ?? undefined
    let hasMore = true

    while (hasMore) {
      const response = await this.plaid.transactionsSync({
        access_token: accessToken,
        ...(cursor ? { cursor } : {}),
      })

      const { added, modified, removed, next_cursor, has_more } = response.data

      for (const tx of [...added, ...modified]) {
        const accountId = await this.resolveAccountId(connectionId, userId, tx.account_id, accessToken)
        // Plaid: positive = debit (spending), negative = credit (income).
        // Store negated so positive = money coming in, matching the rest of the app.
        const amount = -tx.amount
        await this.prisma.openBankingTransaction.upsert({
          where: { externalId: tx.transaction_id },
          create: {
            userId,
            externalId: tx.transaction_id,
            accountId,
            timestamp: new Date(tx.date),
            description: tx.name,
            amount,
            currency: tx.iso_currency_code ?? 'GBP',
            merchantName: tx.merchant_name ?? null,
            category: this.mapCategory(tx.personal_finance_category?.primary ?? tx.category?.[0]),
            categoryEmoji: this.categoryEmoji(tx.personal_finance_category?.primary ?? tx.category?.[0]),
          },
          update: {
            amount,
            merchantName: tx.merchant_name ?? null,
            category: this.mapCategory(tx.personal_finance_category?.primary ?? tx.category?.[0]),
          },
        })
      }

      for (const tx of removed) {
        await this.prisma.openBankingTransaction.deleteMany({ where: { externalId: tx.transaction_id } })
      }

      cursor = next_cursor
      hasMore = has_more
    }

    await this.prisma.openBankingConnection.update({ where: { id: connectionId }, data: { cursor } })
    this.logger.log(`Synced connection ${connectionId}`)
  }

  private async resolveAccountId(
    connectionId: string,
    userId: string,
    externalId: string,
    accessToken: string,
  ): Promise<string> {
    const existing = await this.prisma.openBankingAccount.findUnique({
      where: { connectionId_externalId: { connectionId, externalId } },
    })
    if (existing) return existing.id

    const resp = await this.plaid.accountsGet({ access_token: accessToken })
    const account = resp.data.accounts.find(a => a.account_id === externalId)

    const created = await this.prisma.openBankingAccount.create({
      data: {
        connectionId,
        userId,
        externalId,
        accountType: account?.type ?? 'depository',
        subtype: account?.subtype ?? null,
        displayName: account?.name ?? 'Account',
        currency: account?.balances.iso_currency_code ?? 'GBP',
        balance: account?.balances.current ?? 0,
      },
    })
    return created.id
  }

  private mapCategory(raw?: string | null): string {
    if (!raw) return 'Other'
    const map: Record<string, string> = {
      FOOD_AND_DRINK: 'Eating Out',
      GROCERIES: 'Groceries',
      TRANSPORTATION: 'Transport',
      TRAVEL: 'Travel',
      ENTERTAINMENT: 'Entertainment',
      SHOPPING: 'Shopping',
      GENERAL_MERCHANDISE: 'Shopping',
      MEDICAL: 'Health',
      HEALTHCARE: 'Health',
      PERSONAL_CARE: 'Personal Care',
      RENT_AND_UTILITIES: 'Bills',
      UTILITIES: 'Bills',
      LOAN_PAYMENTS: 'Bills',
      BANK_FEES: 'Bills',
      INCOME: 'Income',
      TRANSFER_IN: 'Transfer',
      TRANSFER_OUT: 'Transfer',
      GENERAL_SERVICES: 'Other',
      HOME_IMPROVEMENT: 'Other',
      GOVERNMENT_AND_NON_PROFIT: 'Other',
      EDUCATION: 'Education',
    }
    return map[raw.toUpperCase()] ?? 'Other'
  }

  private categoryEmoji(raw?: string | null): string {
    const map: Record<string, string> = {
      FOOD_AND_DRINK: '🍔',
      GROCERIES: '🛒',
      TRANSPORTATION: '🚗',
      TRAVEL: '✈️',
      ENTERTAINMENT: '🎬',
      SHOPPING: '🛍️',
      GENERAL_MERCHANDISE: '🏪',
      MEDICAL: '🏥',
      HEALTHCARE: '🏥',
      PERSONAL_CARE: '💆',
      RENT_AND_UTILITIES: '🏠',
      UTILITIES: '💡',
      LOAN_PAYMENTS: '💳',
      BANK_FEES: '🏦',
      INCOME: '💰',
      TRANSFER_IN: '↩️',
      TRANSFER_OUT: '↪️',
      GENERAL_SERVICES: '⚙️',
      HOME_IMPROVEMENT: '🔨',
      EDUCATION: '📚',
    }
    return map[raw?.toUpperCase() ?? ''] ?? '💳'
  }
}
