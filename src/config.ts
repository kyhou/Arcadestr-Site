// Single place for everything that changes per deployment.
// Values read from env at build time fall back to safe defaults.

export const site = {
  name: 'Arcadestr',
  tagline: 'A game store with no store owner.',
  description:
    'Arcadestr is a desktop app for buying, owning and installing PC games over Nostr. Pay developers directly with Lightning; your proof of ownership lives on open relays, not on our servers.',

  // "owner/repo" holding the Tauri release artifacts. Empty = downloads show "coming soon".
  githubRepo: import.meta.env.PUBLIC_GITHUB_REPO ?? '',

  // Optional links. Empty strings are hidden.
  sourceUrl: import.meta.env.PUBLIC_SOURCE_URL ?? '',
  nostrNpub: import.meta.env.PUBLIC_NOSTR_NPUB ?? '',
  webAppUrl: import.meta.env.PUBLIC_WEB_APP_URL ?? '', // future app.arcadestr.* deployment

  platforms: {
    linux: { label: 'Linux', status: 'launch' },
    windows: { label: 'Windows', status: 'launch' },
    macos: { label: 'macOS', status: 'later' },
  },
} as const;

// Display order and descriptions for spec pages. Specs not listed here still render, after these.
export const specMeta: Record<string, { short: string; summary: string }> = {
  'adp-01': {
    short: 'ADP-01',
    summary:
      'Arcadestr Distribution Protocol. An open HTTP protocol for serving paid game files. Any operator can run a server; developers pick which servers carry their builds.',
  },
  'nip-102': {
    short: 'NIP-102',
    summary:
      'Marketplace Receipt (kind:1020). A signed, buyer-encrypted receipt that works as a portable proof of ownership.',
  },
  'nip-103': {
    short: 'NIP-103',
    summary:
      'Entitlement Grant. Durable access issued without payment: promo claims, review copies, prizes, migrated licenses.',
  },
  'adp-01-amendment-free-acquisitions': {
    short: 'ADP-01 amendment',
    summary: 'Free and promotional acquisitions: acquisition policies, campaigns and delegated grant issuance.',
  },
};
