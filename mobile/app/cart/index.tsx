import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Body, Button, Caption, Card, Divider, Empty, Row, Screen, Subtitle, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { readCart, removeFromCart, computeTotals, type CartLine, lineTotal } from '../../lib/cart';
import { fmtSar } from '../../lib/money';
import { spacing, colors } from '../../lib/theme';
import { t } from '../../lib/i18n';

export default function CartScreen() {
  const router = useRouter();
  const toast = useToast();
  const [lines, setLines] = useState<CartLine[]>([]);
  const refresh = useCallback(async () => setLines(await readCart()), []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totals = computeTotals(lines);

  if (lines.length === 0) {
    return (
      <Screen>
        <Title>{t('cart.title')}</Title>
        <Empty title={t('cart.empty')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{t('cart.title')}</Title>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={lines}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ gap: spacing.sm }}
        renderItem={({ item }) => (
          <Card>
            <Subtitle>{item.title}</Subtitle>
            <Caption>
              {item.vendorName} · {item.quantity} {item.unitLabel}
            </Caption>
            <Row align="space-between">
              <Body>{fmtSar(lineTotal(item))}</Body>
              <Pressable
                onPress={async () => {
                  await removeFromCart(item.id);
                  await refresh();
                  toast.show('Removed');
                }}
              >
                <Body muted>Remove</Body>
              </Pressable>
            </Row>
          </Card>
        )}
      />
      <Divider />
      <Totals totals={totals} />
      <View style={{ height: spacing.md }} />
      <Button
        label={t('cart.checkout')}
        onPress={() => router.push('/checkout')}
        fullWidth
      />
    </Screen>
  );
}

function Totals({ totals }: { totals: ReturnType<typeof computeTotals> }) {
  return (
    <View style={{ gap: spacing.xs }}>
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
      <Row align="space-between">
        <Subtitle>{t('cart.total')}</Subtitle>
        <Subtitle>{fmtSar(totals.total)}</Subtitle>
      </Row>
      <Caption>Totals are recomputed on the server for the final charge.</Caption>
      <View accessible accessibilityLabel="cart separator" style={{ height: 0, borderColor: colors.divider }} />
    </View>
  );
}
