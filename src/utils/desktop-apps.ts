import { readdir, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { DesktopApp } from '../types';

function getAppDirs(): string[] {
  const dataHome =
    process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local/share');
  const dataDirs = (process.env.XDG_DATA_DIRS || '/usr/local/share:/usr/share')
    .split(':')
    .filter(Boolean);
  const dirs = [dataHome, ...dataDirs].map((dir) =>
    path.join(dir, 'applications')
  );
  return [...new Set(dirs)];
}

function parseDesktopFile(content: string): {
  name?: string;
  mimeTypes: string[];
  noDisplay: boolean;
} {
  let inEntry = false;
  let name: string | undefined;
  let mimeTypes: string[] = [];
  let noDisplay = false;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[')) {
      inEntry = trimmed === '[Desktop Entry]';
      continue;
    }
    if (!inEntry) continue;

    if (trimmed.startsWith('Name=') && !name) {
      name = trimmed.slice('Name='.length);
    } else if (trimmed.startsWith('MimeType=')) {
      mimeTypes = trimmed.slice('MimeType='.length).split(';').filter(Boolean);
    } else if (trimmed.startsWith('NoDisplay=')) {
      noDisplay = trimmed.slice('NoDisplay='.length).toLowerCase() === 'true';
    }
  }

  return { name, mimeTypes, noDisplay };
}

let cachedApps: DesktopApp[] | null = null;

export async function getAllDesktopApps(): Promise<DesktopApp[]> {
  if (cachedApps) return cachedApps;

  const seen = new Set<string>();
  const apps: DesktopApp[] = [];

  for (const dir of getAppDirs()) {
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.endsWith('.desktop') || seen.has(entry)) continue;
      seen.add(entry);

      try {
        const content = await readFile(path.join(dir, entry), 'utf-8');
        const { name, mimeTypes, noDisplay } = parseDesktopFile(content);
        if (noDisplay || mimeTypes.length === 0) continue;
        apps.push({
          id: entry,
          name: name ?? entry,
          path: path.join(dir, entry),
          mimeTypes,
        });
      } catch {
        // unreadable or malformed desktop file, skip it
      }
    }
  }

  cachedApps = apps;
  return apps;
}

export async function getAppsForMimeType(
  mimeType: string
): Promise<DesktopApp[]> {
  const apps = await getAllDesktopApps();
  return apps
    .filter((app) => app.mimeTypes.includes(mimeType))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const resolvedByIdCache = new Map<string, DesktopApp | null>();

// Resolves any desktop id to its app metadata, independent of the
// MimeType/NoDisplay filtering used for picker candidates — the currently
// configured default for a mime type may be an app that doesn't declare
// that mime type itself (set manually) or is NoDisplay (a helper app).
export async function resolveAppById(
  id: string
): Promise<DesktopApp | undefined> {
  if (resolvedByIdCache.has(id)) return resolvedByIdCache.get(id) ?? undefined;

  for (const dir of getAppDirs()) {
    const filePath = path.join(dir, id);
    try {
      const content = await readFile(filePath, 'utf-8');
      const { name, mimeTypes } = parseDesktopFile(content);
      const app: DesktopApp = {
        id,
        name: name ?? id,
        path: filePath,
        mimeTypes,
      };
      resolvedByIdCache.set(id, app);
      return app;
    } catch {
      // not in this dir, try the next one
    }
  }

  resolvedByIdCache.set(id, null);
  return undefined;
}
