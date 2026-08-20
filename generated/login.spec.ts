import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

const PASSWORD = process.env.APP_PASSWORD ?? 'secret_sauce';

test.describe('Login', () => {
  test('[TC_01] Open SauceDemo login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC_02] Successful login with standard user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('[TC_03] Successful login with performance glitch user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('performance_glitch_user', PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('[TC_04] Error login with incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrong_password');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username and password do not match any user');
  });

  test('[TC_05] Error login with non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('unknown_user', PASSWORD);
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username and password do not match any user');
  });

  test('[TC_06] Error login with locked out user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('locked_out_user', PASSWORD);
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Sorry, this user has been locked out.');
  });

  test('[TC_07] Error login with empty username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('', '');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username is required');
  });

  test('[TC_08] Error login with empty password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', '');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Password is required');
  });

  test('[TC_09] Close error banner after failed login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrong_password');
    await loginPage.errorMessageContainer.locator('button').click();
    await expect(page.locator('.error-message-container h3')).not.toBeVisible();
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
  });

  test('[TC_10] Logout from account', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', PASSWORD);
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();
    await expect(page).not.toHaveURL(/inventory/);
  });
});