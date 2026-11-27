import { site } from '../config';

export type Os = 'linux' | 'windows' | 'macos';

export interface Asset {
  os: Os;
  kind: string; // AppImage, deb, rpm, Arch, msi, exe, dmg
  name: string;
  url: string;
  size: number;
  primary: boolean; // the one the big button should point at
  sha256?: string;
}

type ChecksumFile = { name: string; url: string };

export interface Release {
  version: string;
  publishedAt: string;
  url: string;
  assets: Asset[];
  checksums?: ChecksumFile;
}

// Installer naming. Updater artifacts (.sig, .tar.gz, .zip) are skipped.
const RULES: { re: RegExp; os: Os; kind: string; primary?: boolean }[] = [
  { re: /\.AppImage$/i, os: 'linux', kind: 'AppImage', primary: true },
  { re: /\.deb$/i, os: 'linux', kind: 'deb' },
  { re: /\.rpm$/i, os: 'linux', kind: 'rpm' },
  { re: /\.pkg\.tar\.zst$/i, os: 'linux', kind: 'Arch' },
  { re: /-setup\.exe$/i, os: 'windows', kind: 'exe', primary: true },
  { re: /\.msi$/i, os: 'windows', kind: 'msi' },
  { re: /\.dmg$/i, os: 'macos', kind: 'dmg', primary: true },
];

const CHECKSUMS = /^(SHA256SUMS(\.txt)?|checksums?\.txt|.*\.sha256)$/i;
const MANIFEST = /^(SHA256SUMS(\.txt)?|checksums?\.txt)$/i;

async function loadChecksums(file: ChecksumFile, assets: Asset[]) {
  try {
    const res = await fetch(file.url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const hashes = new Map<string, Set<string>>();
    for (const line of text.split(/\r?\n/)) {
      const entry = /^([a-f0-9]{64}) [ *](.+)$/i.exec(line);
      if (!entry) continue;
      const [, hash, filename] = entry;
      const name = filename.replace(/^\.\//, '');
      const values = hashes.get(name) ?? new Set<string>();
      values.add(hash.toLowerCase());
      hashes.set(name, values);
    }

    for (const asset of assets) {
      const values = hashes.get(asset.name);
      if (values?.size === 1) asset.sha256 = values.values().next().value;
    }
    // Some releases publish a bare hash in a file named after the installer.
    if (assets.length === 1 && file.name === `${assets[0].name}.sha256` && /^[a-f0-9]{64}$/i.test(text.trim())) {
      assets[0].sha256 = text.trim().toLowerCase();
    }
  } catch (e) {
    console.warn(`[releases] Could not read ${file.name}:`, (e as Error).message);
  }
}

let cached: Promise<Release | null> | undefined;

/** Fetched once per build. Returns null when no repo is configured or the API is unreachable. */
export function getLatestRelease(): Promise<Release | null> {
  return (cached ??= load());
}

async function fetchRaw(): Promise<any | null> {
  // Local dev / tests: point RELEASE_JSON at a saved GitHub "latest release" response.
  if (process.env.RELEASE_JSON) {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(process.env.RELEASE_JSON, 'utf8'));
  }
  if (!site.githubRepo) return null;
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/repos/${site.githubRepo}/releases/latest`, { headers });
  if (!res.ok) {
    console.warn(`[releases] GitHub API ${res.status} for ${site.githubRepo}`);
    return null;
  }
  return res.json();
}

async function load(): Promise<Release | null> {
  try {
    const r = await fetchRaw();
    if (!r) return null;
    const assets: Asset[] = [];
    const checksumFiles: ChecksumFile[] = [];
    for (const a of r.assets ?? []) {
      if (CHECKSUMS.test(a.name)) {
        checksumFiles.push({ name: a.name, url: a.browser_download_url });
        continue;
      }
      const rule = RULES.find((x) => x.re.test(a.name));
      if (!rule) continue;
      assets.push({
        os: rule.os,
        kind: rule.kind,
        name: a.name,
        url: a.browser_download_url,
        size: a.size,
        primary: !!rule.primary,
      });
    }
    const checksums = checksumFiles.find((file) => /^SHA256SUMS(\.txt)?$/i.test(file.name))
      ?? checksumFiles.find((file) => MANIFEST.test(file.name))
      ?? checksumFiles.find((file) => !assets.some((asset) => file.name === `${asset.name}.sha256`));
    if (checksums) await loadChecksums(checksums, assets);
    await Promise.all(assets.filter((asset) => !asset.sha256).map(async (asset) => {
      const file = checksumFiles.find((file) => file.name === `${asset.name}.sha256`);
      if (file) await loadChecksums(file, [asset]);
    }));

    return {
      version: String(r.tag_name ?? '').replace(/^v/, ''),
      publishedAt: r.published_at,
      url: r.html_url,
      assets,
      checksums,
    };
  } catch (e) {
    console.warn('[releases] fetch failed:', (e as Error).message);
    return null;
  }
}

export function formatSize(bytes: number): string {
  return bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`;
}

export function primaryByOs(assets: Asset[]): Partial<Record<Os, Asset>> {
  return Object.fromEntries(assets.filter((asset) => asset.primary).map((asset) => [asset.os, asset]));
}
