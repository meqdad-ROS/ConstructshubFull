import { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Body, Button, Card, Caption, Empty, Row, Screen, StatusPill, Subtitle, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useSession } from '../../lib/session';
import { api, ApiError } from '../../lib/api';
import { enqueue } from '../../lib/outbox';
import { fmtSar } from '../../lib/money';
import { spacing, colors } from '../../lib/theme';
import { t } from '../../lib/i18n';

type Job = {
  id: string;
  title: string;
  description: string | null;
  trade: string | null;
  location: string | null;
  rate: number | null;
  rateUnit: string | null;
};

export default function JobsTab() {
  const { user } = useSession();
  const toast = useToast();
  const qc = useQueryClient();

  const jobs = useQuery<{ jobs: Job[] }>({
    queryKey: ['jobs', 'open'],
    queryFn: () => api('/api/jobs'),
  });

  const apply = useMutation({
    mutationFn: (jobId: string) =>
      api(`/api/jobs/${jobId}/apply`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      toast.show('Application sent', { tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: async (err, jobId) => {
      if (err instanceof ApiError && err.status === 0) {
        await enqueue({ kind: 'review.create', method: 'POST', path: `/api/jobs/${jobId}/apply`, body: {} });
        toast.show('Offline — queued', { tone: 'warning' });
      } else {
        toast.show(err instanceof Error ? err.message : 'Apply failed', { tone: 'danger' });
      }
    },
  });

  const renderRow = useCallback(
    ({ item }: { item: Job }) => (
      <Card style={{ marginBottom: spacing.sm }}>
        <Subtitle>{item.title}</Subtitle>
        <Row gap={spacing.sm}>
          {item.trade ? <StatusPill label={item.trade} /> : null}
          {item.rate != null ? (
            <StatusPill tone="gold" label={`${fmtSar(item.rate)} / ${item.rateUnit?.toLowerCase() ?? 'day'}`} />
          ) : null}
        </Row>
        {item.location ? <Caption>{item.location}</Caption> : null}
        {item.description ? <Body>{item.description}</Body> : null}
        <View style={{ height: spacing.sm }} />
        <Button
          label={t('worker.apply')}
          onPress={() => apply.mutate(item.id)}
          loading={apply.isPending}
          fullWidth
        />
      </Card>
    ),
    [apply]
  );

  if (user?.role !== 'USR_WORKER' && user?.role !== 'USR_ADMIN') {
    return (
      <Screen>
        <Empty title="Workers only" hint="This tab is visible to Skilled Worker accounts." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{t('worker.feed')}</Title>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={jobs.data?.jobs ?? []}
        keyExtractor={(j) => j.id}
        renderItem={renderRow}
        refreshControl={
          <RefreshControl refreshing={jobs.isFetching} onRefresh={() => void jobs.refetch()} tintColor={colors.gold} />
        }
        ListEmptyComponent={<Empty title="No open jobs" />}
      />
    </Screen>
  );
}
