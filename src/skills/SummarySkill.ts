import * as fs from 'fs';
import * as path from 'path';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { MistralClient } from '../orchestrator/MistralClient';
import { PromptEngine } from '../orchestrator/PromptEngine';

export class SummarySkill implements AgentSkill {
  private readonly client = new MistralClient();
  private readonly engine = new PromptEngine();

  name(): string {
    return 'Summary';
  }

  async execute(ctx: AgentContext): Promise<void> {
    console.log('  Generating final QA summary report...');

    const pipelineTrace = ctx.steps
      .map((s) => `${s.name} | ${s.status}${s.details ? ' | ' + s.details : ''}`)
      .join('\n');

    const prompt = this.engine.fill(path.resolve('prompts/07_summary.txt'), {
      PIPELINE_TRACE: pipelineTrace,
      TEST_RUN_LOG: ctx.testRunLog.slice(0, 6000),
      ALLURE_RESULTS: JSON.stringify(ctx.allureJson, null, 2),
      BUG_REPORT: ctx.bugReport || '{"status": "NO_BUGS_FOUND"}',
      CODE_REVIEW: ctx.codeReview.slice(0, 3000) || 'No code review data available.',
    });

    const raw = await this.client.chat([{ role: 'user', content: prompt }], {
      temperature: 0.3,
      maxTokens: 4096,
    });

    const report = raw.replace(/^```(?:markdown)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    ctx.finalReport = report;

    const outputPath = path.resolve('generated/final_report.md');
    fs.writeFileSync(outputPath, report, 'utf-8');

    console.log(`  Final report saved → generated/final_report.md`);
    console.log(`  Ready for Confluence publication.`);
  }
}
