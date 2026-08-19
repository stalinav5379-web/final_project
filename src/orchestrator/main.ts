import 'dotenv/config';
import { AgentContext } from './AgentContext';
import type { AgentSkill } from './AgentSkill';
import { BuildScenariosPromptSkill } from '../skills/BuildScenariosPromptSkill';
import { PiiScanSkill } from '../skills/PiiScanSkill';
import { ScenarioGenerationSkill } from '../skills/ScenarioGenerationSkill';
import { HitlScenarioApprovalSkill } from '../skills/HitlScenarioApprovalSkill';
import { TestcaseGenerationSkill } from '../skills/TestcaseGenerationSkill';
import { DomSnapshotSkill } from '../skills/DomSnapshotSkill';
import { UiTestGenerationSkill } from '../skills/UiTestGenerationSkill';
import { HitlCodeApprovalSkill } from '../skills/HitlCodeApprovalSkill';
import { CodeStyleSkill } from '../skills/CodeStyleSkill';
import { AiCodeReviewSkill } from '../skills/AiCodeReviewSkill';
import { AiCodeFixSkill } from '../skills/AiCodeFixSkill';
import { TestFixLoopSkill } from '../skills/TestFixLoopSkill';
import { AllureSkill } from '../skills/AllureSkill';
import { GitSkill } from '../skills/GitSkill';
import { BugReportSkill } from '../skills/BugReportSkill';
import { SummarySkill } from '../skills/SummarySkill';

const skills: AgentSkill[] = [
  // --- День 1 ---
  new BuildScenariosPromptSkill(),
  new PiiScanSkill(),
  new ScenarioGenerationSkill(),
  new HitlScenarioApprovalSkill(),
  new TestcaseGenerationSkill(),
  new DomSnapshotSkill(),
  // --- День 2 ---
  new UiTestGenerationSkill(),
  new HitlCodeApprovalSkill(),
  new CodeStyleSkill(),
  new AiCodeReviewSkill(),
  new AiCodeFixSkill(),   // фиксит критические ишью из code review
  // --- День 3 ---
  new TestFixLoopSkill(), // запускает тесты → AI фиксит → до 3 кругов
  new AllureSkill(),      // генерирует отчёт из финального прогона
  new GitSkill(),         // пушит только после зелёных/исчерпанных попыток
  new BugReportSkill(),
  new SummarySkill(),
];

async function run(): Promise<void> {
  const ctx = new AgentContext();

  console.log('\n╔══════════════════════════════════╗');
  console.log('║     AI-Driven QA Pipeline        ║');
  console.log('╚══════════════════════════════════╝\n');

  for (const skill of skills) {
    console.log(`\n▶  ${skill.name()}`);
    try {
      await skill.execute(ctx);
      ctx.addStep(skill.name(), 'PASSED');
      console.log(`✓  ${skill.name()} — done`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.addStep(skill.name(), 'FAILED', message);
      console.error(`\n✗  Pipeline stopped at "${skill.name()}": ${message}`);
      process.exit(1);
    }
  }

  console.log('\n╔══════════════════════════════════╗');
  console.log(`║  Done. Steps completed: ${String(ctx.steps.length).padEnd(9)}║`);
  console.log('╚══════════════════════════════════╝\n');
}

run().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
