import type { FastifyInstance } from 'fastify';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '../middleware/auth';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  'You are Xen, an AI assistant built into HowFar by Xensiq. Be helpful, concise, and friendly.';

interface ChatBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function xenRoutes(app: FastifyInstance) {
  app.post<{ Body: ChatBody }>('/chat', {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: { type: 'array' },
        },
      },
    },
  }, async (req, reply) => {
    const { messages } = req.body;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    return reply.send({ reply: text });
  });
}
