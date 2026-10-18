import { ScrollView, View, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Body, Button, Card, Caption, Row, Screen, Subtitle, Title } from '../components/ui';
import { useNotificationList } from '../lib/queries';
import { api } from '../lib/api';
import { spacing, colors } from '../lib/theme';
import { relativeTime } from '../lib/pure';

export default function NotificationsScreen() {
  const list = useNotificationList();
  const qc = useQueryClient();

  const markRead = useMutation({
    mutationFn: (id: string) =>
      api('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'read', notificationId: id }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () =>
      api('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'read-all' }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = list.data?.notifications ?? [];
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Notifications' }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Title>Notifications</Title>
        <Caption>{unread === 0 ? 'All caught up.' : `${unread} unread`}</Caption>

        <View style={{ height: spacing.md }} />

        {unread > 0 && (
          <>
            <Button
              label="Mark all read"
              variant="secondary"
              onPress={() => markAll.mutate()}
              loading={markAll.isPending}
            />
            <View style={{ height: spacing.sm }} />
          </>
        )}

        {list.isLoading && (
          <Card>
            <Body muted>Loading...</Body>
          </Card>
        )}

        {!list.isLoading && items.length === 0 && (
          <Card>
            <Body muted>No notifications yet.</Body>
          </Card>
        )}

        {items.map((n) => {
          const isUnread = !n.readAt;
          return (
            <Pressable
              key={n.id}
              onPress={() => isUnread && markRead.mutate(n.id)}
              style={{ marginBottom: spacing.sm }}
            >
              <Card
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: isUnread ? colors.gold : colors.divider,
                }}
              >
                <Row>
                  <View style={{ flex: 1 }}>
                    <Subtitle>{n.title}</Subtitle>
                    {n.body ? <Body muted>{n.body}</Body> : null}
                    <Caption>
                      {n.type} · {relativeTime(new Date(n.createdAt).getTime())}
                    </Caption>
                  </View>
                </Row>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
