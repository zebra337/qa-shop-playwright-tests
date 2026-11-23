import { expect, Page } from '@playwright/test';

// ALLOW_TEST_RESET на публичном стенде выключен, поэтому каждый тест
// создаёт свои уникальные данные и не мешает другим.
export function uniqEmail(prefix = 'e2e'): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.test`;
}

export function normMoney(s: string): string {
  return s.replace(/[\u00A0\u202F\u2009\u2007\s]/g, ' ').trim();
}

// Проверка денежной суммы с учётом неразрывных пробелов ru-локали (1 190 ₽).
export async function expectMoney(page: Page, testId: string, value: number): Promise<void> {
  const expected = normMoney(value.toLocaleString('ru-RU')) + ' ₽';
  await expect
    .poll(async () => normMoney(await page.getByTestId(testId).innerText()))
    .toBe(expected);
}

export async function expectCartCount(page: Page, value: string): Promise<void> {
  await expect(page.getByTestId('cart-count')).toHaveText(value);
}

export async function addFromGrid(page: Page, productId: number, times = 1): Promise<void> {
  await page.goto('/#/');
  const btn = page.locator(
    `[data-testid="product-card"][data-id="${productId}"] button[data-add="${productId}"]`,
  );
  await expect(btn).toBeVisible();
  for (let i = 0; i < times; i++) {
    await btn.click();
    await expect(page.locator('#toast')).toHaveText('Товар добавлен в корзину');
  }
}

export async function addProductQty(page: Page, productId: number, qty: number): Promise<void> {
  await page.goto(`/#/product/${productId}`);
  await expect(page.getByTestId('product-page')).toBeVisible();
  if (qty !== 1) await page.locator('#qty').fill(String(qty));
  await page.locator('#add').click();
}

export async function openCart(page: Page): Promise<void> {
  await page.goto('/#/cart');
  await expect(page.locator('[data-testid="cart-table"], [data-testid="cart-empty"]')).toBeVisible();
}

export interface RegData {
  email: string;
  password: string;
  name: string;
}

export async function register(page: Page, name = 'E2E Покупатель'): Promise<RegData> {
  const data: RegData = { email: uniqEmail(), password: 'Pass123x', name };
  await page.goto('/#/register');
  const form = page.locator('#auth');
  await form.locator('input[name=name]').fill(data.name);
  await form.locator('input[name=email]').fill(data.email);
  await form.locator('input[name=password]').fill(data.password);
  await form.locator('button[type=submit]').click();
  await expect(page.locator('#user-name')).toContainText(data.name, { timeout: 20_000 });
  await page.goto('/#/');
  return data;
}

export async function login(page: Page, email: string, password = 'Pass123x'): Promise<void> {
  await page.goto('/#/login');
  const form = page.locator('#auth');
  await form.locator('input[name=email]').fill(email);
  await form.locator('input[name=password]').fill(password);
  await form.locator('button[type=submit]').click();
  await expect(page.locator('#user-name')).toBeVisible({ timeout: 20_000 });
}

export async function logout(page: Page): Promise<void> {
  await page.locator('#nav-logout').click();
  await expect(page.locator('#nav-login')).toBeVisible({ timeout: 20_000 });
}

export interface CheckoutOpts {
  name?: string;
  phone?: string;
  delivery?: 'pickup' | 'courier';
  address?: string;
  payment?: 'card' | 'cash';
}

export async function fillCheckout(page: Page, opts: CheckoutOpts = {}): Promise<void> {
  const o: Required<CheckoutOpts> = {
    name: 'Тест Тестов',
    phone: '+7 900 000-00-00',
    delivery: 'pickup',
    address: 'Минск, ул. Тестовая, 10',
    payment: 'cash',
    ...opts,
  };
  const form = page.locator('#checkout');
  await form.locator('input[name=name]').fill(o.name);
  await form.locator('input[name=phone]').fill(o.phone);
  await form.locator(`input[name=delivery][value="${o.delivery}"]`).check();
  if (o.delivery === 'courier') await form.locator('input[name=address]').fill(o.address);
  await form.locator(`input[name=payment][value="${o.payment}"]`).check();
}

export async function placeOrder(page: Page): Promise<void> {
  await page.locator('#checkout button[type=submit]').click();
  await expect(page.getByTestId('order-success')).toBeVisible({ timeout: 20_000 });
}
