import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// Drop the spec markdown files (ADP-01.md, NIP-102.md, NIP-103.md, ...) into
// src/content/specs/ — or run `npm run sync-specs -- <path-to-arcadestr-repo>`.
// Slug = lowercased filename. Title = first H1.
export const collections = {
  specs: defineCollection({
    loader: glob({
      pattern: '*.md',
      base: './src/content/specs',
      generateId: ({ entry }) => entry.replace(/\.md$/, '').toLowerCase(),
    }),
  }),
};
