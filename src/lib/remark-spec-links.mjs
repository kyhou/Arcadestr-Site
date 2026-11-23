import { visit } from 'unist-util-visit';

// Spec files link to each other as `NIP-102.md` and to upstream NIPs as `99.md`.
// Rewrite both so links work on the site.
const LOCAL = /^([A-Za-z][\w-]*)\.md(#.*)?$/;
const UPSTREAM = /^(\d{2})\.md(#.*)?$/;

export function remarkSpecLinks() {
  return (tree) => {
    visit(tree, 'link', (node) => {
      const url = node.url ?? '';
      let m;
      if ((m = url.match(UPSTREAM))) {
        node.url = `https://github.com/nostr-protocol/nips/blob/master/${m[1]}.md${m[2] ?? ''}`;
      } else if ((m = url.match(LOCAL))) {
        node.url = `/protocol/${m[1].toLowerCase()}/${m[2] ?? ''}`;
      }
    });
  };
}
