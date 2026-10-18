import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Card, Caption, Divider, Field, Row, Screen, Subtitle, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { readCart, clearCart, computeTotals, type CartLine } from '../../lib/cart';
import { fmtSar } from '../../lib/money';
import { api, ApiError } from '../../lib/api';
import { enqueue } from '../../lib/outbox';
import { spacing } from '../../lib/theme';
import { t } from '../../lib/i18n';

type PaymentMethod = 'CARD' | 'WALLET' | 'BNPL' | 'CASH_ON_DELIVERY';

export default function CheckoutScreen() {
  const router = useRouter();
  const toast = useToast();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => setLines(await readCart()))();
  }, []);

  const totals = computeTotals(lines);
  const valid = fullName.trim() && phone.trim() && line1.trim() && city.trim() && lines.length > 0;

  const submit = useCallback(async () => {
    if (!valid) return;
    setSubmitting(true);
    const payload = {
      lines: lines.map((l) => ({
        listingId: l.listingId,
        kind: l.kind,
        title: l.title,
        vendorName: l.vendorName,
        unitPrice: l.unitPrice,
        unitLabel: l.unitLabel,
        quantity: l.quantity,
        days: l.days,
        hireDays: l.hireDays,
      })),
      shipping: { fullName, phone, line1, city, country: 'SA' },
      payment: { method },
    };
    try {
      const resp = await api<{ orderId: string; status: string; totals: { total: number } }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await clearCart();
      toast.show('Order placed', { tone: 'success' });
      router.replace(`/orders/${resp.orderId}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        // Offline — queue it.
        await enqueue({ kind: 'order.create', method: 'POST', path: '/api/orders', body: payload });
        toast.show('Offline — order queued; will submit when back online.', { tone: 'warning' });
        await clearCart();
        router.replace('/orders');
      } else {
        toast.show(err instanceof Error ? err.message : 'Checkout failed', { tone: 'danger' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [city, fullName, line1, lines, method, phone, router, toast, valid]);

  return (
    <ScrollView style={{ backgroundColor: '#0b1220' }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>Checkout</Title>

      <Card>
        <Subtitle>Delivery</Subtitle>
        <View style={{ height: spacing.sm }} />
        <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Ahmed Al-Rashidi" />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+9665…" />
        <Field label="Street address" value={line1} onChangeText={setLine1} placeholder="Villa 12, Al Yasmin" />
        <Field label="City" value={city} onChangeText={setCity} placeholder="Riyadh" />
      </Card>

      <Card>
        <Subtitle>Payment</Subtitle>
        <View style={{ height: spacing.sm }} />
        <Row>
          {(['CARD', 'WALLET', 'BNPL', 'CASH_ON_DELIVERY'] as PaymentMethod[]).map((m) => (
            <View key={m} style={{ flex: 1 }}>
              <Button
                label={m === 'CASH_ON_DELIVERY' ? 'COD' : m}
                variant={method === m ? 'primary' : 'secondary'}
                onPress={() => setMethod(m)}
                fullWidth
              />
            </View>
          ))}
        </Row>
      </Card>

      <Card>
        <Subtitle>Totals</Subtitle>
        <Row align="space-between">
          <Body muted>{t('cart.subtotal')}</Body>
          <Body>{fmtSar(totals.subtotal)}</Body>
        </Row>
        <Row align="space-between">
          <Body muted>{t('cart.vat')}</Body>
          <Body>{fmtSar(totals.vat)}</Body>
        </Row>
        <Row align="space-between">
          <Body muted>{t('cart.platform_fee')}</Body>
          <Body>{fmtSar(totals.platformFee)}</Body>
        </Row>
        <Divider />
        <Row align="space-between">
          <Subtitle>{t('cart.total')}</Subtitle>
          <Subtitle>{fmtSar(totals.total)}</Subtitle>
        </Row>
        <Caption>Server will re-verify this total before charging.</Caption>
      </Card>

      <Button
        label={submitting ? 'Placing…' : `Pay ${fmtSar(totals.total)}`}
        onPress={submit}
        disabled={!valid}
        loading={submitting}
        fullWidth
      />
    </ScrollView>
  );
}
