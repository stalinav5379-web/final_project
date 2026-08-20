import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

const PASSWORD = process.env.APP_PASSWORD ?? 'secret_sauce';

test.describe('LoginPage', () => {
  test('[TC_01] Verify login page loads successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('https://www.saucedemo.com/');
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('[TC_02] Successful login with standard user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('https://www.saucedemo.com/');
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/.*inventory.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('[TC_03] Successful login with performance glitch user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('https://www.saucedemo.com/');
    await loginPage.usernameInput.fill('performance_glitch_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/.*inventory.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('[TC_04] Login error with incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('https://www.saucedemo.com/');
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill('incorrect_password');
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });

  test('[TC_05] Login error with non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('https://www.saucedemo.com/');
    await loginPage.usernameInput.fill('unknown_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });

  test('[TC_06] Login error with locked-out user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('https://www.saucedemo.com/');
    await loginPage.usernameInput.fill('locked_out_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Sorry, this user has been locked out.');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
    await expect(loginPage.passwordInput).toHaveClass(/error/);
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });

  test('[TC_07] Login error with empty username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('https://www.saucedemo.com/');
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username is required');
    await expect(loginPage.usernameInput).toHaveClass(/error/);
  });

  test('[TC_08] Login error with empty password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('https://www.saucedemo.com/');
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.loginButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Password is required');
    await expect(loginPage.passwordInput).toHaveClass(/error/);
  });

  test('[TC_09] Close error banner after login failure', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('https://www.saucedemo.com/');
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill('incorrect_password');
    await loginPage.loginButton.click();
    await page.locator('.error-button').click();
    await expect(loginPage.errorMessageContainer).not.toBeVisible();
    await expect(loginPage.usernameInput).not.toHaveClass(/error/);
    await expect(loginPage.passwordInput).not.toHaveClass(/error/);
  });

  test('[TC_10] Logout from account successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('https://www.saucedemo.com/');
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill(PASSWORD);
    await loginPage.loginButton.click();
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });
});