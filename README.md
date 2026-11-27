# arcadestr-site

Static marketing and download site for Arcadestr. Built with Astro 7 and Tailwind v4. Zero JS except the OS-detecting download button.

## Run

```sh
npm install
npm run dev                                        # http://localhost:4321
RELEASE_JSON=fixtures/release.json npm run dev     # with mock release data
npm run build                                      # -> dist/
```

## Configuration (build-time env, see `.env.example`)

| Var | Effect |
|---|---|
| `SITE_URL` | Canonical URLs, sitemap, OG tags |
| `PUBLIC_GITHUB_REPO` | `owner/repo` with Tauri release assets. Empty: download buttons show "coming soon" |
| `PUBLIC_SOURCE_URL`, `PUBLIC_NOSTR_NPUB` | Footer links, hidden when empty |
| `GITHUB_TOKEN` | Optional; avoids GitHub API rate limits during build |
| `RELEASE_JSON` | Local path to a saved `/releases/latest` response, used in place of the API |

Copy and taglines live in `src/pages/index.astro`. Site constants and spec summaries are in `src/config.ts`. Design tokens are in the `@theme` block of `src/styles/global.css`.

## Downloads

`src/lib/releases.ts` fetches the latest GitHub release once per build and classifies the Tauri bundles:

- Linux: AppImage (primary when available), deb, rpm, Arch Linux (`.pkg.tar.zst`)
- Windows: `-setup.exe` (primary), msi
- macOS: dmg (planned)
- Checksums: `SHA256SUMS`, `checksums.txt` or `*.sha256`

Updater artifacts (`.sig`, `latest.json`) are ignored. Download links only change when the site rebuilds, so add this step to the app's release workflow:

```yaml
- run: gh api repos/<owner>/arcadestr-site/dispatches -f event_type=app-released
  env: { GH_TOKEN: ${{ secrets.SITE_DISPATCH_TOKEN }} }
```

## Protocol specs

The spec pages render every `src/content/specs/*.md`. Sync them from the app repo:

```sh
npm run sync-specs -- ../arcadestr/docs        # or explicit file paths
```

Cross-links such as `NIP-102.md` are rewritten to `/protocol/nip-102/`, and upstream links such as `99.md` point to `nostr-protocol/nips`. Display order and card summaries come from `specMeta` in `src/config.ts`.

## Deploy

`.github/workflows/deploy.yml` deploys to Cloudflare Pages on push to `main`, on manual dispatch, and on `repository_dispatch: app-released`.

- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Repo variables: `SITE_URL`, `PUBLIC_GITHUB_REPO`, …

The output in `dist/` is plain static files, so any static host works.

## Future web app

Deploy the Leptos `web/` crate separately (e.g. `app.<domain>`) and set `PUBLIC_WEB_APP_URL`. This site does not depend on it.
