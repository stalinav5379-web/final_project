import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

test.describe('Login', () => {
  test('[TC_00] Verify login page loads correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC_01] Successful login with standard user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', '[MASKED_PASSWORD]');
    await expect(page).toHaveURL(/\/inventory\.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('[TC_02] Successful login with performance glitch user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('performance_glitch_user', '[MASKED_PASSWORD]');
    await expect(page).toHaveURL(/\/inventory\.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('[TC_03] Error when entering incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrongpassword');
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username and password do not match any user in this service');
    await expect(page).not.toHaveURL(/inventory/);
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
  });

  test('[TC_04] Error when using non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('unknown_user', '[MASKED_PASSWORD]');
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username and password do not match any user in this service');
    await expect(page).not.toHaveURL(/inventory/);
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
  });

  test('[TC_05] Error when using locked out user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('locked_out_user', '[MASKED_PASSWORD]');
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username and password do not match any user in this service');
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_06] Error when username field is empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('', '');
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username is required');
    await expect(page).not.toHaveURL(/inventory/);
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).not.toHaveClass(/error/);
  });

  test('[TC_07] Error when password field is empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', '');
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Password is required');
    await expect(page).not.toHaveURL(/inventory/);
    await expect(loginPage.usernameInput).not.toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
  });

  test('[TC_08] Close error banner after login failure', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrongpassword');
    await loginPage.errorMessageContainer.locator('button').click();
    await expect(page.locator('.error-message-container h3')).not.toBeVisible();
    await expect(loginPage.usernameInput).not.toHaveClass(/error/);
    await expect(loginPage.passwordInput).not.toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('[TC_09] Logout from account', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', '[MASKED_PASSWORD]');
    await page.locator('.bm-burger-button').click();
    await page.locator('#logout_sidebar_link').click();
    await expect(page).not.toHaveURL(/inventory/);
  });
});