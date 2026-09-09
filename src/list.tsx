import {
  Action,
  ActionPanel,
  confirmAlert,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from '@vicinae/api';
import { useCallback, useEffect, useState } from 'react';
import AppPicker from './components/app-picker';
import type { DesktopApp, MimeAssociation } from './types';
import { resolveAppById } from './utils/desktop-apps';
import { getDefaultAssociations, removeDefaultApp } from './utils/mimeapps';

interface Row {
  association: MimeAssociation;
  app: DesktopApp | undefined;
}

function groupByCategory(rows: Row[]): [string, Row[]][] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const list = groups.get(row.association.category) ?? [];
    list.push(row);
    groups.set(row.association.category, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default function Command() {
  const { push } = useNavigation();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const associations = await getDefaultAssociations();
      const resolved = await Promise.all(
        associations.map(async (association) => ({
          association,
          app: association.defaultAppId
            ? await resolveAppById(association.defaultAppId)
            : undefined,
        }))
      );
      setRows(resolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const resetDefault = useCallback(
    async (mimeType: string) => {
      const confirmed = await confirmAlert({
        title: `Reset default for ${mimeType}?`,
        message:
          'Removes your override. Falls back to the system-wide default, if any.',
        primaryAction: { title: 'Reset' },
      });
      if (!confirmed) return;

      try {
        await removeDefaultApp(mimeType);
        showToast({
          style: Toast.Style.Success,
          title: 'Default reset',
          message: mimeType,
        });
        await refresh();
      } catch (err) {
        showToast({
          style: Toast.Style.Failure,
          title: 'Failed to reset default',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [refresh]
  );

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Warning}
          title="Could not read mimeapps.list"
          description={error}
          actions={
            <ActionPanel>
              <Action
                title="Retry"
                icon={Icon.ArrowClockwise}
                onAction={refresh}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={loading}
      navigationTitle="Default Applications"
      searchBarPlaceholder="Search mime types..."
    >
      {rows.length === 0 && !loading && (
        <List.EmptyView
          icon={Icon.QuestionMarkCircle}
          title="No default applications configured"
        />
      )}
      {groupByCategory(rows).map(([category, categoryRows]) => (
        <List.Section
          key={category}
          title={category}
          subtitle={String(categoryRows.length)}
        >
          {categoryRows.map(({ association, app }) => (
            <List.Item
              key={association.mimeType}
              title={association.mimeType}
              subtitle={app?.name ?? association.defaultAppId ?? 'Unknown'}
              icon={app ? { fileIcon: app.path } : Icon.QuestionMarkCircle}
              actions={
                <ActionPanel>
                  <Action
                    title="Set Default App"
                    icon={Icon.Pencil}
                    onAction={() =>
                      push(
                        <AppPicker
                          mimeType={association.mimeType}
                          onChanged={refresh}
                        />
                      )
                    }
                  />
                  <Action.CopyToClipboard
                    title="Copy Mime Type"
                    content={association.mimeType}
                  />
                  <Action
                    title="Reset to System Default"
                    icon={Icon.ArrowClockwise}
                    style="destructive"
                    onAction={() => resetDefault(association.mimeType)}
                  />
                  <Action
                    title="Refresh"
                    icon={Icon.ArrowClockwise}
                    shortcut={{ modifiers: ['cmd'], key: 'r' }}
                    onAction={refresh}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
