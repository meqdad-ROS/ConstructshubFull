import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSession } from '../../lib/session';
import { colors } from '../../lib/theme';
import { t } from '../../lib/i18n';

// Tab visibility by role (SRS §4.3 capability matrix).
function tabsForRole(role: string | undefined): Set<string> {
  switch (role) {
    case 'USR_DRIVER':
      return new Set(['trips', 'messages', 'profile', 'settings']);
    case 'USR_WORKER':
      return new Set(['jobs', 'messages', 'profile', 'settings']);
    case 'USR_SUPPLIER':
      return new Set(['marketplace', 'orders', 'messages', 'profile', 'settings']);
    case 'USR_CONTR':
    case 'USR_CONSULT':
      return new Set(['marketplace', 'tenders', 'orders', 'messages', 'profile', 'settings']);
    case 'USR_OWNER':
      return new Set(['marketplace', 'tenders', 'orders', 'messages', 'profile', 'settings']);
    case 'USR_CASUAL':
    default:
      return new Set(['marketplace', 'orders', 'messages', 'profile', 'settings']);
  }
}

export default function TabsLayout() {
  const { user, loading } = useSession();
  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  const visible = tabsForRole(user.role);
  const hidden = (name: string) =>
    visible.has(name) ? undefined : { href: null as unknown as undefined };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.paper,
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: colors.divider },
      }}
    >
      <Tabs.Screen
        name="marketplace"
        options={{ title: t('nav.marketplace'), tabBarIcon: () => <Text>🛒</Text>, ...hidden('marketplace') }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: t('nav.jobs'), tabBarIcon: () => <Text>🧰</Text>, ...hidden('jobs') }}
      />
      <Tabs.Screen
        name="trips"
        options={{ title: t('nav.trips'), tabBarIcon: () => <Text>🚚</Text>, ...hidden('trips') }}
      />
      <Tabs.Screen
        name="tenders"
        options={{ title: t('nav.tenders'), tabBarIcon: () => <Text>📑</Text>, ...hidden('tenders') }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: t('nav.orders'), tabBarIcon: () => <Text>📦</Text>, ...hidden('orders') }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: t('nav.messages'), tabBarIcon: () => <Text>💬</Text>, ...hidden('messages') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('nav.profile'), tabBarIcon: () => <Text>👤</Text>, ...hidden('profile') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('nav.settings'), tabBarIcon: () => <Text>⚙️</Text>, ...hidden('settings') }}
      />
    </Tabs>
  );
}
