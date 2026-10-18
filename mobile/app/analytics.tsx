import { ScrollView, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Body, Button, Card, Caption, Row, Screen, Subtitle, Title } from '../components/ui';
import { useAnalyticsMe } from '../lib/queries';
import { fmtSar } from '../lib/money';
import { spacing } from '../lib/theme';
import { t } from '../lib/i18n';

type Tile = { label: string; value: string | number; hint?: string };

function tilesFor(
  role: string,
  m: Record<string, unknown> & { [k: string]: unknown },
): Tile[] {
  const num = (k: string) => Number(m[k] ?? 0);
  const sar = (k: string) => fmtSar(Number(m[k] ?? 0));
  switch (role) {
    case 'USR_CASUAL':
    case 'USR_OWNER':
      return [
        { label: 'Orders', value: num('orderCount') },
        { label: 'Delivered spend', value: sar('deliveredSpend') },
        { label: 'Wishlist', value: num('wishlistSize') },
        ...(role === 'USR_OWNER'
          ? [
              { label: 'Projects', value: num('projectCount') },
              { label: 'Tenders', value: num('tenderCount') },
              { label: 'Milestones approved', value: num('approvedMilestones') },
            ]
          : []),
      ];
    case 'USR_CONTR':
    case 'USR_CONSULT':
      return [
        { label: 'Bids', value: num('bidCount') },
        { label: 'Won', value: num('bidsWon') },
        { label: 'Win rate', value: `${num('winRate')}%` },
        { label: 'Active projects', value: num('activeProjects') },
      ];
    case 'USR_SUPPLIER':
      return [
        { label: 'Products', value: num('productCount') },
        { label: 'Orders', value: num('orderCount') },
        { label: 'Revenue', value: sar('revenue') },
        { label: 'Search impressions', value: num('searchImpressions') },
      ];
    case 'USR_WORKER':
      return [
        { label: 'Applications', value: num('applicationCount') },
        { label: 'Accepted', value: num('applicationsAccepted') },
        { label: 'Acceptance rate', value: `${num('acceptanceRate')}%` },
        { label: 'Minutes worked', value: num('workMinutes') },
      ];
    case 'USR_DRIVER':
      return [
        { label: 'Trips', value: num('tripCount') },
        { label: 'Completed', value: num('tripsCompleted') },
        { label: 'Completion rate', value: `${num('completionRate')}%` },
        { label: 'Earnings', value: sar('earnings') },
      ];
    default:
      return [];
  }
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const { data, isLoading, error } = useAnalyticsMe(30);

  const tiles = data ? tilesFor(data.role, data.scopedMetrics as Record<string, unknown>) : [];
  const activity = data?.eventActivity ?? [];
  const recent = data?.recentEvents ?? [];
  const unread = data?.unreadNotifications ?? 0;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Analytics' }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Title>Your analytics</Title>
        <Caption>Last 30 days</Caption>

        <View style={{ height: spacing.md }} />

        <Card>
          <Row>
            <View style={{ flex: 1 }}>
              <Caption>Unread notifications</Caption>
              <Subtitle>{unread}</Subtitle>
            </View>
            <Button
              label="Open"
              variant="ghost"
              onPress={() => router.push('/notifications')}
            />
          </Row>
        </Card>

        {isLoading && (
          <>
            <View style={{ height: spacing.sm }} />
            <Card>
              <Body muted>{t('common.loading')}</Body>
            </Card>
          </>
        )}

        {error && (
          <>
            <View style={{ height: spacing.sm }} />
            <Card>
              <Body muted>Could not load analytics.</Body>
            </Card>
          </>
        )}

        {tiles.length > 0 && (
          <>
            <View style={{ height: spacing.md }} />
            {tiles.map((tile) => (
              <View key={tile.label}>
                <Card>
                  <Caption>{tile.label}</Caption>
                  <Subtitle>{tile.value}</Subtitle>
                </Card>
                <View style={{ height: spacing.sm }} />
              </View>
            ))}
          </>
        )}

        <View style={{ height: spacing.sm }} />
        <Card>
          <Caption>Event activity</Caption>
          {activity.length === 0 ? (
            <Body muted>No events tracked yet.</Body>
          ) : (
            activity.slice(0, 10).map((e) => (
              <Row key={e.event}>
                <View style={{ flex: 1 }}>
                  <Body>{e.event}</Body>
                </View>
                <Body muted>{String(e.count)}</Body>
              </Row>
            ))
          )}
        </Card>

        <View style={{ height: spacing.sm }} />
        <Card>
          <Caption>Recent events</Caption>
          {recent.length === 0 ? (
            <Body muted>No recent events.</Body>
          ) : (
            recent.slice(0, 10).map((e) => (
              <Row key={e.id}>
                <View style={{ flex: 1 }}>
                  <Body>{e.event}</Body>
                </View>
                <Body muted>{new Date(e.createdAt).toLocaleTimeString()}</Body>
              </Row>
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
