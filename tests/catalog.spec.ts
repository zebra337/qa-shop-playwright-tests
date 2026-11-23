import { expect, test } from '@playwright/test';
import { expectMoney } from './utils';

const card = (id: number) => `[data-testid="product-card"][data-id="${id}"]`;

test.describe('Каталог и поиск', () => {
  test('витрина показывает весь каталог', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Каталог' })).toBeVisible();
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(16);
  });

  test('фильтр по категории «Чай» показывает только чай', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('select[name=category]', 'tea');
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards).toHaveCount(3);
    await expect(page.locator(card(4))).toContainText('Те Гуань Инь');
    await expect(page.locator(card(6))).toContainText('Матча');
    await expect(page.locator('[data-testid="product-card"]', { hasText: 'Кофе' })).toHaveCount(0);
  });

  test('поиск по названию без учёта регистра', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name=search]', 'МАТЧА');
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Матча');
  });

  test('поиск находит и по описанию товара', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name=search]', 'Swiss Water');
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('без кофеина');
  });

  test('пустой результат поиска показывает сообщение', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name=search]', 'абракадабра');
    await expect(page.getByTestId('empty-list')).toBeVisible();
  });

  test('сортировка по цене и имени', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('select[name=sort]', 'price_asc');
    await expect(page.locator('[data-testid="product-card"]').first()).toContainText('320');
    await page.selectOption('select[name=sort]', 'price_desc');
    await expect(page.locator('[data-testid="product-card"]').first()).toContainText('5 600');
    await page.selectOption('select[name=sort]', 'name');
    await expect(page.locator('[data-testid="product-card"]').first()).toContainText('Воронка');
  });

  test('товар без наличия нельзя добавить', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(card(3))).toContainText('Нет в наличии');
    await expect(page.locator(`${card(3)} button[data-add]`)).toBeDisabled();
  });

  test('карточка товара открывается с ценой', async ({ page }) => {
    await page.goto('/#/product/1');
    await expect(page.getByTestId('product-page')).toContainText('890');
  });

  test('несуществующий товар показывает сообщение', async ({ page }) => {
    await page.goto('/#/product/999');
    await expect(page.getByRole('heading', { name: 'Товар не найден' })).toBeVisible();
  });

  test('API: фильтр категории с сортировкой по возрастанию цены', async ({ request }) => {
    const res = await request.get('/api/products?category=tea&sort=price_asc');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([
      expect.objectContaining({ id: 5, price: 480 }),
      expect.objectContaining({ id: 4, price: 640 }),
      expect.objectContaining({ id: 6, price: 1750 }),
    ]);
  });

  test('API: несуществующий товар', async ({ request }) => {
    const res = await request.get('/api/products/999');
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({ error: 'Товар не найден' });
  });
});
