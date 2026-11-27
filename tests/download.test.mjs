import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

test('the download page lists installers and their release-specific verification instructions', (t) => {
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

  const section = html.split('aria-labelledby="verify-heading"')[1] ?? '';
  const panel = (name) => section.split(`data-package="${name}"`)[1]?.split('</details>')[0] ?? '';
  const exe = panel('Arcadestr-0.1.0-windows-x86_64-setup.exe');
  const msi = panel('Arcadestr-0.1.0-windows-x86_64.msi');
  const dmg = panel('Arcadestr-0.1.0-macos-arm64.dmg');
  const arch = panel('arcadestr-0.1.0-1-x86_64.pkg.tar.zst');
  const rpm = panel('Arcadestr-0.1.0-1.x86_64.rpm');
  assert.match(exe, /Get-FileHash -LiteralPath/);
  assert.match(exe, /data-sha256[^>]*>ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad/);
  assert.match(msi, /Get-Content -LiteralPath (?:'|&#39;)SHA256SUMS/);
  assert.doesNotMatch(msi, /data-local-verifier/);
  assert.match(dmg, /shasum -a 256 --check/);
  assert.match(dmg, /data-local-verifier/);
  assert.match(arch, /sha256sum --check/);
  assert.match(arch, /data-sha256[^>]*>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855/);
  assert.match(rpm, /SHA256SUMS.*sha256sum --check/);
});
