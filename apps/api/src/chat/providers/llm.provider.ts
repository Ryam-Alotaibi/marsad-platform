import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const SYSTEM_PROMPT =
  'أنت المستشار الذكي بمنصة مرصاد لمراقبة البنية التحتية. أجب بإيجاز وبالعربية الفصحى، ' +
  'بالاعتماد حصريًا على الحقائق المزوَّدة أدناه — لا تخترع أي رقم أو معلومة غير مذكورة فيها، ' +
  'ولا تذكر أنك نموذج لغوي أو أنك تعيد صياغة نص.';

type Backend = 'openai' | 'anthropic' | null;

/**
 * Real LLM rephrasing — activates only when OPENAI_API_KEY or ANTHROPIC_API_KEY
 * is set (OpenAI takes priority if both are present). The retrieval step
 * (chat.service.ts's buildXAnswer methods) always runs first and always
 * queries the real database regardless of whether this is configured; this
 * provider's only job is to turn those already-verified facts into a more
 * natural reply, strictly grounded in what it's given. With no API key (the
 * default in this repo), ChatService falls back to the deterministic
 * template text — see ARCHITECTURE.md.
 */
@Injectable()
export class LlmProvider {
  private readonly logger = new Logger(LlmProvider.name);
  private readonly openai: OpenAI | null;
  private readonly anthropic: Anthropic | null;
  private readonly backend: Backend;

  constructor(private readonly config: ConfigService) {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
    this.anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
    this.backend = this.openai ? 'openai' : this.anthropic ? 'anthropic' : null;
  }

  get isConfigured(): boolean {
    return this.backend !== null;
  }

  async rephrase(question: string, facts: string): Promise<string | null> {
    if (this.backend === 'openai') return this.rephraseWithOpenAI(question, facts);
    if (this.backend === 'anthropic') return this.rephraseWithAnthropic(question, facts);
    return null;
  }

  private async rephraseWithOpenAI(
    question: string,
    facts: string,
  ): Promise<string | null> {
    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `السؤال: ${question}\n\nالحقائق الفعلية من قاعدة البيانات:\n${facts}`,
          },
        ],
      });
      return response.choices[0]?.message?.content ?? null;
    } catch (err) {
      this.logger.error(`OpenAI call failed: ${(err as Error).message}`);
      return null;
    }
  }

  private async rephraseWithAnthropic(
    question: string,
    facts: string,
  ): Promise<string | null> {
    try {
      const response = await this.anthropic!.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `السؤال: ${question}\n\nالحقائق الفعلية من قاعدة البيانات:\n${facts}`,
          },
        ],
      });
      const block = response.content[0];
      return block?.type === 'text' ? block.text : null;
    } catch (err) {
      this.logger.error(`Anthropic call failed: ${(err as Error).message}`);
      return null;
    }
  }
}
