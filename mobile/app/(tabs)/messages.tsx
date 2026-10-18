import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Caption, Card, Empty, Row, Screen, StatusPill, Subtitle, Title } from '../../components/ui';
import { useMessageThreads } from '../../lib/queries';
import { fmtRelative } from '../../lib/money';
import { colors, spacing } from '../../lib/theme';
import { t } from '../../lib/i18n';

export default function MessagesTab() {
  const router = useRouter();
  const { data, isFetching, refetch } = useMessageThreads();
  const threads = data?.threads ?? [];

  const renderRow = useCallback(
    ({ item }: { item: (typeof threads)[number] }) => (
      <Pressable onPress={() => router.push(`/messages/${item.id}`)}>
        <Card style={{ marginBottom: spacing.sm }}>
          <Row align="space-between">
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Subtitle>{item.counterpart?.name ?? 'Conversation'}</Subtitle>
              <Body muted>{item.lastMessage}</Body>
              <Caption>{fmtRelative(item.lastAt)}</Caption>
            </View>
            {item.unread > 0 ? <StatusPill tone="gold" label={`${item.unread} new`} /> : null}
          </Row>
        </Card>
      </Pressable>
    ),
    [router]
  );

  return (
    <Screen>
      <Title>{t('messages.title')}</Title>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={threads}
        keyExtractor={(th) => th.id}
        renderItem={renderRow}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} tintColor={colors.gold} />}
        ListEmptyComponent={<Empty title={t('messages.empty')} />}
      />
    </Screen>
  );
}
