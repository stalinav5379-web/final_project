import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

const PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

test.describe('Login', () => {
  test('[TC_01] Successful login with standard user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('[TC_02] Successful login with performance glitch user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('performance_glitch_user', PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('[TC_03] Login with incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrong_password');
    const errorMsg = await loginPage.getErrorMessage();
    await expect(errorMsg).toContain('Username and password do not match any user in this service');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_04] Login with non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('unknown_user', PASSWORD);
    const errorMsg = await loginPage.getErrorMessage();
    await expect(errorMsg).toContain('Username and password do not match any user in this service');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_05] Login with locked out user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('locked_out_user', PASSWORD);
    const errorMsg = await loginPage.getErrorMessage();
    await expect(errorMsg).toContain('Sorry, this user has been locked out.');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_06] Login with empty username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('', '');
    const errorMsg = await loginPage.getErrorMessage();
    await expect(errorMsg).toContain('Username is required');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).not.toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_07] Login with empty password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', '');
    const errorMsg = await loginPage.getErrorMessage();
    await expect(errorMsg).toContain('Password is required');
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(loginPage.usernameInput).not.toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_08] Close error banner after failed login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrong_password');
    await loginPage.errorMessageContainer.locator('button').click();
    await expect(page.locator('.error-message-container h3')).not.toBeVisible();
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_09] Logout from account', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', PASSWORD);
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();
    await expect(page).not.toHaveURL(/inventory/);
    await expect(page.title()).resolves.toContain('Swag Labs');
  });
});