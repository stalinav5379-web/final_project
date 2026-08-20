import * as fs from 'fs';
import * as path from 'path';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { MistralClient } from '../orchestrator/MistralClient';
import { PromptEngine } from '../orchestrator/PromptEngine';
import { getPageObjectFileName, getPageObjectFilePath, getSpecFileName, getSpecFilePath } from '../orchestrator/PageConfig';

const MAX_RETRIES = 3;

export class AiCodeFixSkill implements AgentSkill {
  private readonly client = new MistralClient();
  private readonly engine = new PromptEngine();

  name(): string {
    return 'AiCodeFix';
  }

  async execute(ctx: AgentContext): Promise<void> {
    const criticalCount = this.parseCriticalCount(ctx.codeReview);

    if (criticalCount === 0) {
      console.log('  No critical issues found — skipping auto-fix.');
      return;
    }

    console.log(`  Found ${criticalCount} critical issue(s) — sending to Mistral for auto-fix...`);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`  Fix attempt ${attempt}/${MAX_RETRIES}...`);

      const pageObjectFileName = getPageObjectFileName();
      const specFileName = getSpecFileName();

      const prompt = this.engine.fill(path.resolve('prompts/05b_code_fix.txt'), {
        CODE_REVIEW: ctx.codeReview,
        PAGE_OBJECT: ctx.generatedPageObject,
        SPEC: ctx.generatedSpec,
        PAGE_OBJECT_FILENAME: pageObjectFileName,
        SPEC_FILENAME: specFileName,
      });

      const raw = await this.client.chat([{ role: 'user', content: prompt }], {
        temperature: 0.1,
        maxTokens: 8192,
      });

      const pageObject = this.extractBlock(raw, pageObjectFileName);
      const spec = this.extractBlock(raw, specFileName);

      const pomError = this.validate(pageObject, 'pageobject');
      const specError = this.validate(spec, 'spec');

      if (pomError || specError) {
        console.warn(`  Attempt ${attempt} invalid: ${pomError ?? specError}`);
        continue;
      }

      fs.writeFileSync(path.resolve(getPageObjectFilePath()), pageObject, 'utf-8');
      fs.writeFileSync(path.resolve(getSpecFilePath()), spec, 'utf-8');

      ctx.generatedPageObject = pageObject;
      ctx.generatedSpec = spec;

      console.log(`  Auto-fix applied — ${pageObjectFileName} and ${specFileName} updated.`);
      return;
    }

    // не останавливаем пайплайн — оригинальный код всё равно запушится
    console.warn(`  Auto-fix failed after ${MAX_RETRIES} attempts — pushing original code.`);
  }

  private parseCriticalCount(review: string): number {
    // Парсим строку "Overall: X critical, Y major, Z minor issues."
    const match = review.match(/Overall:\s*(\d+)\s*critical/i);
    if (match) return parseInt(match[1], 10);

    // Запасной вариант — считаем вхождения [CRITICAL] в тексте
    return (review.match(/\[CRITICAL\]/gi) ?? []).length;
  }

  private extractBlock(raw: string, filename: string): string {
    // Ищем секцию === filename === и извлекаем код из ```typescript ... ```
    const sectionRegex = new RegExp(
      `===\\s*${filename}\\s*===\\s*\`\`\`(?:typescript|ts)?\\s*\\n([\\s\\S]*?)\\n?\`\`\``,
      'i',
    );
    const match = raw.match(sectionRegex);
    return match?.[1]?.trim() ?? '';
  }

  private validate(code: string, kind: 'pageobject' | 'spec'): string | null {
    if (code.length < 50) return 'Output too short or section not found';
    if (code.includes('```')) return 'Output still contains markdown fences';
    if (!code.includes('import')) return 'Missing import statements';
    if (kind === 'pageobject' && !code.includes('export class')) return 'Missing "export class" declaration';
    if (kind === 'spec' && !code.includes('describe(')) return 'Missing describe() block';
    return null;
  }
}
