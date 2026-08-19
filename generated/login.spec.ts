import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

test.describe('Login', () => {
  test('[TC_01] Verify login page loads successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await expect(page).toHaveTitle('Swag Labs');
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('[TC_02] Successful login with standard user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL(/\/inventory.html/);
    await expect(page.getByText('Products')).toBeVisible();
  });

  test('[TC_03] Successful login with performance glitch user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('performance_glitch_user', 'secret_sauce');
    await expect(page).toHaveURL(/\/inventory.html/);
    await expect(page.getByText('Products')).toBeVisible();
  });

  test('[TC_04] Error when entering incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrong_password');
    const errorMessage = await loginPage.getErrorMessage();
    await expect(errorMessage).toContain('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(/login.html/);
  });

  test('[TC_05] Error when using non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('unknown_user', 'secret_sauce');
    const errorMessage = await loginPage.getErrorMessage();
    await expect(errorMessage).toContain('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(/login.html/);
  });

  test('[TC_06] Error when using locked-out user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('locked_out_user', 'secret_sauce');
    const errorMessage = await loginPage.getErrorMessage();
    await expect(errorMessage).toContain('Sorry, this user has been locked out.');
    await expect(page).toHaveURL(/login.html/);
  });

  test('[TC_07] Error when username field is empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    await expect(errorMessage).toContain('Username is required');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(page).toHaveURL(/login.html/);
  });

  test('[TC_08] Error when password field is empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedIn the context of the provided code review, I notice that the response only addressed the CRITICAL issues as per the instructions. However, I see that the response also included fixes for some MAJOR issues (like the `isLoggedIn()` method) which weren't marked as CRITICAL in the review.

Let me clarify the instructions again:
- Fix ONLY the issues marked [CRITICAL] in the review
- Do NOT change anything that is not flagged as CRITICAL

The only CRITICAL issue in the review was:
[CRITICAL] LoginPage.ts:17 — `errorMessageContainer` uses a fragile CSS class (`.error-message-container`), which may change with UI updates.

Here's the corrected response that only fixes the CRITICAL issue:

=== LoginPage.ts ===