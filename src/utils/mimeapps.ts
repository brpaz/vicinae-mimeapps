import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { MimeAssociation } from '../types';

const execFileAsync = promisify(execFile);
const MIMEAPPS_PATH = path.join(os.homedir(), '.config', 'mimeapps.list');
const DEFAULT_SECTION = '[Default Applications]';

export function categoryOf(mimeType: string): string {
  return mimeType.split('/')[0] || 'other';
}

export async function getDefaultAssociations(): Promise<MimeAssociation[]> {
  let content: string;
  try {
    content = await readFile(MIMEAPPS_PATH, 'utf-8');
  } catch {
    return [];
  }

  const associations: MimeAssociation[] = [];
  let inDefaultSection = false;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[')) {
      inDefaultSection = trimmed === DEFAULT_SECTION;
      continue;
    }
    if (!inDefaultSection || !trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const mimeType = trimmed.slice(0, separatorIndex);
    // Values can be a `;`-separated list; the first entry is the default.
    const defaultAppId =
      trimmed.slice(separatorIndex + 1).split(';')[0] || undefined;
    associations.push({
      mimeType,
      category: categoryOf(mimeType),
      defaultAppId,
    });
  }

  return associations;
}

export async function setDefaultApp(
  mimeType: string,
  desktopId: string
): Promise<void> {
  try {
    await execFileAsync('xdg-mime', ['default', desktopId, mimeType]);
  } catch (error) {
    const err = error as { stderr?: string; message: string };
    throw new Error(err.stderr?.trim() || err.message);
  }
}

// xdg-mime has no "unset default" command, so this removes the override
// line directly, falling back to whatever /usr/share/applications/mimeinfo
// or mimeapps.list system-wide would otherwise resolve to.
export async function removeDefaultApp(mimeType: string): Promise<void> {
  let content: string;
  try {
    content = await readFile(MIMEAPPS_PATH, 'utf-8');
  } catch {
    return;
  }

  let inDefaultSection = false;
  const lines = content.split('\n').filter((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('[')) {
      inDefaultSection = trimmed === DEFAULT_SECTION;
      return true;
    }
    if (inDefaultSection && trimmed.startsWith(`${mimeType}=`)) {
      return false;
    }
    return true;
  });

  await writeFile(MIMEAPPS_PATH, lines.join('\n'), 'utf-8');
}
