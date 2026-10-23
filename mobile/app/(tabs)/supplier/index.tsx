import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Body, Caption, Card, Empty, Row, Screen, StatusPill, Subtitle, Title } from '../../../components/ui';
import { useToast } from '../../../components/toast';
import { api } from '../../../lib/api';
import { colors, spacing } from '../../../lib/theme';
import { t } from '../../../lib/i18n';
import { fmtSar, fmtRelative } from '../../../lib/money';
import { useSupplierDashboard } from '../../../lib/queries';

type SupplierOrderRow = {
  id: string;
  customer: string;
  items: string;
  total: number | null;
  status: string;
  createdAt: string;
};

type SupplierProductRow = {
  id: string;
  name: string;
  stock: number;
  price: number | null;
  lowStock: boolean;
};

export default function SupplierDashboard() {
  const router = useRouter();
  const toast = useToast();
  const { data, isFetching, refetch } = useSupplierDashboard();

  const orders = data?.recentOrders ?? [];
  const products = data?.products ?? [];

  const renderOrder = useCallback(
    ({ item }: { item: SupplierOrderRow }) => (
      <Pressable onPress={() => router.push(`/orders/${item.id}` as any)}>
        <Card style={{ marginBottom: spacing.sm }}>
          <Row align="space-between">
            <View style={{ flex: 1 }}>
              <Subtitle>#{item.id.slice(0, 8).toUpperCase()}</Subtitle>
              <Caption>{fmtRelative(item.createdAt)}</Caption>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Body>{fmtSar(item.total)}</Body>
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

  const renderProduct = useCallback(
    ({ item }: { item: SupplierProductRow }) => (
      <Pressable onPress={() => router.push(`/products/${item.id}` as any)}>
        <Card style={{ marginBottom: spacing.sm }}>
          <Row align="space-between">
            <View style={{ flex: 1, gap: 4 }}>
              <Subtitle>{item.name}</Subtitle>
              <Row gap={spacing.sm}>
                <Caption>Stock: {item.stock}</Caption>
                {item.lowStock && <StatusPill tone="warning" label="Low Stock" />}
              </Row>
            </View>
            <Body>{item.price ? fmtSar(item.price) : '—'}</Body>
          </Row>
        </Card>
      </Pressable>
    ),
    [router]
  );

  return (
    <Screen>
      <Title>{t('nav.supplier')}</Title>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={orders}
        keyExtractor={(r) => `order-${r.id}`}
        renderItem={renderOrder}
        ListHeaderComponent={
          orders.length > 0 ? (
            <View style={{ paddingBottom: spacing.md }}>
              <Subtitle>{t('supplier.recent_orders')}</Subtitle>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} tintColor={colors.gold} />
        }
        ListEmptyComponent={orders.length === 0 && !isFetching ? (
          <Empty title={t('supplier.no_orders')} hint={t('supplier.no_orders.hint')} />
        ) : null}
      />
      <FlatList
        data={products}
        keyExtractor={(r) => `prod-${r.id}`}
        renderItem={renderProduct}
        ListHeaderComponent={
          products.length > 0 ? (
            <View style={{ paddingVertical: spacing.md }}>
              <Subtitle>{t('supplier.inventory')}</Subtitle>
            </View>
          ) : null
        }
        ListEmptyComponent={products.length === 0 && !isFetching ? (
          <Empty title={t('supplier.no_products')} hint={t('supplier.no_products.hint')} />
        ) : null}
      />
    </Screen>
  );
}