import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

test.describe('Login', () => {
  test('[TC_01] Open SauceDemo login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await expect(page).toHaveTitle(/Swag Labs/);
  });

  test('[TC_02] Successful login with standard user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', process.env.STANDARD_USER_PASSWORD ?? 'secret_sauce');
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('[TC_03] Successful login with performance glitch user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login(
      'performance_glitch_user',
      process.env.PERFORMANCE_GLITCH_USER_PASSWORD ?? 'secret_sauce',
    );
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('[TC_04] Login with incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrongpassword');
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username and password do not match any user in this service');
    await expect(page).not.toHaveURL(/inventory/);
    await expect(page.locator('.error-message-container h3')).toBeVisible();
  });

  test('[TC_05] Login with incorrect username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('unknown_user', 'any_password');
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username and password do not match any user in this service');
    await expect(page).not.toHaveURL(/inventory/);
    await expect(page.locator('.error-message-container h3')).toBeVisible();
  });

  test('[TC_06] Login with locked-out user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('locked_out_user', 'any_password');
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Sorry, this user has been locked out.');
    await expect(page).not.toHaveURL(/inventory/);
    await expect(page.locator('.error-message-container h3')).toBeVisible();
  });

  test('[TC_07] Login with empty username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('', 'any_password');
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username is required');
    await expect(page).not.toHaveURL(/inventory/);
    await expect(page.locator('.error-message-container h3')).toBeVisible();
  });

  test('[TC_08] Login with empty password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', '');
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Password is required');
    await expect(page).not.toHaveURL(/inventory/);
    await expect(page.locator('.error-message-container h3')).toBeVisible();
  });

  test('[TC_09] Close error message banner', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrongpassword');
    await page.locator('.error-button').click();
    await expect(page.locator('.error-message-container h3')).not.toBeVisible();
  });

  test('[TC_10] Logout from user session', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', process.env.STANDARD_USER_PASSWORD ?? 'secret_sauce');
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();
    await expect(page).not.toHaveURL(/inventory/);
  });
});
