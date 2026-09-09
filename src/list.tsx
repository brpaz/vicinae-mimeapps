import {
  Action,
  ActionPanel,
  Color,
  confirmAlert,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from '@vicinae/api';
import { useCallback, useEffect, useState } from 'react';
import AppPicker from './components/app-picker';
import type { DesktopApp } from './types';
import { getAllDesktopApps, resolveAppById } from './utils/desktop-apps';
import {
  categoryOf,
  getDefaultAssociations,
  removeDefaultApp,
} from './utils/mimeapps';

interface Row {
  mimeType: string;
  category: string;
  defaultAppId?: string;
  app?: DesktopApp;
}

function matchesSearch(row: Row, query: string): boolean {
  if (!query) return true;
  const haystack = `${row.mimeType} ${row.app?.name ?? ''} ${row.defaultAppId ?? ''}`;
  return haystack.toLowerCase().includes(query.toLowerCase());
}

function groupByCategory(rows: Row[]): [string, Row[]][] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const list = groups.get(row.category) ?? [];
    list.push(row);
    groups.set(row.category, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default function Command() {
  const { push } = useNavigation();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [associations, allApps] = await Promise.all([
        getDefaultAssociations(),
        getAllDesktopApps(),
      ]);
      const defaultByMimeType = new Map(
        associations.map((a) => [a.mimeType, a.defaultAppId])
      );

      // Every mime type that either has a configured default, or that at
      // least one installed app declares it can open — not just the ones
      // with an existing override — so types without a default yet (e.g.
      // application/json if never explicitly set) are still discoverable.
      const knownMimeTypes = new Set<string>([
        ...defaultByMimeType.keys(),
        ...allApps.flatMap((a) => a.mimeTypes),
      ]);

      const resolved = await Promise.all(
        [...knownMimeTypes].map(async (mimeType) => {
          const defaultAppId = defaultByMimeType.get(mimeType);
          return {
            mimeType,
            category: categoryOf(mimeType),
            defaultAppId,
            app: defaultAppId ? await resolveAppById(defaultAppId) : undefined,
          };
        })
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

  const visibleRows = rows.filter((row) => matchesSearch(row, searchText));

  return (
    <List
      isLoading={loading}
      navigationTitle="Mime Types"
      searchBarPlaceholder="Search mime types..."
      onSearchTextChange={setSearchText}
    >
      {visibleRows.length === 0 && !loading && (
        <List.EmptyView
          icon={Icon.QuestionMarkCircle}
          title={rows.length === 0 ? 'No mime types found' : 'No matches'}
        />
      )}
      {groupByCategory(visibleRows).map(([category, categoryRows]) => (
        <List.Section
          key={category}
          title={category}
          subtitle={String(categoryRows.length)}
        >
          {categoryRows.map(({ mimeType, defaultAppId, app }) => {
            const hasStaleReference = Boolean(defaultAppId) && !app;
            const subtitle =
              app?.name ??
              (defaultAppId ? `${defaultAppId} (not found)` : 'No default set');
            const icon = app
              ? { fileIcon: app.path }
              : hasStaleReference
                ? { source: Icon.Warning, tintColor: Color.Orange }
                : Icon.Circle;

            return (
              <List.Item
                key={mimeType}
                title={mimeType}
                subtitle={subtitle}
                icon={icon}
                actions={
                  <ActionPanel>
                    <Action
                      title="Set Default App"
                      icon={Icon.Pencil}
                      onAction={() =>
                        push(
                          <AppPicker mimeType={mimeType} onChanged={refresh} />
                        )
                      }
                    />
                    <Action.CopyToClipboard
                      title="Copy Mime Type"
                      content={mimeType}
                    />
                    {defaultAppId && (
                      <Action
                        title="Reset to System Default"
                        icon={Icon.ArrowClockwise}
                        style="destructive"
                        onAction={() => resetDefault(mimeType)}
                      />
                    )}
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      shortcut={{ modifiers: ['cmd'], key: 'r' }}
                      onAction={refresh}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      ))}
    </List>
  );
}
