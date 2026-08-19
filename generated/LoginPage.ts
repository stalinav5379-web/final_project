import { Page, Locator } from '@playwright/test';
export class LoginPage {
  public readonly usernameInput: Locator;
  public readonly passwordInput: Locator;
  public readonly loginButton: Locator;
  public readonly errorMessageContainer: Locator;
  public readonly errorButton: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = this.page.getByTestId('username');
    this.passwordInput = this.page.getByTestId('password');
    this.loginButton = this.page.getByTestId('login-button');
    this.errorMessageContainer = this.page.getByTestId('error-message-container');
    this.errorButton = this.page.getByTestId('error-button');
  }

  public async navigate(url: string): Promise<void> {
    await this.page.goto(url);
  }

  public async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  public async getErrorMessage(): Promise<string> {
    return (await this.errorMessageContainer.textContent()) ?? '';
  }

  public isLoggedIn(): boolean {
    return this.page.url().includes('/inventory.html');
  }
}