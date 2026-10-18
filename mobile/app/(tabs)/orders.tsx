import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Caption, Card, Empty, Row, Screen, StatusPill, Subtitle, Title } from '../../components/ui';
import { useMyOrders, type OrderRow } from '../../lib/queries';
import { fmtSar, fmtRelative } from '../../lib/money';
import { colors, spacing } from '../../lib/theme';
import { t } from '../../lib/i18n';

export default function OrdersTab() {
  const router = useRouter();
  const { data, isFetching, refetch } = useMyOrders();
  const rows = data?.orders ?? [];

  const renderRow = useCallback(
    ({ item }: { item: OrderRow }) => (
      <Pressable onPress={() => router.push(`/orders/${item.id}`)}>
        <Card style={{ marginBottom: spacing.sm }}>
          <Row align="space-between">
            <View style={{ flex: 1 }}>
              <Subtitle>#{item.id.slice(0, 8).toUpperCase()}</Subtitle>
              <Caption>{fmtRelative(item.createdAt)}</Caption>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Body>{fmtSar(item.totalAmount)}</Body>
              <StatusPill
                label={item.status}
                tone={
                  item.status === 'DELIVERED'
                    ? 'success'
                    : item.status === 'CANCELLED'
                    ? 'danger'
                    : 'warning'
                }
              />
            </View>
          </Row>
        </Card>
      </Pressable>
    ),
    [router]
  );

  return (
    <Screen>
      <Title>{t('nav.orders')}</Title>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        renderItem={renderRow}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} tintColor={colors.gold} />}
        ListEmptyComponent={<Empty title="No orders yet" hint="Place one from the Market tab." />}
      />
    </Screen>
  );
}
