import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Body, Button, Card, Caption, Divider, Row, Screen, StatusPill, Subtitle, Title } from '../../components/ui';
import { api } from '../../lib/api';
import { fmtSar } from '../../lib/money';
import { spacing, colors } from '../../lib/theme';
import { t } from '../../lib/i18n';

type Order = {
  id: string;
  status: string;
  totalAmount: number | null;
  createdAt: string;
  payment: { paymentMethod: string | null; paymentStatus: string | null; paidAt: string | null } | null;
  shipping: { address: string | null; city: string | null; country: string | null } | null;
};

const STEPS = ['PENDING', 'ACCEPTED', 'DISPATCHED', 'DELIVERED'] as const;
type Step = (typeof STEPS)[number];

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery<{ orders: Order[] }>({
    queryKey: ['orders', 'me'],
    queryFn: () => api('/api/orders'),
  });
  const order = data?.orders.find((o) => o.id === id);

  if (isLoading) {
    return (
      <Screen>
        <Body muted>Loading…</Body>
      </Screen>
    );
  }
  if (error || !order) {
    return (
      <Screen>
        <Title>Not found</Title>
        <Body muted>This order does not exist or you don't have access.</Body>
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const invoiceUrl = `/api/orders/${order.id}/invoice?format=json`;

  return (
    <ScrollView style={{ backgroundColor: colors.ink }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>#{order.id.slice(0, 8).toUpperCase()}</Title>
      <Row gap={spacing.sm}>
        <StatusPill
          label={order.status}
          tone={
            order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'
          }
        />
        {order.payment?.paymentStatus ? (
          <StatusPill
            label={order.payment.paymentStatus}
            tone={order.payment.paymentStatus === 'AUTHORIZED' ? 'success' : 'default'}
          />
        ) : null}
      </Row>

      <Card>
        <Subtitle>Timeline</Subtitle>
        <View style={{ height: spacing.sm }} />
        {STEPS.map((s) => (
          <TimelineRow key={s} step={s} current={order.status as Step} />
        ))}
      </Card>

      <Card>
        <Subtitle>Payment</Subtitle>
        <Row align="space-between">
          <Body muted>Amount</Body>
          <Body>{fmtSar(order.totalAmount)}</Body>
        </Row>
        <Row align="space-between">
          <Body muted>Method</Body>
          <Body>{order.payment?.paymentMethod ?? '—'}</Body>
        </Row>
      </Card>

      {order.shipping ? (
        <Card>
          <Subtitle>Delivery</Subtitle>
          <Body>{order.shipping.address ?? '—'}</Body>
          <Caption>
            {order.shipping.city ?? ''}
            {order.shipping.country ? `, ${order.shipping.country}` : ''}
          </Caption>
        </Card>
      ) : null}

      <Button
        label="Download ZATCA invoice"
        variant="secondary"
        onPress={async () => {
          try {
            const inv = await api<{ qr: string; totals?: { totalWithVat: number } }>(invoiceUrl);
            console.log('[invoice.qr]', inv.qr);
          } catch {
            /* no-op */
          }
        }}
        fullWidth
      />
      <Button label="Refresh" variant="ghost" onPress={() => void refetch()} fullWidth />
    </ScrollView>
  );
}

function TimelineRow({ step, current }: { step: Step; current: Step }) {
  const index = STEPS.indexOf(step);
  const currentIndex = STEPS.indexOf(current);
  const state: 'done' | 'current' | 'future' =
    currentIndex > index ? 'done' : currentIndex === index ? 'current' : 'future';
  const bg = state === 'done' ? colors.success : state === 'current' ? colors.gold : colors.divider;
  const fg = state === 'future' ? colors.muted : colors.paper;
  return (
    <Row>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: bg,
          marginRight: spacing.md,
        }}
      />
      <Body>{t(`order.timeline.${step.toLowerCase()}`)}</Body>
      <View style={{ flex: 1 }} />
      <Caption>{state}</Caption>
    </Row>
  );
}
