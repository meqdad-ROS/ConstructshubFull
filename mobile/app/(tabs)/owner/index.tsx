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
import { useOwnerDashboard } from '../../../lib/queries';

type OwnerProjectRow = {
  id: string;
  name: string;
  location: string | null;
  status: string;
  budget: number | null;
  milestonesCount: number;
  tendersCount: number;
  bidsCount: number;
  createdAt: string;
};

type OwnerTenderRow = {
  id: string;
  title: string;
  status: string;
  bidsCount: number;
  projectName: string;
  createdAt: string;
};

export default function OwnerDashboard() {
  const router = useRouter();
  const toast = useToast();
  const { data, isFetching, refetch } = useOwnerDashboard();

  const projects = data?.projects ?? [];
  const tenders = data?.tenders ?? [];
  const stats = data?.stats;

  const renderProject = useCallback(
    ({ item }: { item: OwnerProjectRow }) => (
      <Pressable onPress={() => router.push('/(tabs)/tenders')}>
        <Card style={{ marginBottom: spacing.sm }}>
          <Row align="space-between">
            <View style={{ flex: 1, gap: 4 }}>
              <Subtitle>{item.name}</Subtitle>
              <Row gap={spacing.sm}>
                {item.location && <Caption>{item.location}</Caption>}
                <StatusPill
                  label={item.status}
                  tone={
                    item.status === 'ACTIVE' ? 'success' : item.status === 'DRAFT' ? 'default' : 'warning'
                  }
                />
              </Row>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Body>{item.budget ? fmtSar(item.budget) : '—'}</Body>
              <Caption>
                {t('owner.milestones')}: {item.milestonesCount} | {t('owner.tenders')}: {item.tendersCount} | {t('owner.bids')}: {item.bidsCount}
              </Caption>
            </View>
          </Row>
        </Card>
      </Pressable>
    ),
    [router]
  );

  const renderTender = useCallback(
    ({ item }: { item: OwnerTenderRow }) => (
      <Pressable onPress={() => router.push(`/tenders/${item.id}` as any)}>
        <Card style={{ marginBottom: spacing.sm }}>
          <Row align="space-between">
            <View style={{ flex: 1, gap: 4 }}>
              <Subtitle>{item.title}</Subtitle>
              <Caption>{item.projectName}</Caption>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <StatusPill
                label={item.status}
                tone={
                  item.status === 'OPEN' ? 'success' : item.status === 'DRAFT' ? 'default' : 'warning'
                }
              />
              <Caption>{t('owner.bids_count', { count: item.bidsCount })}</Caption>
            </View>
          </Row>
        </Card>
      </Pressable>
    ),
    [router]
  );

  return (
    <Screen>
      <Title>{t('nav.owner')}</Title>
      <View style={{ height: spacing.md }} />
      {stats && (
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          <Row gap={spacing.sm} style={{ flexWrap: 'wrap' }}>
            <Card style={{ flex: 1, minWidth: 120 }}>
              <Caption>{t('owner.active_projects')}</Caption>
              <Body>{stats.activeProjects}</Body>
            </Card>
            <Card style={{ flex: 1, minWidth: 120 }}>
              <Caption>{t('owner.open_tenders')}</Caption>
              <Body>{stats.openTenders}</Body>
            </Card>
            <Card style={{ flex: 1, minWidth: 120 }}>
              <Caption>{t('owner.new_bids')}</Caption>
              <Body>{stats.newBids}</Body>
            </Card>
            <Card style={{ flex: 1, minWidth: 120 }}>
              <Caption>{t('owner.unread_notifications')}</Caption>
              <Body>{stats.unreadNotifications}</Body>
            </Card>
            <Card style={{ flex: 1, minWidth: 120 }}>
              <Caption>{t('owner.total_budget')}</Caption>
              <Body>{stats.totalBudget ? fmtSar(stats.totalBudget) : '—'}</Body>
            </Card>
          </Row>
        </View>
      )}
      <FlatList
        data={projects}
        keyExtractor={(r) => `proj-${r.id}`}
        renderItem={renderProject}
        ListHeaderComponent={
          projects.length > 0 ? (
            <View style={{ paddingBottom: spacing.md }}>
              <Subtitle>{t('owner.recent_projects')}</Subtitle>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} tintColor={colors.gold} />
        }
        ListEmptyComponent={projects.length === 0 && !isFetching ? (
          <Empty title={t('owner.no_projects')} hint={t('owner.no_projects.hint')} />
        ) : null}
      />
      <FlatList
        data={tenders}
        keyExtractor={(r) => `tender-${r.id}`}
        renderItem={renderTender}
        ListHeaderComponent={
          tenders.length > 0 ? (
            <View style={{ paddingVertical: spacing.md }}>
              <Subtitle>{t('owner.recent_tenders')}</Subtitle>
            </View>
          ) : null
        }
        ListEmptyComponent={tenders.length === 0 && !isFetching ? (
          <Empty title={t('owner.no_tenders')} hint={t('owner.no_tenders.hint')} />
        ) : null}
      />
    </Screen>
  );
}