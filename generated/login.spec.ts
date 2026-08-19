import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

test.describe('Login', () => {
  test('[TC_01] Page loads successfully with correct title', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await expect(page).toHaveTitle('Swag Labs');
    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('[TC_02] Login with standard_user credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', process.env.STANDARD_USER_PASSWORD ?? 'secret_sauce');
    await expect(page).toHaveTitle('Products');
    expect(loginPage.isLoggedIn()).toBeTruthy();
  });

  test('[TC_03] Login with performance_glitch_user credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('performance_glitch_user', process.env.PERFORMANCE_GLITCH_USER_PASSWORD ?? 'secret_sauce');
    await expect(page).toHaveTitle('Products');
    expect(loginPage.isLoggedIn()).toBeTruthy();
  });

  test('[TC_04] Attempt login with incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrongpassword');
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user in this service');
    expect(loginPage.isLoggedIn()).toBeFalsy();
  });

  test('[TC_05] Attempt login with non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('unknown_user', process.env.STANDARD_USER_PASSWORD ?? 'secret_sauce');
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user in this service');
    expect(loginPage.isLoggedIn()).toBeFalsy();
  });

  test('[TC_06] Attempt login with locked_out_user credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('locked_out_user', process.env.STANDARD_USER_PASSWORD ?? 'secret_sauce');
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Sorry, this user has been locked out.');
    expect(loginPage.isLoggedIn()).toBeFalsy();
  });

  test('[TC_07] Attempt login with empty username field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('', process.env.STANDARD_USER_PASSWORD ?? 'secret_sauce');
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username is required');
    expect(loginPage.isLoggedIn()).toBeFalsy();
  });

  test('[TC_08] Attempt login with empty password field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', '');
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Password is required');
    expect(loginPage.isLoggedIn()).toBeFalsy();
  });

  test('[TC_09] Close error banner after failed login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', 'wrongpassword');
    await loginPage.errorButton.click();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBe('');
    expect(loginPage.isLoggedIn()).toBeFalsy();
  });

  test('[TC_10] Logout from account via burger menu', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(process.env.APPLICATION_PAGE_URL ?? 'https://www.saucedemo.com/');
    await loginPage.login('standard_user', process.env.STANDARD_USER_PASSWORD ?? 'secret_sauce');
    await page.getByTestId('react-burger-menu-btn').click();
    await page.getByTestId('logout_sidebar_link').click();
    await expect(page).toHaveURL(process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/');
  });
}