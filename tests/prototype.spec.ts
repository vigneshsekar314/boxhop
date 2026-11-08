import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.mode')).toHaveText('PAN');
});

test('plain hjkl moves spatial focus without changing the document', async ({ page }) => {
  const focused = page.locator('[data-focused="true"]');
  await expect(focused).toHaveAttribute('data-block-id', 'start');
  const saved = await page.evaluate(() => localStorage.getItem('boxhop-prototype-v1'));
  for (const [key, id] of [['h', 'left'], ['l', 'start'], ['l', 'right'], ['h', 'start'], ['j', 'below'], ['k', 'start'], ['k', 'above']]) {
    await page.keyboard.press(key);
    await expect(focused).toHaveAttribute('data-block-id', id);
  }
  expect(await page.evaluate(() => localStorage.getItem('boxhop-prototype-v1'))).toBe(saved);
});

test('Vim owns text input, motions, visual mode and the first Escape', async ({ page }) => {
  await page.keyboard.type('aa');
  await expect(page.locator('.mode')).toHaveText('EDIT · INSERT');
  await page.keyboard.type('first line');
  await page.keyboard.press('Enter');
  await page.keyboard.type('hjkl aa al atl');
  await page.keyboard.press('Tab');
  await expect(page.locator('.block')).toHaveCount(6);
  await page.keyboard.press('Escape');
  await expect(page.locator('.mode')).toHaveText('EDIT · NORMAL');
  await page.keyboard.press('0');
  await page.keyboard.press('v');
  await expect(page.locator('.mode')).toHaveText('EDIT · VISUAL');
  await page.keyboard.press('l');
  await page.keyboard.press('Escape');
  await expect(page.locator('.mode')).toHaveText('EDIT · NORMAL');
  // A held Escape should not advance through the second keyboard scope.
  await page.locator('.cm-content').dispatchEvent('keydown', { key: 'Escape', repeat: true });
  await expect(page.locator('.mode')).toHaveText('EDIT · NORMAL');
  await page.keyboard.press('Escape');
  await expect(page.locator('.mode')).toHaveText('PAN');
  await expect(page.locator('[data-focused="true"] .block-text')).toContainText('first line\nhjkl aa al atl');
});

test('Vim change-word and undo operate inside the block', async ({ page }) => {
  await page.keyboard.type('aa');
  await page.keyboard.type('hello world');
  await page.keyboard.press('Escape');
  await page.keyboard.press('0');
  await page.keyboard.type('cw');
  await page.keyboard.type('goodbye');
  await page.keyboard.press('Escape');
  await expect(page.locator('.cm-content')).toHaveText('goodbye world');
  await page.keyboard.press('u');
  // This adapter keeps a change operator's delete and insert as separate undo steps.
  await expect(page.locator('.cm-content')).toHaveText(' world');
  await page.keyboard.press('u');
  await expect(page.locator('.cm-content')).toHaveText('hello world');
  await expect(page.locator('.block')).toHaveCount(6);
});

test('creation keeps positions stable; labeled creation can cancel; undo restores graph', async ({ page }) => {
  const positions = await page.locator('.block').evaluateAll(blocks => blocks.map(b => b.getAttribute('style')));
  await page.keyboard.type('atl');
  await expect(page.getByRole('dialog', { name: 'New link label' })).toBeVisible();
  await page.keyboard.type('canceled relationship');
  await page.keyboard.press('Escape');
  await expect(page.locator('.block')).toHaveCount(5);
  await page.keyboard.type('atl');
  await page.getByRole('textbox', { name: 'Link label' }).fill('depends on');
  await page.keyboard.press('Enter');
  await page.keyboard.type('A connected idea');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.locator('.connection')).toHaveCount(5);
  await expect(page.locator('.connections text').filter({ hasText: 'depends on' })).toBeVisible();
  expect((await page.locator('.block').evaluateAll(blocks => blocks.map(b => b.getAttribute('style')))).slice(0, 5)).toEqual(positions);
  await page.keyboard.press('d');
  await expect(page.locator('.block')).toHaveCount(5);
  await expect(page.locator('.connection')).toHaveCount(4);
  await page.keyboard.press('u');
  await expect(page.locator('.block')).toHaveCount(6);
  await expect(page.locator('.connection')).toHaveCount(5);
  await page.keyboard.press('u');
  await expect(page.locator('.block')).toHaveCount(5);
  await page.keyboard.press('Shift+R');
  await expect(page.locator('.block')).toHaveCount(6);
  await expect(page.locator('.connection')).toHaveCount(5);
  await page.keyboard.press('u');
  await expect(page.locator('.block')).toHaveCount(5);
  await page.keyboard.press('Control+r');
  await expect(page.locator('.block')).toHaveCount(6);
});

