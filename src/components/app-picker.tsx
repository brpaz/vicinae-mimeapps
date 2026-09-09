import {
  Action,
  ActionPanel,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from '@vicinae/api';
import { useCallback, useEffect, useState } from 'react';
import type { DesktopApp } from '../types';
import { getAllDesktopApps, getAppsForMimeType } from '../utils/desktop-apps';
import { setDefaultApp } from '../utils/mimeapps';

interface AppPickerProps {
  mimeType: string;
  onChanged: () => void;
}

export default function AppPicker({ mimeType, onChanged }: AppPickerProps) {
  const { pop } = useNavigation();
  const [apps, setApps] = useState<DesktopApp[]>([]);
  const [showingAll, setShowingAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (all: boolean) => {
      setLoading(true);
      setApps(
        all ? await getAllDesktopApps() : await getAppsForMimeType(mimeType)
      );
      setShowingAll(all);
      setLoading(false);
    },
    [mimeType]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const selectApp = useCallback(
    async (app: DesktopApp) => {
      try {
        await setDefaultApp(mimeType, app.id);
        showToast({
          style: Toast.Style.Success,
          title: `${app.name} set as default`,
          message: mimeType,
        });
        onChanged();
        pop();
      } catch (err) {
        showToast({
          style: Toast.Style.Failure,
          title: 'Failed to set default app',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [mimeType, onChanged, pop]
  );

  return (
    <List
      isLoading={loading}
      navigationTitle={`Set Default for ${mimeType}`}
      searchBarPlaceholder="Search apps..."
    >
      {apps.length === 0 && !loading && (
        <List.EmptyView
          icon={Icon.QuestionMarkCircle}
          title="No app declares support for this mime type"
          description="Browse every installed app instead and force-assign one."
          actions={
            <ActionPanel>
              <Action
                title="Show All Apps"
                icon={Icon.AppWindow}
                onAction={() => load(true)}
              />
            </ActionPanel>
          }
        />
      )}
      {apps.map((app) => (
        <List.Item
          key={app.id}
          title={app.name}
          subtitle={app.id}
          icon={{ fileIcon: app.path }}
          actions={
            <ActionPanel>
              <Action
                title="Set as Default"
                icon={Icon.CheckCircle}
                onAction={() => selectApp(app)}
              />
              {!showingAll && (
                <Action
                  title="Show All Apps"
                  icon={Icon.AppWindow}
                  onAction={() => load(true)}
                />
              )}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
