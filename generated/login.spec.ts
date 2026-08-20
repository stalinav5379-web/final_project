import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

const PASSWORD = process.env.APP_PASSWORD ?? 'secret_sauce';
const APP_URL = process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/';

test.describe('LoginPage', () => {
  test('[TC_01] Verify page loads successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC_02] Login with standard user credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/\/inventory.html/);
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC_03] Login with performance glitch user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('performance_glitch_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/\/inventory.html/);
  });

  test('[TC_04] Login with incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill('incorrect_password');
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user in this service');
    await expect(loginPage.errorMessageContainer).toBeVisible();
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_05] Login with non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('unknown_user');
    await loginPage.passwordInput.fill('any_password');
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user in this service');
    await expect(loginPage.errorMessageContainer).toBeVisible();
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
    await expect(loginPage.errorMessageContainer).toBeVisible();
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_07] Attempt login with empty username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username is required');
    await expect(loginPage.errorMessageContainer).toBeVisible();
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_08] Attempt login with empty password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Password is required');
    await expect(loginPage.errorMessageContainer).toBeVisible();
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_09] Close error banner after login failure', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill('incorrect_password');
    await loginPage.loginButton.click();
    await loginPage.errorMessageContainer.locator('button').click();
    await expect(loginPage.errorMessageContainer.locator('h3')).not.toBeVisible();
  });

  test('[TC_10] Logout from account', async ({ page }) => {
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
