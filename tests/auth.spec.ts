import { expect, test } from '@playwright/test';
import { login, logout, register, uniqEmail } from './utils';

test.describe('Регистрация и вход', () => {
  test('успешная регистрация отображает имя пользователя', async ({ page }) => {
    await page.goto('/#/register');
    const form = page.locator('#auth');
    await form.locator('input[name=name]').fill('Иван Тестов');
    await form.locator('input[name=email]').fill(uniqEmail('reg'));
    await form.locator('input[name=password]').fill('Pass123x');
    await form.locator('button[type=submit]').click();
    await expect(page.locator('#user-name')).toContainText('Иван Тестов', { timeout: 20_000 });
    await expect(page.locator('#nav-login')).toBeHidden();
  });

  test('валидация полей регистрации', async ({ page }) => {
    await page.goto('/#/register');
    await page.locator('#auth button[type=submit]').click();
    await expect(page.locator('#form-error')).toBeVisible();
    await expect(page.locator('#name-error')).toContainText('Укажите');
    await expect(page.locator('#email-error')).toContainText('Укажите');
    await expect(page.locator('#password-error')).toContainText('Пароль');
  });

  test('повторная регистрация занятого e-mail отклоняется', async ({ page }) => {
    const data = await register(page);
    await logout(page);
    await page.goto('/#/register');
    const form = page.locator('#auth');
    await form.locator('input[name=name]').fill('Дубль Дубль');
    await form.locator('input[name=email]').fill(data.email);
    await form.locator('input[name=password]').fill(data.password);
    await form.locator('button[type=submit]').click();
    await expect(page.locator('#email-error')).toContainText('занят');
  });

  test('вход с неверным паролем отклоняется', async ({ page }) => {
    const data = await register(page);
    await logout(page);
    await page.goto('/#/login');
    const form = page.locator('#auth');
    await form.locator('input[name=email]').fill(data.email);
    await form.locator('input[name=password]').fill('WrongPass1');
    await form.locator('button[type=submit]').click();
    await expect(page.locator('#form-error')).toContainText('Неверн');
  });

  test('сессия сохраняется после перезагрузки страницы, выход работает', async ({ page }) => {
    const data = await register(page);
    await page.reload();
    await expect(page.locator('#user-name')).toContainText(data.name);
    await logout(page);
    await login(page, data.email, data.password);
    await expect(page.locator('#user-name')).toContainText(data.name);
  });

  test('гостю недоступна страница «Мои заказы»', async ({ page }) => {
    await page.goto('/#/orders');
    await expect(page).toHaveURL(/#\/login$/);
  });

  test('API: заказы без сессии не видны', async ({ request }) => {
    const res = await request.get('/api/orders');
    expect(res.status()).toBe(401);
  });
});
