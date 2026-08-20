import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

const APP_URL = process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/';
const PASSWORD = process.env.APP_PASSWORD ?? 'secret_sauce';

test.describe('LoginPage', () => {
  test('[TC_01] Open login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC_02] Successful login standard user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/.*inventory.html/);
  });

  test('[TC_03] Successful login performance glitch user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('performance_glitch_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/.*inventory.html/);
  });

  test('[TC_04] Login with incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill('incorrect_password');
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_05] Login with incorrect username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('non_existent_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_06] Login with locked out user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('locked_out_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Sorry, this user has been locked out.');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_07] Login with empty username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username is required');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_08] Login with empty password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Password is required');
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_09] Close error banner', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill('incorrect_password');
    await loginPage.loginButton.click();
    await page.locator('[data-test="error-button"]').click();
    await expect(page.locator('.error-message-container h3')).not.toBeVisible();
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
  });

  test('[TC_10] Logout from application', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();
    await expect(page).toHaveURL(APP_URL);
  });
});