import * as fs from 'fs';
import * as path from 'path';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { HitlManager } from '../orchestrator/HitlManager';
import { MistralClient } from '../orchestrator/MistralClient';
import { PromptEngine } from '../orchestrator/PromptEngine';

const PREVIEW_LIMIT = 1500;

export class HitlCodeApprovalSkill implements AgentSkill {
  private readonly hitl = new HitlManager();
  private readonly client = new MistralClient();
  private readonly engine = new PromptEngine();

  name(): string {
    return 'HitlCodeApproval';
  }

  async execute(ctx: AgentContext): Promise<void> {
    while (true) {
      const result = await this.hitl.approve('GENERATED CODE', this.buildPreview(ctx));

      if (result.approved) return;

      const feedback = result.comment ?? '';
      console.log('  Regenerating code with feedback...');

      ctx.generatedPageObject = await this.regenerate(
        'prompts/03_page_object.txt',
        { DOM_HTML: ctx.domHtml.slice(0, 30_000) },
        ctx.generatedPageObject,
        feedback,
        'LoginPage.ts',
        'generated/LoginPage.ts',
      );

      ctx.generatedSpec = await this.regenerate(
        'prompts/04_spec.txt',
        { PAGE_OBJECT: ctx.generatedPageObject, TESTCASES: JSON.stringify(ctx.testcases, null, 2) },
        ctx.generatedSpec,
        feedback,
        'login.spec.ts',
        'generated/login.spec.ts',
      );
    }
  }

  private buildPreview(ctx: AgentContext): string {
    const trim = (s: string): string =>
      s.length > PREVIEW_LIMIT ? s.slice(0, PREVIEW_LIMIT) + '\n... (truncated)' : s;

    return [
      '=== LoginPage.ts ===',
      trim(ctx.generatedPageObject),
      '',
      '=== login.spec.ts ===',
      trim(ctx.generatedSpec),
    ].join('\n');
  }

  private async regenerate(
    templatePath: string,
    vars: Record<string, string>,
    previousCode: string,
    feedback: string,
    label: string,
    outputPath: string,
  ): Promise<string> {
    const base = this.engine.fill(path.resolve(templatePath), vars);
    const prompt =
      `${base}\n\n` +
      `Previous code:\n${previousCode}\n\n` +
      `User feedback: ${feedback}\n` +
      `Regenerate taking this feedback into account.`;

    const raw = await this.client.chat(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, maxTokens: 4096 },
    );

    const code = this.stripMarkdown(raw);
    const absPath = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, code, 'utf-8');
    console.log(`  Regenerated ${label} → ${outputPath}`);
    return code;
  }

  private stripMarkdown(code: string): string {
    const match = code.match(/```(?:typescript|ts)?\s*\n([\s\S]*?)\n?```/);
    return match?.[1]?.trim() ?? code.trim();
  }
}
