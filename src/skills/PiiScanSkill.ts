import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { PiiMasker } from '../security/PiiMasker';

export class PiiScanSkill implements AgentSkill {
  private readonly masker = new PiiMasker();

  name(): string {
    return 'PiiScan';
  }

  async execute(ctx: AgentContext): Promise<void> {
    const result = this.masker.mask(ctx.scenariosPrompt);

    if (result.count === 0) {
      console.log('  No PII detected. Prompt is clean.');
      return;
    }

    ctx.scenariosPrompt = result.maskedText;
    console.log(`  PII masked: ${result.count} item(s) — types: ${result.types.join(', ')}`);
  }
}
