import 'dotenv/config';
import { AgentContext } from './orchestrator/AgentContext';
import { BugReportSkill } from './skills/BugReportSkill';

const ctx = new AgentContext();

ctx.testRunLog = `
Running 10 tests using 1 worker

  ✓  1 [chromium] › generated/login.spec.ts:7 › Login › [TC_01] Page loads successfully (900ms)
  ✘  2 [chromium] › generated/login.spec.ts:13 › Login › [TC_02] Successful login with standard user (5.5s)
  ✘  3 [chromium] › generated/login.spec.ts:21 › Login › [TC_03] Successful login with performance glitch user (5.6s)
  ✓  4 [chromium] › generated/login.spec.ts:29 › Login › [TC_04] Login fails with incorrect password (600ms)
  ✘  5 [chromium] › generated/login.spec.ts:48 › Login › [TC_06] Login fails for locked out user (5.5s)

  1) Login › [TC_02] Successful login with standard user
    Error: expect(page).toHaveURL(expected) failed
    Expected pattern: /inventory\.html/
    Received string:  "https://www.saucedemo.com/"
    Timeout: 5000ms
    at generated/login.spec.ts:17

  2) Login › [TC_03] Successful login with performance glitch user
    Error: expect(page).toHaveURL(expected) failed
    Expected pattern: /inventory\.html/
    Received string:  "https://www.saucedemo.com/"
    Timeout: 5000ms
    at generated/login.spec.ts:25

  3) Login › [TC_06] Login fails for locked out user
    Error: expect(received).toContain(expected)
    Expected: "Sorry, this user has been locked out."
    Received: "Epic sadface: Username and password do not match any user in this service"
    at generated/login.spec.ts:52

  3 failed, 7 passed
`;

ctx.allureJson = {
  passed: 7,
  failed: 3,
  broken: 0,
  skipped: 0,
  total: 10,
  failures: [
    { name: '[TC_02] Successful login with standard user', message: 'Expected URL /inventory\\.html/, received https://www.saucedemo.com/' },
    { name: '[TC_03] Successful login with performance glitch user', message: 'Expected URL /inventory\\.html/, received https://www.saucedemo.com/' },
    { name: '[TC_06] Login fails for locked out user', message: 'Expected "Sorry, this user has been locked out." but got wrong error message' },
  ],
};

(async () => {
  const skill = new BugReportSkill();
  console.log('\n▶  Running BugReportSkill in isolation...\n');
  await skill.execute(ctx);
  console.log('\n--- Result ---');
  console.log(ctx.bugReport);
})();
