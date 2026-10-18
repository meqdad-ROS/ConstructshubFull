import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Body, Button, Card, Caption, Divider, Field, Row, Screen, StatusPill, Subtitle, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { api, ApiError } from '../../lib/api';
import { enqueue } from '../../lib/outbox';
import { fmtSar, fmtRelative } from '../../lib/money';
import { spacing } from '../../lib/theme';
import { t } from '../../lib/i18n';

type Tender = {
  id: string;
  title: string;
  description: string | null;
  estimatedValue: number | null;
  deadline: string | null;
  status: string;
  requiredType: string | null;
  owner: { profile?: { fullName?: string | null; city?: string | null } | null };
};

export default function TenderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();

  const [price, setPrice] = useState('');
  const [timelineDays, setTimelineDays] = useState('');
  const [proposal, setProposal] = useState('');

  const q = useQuery<{ tender: Tender }>({
    queryKey: ['tender', id],
    queryFn: () => api(`/api/tenders?id=${encodeURIComponent(String(id))}`),
    enabled: Boolean(id),
  });

  const bid = useMutation({
    mutationFn: () =>
      api(`/api/tenders/${id}/bids`, {
        method: 'POST',
        body: JSON.stringify({
          price: parseFloat(price),
          timelineDays: timelineDays ? parseInt(timelineDays, 10) : undefined,
          proposal: proposal || undefined,
        }),
      }),
    onSuccess: () => {
      toast.show('Bid submitted', { tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['tenders'] });
      router.back();
    },
    onError: async (err) => {
      if (err instanceof ApiError && err.status === 0) {
        await enqueue({
          kind: 'bid.submit',
          method: 'POST',
          path: `/api/tenders/${id}/bids`,
          body: {
            price: parseFloat(price),
            timelineDays: timelineDays ? parseInt(timelineDays, 10) : undefined,
            proposal: proposal || undefined,
          },
        });
        toast.show('Offline — queued', { tone: 'warning' });
        router.back();
      } else {
        toast.show(err instanceof Error ? err.message : 'Bid failed', { tone: 'danger' });
      }
    },
  });

  const tender = q.data?.tender;
  if (q.isLoading) {
    return (
      <Screen>
        <Body muted>{t('common.loading')}</Body>
      </Screen>
    );
  }
  if (!tender) {
    return (
      <Screen>
        <Title>Not found</Title>
      </Screen>
    );
  }

  const priceNum = parseFloat(price);
  const valid = Number.isFinite(priceNum) && priceNum > 0;

  return (
    <ScrollView style={{ backgroundColor: '#0b1220' }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>{tender.title}</Title>
      <Row gap={spacing.sm}>
        <StatusPill
          label={tender.status}
          tone={tender.status === 'OPEN' ? 'success' : tender.status === 'AWARDED' ? 'gold' : 'default'}
        />
        {tender.requiredType ? <StatusPill label={tender.requiredType} /> : null}
      </Row>
      <Card>
        <Caption>Posted by</Caption>
        <Body>{tender.owner.profile?.fullName ?? 'Owner'}</Body>
        {tender.owner.profile?.city ? <Caption>{tender.owner.profile.city}</Caption> : null}
      </Card>
      {tender.description ? (
        <Card>
          <Body>{tender.description}</Body>
        </Card>
      ) : null}
      <Card>
        <Row align="space-between">
          <Caption>Estimated value</Caption>
          <Body>{fmtSar(tender.estimatedValue)}</Body>
        </Row>
        <Row align="space-between">
          <Caption>Deadline</Caption>
          <Body>{tender.deadline ? fmtRelative(tender.deadline) : '—'}</Body>
        </Row>
      </Card>
      <Divider />
      <Subtitle>{t('contractor.submit_bid')}</Subtitle>
      <Field
        label="Price (SAR)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        placeholder="12500"
      />
      <Field
        label="Timeline (days)"
        value={timelineDays}
        onChangeText={setTimelineDays}
        keyboardType="numeric"
        placeholder="30"
      />
      <Field
        label="Proposal (optional)"
        value={proposal}
        onChangeText={setProposal}
        multiline
        placeholder="How you plan to execute…"
      />
      <View style={{ height: spacing.sm }} />
      <Button
        label={bid.isPending ? 'Submitting…' : t('contractor.submit_bid')}
        onPress={() => bid.mutate()}
        disabled={!valid || bid.isPending}
        loading={bid.isPending}
        fullWidth
      />
    </ScrollView>
  );
}
