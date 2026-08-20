import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

const APP_URL = process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/';
const PASSWORD = process.env.APP_PASSWORD ?? 'secret_sauce';

test.describe('LoginPage', () => {
  test('[TC_01] Verify login page loads successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC_02] Successful login with standard user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/inventory.html/);
  });

  test('[TC_03] Successful login with performance glitch user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('performance_glitch_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    await expect(loginPage.isLoggedIn()).toBeTruthy();
  });

  test('[TC_04] Login error with incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill('wrong_password');
    await loginPage.loginButton.click();
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_05] Login error with non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('unknown_user');
    await loginPage.passwordInput.fill('any_password');
    await loginPage.loginButton.click();
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_06] Login error with locked out user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('locked_out_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Sorry, this user has been locked out.');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_07] Login error with empty username field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.loginButton.click();
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Username is required');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_08] Login error with empty password field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.loginButton.click();
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Password is required');
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL(APP_URL);
  });

  test('[TC_09] Close error message banner', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill('wrong_password');
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