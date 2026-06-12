import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaService } from '../prisma/prisma.service'
import { PriceService } from '../crypto/price.service'
import type { SabrinaStreamEvent, CryptoCurrency } from '@netbank/types'

@Injectable()
export class SabrinaService {
  private readonly logger = new Logger(SabrinaService.name)
  private readonly client: Anthropic

  private readonly tools: Anthropic.Tool[] = [
    {
      name: 'get_account_balance',
      description: 'Get the current balance and details for a user account',
      input_schema: {
        type: 'object',
        properties: { accountId: { type: 'string', description: 'The account ID, or "all" for all accounts' } },
        required: ['accountId'],
      },
    },
    {
      name: 'get_transactions',
      description: 'Get recent transactions for a user, with optional filters',
      input_schema: {
        type: 'object',
        properties: {
          accountId: { type: 'string' },
          limit: { type: 'number', default: 20 },
          category: { type: 'string' },
          from: { type: 'string', description: 'ISO date string' },
          to: { type: 'string', description: 'ISO date string' },
        },
      },
    },
    {
      name: 'get_spending_summary',
      description: 'Analyse spending patterns for a given period',
      input_schema: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['week', 'month', 'year'], default: 'month' },
          groupBy: { type: 'string', enum: ['category', 'merchant', 'day'], default: 'category' },
        },
      },
    },
    {
      name: 'get_crypto_portfolio',
      description: 'Get the user\'s cryptocurrency portfolio value and holdings',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'get_crypto_price',
      description: 'Get the current price and 7-day sparkline for a cryptocurrency',
      input_schema: {
        type: 'object',
        properties: { currency: { type: 'string', description: 'e.g. BTC, ETH, XMR' } },
        required: ['currency'],
      },
    },
    {
      name: 'search_web',
      description: 'Search the web for financial news, rates, or information',
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
    {
      name: 'get_savings_pots',
      description: 'Get all savings pots and their progress toward goals',
      input_schema: { type: 'object', properties: {} },
    },
  ]

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private prices: PriceService,
  ) {
    this.client = new Anthropic({ apiKey: this.config.getOrThrow('ANTHROPIC_API_KEY') })
  }

  async *chat(userId: string, message: string, conversationId?: string): AsyncGenerator<SabrinaStreamEvent> {
    let convo = conversationId
      ? await this.prisma.sabrinaConversation.findFirst({
          where: { id: conversationId, userId },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        })
      : null

    if (!convo) {
      convo = await this.prisma.sabrinaConversation.create({
        data: { userId, title: message.slice(0, 60) },
        include: { messages: true },
      })
    }

    await this.prisma.sabrinaMessage.create({
      data: { conversationId: convo.id, role: 'user', content: message },
    })

    yield { type: 'message_start', conversationId: convo.id }

    const history = convo.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: 'user', content: message },
    ]

    let fullResponse = ''
    let continueLoop = true

    while (continueLoop) {
      const stream = this.client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: this.systemPrompt(userId),
        tools: this.tools,
        messages,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            yield { type: 'content_delta', delta: event.delta.text }
            fullResponse += event.delta.text
          }
        }
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            yield { type: 'tool_use', toolName: event.content_block.name, toolInput: {} }
          }
        }
      }

      const finalMsg = await stream.finalMessage()

      if (finalMsg.stop_reason === 'tool_use') {
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of finalMsg.content) {
          if (block.type === 'tool_use') {
            const result = await this.executeTool(userId, block.name, block.input as Record<string, unknown>)
            yield { type: 'tool_result', toolName: block.name, result: JSON.stringify(result) }
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
          }
        }

        messages.push({ role: 'assistant', content: finalMsg.content })
        messages.push({ role: 'user', content: toolResults })
      } else {
        continueLoop = false
      }
    }

    const saved = await this.prisma.sabrinaMessage.create({
      data: { conversationId: convo.id, role: 'assistant', content: fullResponse },
    })

    yield { type: 'message_end', messageId: saved.id }
  }

  async getConversations(userId: string) {
    return this.prisma.sabrinaConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
    })
  }

  private async executeTool(userId: string, name: string, input: Record<string, unknown>) {
    switch (name) {
      case 'get_account_balance': {
        const where = input.accountId === 'all' ? { userId } : { id: input.accountId as string, userId }
        return this.prisma.account.findMany({ where })
      }
      case 'get_transactions': {
        return this.prisma.transaction.findMany({
          where: {
            userId,
            ...(input.accountId ? { accountId: input.accountId as string } : {}),
            ...(input.from ? { createdAt: { gte: new Date(input.from as string) } } : {}),
          },
          take: (input.limit as number) ?? 20,
          orderBy: { createdAt: 'desc' },
        })
      }
      case 'get_spending_summary': {
        const transactions = await this.prisma.transaction.findMany({
          where: { userId, direction: 'OUTBOUND', status: 'COMPLETED' },
          take: 200,
          orderBy: { createdAt: 'desc' },
        })
        const summary: Record<string, number> = {}
        for (const tx of transactions) {
          const key = tx.merchantCategory ?? 'Other'
          summary[key] = (summary[key] ?? 0) + parseFloat(tx.amount.toString())
        }
        return summary
      }
      case 'get_crypto_portfolio': {
        const wallets = await this.prisma.cryptoWallet.findMany({ where: { userId } })
        return wallets.map(w => ({ currency: w.currency, balance: w.balance.toString(), address: w.address }))
      }
      case 'get_crypto_price': {
        const currency = (input.currency as string).toUpperCase() as CryptoCurrency
        return this.prices.getPrice(currency)
      }
      case 'search_web': {
        // In production: integrate with Brave Search or Tavily API
        return { message: `Web search for "${input.query}" — connect a search API key to enable live results.` }
      }
      case 'get_savings_pots': {
        const accounts = await this.prisma.account.findMany({ where: { userId }, include: { pots: true } })
        return accounts.flatMap(a => a.pots)
      }
      default:
        return { error: `Unknown tool: ${name}` }
    }
  }

  private systemPrompt(userId: string): string {
    return `You are Sabrina, the intelligent financial assistant for Netbank — a modern, friendly digital bank.

Your personality:
- Warm, witty, and genuinely helpful — like a brilliant friend who happens to be great with money
- Plain English always. No jargon. If you must use a financial term, explain it in one sentence.
- Proactively spot patterns and offer insights the user didn't ask for, but keep it relevant
- Honest about limitations — if you don't know something, say so
- Never alarmist. Frame financial challenges as solvable problems

Your capabilities:
- Full read access to the user's accounts, transactions, and crypto portfolio via tools
- Ability to search the web for current rates, news, and financial information
- Deep knowledge of personal finance, investing, crypto, and tax (UK-focused)

What you never do:
- Make transactions or move money without explicit confirmation
- Give specific investment advice (suggest they speak to an IFA for regulated advice)
- Share any user data outside this conversation

Current user ID: ${userId}
Today's date: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
`
  }
}
