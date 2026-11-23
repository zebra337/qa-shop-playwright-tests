import { expect, test } from '@playwright/test';
import { addFromGrid, addProductQty, expectCartCount, expectMoney, openCart } from './utils';

test.describe('Корзина', () => {
  test('добавление из витрины обновляет счётчик и состав корзины', async ({ page }) => {
    await addFromGrid(page, 1);
    await addFromGrid(page, 4);
    await expectCartCount(page, '2');
    await openCart(page);
    await expect(page.locator('[data-testid="cart-row"]')).toHaveCount(2);
  });

  test('количество с карточки товара попадает в корзину', async ({ page }) => {
    await addProductQty(page, 6, 3); // 1750 × 3
    await expectCartCount(page, '3');
    await openCart(page);
    await expectMoney(page, 'subtotal', 5250);
    await expectMoney(page, 'total', 5250);
  });

  test('кнопка «+» в корзине увеличивает количество', async ({ page }) => {
    await addFromGrid(page, 5); // 480
    await openCart(page);
    await page.locator('[data-testid="cart-row"] button[data-qty="2"]').click();
    await expect(page.locator('[data-testid="cart-row"] input[name=qty]')).toHaveValue('2');
    await expectMoney(page, 'subtotal', 960);
  });

  test('кнопка «−» при 1 шт. удаляет позицию', async ({ page }) => {
    await addFromGrid(page, 5);
    await openCart(page);
    await page.locator('[data-testid="cart-row"] button[data-qty="0"]').click();
    await expect(page.getByTestId('cart-empty')).toBeVisible();
    await expectCartCount(page, '0');
  });

  test('количество можно изменить вручную', async ({ page }) => {
    await addFromGrid(page, 4); // 640
    await openCart(page);
    const input = page.locator('[data-testid="cart-row"] input[name=qty]');
    await input.fill('3');
    await input.press('Tab'); // перерендер по событию change
    await expectMoney(page, 'subtotal', 1920);
  });

  test('кнопка «Удалить» убирает позицию', async ({ page }) => {
    await addFromGrid(page, 5);
    await addFromGrid(page, 4);
    await openCart(page);
    await page.locator('[data-testid="cart-row"][data-id="4"] button[data-remove]').click();
    await expect(page.locator('[data-testid="cart-row"]')).toHaveCount(1);
  });

  test('очистка корзины сбрасывает счётчик', async ({ page }) => {
    await addFromGrid(page, 5);
    await openCart(page);
    await page.locator('[data-testid="cart-clear"]').click();
    await expect(page.getByTestId('cart-empty')).toBeVisible();
    await expectCartCount(page, '0');
  });

  test('нельзя заказать больше, чем есть на складе (карточка товара)', async ({ page }) => {
    // у продукта 6 в наличии 7 шт.
    await addProductQty(page, 6, 8);
    await expect(page.locator('#toast.error')).toHaveText('В наличии только 7 шт.');
    await expectCartCount(page, '0');
  });

  test('нельзя заказать больше, чем есть на складе (повторное добавление)', async ({ page }) => {
    await addProductQty(page, 6, 5);
    await addProductQty(page, 6, 5); // 5 + 5 > 7
    await expect(page.locator('#toast.error')).toContainText('7');
    await expectCartCount(page, '5');
  });

  test('оформление пустой корзины невозможно', async ({ page }) => {
    await page.goto('/#/checkout');
    await expect(page.getByTestId('cart-empty')).toBeVisible();
    expect(page.url()).toContain('#/cart');
  });
});
