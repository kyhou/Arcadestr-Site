import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

test('the download page lists the Arch package under Linux', (t) => {
  // Keep the test output on the same filesystem as Astro's staging directory.
  mkdirSync('node_modules/.cache', { recursive: true });
  const outDir = mkdtempSync(join('node_modules/.cache', 'arcadestr-site-'));
  t.after(() => rmSync(outDir, { recursive: true, force: true }));

  execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', outDir], {
    env: { ...process.env, RELEASE_JSON: 'fixtures/release.json' },
  });

  const html = readFileSync(join(outDir, 'download/index.html'), 'utf8');
  const linux = html.split('id="linux"')[1]?.split('id="windows"')[0] ?? '';
  assert.ok(linux.includes('href="https://example.invalid/a.pkg.tar.zst"'), 'Arch package link missing from Linux downloads');
});
