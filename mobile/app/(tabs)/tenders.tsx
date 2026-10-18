import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Body, Caption, Card, Empty, Row, Screen, StatusPill, Subtitle, Title } from '../../components/ui';
import { useSession } from '../../lib/session';
import { api } from '../../lib/api';
import { fmtSar, fmtRelative } from '../../lib/money';
import { colors, spacing } from '../../lib/theme';
import { t } from '../../lib/i18n';

type Tender = {
  id: string;
  title: string;
  description: string | null;
  estimatedValue: number | null;
  deadline: string | null;
  status: string;
  requiredType: string | null;
  _count?: { bids: number };
  owner: { profile?: { fullName?: string | null; city?: string | null } | null };
};

export default function TendersTab() {
  const { user } = useSession();
  const router = useRouter();
  const q = useQuery<{ tenders: Tender[] }>({
    queryKey: ['tenders', 'open'],
    queryFn: () => api('/api/tenders'),
    enabled: user?.role === 'USR_CONTR' || user?.role === 'USR_CONSULT' || user?.role === 'USR_ADMIN',
  });

  const renderRow = useCallback(
    ({ item }: { item: Tender }) => (
      <Pressable onPress={() => router.push(`/tenders/${item.id}`)}>
        <Card style={{ marginBottom: spacing.sm }}>
          <Row align="space-between">
            <Subtitle>{item.title}</Subtitle>
            {item.requiredType ? <StatusPill label={item.requiredType} /> : null}
          </Row>
          <Caption>{item.owner.profile?.fullName ?? 'Owner'}</Caption>
          <Row align="space-between">
            <Caption>
              {item._count?.bids ?? 0} bid{(item._count?.bids ?? 0) === 1 ? '' : 's'}
            </Caption>
            <Body>{fmtSar(item.estimatedValue)}</Body>
          </Row>
          {item.deadline ? <Caption>Closes {fmtRelative(item.deadline)}</Caption> : null}
        </Card>
      </Pressable>
    ),
    [router]
  );

  if (user?.role !== 'USR_CONTR' && user?.role !== 'USR_CONSULT' && user?.role !== 'USR_ADMIN') {
    return (
      <Screen>
        <Empty title="Contractors / consultants only" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{t('contractor.tenders')}</Title>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={q.data?.tenders ?? []}
        keyExtractor={(tn) => tn.id}
        renderItem={renderRow}
        refreshControl={
          <RefreshControl refreshing={q.isFetching} onRefresh={() => void q.refetch()} tintColor={colors.gold} />
        }
        ListEmptyComponent={<Empty title="No open tenders right now" />}
      />
    </Screen>
  );
}
