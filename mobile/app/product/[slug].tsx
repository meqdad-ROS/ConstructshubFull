import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Body, Button, Caption, Card, Divider, Row, Screen, StatusPill, Subtitle, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { api } from '../../lib/api';
import { fmtSar } from '../../lib/money';
import { addToCart } from '../../lib/cart';
import { spacing } from '../../lib/theme';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  unit: string | null;
  stock: number;
  supplier?: { id: string; profile?: { fullName?: string | null; city?: string | null } | null };
};

export default function ProductDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data, isLoading, error } = useQuery<{ product: Product }>({
    queryKey: ['product', slug],
    queryFn: () => api(`/api/search/products?id=${encodeURIComponent(String(slug))}`),
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return (
      <Screen>
        <Body muted>Loading…</Body>
      </Screen>
    );
  }
  if (error || !data?.product) {
    return (
      <Screen>
        <Title>Not found</Title>
        <Body muted>This product is no longer available.</Body>
        <View style={{ height: spacing.md }} />
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const p = data.product;
  const inStock = p.stock > 0;

  return (
    <ScrollView style={{ backgroundColor: '#0b1220' }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>{p.name}</Title>
      <Row gap={spacing.sm}>
        {inStock ? (
          <StatusPill tone="success" label="In stock" />
        ) : (
          <StatusPill tone="danger" label="Out of stock" />
        )}
        {p.unit ? <StatusPill label={`per ${p.unit}`} /> : null}
      </Row>
      <Subtitle>{fmtSar(p.price)}</Subtitle>
      {p.description ? (
        <Card>
          <Body>{p.description}</Body>
        </Card>
      ) : null}
      {p.supplier?.profile ? (
        <Card>
          <Caption>Supplier</Caption>
          <Body>{p.supplier.profile.fullName ?? 'Supplier'}</Body>
          {p.supplier.profile.city ? <Caption>{p.supplier.profile.city}</Caption> : null}
        </Card>
      ) : null}
      <Divider />
      <Button
        label={inStock ? 'Add to cart' : 'Out of stock'}
        onPress={async () => {
          if (!inStock || !p.price) return;
          await addToCart({
            listingId: p.id,
            kind: 'purchase',
            title: p.name,
            quantity: 1,
            unitPrice: p.price,
            unitLabel: p.unit ?? 'pcs',
            vendorName: p.supplier?.profile?.fullName ?? 'Supplier',
          });
          toast.show('Added to cart', { tone: 'success' });
          router.push('/cart');
        }}
        disabled={!inStock}
        fullWidth
      />
    </ScrollView>
  );
}
