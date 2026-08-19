import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

const PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

test.describe('Login', () => {
  test('[TC_01] Load SauceDemo login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC_02] Login with standard_user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC_03] Login with performance_glitch_user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('performance_glitch_user', PASSWORD);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('[TC_04] Login with incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrongpassword');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user');
  });

  test('[TC_05] Login with non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('unknown_user', 'any_password');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user');
  });

  test('[TC_06] Login with locked_out_user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('locked_out_user', PASSWORD);
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Sorry, this user has been locked out.');
  });

  test('[TC_07] Submit login with empty username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('', PASSWORD);
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username is required');
  });

  test('[TC_08] Submit login with empty password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', '');
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).not.toHaveURL(/inventory/);
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Password is required');
  });

  test('[TC_09] Close error message banner', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrongpassword');
    await loginPage.errorMessageContainer.locator('button').click();
    await expect(page.locator('.error-message-container h3')).not.toBeVisible();
  });

  test('[TC_10] Logout via burger menu', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', PASSWORD);
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();
    await expect(page).not.toHaveURL(/inventory/);
  });
});