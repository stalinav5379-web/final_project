import type { AgentContext } from './AgentContext';

export interface AgentSkill {
  name(): string;
  execute(ctx: AgentContext): Promise<void>;
}
