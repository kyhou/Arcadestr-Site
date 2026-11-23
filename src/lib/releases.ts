import { site } from '../config';

export type Os = 'linux' | 'windows' | 'macos';

export interface Asset {
  os: Os;
  kind: string; // AppImage, deb, rpm, msi, exe, dmg
  name: string;
  url: string;
  size: number;
  primary: boolean; // the one the big button should point at
}

export interface Release {
  version: string;
  publishedAt: string;
  url: string;
  assets: Asset[];
  checksums?: { name: string; url: string };
}

// Tauri bundle naming. Updater artifacts (.sig, .tar.gz, .zip) are skipped.
const RULES: { re: RegExp; os: Os; kind: string; primary?: boolean }[] = [
  { re: /\.AppImage$/i, os: 'linux', kind: 'AppImage', primary: true },
  { re: /\.deb$/i, os: 'linux', kind: 'deb' },
  { re: /\.rpm$/i, os: 'linux', kind: 'rpm' },
  { re: /-setup\.exe$/i, os: 'windows', kind: 'exe', primary: true },
  { re: /\.msi$/i, os: 'windows', kind: 'msi' },
  { re: /\.dmg$/i, os: 'macos', kind: 'dmg', primary: true },
];

const CHECKSUMS = /^(SHA256SUMS(\.txt)?|checksums?\.txt|.*\.sha256)$/i;

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
    let checksums: Release['checksums'];
    for (const a of r.assets ?? []) {
      if (CHECKSUMS.test(a.name)) {
        checksums ??= { name: a.name, url: a.browser_download_url };
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
