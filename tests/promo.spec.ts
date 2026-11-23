import { expect, test } from '@playwright/test';
import { addProductQty, expectMoney, openCart } from './utils';

const applyPromo = async (page: any, code: string) => {
  await page.locator('#promo input[name=code]').fill(code);
  await page.locator('#promo button[type=submit]').click();
};

test.describe('Промокоды', () => {
  test('SALE10 даёт скидку 10 %', async ({ page }) => {
    await addProductQty(page, 2, 1); // 2150 ₽
    await openCart(page);
    await applyPromo(page, 'SALE10');
    await expect(page.getByTestId('subtotal')).toContainText('2 150');
    await expect(page.getByTestId('discount')).toContainText('215');
    await expectMoney(page, 'total', 1935);
  });

  test('WELCOME500 не действует при сумме товаров меньше 2000 ₽', async ({ page }) => {
    await addProductQty(page, 5, 1); // 480 ₽
    await openCart(page);
    await applyPromo(page, 'WELCOME500');
    await expect(page.getByTestId('discount')).toHaveCount(0);
  });

  test('WELCOME500 даёт скидку 500 ₽ при сумме от 2000 ₽', async ({ page }) => {
    await addProductQty(page, 2, 1); // 2150 ₽
    await openCart(page);
    await applyPromo(page, 'WELCOME500');
    await expect(page.getByTestId('discount')).toContainText('500');
    await expectMoney(page, 'total', 1650);
  });

  test('неизвестный промокод отклоняется', async ({ page }) => {
    await addProductQty(page, 5, 1);
    await openCart(page);
    await applyPromo(page, 'BLACKFRIDAY');
    await expect(page.locator('#toast.error')).toBeVisible();
  });

  test('пустой код сбрасывает промокод', async ({ page }) => {
    await addProductQty(page, 2, 1);
    await openCart(page);
    await applyPromo(page, 'SALE10');
    await expect(page.getByTestId('discount')).toBeVisible();
    await applyPromo(page, '');
    await expect(page.getByTestId('discount')).toHaveCount(0);
    await expectMoney(page, 'total', 2150);
  });

  test('скидка пересчитывается при изменении количества', async ({ page }) => {
    await addProductQty(page, 2, 1); // 2150
    await openCart(page);
    await applyPromo(page, 'SALE10');
    const input = page.locator('[data-testid="cart-row"] input[name=qty]');
    await input.fill('2');
    await input.press('Tab');
    await expectMoney(page, 'subtotal', 4300);
    await expect(page.getByTestId('discount')).toContainText('430');
    await expectMoney(page, 'total', 3870);
  });
});
