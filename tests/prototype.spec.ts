import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.mode')).toHaveText('PAN');
});

test('plain hjkl moves spatial focus without changing the document', async ({ page }) => {
  const focused = page.locator('[data-focused="true"]');
  await expect(focused).toHaveAttribute('data-block-id', 'start');
  const saved = await page.evaluate(() => localStorage.getItem('boxhop-workspace-v1'));
  for (const [key, id] of [['h', 'left'], ['l', 'start'], ['l', 'right'], ['h', 'start'], ['j', 'below'], ['k', 'start'], ['k', 'above']]) {
    await page.keyboard.press(key);
    await expect(focused).toHaveAttribute('data-block-id', id);
  }
  expect(await page.evaluate(() => localStorage.getItem('boxhop-workspace-v1'))).toBe(saved);
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
  await expect(page.getByRole('tab')).toHaveCount(2);
  await page.locator('input[type="file"]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1,"blocks":[],"links":[null]}') });
  await expect(page.getByRole('status')).toContainText('Could not open');
  await expect(page.locator('.block')).toHaveCount(6);
  await expect(page.getByRole('tab')).toHaveCount(2);
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
    localStorage.removeItem('boxhop-workspace-v1');
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

test('new diagrams from the File menu and command mode keep independent drafts and histories', async ({ page }) => {
  await page.keyboard.type('aa');
  await page.keyboard.type('First tab draft');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'New diagram' }).click();
  const first = page.getByRole('tab', { name: 'Untitled 1' });
  const second = page.getByRole('tab', { name: 'Untitled 2' });
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.block')).toHaveCount(0);
  await page.keyboard.press('u');
  await expect(page.getByRole('status')).toContainText('Nothing to undo');
  await page.keyboard.type('aa');
  await page.keyboard.type('Second tab draft');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.keyboard.type(':new');
  await expect(page.getByRole('textbox', { name: 'Command', exact: true })).toHaveValue('new');
  await page.keyboard.press('Enter');
  const third = page.getByRole('tab', { name: 'Untitled 3' });
  await expect(third).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.block')).toHaveCount(0);
  await first.click();
  await expect(page.locator('.block')).toHaveCount(6);
  await expect(page.locator('.block-text').filter({ hasText: 'First tab draft' })).toBeVisible();
  await page.keyboard.press('u');
  await expect(page.locator('.block')).toHaveCount(5);
  await page.keyboard.press('Shift+R');
  await expect(page.locator('.block')).toHaveCount(6);
  await second.click();
  await expect(page.locator('.block-text')).toHaveText('Second tab draft');
  const pendingDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await pendingDownload;
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(exported.blocks).toHaveLength(1);
  expect(exported.blocks[0].text).toBe('Second tab draft');
  await page.reload();
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.block-text')).toHaveText('Second tab draft');
  await first.click();
  await expect(page.locator('.block-text').filter({ hasText: 'First tab draft' })).toBeVisible();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute('aria-selected', 'true');
});

test('application command mode cancels and reports unknown commands without changing diagrams', async ({ page }) => {
  await page.keyboard.type(':new');
  await page.keyboard.press('Escape');
  await expect(page.locator('.mode')).toHaveText('PAN');
  await expect(page.locator('.canvas')).toBeFocused();
  await expect(page.getByRole('tab')).toHaveCount(1);
  await page.keyboard.type(':unknown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Unknown command: unknown');
  await expect(page.getByRole('tab')).toHaveCount(1);
  await expect(page.locator('.block')).toHaveCount(5);
});

