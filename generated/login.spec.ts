import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

const PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

test.describe('Login', () => {
  test('[TC_01] Page loads successfully with correct title', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC_02] Successful login with standard user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC_03] Successful login with performance glitch user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('performance_glitch_user', PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('[TC_04] Login fails with incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrongpassword');
    await expect(page.locator('.error-message-container h3')).toContainText('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_05] Login fails with non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('unknown_user', PASSWORD);
    await expect(page.locator('.error-message-container h3')).toContainText('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_06] Login fails for locked out user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('locked_out_user', PASSWORD);
    await expect(page.locator('.error-message-container h3')).toContainText('Sorry, this user has been locked out.');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_07] Login fails with empty username field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('', PASSWORD);
    await expect(page.locator('.error-message-container h3')).toContainText('Username is required');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_08] Login fails with empty password field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', '');
    await expect(page.locator('.error-message-container h3')).toContainText('Password is required');
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_09] Close error banner after failed login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrongpassword');
    await page.locator('.error-button').click();
    await expect(page.locator('.error-message-container h3')).not.toBeVisible();
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
  });

  test('[TC_10] Logout and reset session', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', PASSWORD);
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();
    await expect(page).not.toHaveURL(/inventory/);
  });
});