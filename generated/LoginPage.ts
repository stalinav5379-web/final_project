import { Page, Locator } from '@playwright/test';
export class LoginPage {
  public readonly usernameInput: Locator;
  public readonly passwordInput: Locator;
  public readonly loginButton: Locator;
  public readonly errorMessageContainer: Locator;
  public readonly loginCredentialsContainer: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = this.page.getByTestId('username');
    this.passwordInput = this.page.getByTestId('password');
    this.loginButton = this.page.getByTestId('login-button');
    this.errorMessageContainer = this.page.locator('.error-message-container');
    this.loginCredentialsContainer = this.page.getByTestId('login-credentials-container');
  }

  public async navigate(url: string): Promise<void> {
    await this.page.goto(url);
  }

  public async getErrorMessage(): Promise<string> {
    return (await this.errorMessageContainer.textContent()) ?? '';
  }

  public isLoggedIn(): boolean {
    return this.page.url().includes('/inventory');
  }
}
