import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

const APP_URL = process.env.APPLICATION_URL ?? 'https://www.saucedemo.com/';
const STANDARD_USER = 'standard_user';
const PERFORMANCE_GLITCH_USER = 'performance_glitch_user';
const STANDARD_USER_PASSWORD = process.env.STANDARD_USER_PASSWORD ?? 'secret_sauce';
const PERFORMANCE_GLITCH_USER_PASSWORD = process.env.PERFORMANCE_GLITCH_USER_PASSWORD ?? 'secret_sauce';

test.describe('Login', () => {
  test('[TC_01] Successful login with standard_user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.login(STANDARD_USER, STANDARD_USER_PASSWORD);
    await expect(loginPage.isLoggedIn()).resolves.toBeTruthy();
    await expect(page).toHaveTitle('Products');
  });

  test('[TC_02] Successful login with performance_glitch_user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.login(PERFORMANCE_GLITCH_USER, PERFORMANCE_GLITCH_USER_PASSWORD);
    await expect(loginPage.isLoggedIn()).resolves.toBeTruthy();
    await expect(page).toHaveTitle('Products');
  });

  test('[TC_03] Error — Incorrect password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.login(STANDARD_USER, 'wrong_password');
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user');
  });

  test('[TC_04] Error — Non-existent username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.login('unknown_user', STANDARD_USER_PASSWORD);
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username and password do not match any user');
  });

  test('[TC_05] Error — Locked-out user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.login('locked_out_user', STANDARD_USER_PASSWORD);
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Sorry, this user has been locked out.');
  });

  test('[TC_06] Error — Empty username field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.login('', STANDARD_USER_PASSWORD);
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Username is required');
  });

  test('[TC_07] Error — Empty password field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.login(STANDARD_USER, '');
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Password is required');
  });

  test('[TC_08] Close error banner', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.login(STANDARD_USER, 'wrong_password');
    await page.getByTestId('error-button').click();
    await expect(loginPage.errorMessageContainer).not.toBeVisible();
  });

  test('[TC_09] Logout from account', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate(APP_URL);
    await loginPage.login(STANDARD_USER, STANDARD_USER_PASSWORD);
    await page.getByTestId('react-burger-menu-btn').click();
    await page.getByTestId('logout_sidebar_link').click();
    expect(page.url()).toContain('/');
  });
});