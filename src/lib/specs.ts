import { getCollection } from 'astro:content';
import { specMeta } from '../config';

export async function getSpecs() {
  const all = await getCollection('specs');
  const rank = (id: string) => {
    const i = Object.keys(specMeta).indexOf(id);
    return i === -1 ? 999 : i;
  };
  return all
    .map((e) => ({
      entry: e,
      id: e.id,
      title: e.body?.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? e.id,
      short: specMeta[e.id]?.short ?? e.id.toUpperCase(),
      summary: specMeta[e.id]?.summary ?? '',
    }))
    .sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
}
