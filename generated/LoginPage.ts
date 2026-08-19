import { Page, Locator } from '@playwright/test';

export class LoginPage {
  public readonly usernameInput: Locator;
  public readonly passwordInput: Locator;
  public readonly loginButton: Locator;
  public readonly loginContainer: Locator;
  public readonly loginCredentialsContainer: Locator;
  public readonly loginCredentials: Locator;
  public readonly loginPassword: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = this.page.getByTestId('username');
    this.passwordInput = this.page.getByTestId('password');
    this.loginButton = this.page.getByTestId('login-button');
    this.loginContainer = this.page.getByTestId('login-container');
    this.loginCredentialsContainer = this.page.getByTestId('login-credentials-container');
    this.loginCredentials = this.page.getByTestId('login-credentials');
    this.loginPassword = this.page.getByTestId('login-password');
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
    const errorLocator = this.page.locator('.error-message-container');
    return (await errorLocator.textContent()) ?? '';
  }

  public isLoggedIn(): boolean {
    return this.page.url().includes('/inventory.html');
  }
}
