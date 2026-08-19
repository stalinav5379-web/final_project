import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { HitlManager } from '../orchestrator/HitlManager';
import { MistralClient } from '../orchestrator/MistralClient';

export class HitlScenarioApprovalSkill implements AgentSkill {
  private readonly hitl = new HitlManager();
  private readonly client = new MistralClient();

  name(): string {
    return 'HitlScenarioApproval';
  }

  async execute(ctx: AgentContext): Promise<void> {
    while (true) {
      const result = await this.hitl.approve('TEST SCENARIOS', ctx.scenarios);

      if (result.approved) return;

      // Пользователь отклонил — добавляем комментарий к промпту и регенерируем
      const updatedPrompt =
        `${ctx.scenariosPrompt}\n\n` +
        `User feedback on previous attempt: ${result.comment}\n` +
        `Please regenerate the scenarios taking this feedback into account.`;

      console.log('  Regenerating scenarios with feedback...');

      ctx.scenarios = await this.client.chat(
        [{ role: 'user', content: updatedPrompt }],
        { temperature: 0.4, maxTokens: 4096 },
      );

      console.log(`  New scenarios received: ${ctx.scenarios.length} chars`);
    }
  }
}