test('existing drafts migrate and opening an older file creates a separate tab', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.removeItem('boxhop-workspace-v1');
    localStorage.setItem('boxhop-prototype-v1', JSON.stringify({ version: 1, blocks: [{ id: 'old', text: 'Existing draft', x: 0, y: 0 }], links: [] }));
  });
  await page.reload();
  await expect(page.locator('.block-text')).toHaveText('Existing draft');
  await page.keyboard.type(':new');
  await page.keyboard.press('Enter');
  const imported = { version: 1, blocks: [{ id: 'imported', text: 'Imported draft', x: 0, y: 0 }], links: [] };
  await page.locator('input[type="file"]').setInputFiles({ name: 'diagram.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
  await expect(page.locator('.block-text')).toHaveText('Imported draft');
  await expect(page.getByRole('tab', { name: 'diagram', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('u');
  await expect(page.getByRole('status')).toContainText('Nothing to undo');
  await expect(page.locator('.block-text')).toHaveText('Imported draft');
  await page.getByRole('tab', { name: 'Untitled 2' }).click();
  await expect(page.locator('.block')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Untitled 1' }).click();
  await expect(page.locator('.block-text')).toHaveText('Existing draft');
  await page.reload();
  await expect(page.locator('.block-text')).toHaveText('Existing draft');
  await page.getByRole('tab', { name: 'diagram', exact: true }).click();
  await expect(page.locator('.block-text')).toHaveText('Imported draft');
  await page.keyboard.press('i');
  await page.keyboard.type('Unsaved ');
  await page.reload();
  await expect(page.getByRole('tab', { name: 'diagram', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.block-text')).toHaveText('Unsaved Imported draft');
});

test('importing preserves an active edit and allows the same file to be opened again', async ({ page }) => {
  await page.keyboard.type('aa');
  await page.keyboard.type('Existing unfinished thought');
  const file = { name: 'legacy.boxhop.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, blocks: [{ id: 'imported', text: 'Imported thought', x: 0, y: 0 }], links: [] })) };
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByRole('tab', { name: 'legacy' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.block-text')).toHaveText('Imported thought');
  await page.getByRole('tab', { name: 'Untitled 1' }).click();
  await expect(page.locator('.block-text').filter({ hasText: 'Existing unfinished thought' })).toBeVisible();
  await page.keyboard.press('u');
  await expect(page.locator('.block')).toHaveCount(5);
  await page.keyboard.press('Shift+R');
  await expect(page.locator('.block')).toHaveCount(6);
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByRole('tab', { name: 'legacy' })).toHaveCount(2);
  await expect(page.getByRole('tab', { name: 'legacy' }).last()).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.getByRole('tab')).toHaveCount(3);
  await expect(page.locator('.block-text')).toHaveText('Imported thought');
});

test('a delayed import preserves edits made after the file was selected', async ({ page }) => {
  await page.keyboard.type(':new Second');
  await page.keyboard.press('Enter');
  await page.evaluate(() => {
    const original = File.prototype.text;
    File.prototype.text = async function () {
      const content = await original.call(this);
      await new Promise<void>(resolve => { (window as Window & { releaseImport?: () => void }).releaseImport = resolve; });
      return content;
    };
  });
  const file = { name: 'pending.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, name: 'Pending import', blocks: [], links: [] })) };
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.waitForFunction(() => typeof (window as Window & { releaseImport?: () => void }).releaseImport === 'function');
  await page.getByRole('tab', { name: 'Untitled 1' }).click();
  await page.keyboard.type('aa');
  await page.keyboard.type('Edited while reading');
  await page.evaluate(() => (window as Window & { releaseImport?: () => void }).releaseImport?.());
  await expect(page.getByRole('tab', { name: 'Pending import' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Untitled 1' }).click();
  await expect(page.locator('.block-text').filter({ hasText: 'Edited while reading' })).toBeVisible();
  await page.keyboard.press('u');
  await expect(page.locator('.block')).toHaveCount(5);
  await page.keyboard.press('Shift+R');
  await expect(page.locator('.block-text').filter({ hasText: 'Edited while reading' })).toBeVisible();
});

test('named diagrams can be renamed, exported, and reopened with their names', async ({ page }) => {
  await page.keyboard.type(':new project_alpha');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab', { name: 'project_alpha' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Untitled 1' }).dblclick();
  const name = page.getByRole('textbox', { name: 'Diagram name' });
  await expect(name).toHaveValue('Untitled 1');
  await name.fill('Roadmap / Ideas');
  await name.press('Enter');
  const renamed = page.getByRole('tab', { name: 'Roadmap / Ideas' });
  await expect(renamed).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('u');
  await expect(page.getByRole('tab', { name: 'Untitled 1' })).toBeVisible();
  await page.keyboard.press('Shift+R');
  await expect(renamed).toBeVisible();
  await page.reload();
  await expect(renamed).toHaveAttribute('aria-selected', 'true');
  const pendingDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await pendingDownload;
  expect(download.suggestedFilename()).toBe('Roadmap _ Ideas.boxhop.json');
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(exported.name).toBe('Roadmap / Ideas');
  expect(exported.blocks).toHaveLength(5);
  await page.locator('.canvas').focus();
  await page.keyboard.type(':new Imported');
  await page.keyboard.press('Enter');
  await page.locator('input[type="file"]').setInputFiles((await download.path())!);
  await expect(page.getByRole('tab', { name: 'Roadmap / Ideas' }).last()).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.block')).toHaveCount(5);
  await page.keyboard.press('u');
  await expect(page.getByRole('status')).toContainText('Nothing to undo');
  await expect(page.getByRole('tab', { name: 'Roadmap / Ideas' }).last()).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.block')).toHaveCount(5);
  await page.getByRole('tab', { name: 'Imported' }).click();
  await expect(page.locator('.block')).toHaveCount(0);
});

test('tab rename can be canceled, ignores empty names, and saves on blur', async ({ page }) => {
  await page.keyboard.type(':new Design Notes');
  await page.keyboard.press('Enter');
  const tab = page.getByRole('tab', { name: 'Design Notes' });
  await tab.dblclick();
  const name = page.getByRole('textbox', { name: 'Diagram name' });
  await name.fill('Canceled');
  await name.press('Escape');
  await expect(tab).toBeVisible();
  await tab.focus();
  await page.keyboard.press('F2');
  await name.fill('   ');
  await name.press('Enter');
  await expect(tab).toBeVisible();
  await tab.dblclick();
  await name.fill('Saved on blur');
  await page.getByRole('tab', { name: 'Untitled 1' }).click();
  await expect(page.getByRole('tab', { name: 'Saved on blur' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Saved on blur' })).toBeVisible();
  await page.getByRole('tab', { name: 'Saved on blur' }).click();
  await page.keyboard.type('aa');
  await page.keyboard.type('Draft before rename');
  await page.getByRole('tab', { name: 'Saved on blur' }).dblclick();
  await name.fill('While editing');
  await name.press('Enter');
  await expect(page.locator('.mode')).toHaveText('PAN');
  await expect(page.locator('.block-text')).toHaveText('Draft before rename');
  await page.keyboard.press('u');
  await expect(page.getByRole('tab', { name: 'Saved on blur' })).toBeVisible();
  await page.keyboard.press('u');
  await expect(page.locator('.block')).toHaveCount(0);
});

test('F2 renames the active diagram after selecting a tab', async ({ page }) => {
  await page.keyboard.type(':new Second');
  await page.keyboard.press('Enter');
  await page.getByRole('tab', { name: 'Untitled 1' }).click();
  await expect(page.locator('.canvas')).toBeFocused();
  await page.keyboard.press('F2');
  const name = page.getByRole('textbox', { name: 'Diagram name' });
  await expect(name).toBeFocused();
  await expect(name).toHaveValue('Untitled 1');
  await name.fill('Renamed with F2');
  await name.press('Enter');
  await expect(page.getByRole('tab', { name: 'Renamed with F2' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Second' })).toBeVisible();
  await expect(page.locator('.canvas')).toBeFocused();
});

test('canceling and deleting an inactive diagram preserves the active edit', async ({ page }) => {
  await page.keyboard.type(':new Active');
  await page.keyboard.press('Enter');
  await page.keyboard.type('aa');
  await page.keyboard.type('Draft');
  const close = page.getByRole('button', { name: 'Delete diagram Untitled 1' });
  await close.click();
  const dialog = page.getByRole('dialog', { name: 'Delete “Untitled 1”?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Delete diagram', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(close).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Untitled 1' })).toBeVisible();
  await close.click();
  await dialog.getByRole('button', { name: 'Delete diagram', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Untitled 1' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Active' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.cm-content')).toBeFocused();
  await page.keyboard.type(' kept');
  await page.reload();
  await expect(page.getByRole('tab')).toHaveCount(1);
  await expect(page.locator('.block-text')).toHaveText('Draft kept');
});

test('deleting the active and last diagrams selects a remaining or empty tab', async ({ page }) => {
  await page.keyboard.type(':new Second');
  await page.keyboard.press('Enter');
  await page.keyboard.type('aa');
  await page.keyboard.type('Second draft');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.keyboard.type(':new Third');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Delete diagram Third' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete diagram', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Second' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.block-text')).toHaveText('Second draft');
  await page.keyboard.press('u');
  await expect(page.locator('.block')).toHaveCount(0);
  await page.keyboard.press('Shift+R');
  await expect(page.locator('.block-text')).toHaveText('Second draft');
  await page.getByRole('button', { name: 'Delete diagram Second' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete diagram', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Untitled 1' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.block')).toHaveCount(5);
  await page.getByRole('button', { name: 'Delete diagram Untitled 1' }).click();
  await expect(page.getByRole('dialog')).toContainText('A new empty diagram will open.');
  await page.getByRole('dialog').getByRole('button', { name: 'Delete diagram', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Untitled 1' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.block')).toHaveCount(0);
  await page.keyboard.press('u');
  await expect(page.getByRole('status')).toContainText('Nothing to undo');
  await page.reload();
  await expect(page.getByRole('tab')).toHaveCount(1);
  await expect(page.locator('.block')).toHaveCount(0);
});

test('deleting the last diagram while editing requires confirmation', async ({ page }) => {
  await page.keyboard.type('aa');
  await page.keyboard.type('Unfinished draft');
  const close = page.getByRole('button', { name: 'Delete diagram Untitled 1' });
  await close.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('.mode')).toHaveText('EDIT · INSERT');
  await expect(page.locator('.cm-content')).toHaveText('Unfinished draft');
  await close.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete diagram', exact: true }).click();
  await expect(page.locator('.mode')).toHaveText('PAN');
  await expect(page.locator('.block')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.block')).toHaveCount(0);
});
