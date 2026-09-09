import { readFile } from 'node:fs/promises';

const SUBCLASSES_PATH = '/usr/share/mime/subclasses';

let cachedParents: Map<string, string[]> | null = null;

// shared-mime-info records "child parent" pairs (a type can have more than
// one parent, e.g. text/javascript subclasses both text/plain and
// application/x-executable). Apps commonly only declare the generic parent
// (text/plain) in their .desktop MimeType field, so matching a specific type
// like application/json against installed apps needs to walk this chain —
// that's exactly what gio/xdg-mime do, which is why they "know" more apps
// can open a type than a plain MimeType= scan would find.
async function getParents(): Promise<Map<string, string[]>> {
  if (cachedParents) return cachedParents;

  const parents = new Map<string, string[]>();
  try {
    const content = await readFile(SUBCLASSES_PATH, 'utf-8');
    for (const line of content.split('\n')) {
      const [child, parent] = line.trim().split(/\s+/);
      if (!child || !parent) continue;
      const list = parents.get(child) ?? [];
      list.push(parent);
      parents.set(child, list);
    }
  } catch {
    // shared-mime-info not installed or unreadable; no hierarchy available
  }

  cachedParents = parents;
  return parents;
}

export async function getAncestorMimeTypes(
  mimeType: string
): Promise<string[]> {
  const parents = await getParents();
  const ancestors = new Set<string>();
  const queue = [mimeType];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    for (const parent of parents.get(current) ?? []) {
      if (ancestors.has(parent)) continue;
      ancestors.add(parent);
      queue.push(parent);
    }
  }

  return [...ancestors];
}
