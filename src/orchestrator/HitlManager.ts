import * as readline from 'readline';

export interface HitlResult {
  approved: boolean;
  comment: string;
}

export class HitlManager {
  // Выводит контент на экран и ждёт Y/N от пользователя.
  // При N — запрашивает комментарий для регенерации.
  async approve(label: string, content: string): Promise<HitlResult> {
    const line = '─'.repeat(60);

    console.log(`\n${line}`);
    console.log(`  REVIEW REQUIRED: ${label}`);
    console.log(line);
    console.log(content);
    console.log(line);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const answer = await this.ask(rl, '\nApprove and continue? [Y/n]: ');
      const approved = answer.trim().toLowerCase() !== 'n';

      if (approved) {
        console.log('✓ Approved. Moving to next step.\n');
        return { approved: true, comment: '' };
      }

      const comment = await this.ask(rl, 'Enter feedback for regeneration: ');
      console.log('↺ Regenerating with your feedback...\n');
      return { approved: false, comment: comment.trim() };
    } finally {
      rl.close();
    }
  }

  private ask(rl: readline.Interface, prompt: string): Promise<string> {
    return new Promise((resolve) => rl.question(prompt, resolve));
  }
}
