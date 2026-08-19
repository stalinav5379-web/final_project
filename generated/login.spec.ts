import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

test.describe('Login', () => {
  test('[TC-S01] Open SauceDemo login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC-01] Successful login with standard user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL(/\/inventory.html/);
    await expect(page.locator('.title')).toHaveText('Products');
  });

  test('[TC-02] Successful login with performance glitch user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('performance_glitch_user', 'secret_sauce');
    await expect(page).toHaveURL(/\/inventory.html/);
  });

  test('[TC-03] Error with incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrong_password');
    const errorMessage = await loginPage.getErrorMessage();
    await expect(errorMessage).toContain('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(/login.html/);
  });

  test('[TC-04] Error with non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('unknown_user', 'secret_sauce');
    const errorMessage = await loginPage.getErrorMessage();
    await expect(errorMessage).toContain('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(/login.html/);
  });

  test('[TC-05] Error with locked out user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('locked_out_user', 'secret_sauce');
    const errorMessage = await loginPage.getErrorMessage();
    await expect(errorMessage).toContain('Sorry, this user has been locked out.');
    await expect(page).toHaveURL(/login.html/);
  });

  test('[TC-06] Error with empty username field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('', 'secret_sauce');
    const errorMessage = await loginPage.getErrorMessage();
    await expect(errorMessage).toContain('Username is required');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(page).toHaveURL(/login.html/);
  });

  test('[TC-07] Error with empty password field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', '');
    const errorMessage = await loginPage.getErrorMessage();
    await expect(errorMessage).toContain('Password is required');
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(/login.html/);
  });

  test('[TC-08] Close error banner', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrong_password');
    await page.locator('.error-button').click();
    await expect(loginPage.errorMessageContainer).not.toBeVisible();
    await expect(loginPage.usernameInput).not.toHaveClass(/error/);
    await expect(loginPage.passwordInput).not.toHaveClass(/error/);
  });

  test('[TC-09] Logout from application', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'secret_sauce');
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();
    await expect(page).toHaveURL(/login.html/);
  });
});