test('active insert text survives reload and native files round-trip', async ({ page }) => {
  await page.keyboard.type('al');
  await page.keyboard.type('Recover this unfinished thought');
  await expect(page.locator('.cm-content')).toContainText('Recover this unfinished thought');
  await page.reload();
  await expect(page.locator('.block')).toHaveCount(6);
  await expect(page.locator('.block-text').filter({ hasText: 'Recover this unfinished thought' })).toBeVisible();
  const pendingDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await pendingDownload;
  const file = await download.path();
  expect(file).toBeTruthy();
  await page.locator('input[type="file"]').setInputFiles(file!);
  await expect(page.getByRole('status')).toContainText('Diagram opened');
  await expect(page.locator('.block')).toHaveCount(6);
  await page.locator('input[type="file"]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1,"blocks":[],"links":[null]}') });
  await expect(page.getByRole('status')).toContainText('Could not open');
  await expect(page.locator('.block')).toHaveCount(6);
});

test('Vim command prompt and help return to the correct keyboard scope', async ({ page }) => {
  await page.keyboard.press('i');
  await page.keyboard.press('Escape');
  await page.keyboard.type(':');
  await expect(page.locator('.mode')).toHaveText('EDIT · COMMAND');
  await page.keyboard.press('Escape');
  await expect(page.locator('.mode')).toHaveText('EDIT · NORMAL');
  await page.getByRole('button', { name: 'Keyboard shortcuts', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.cm-content')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.mode')).toHaveText('PAN');
});

test('Markdown preview follows the focused block, scrolls, and updates while editing', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('boxhop-prototype-v1', JSON.stringify({
      version: 1,
      blocks: [
        { id: 'first', x: 0, y: 0, text: '# First thought\n\n**Bold** and [a link](https://example.com)\n\n' + Array.from({ length: 50 }, (_, index) => `Paragraph ${index}`).join('\n\n') + '\n\n<script>alert(1)</script>' },
        { id: 'second', x: 360, y: 0, text: '' },
      ],
      links: [],
    }));
  });
  await page.reload();
  await page.keyboard.press('p');
  const preview = page.getByRole('complementary', { name: 'Markdown preview' });
  const content = page.getByLabel('Preview content');
  await expect(preview.getByRole('heading', { name: 'First thought' })).toBeVisible();
  await expect(preview.locator('strong')).toHaveText('Bold');
  await expect(preview.getByRole('link', { name: 'a link' })).toHaveAttribute('href', 'https://example.com');
  await expect(preview.locator('script')).toHaveCount(0);
  await content.focus();
  await page.keyboard.press('End');
  await expect.poll(() => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await page.locator('.canvas').focus();
  await page.keyboard.press('l');
  await expect(preview).toContainText('This thought is empty.');
  await page.keyboard.press('i');
  await page.keyboard.type('# Live preview');
  await expect(preview.getByRole('heading', { name: 'Live preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Close preview' }).click();
  await expect(preview).toHaveCount(0);
  await expect(page.locator('.cm-content')).toBeFocused();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(preview.getByRole('heading', { name: 'Live preview' })).toBeVisible();
  await content.focus();
  await page.keyboard.press('Escape');
  await expect(preview).toHaveCount(0);
  await expect(page.locator('.cm-content')).toBeFocused();
});
