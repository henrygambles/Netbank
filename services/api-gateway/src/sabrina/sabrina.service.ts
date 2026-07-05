import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaService } from '../prisma/prisma.service'
import { PriceService } from '../crypto/price.service'
import { OpenBankingService } from '../open-banking/open-banking.service'
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
      description: 'Search the web for financial news, music recommendations, rates, or any information. Use this to find current facts.',
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'The search query' } },
        required: ['query'],
      },
    },
    {
      name: 'search_youtube',
      description: 'Search YouTube for music videos, songs, playlists, or any video content. Returns video IDs to embed inline in chat.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'e.g. "Taylor Swift Anti-Hero official video" or "lofi hip hop playlist"' },
        },
        required: ['query'],
      },
    },
    {
      name: 'generate_image',
      description: 'Generate an image from a text description using AI. Use for creating visual content, illustrations, or anything the user asks to see.',
      input_schema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Detailed description of the image to generate' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'get_savings_pots',
      description: 'Get all savings pots and their progress toward goals',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'get_open_banking_accounts',
      description: 'Get all connected bank accounts via Open Banking (Plaid) including current accounts, savings, and credit cards with their balances',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'get_open_banking_transactions',
      description: 'Get real bank transactions from connected Open Banking accounts, with merchant names, categories, and amounts',
      input_schema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of transactions to return (default 50)', default: 50 },
          category: { type: 'string', description: 'Filter by category e.g. Groceries, Transport, Eating Out' },
          search: { type: 'string', description: 'Search by merchant name' },
        },
      },
    },
  ]

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private prices: PriceService,
    private openBanking: OpenBankingService,
  ) {
    this.client = new Anthropic({ apiKey: this.config.getOrThrow('ANTHROPIC_API_KEY') })
  }

  async *chat(
    userId: string,
    message: string,
    conversationId?: string,
    images?: string[],
  ): AsyncGenerator<SabrinaStreamEvent> {
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

    // Build user content — text only, or text + images for vision
    const userContent: Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> = []

    if (images && images.length > 0) {
      for (const img of images) {
        const match = img.match(/^data:([^;]+);base64,(.+)$/)
        if (match) {
          userContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: match[2],
            },
          })
        }
      }
    }

    userContent.push({ type: 'text', text: message })

    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: 'user', content: userContent.length === 1 ? message : userContent },
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

  async getConversation(userId: string, conversationId: string) {
    return this.prisma.sabrinaConversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
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
        const apiKey = this.config.get('BRAVE_SEARCH_API_KEY')
        if (!apiKey) {
          return { error: 'Web search not configured — add BRAVE_SEARCH_API_KEY to enable live results.' }
        }
        try {
          const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(input.query as string)}&count=6`
          const res = await fetch(url, {
            headers: {
              'X-Subscription-Token': apiKey,
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip',
            },
          })
          if (!res.ok) return { error: `Search failed: HTTP ${res.status}` }
          const data = await res.json() as any
          return (data.web?.results ?? []).map((r: any) => ({
            title: r.title,
            url: r.url,
            description: r.description,
          }))
        } catch (err: any) {
          return { error: `Search error: ${err.message}` }
        }
      }
      case 'search_youtube': {
        const apiKey = this.config.get('BRAVE_SEARCH_API_KEY')
        if (!apiKey) {
          return { error: 'YouTube search not configured — add BRAVE_SEARCH_API_KEY to enable video search.' }
        }
        try {
          // Try Brave video search first, fall back to web search scoped to YouTube
          const videoUrl = `https://api.search.brave.com/res/v1/videos/search?q=${encodeURIComponent(input.query as string)}&count=5`
          const res = await fetch(videoUrl, {
            headers: {
              'X-Subscription-Token': apiKey,
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip',
            },
          })

          let results: Array<{ title: string; videoId: string; url: string; thumbnail?: string }> = []

          if (res.ok) {
            const data = await res.json() as any
            results = (data.results ?? [])
              .map((r: any) => {
                const idMatch = (r.url ?? '').match(/[?&]v=([a-zA-Z0-9_-]{11})/) ?? (r.url ?? '').match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
                return { title: r.title, videoId: idMatch?.[1] ?? null, url: r.url, thumbnail: r.thumbnail?.src }
              })
              .filter((r: any) => r.videoId)
          }

          // Fall back: web search scoped to youtube.com
          if (results.length === 0) {
            const webUrl = `https://api.search.brave.com/res/v1/web/search?q=site:youtube.com+${encodeURIComponent(input.query as string)}&count=6`
            const webRes = await fetch(webUrl, {
              headers: {
                'X-Subscription-Token': apiKey,
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
              },
            })
            if (webRes.ok) {
              const data = await webRes.json() as any
              results = (data.web?.results ?? [])
                .map((r: any) => {
                  const idMatch = (r.url ?? '').match(/[?&]v=([a-zA-Z0-9_-]{11})/) ?? (r.url ?? '').match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
                  return { title: r.title, videoId: idMatch?.[1] ?? null, url: r.url }
                })
                .filter((r: any) => r.videoId)
            }
          }

          return results.slice(0, 5)
        } catch (err: any) {
          return { error: `YouTube search error: ${err.message}` }
        }
      }
      case 'generate_image': {
        const falKey = this.config.get('FAL_API_KEY')
        if (!falKey) {
          return { error: 'Image generation not configured — add FAL_API_KEY to enable AI image generation.' }
        }
        try {
          const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
            method: 'POST',
            headers: {
              'Authorization': `Key ${falKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: input.prompt as string,
              num_images: 1,
              image_size: 'landscape_4_3',
              num_inference_steps: 4,
            }),
          })
          if (!res.ok) {
            const body = await res.text()
            return { error: `Image generation failed: HTTP ${res.status} — ${body.slice(0, 200)}` }
          }
          const data = await res.json() as any
          const imageUrl = data.images?.[0]?.url
          if (!imageUrl) return { error: 'No image returned by generation service' }
          return { imageUrl, prompt: input.prompt }
        } catch (err: any) {
          return { error: `Image generation error: ${err.message}` }
        }
      }
      case 'get_savings_pots': {
        const accounts = await this.prisma.account.findMany({ where: { userId }, include: { pots: true } })
        return accounts.flatMap(a => a.pots)
      }
      case 'get_open_banking_accounts': {
        return this.openBanking.getAccountsSummaryForSabrina(userId)
      }
      case 'get_open_banking_transactions': {
        return this.openBanking.getTransactionsSummaryForSabrina(
          userId,
          (input.limit as number) ?? 50,
        )
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
- Real web search for current rates, news, financial information, and music recommendations
- YouTube video search and inline embedding (embed with [youtube:VIDEO_ID])
- AI image generation via generate_image tool (embed result with [image:URL])
- Vision — you can see images the user shares with you
- Deep knowledge of personal finance, investing, crypto, and tax (UK-focused)

Embedding media in your responses:
- YouTube videos: Use [youtube:VIDEO_ID] to embed a video inline. Example: [youtube:dQw4w9WgXcQ]
- Generated images: After calling generate_image, embed the result with [image:URL]. Example: [image:https://cdn.fal.ai/...]
- Always add a short sentence before or after each embed so the user has context.
- Only embed media when it genuinely adds value — don't spam embeds.

Music & entertainment:
- When users ask for music recommendations, search YouTube and embed the top result(s)
- Be enthusiastic and specific — mention genre, vibe, why you chose it

What you never do:
- Make transactions or move money without explicit confirmation
- Give specific investment advice (suggest they speak to an IFA for regulated advice)
- Share any user data outside this conversation

Current user ID: ${userId}
Today's date: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
`
  }
}
