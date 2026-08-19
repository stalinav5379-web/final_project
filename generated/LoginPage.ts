import { Page, Locator } from '@playwright/test';

export class LoginPage {
  public readonly usernameInput: Locator;
  public readonly passwordInput: Locator;
  public readonly loginButton: Locator;
  public readonly loginContainer: Locator;
  public readonly loginCredentialsContainer: Locator;
  public readonly loginCredentials: Locator;
  public readonly loginPassword: Locator;
  public readonly errorMessageContainer: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = this.page.getByTestId('username');
    this.passwordInput = this.page.getByTestId('password');
    this.loginButton = this.page.getByTestId('login-button');
    this.loginContainer = this.page.getByTestId('login-container');
    this.loginCredentialsContainer = this.page.getByTestId('login-credentials-container');
    this.loginCredentials = this.page.getByTestId('login-credentials');
    this.loginPassword = this.page.getByTestId('login-password');
    this.errorMessageContainer = this.page.locator('.error-message-container');
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
