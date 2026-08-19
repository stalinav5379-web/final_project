import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { MistralClient } from '../orchestrator/MistralClient';

export class ScenarioGenerationSkill implements AgentSkill {
  private readonly client = new MistralClient();

  name(): string {
    return 'ScenarioGeneration';
  }

  async execute(ctx: AgentContext): Promise<void> {
    console.log('  Sending checklist to Mistral...');

    ctx.scenarios = await this.client.chat(
      [{ role: 'user', content: ctx.scenariosPrompt }],
      { temperature: 0.4, maxTokens: 4096 },
    );

    console.log(`  Scenarios received: ${ctx.scenarios.length} chars`);
  }
}
