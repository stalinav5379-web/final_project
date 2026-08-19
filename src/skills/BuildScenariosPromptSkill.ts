import * as fs from 'fs';
import * as path from 'path';
import type { AgentSkill } from '../orchestrator/AgentSkill';
import type { AgentContext } from '../orchestrator/AgentContext';
import { PromptEngine } from '../orchestrator/PromptEngine';

export class BuildScenariosPromptSkill implements AgentSkill {
  private readonly engine = new PromptEngine();

  name(): string {
    return 'BuildScenariosPrompt';
  }

  async execute(ctx: AgentContext): Promise<void> {
    const checklistPath = path.resolve('checklist.txt');

    if (!fs.existsSync(checklistPath)) {
      throw new Error(`checklist.txt not found at: ${checklistPath}`);
    }

    ctx.checklistText = fs.readFileSync(checklistPath, 'utf-8');
    ctx.scenariosPrompt = this.engine.fill(path.resolve('prompts/01_scenarios.txt'), {
      CHECKLIST: ctx.checklistText,
    });

    console.log(`  Checklist loaded: ${ctx.checklistText.length} chars`);
    console.log(`  Prompt ready: ${ctx.scenariosPrompt.length} chars`);
  }
}
