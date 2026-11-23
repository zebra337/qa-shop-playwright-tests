import { expect, test } from '@playwright/test';
import {
  addFromGrid,
  addProductQty,
  expectCartCount,
  expectMoney,
  fillCheckout,
  placeOrder,
  register,
} from './utils';

test.describe('Оформление заказа', () => {
  test('гостевой заказ: самовывоз, наличные, бесплатная доставка', async ({ page }) => {
    await addFromGrid(page, 5);
    await addFromGrid(page, 5); // 480 × 2 = 960
    await page.goto('/#/checkout');
    await fillCheckout(page, { delivery: 'pickup', payment: 'cash' });
    await expect(page.locator('#address-row')).toBeHidden();
    await expect(page.getByTestId('shipping')).toHaveText('бесплатно');
    await expectMoney(page, 'total', 960);
    await placeOrder(page);
    await expect(page.getByTestId('order-id')).toHaveText(/\d+/);
    await expectCartCount(page, '0');
  });

  test('курьерская доставка стоит 300 ₽ до суммы 3000 ₽', async ({ page }) => {
    await addFromGrid(page, 1); // 890
    await page.goto('/#/checkout');
    await fillCheckout(page, { delivery: 'courier', payment: 'card' });
    await expect(page.locator('#address-row')).toBeVisible();
    await expect(page.getByTestId('shipping')).toContainText('300');
    await expectMoney(page, 'total', 1190);
    await placeOrder(page);
  });

  test('бесплатная доставка при заказе от 3000 ₽', async ({ page }) => {
    await addProductQty(page, 7, 1); // 4200
    await page.goto('/#/checkout');
    await fillCheckout(page, { delivery: 'courier', payment: 'card' });
    await expect(page.getByTestId('shipping')).toHaveText('бесплатно');
    await expectMoney(page, 'total', 4200);
    await placeOrder(page);
  });

  test('валидация: форма до заполнения не отправляется', async ({ page }) => {
    await addFromGrid(page, 5);
    await page.goto('/#/checkout');
    await page.locator('#checkout button[type=submit]').click();
    await expect(page.locator('#form-error')).toBeVisible();
    await expect(page.locator('#name-error')).toContainText('Укажите');
    await expect(page.locator('#phone-error')).toContainText('Укажите');
    await expect(page.locator('#address-error')).toContainText('Укажите');
  });

  test('заказ авторизованного пользователя виден в «Моих заказах»', async ({ page }) => {
    await register(page, 'E2E Заказчик');
    await addFromGrid(page, 9); // 450
    await page.goto('/#/checkout');
    await fillCheckout(page, { delivery: 'pickup', payment: 'cash' });
    await placeOrder(page);
    const orderId = (await page.getByTestId('order-id').innerText()).replace(/\D/g, '');
    await page.goto('/#/orders');
    const row = page.locator('[data-testid="orders-table"] tbody tr', { hasText: orderId });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('450');
  });

  test('после оформления пустая корзина снова требует выбрать товар', async ({ page }) => {
    await addFromGrid(page, 5);
    await page.goto('/#/checkout');
    await fillCheckout(page);
    await placeOrder(page);
    await page.goto('/#/checkout');
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('API: заказ без товаров невозможен', async ({ request }) => {
    const res = await request.post('/api/orders', { data: {} });
    expect([400, 422]).toContain(res.status());
  });
});
