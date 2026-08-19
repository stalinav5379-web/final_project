import * as fs from 'fs';
import * as path from 'path';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { MistralClient } from '../orchestrator/MistralClient';
import { PromptEngine } from '../orchestrator/PromptEngine';

export class AiCodeReviewSkill implements AgentSkill {
  private readonly client = new MistralClient();
  private readonly engine = new PromptEngine();

  name(): string {
    return 'AiCodeReview';
  }

  async execute(ctx: AgentContext): Promise<void> {
    console.log('  Sending code + lint output to Mistral for review...');

    const prompt = this.engine.fill(path.resolve('prompts/05_code_review.txt'), {
      PAGE_OBJECT: ctx.generatedPageObject,
      SPEC: ctx.generatedSpec,
      LINT_OUTPUT: ctx.lintOutput || 'No lint output available',
    });

    ctx.codeReview = await this.client.chat([{ role: 'user', content: prompt }], {
      temperature: 0.2,
      maxTokens: 4096,
    });

    const outputPath = path.resolve('generated/ai_code_review.md');
    fs.writeFileSync(outputPath, ctx.codeReview, 'utf-8');
    console.log(`  Review saved to ${outputPath}`);

    const summary = ctx.codeReview.split('\n').find((l) => l.startsWith('## Summary')) ?? 'See generated/ai_code_review.md';
    console.log(`  ${summary}`);
  }
}
