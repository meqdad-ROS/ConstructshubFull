import { useCallback, useEffect, useRef } from 'react';
import { FlatList, RefreshControl, View, AppState } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { Body, Button, Card, Caption, Empty, Row, Screen, StatusPill, Subtitle, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useSession } from '../../lib/session';
import { api, ApiError } from '../../lib/api';
import { enqueue } from '../../lib/outbox';
import { fmtSar } from '../../lib/money';
import { spacing, colors } from '../../lib/theme';
import { t } from '../../lib/i18n';

type Trip = {
  id: string;
  origin: string;
  destination: string;
  cargoType: string | null;
  fare: number;
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  requester: { profile?: { fullName?: string | null } | null };
};

const GPS_PING_INTERVAL_MS = 60_000;

export default function TripsTab() {
  const { user } = useSession();
  const toast = useToast();
  const qc = useQueryClient();
  const pinger = useRef<ReturnType<typeof setInterval> | null>(null);

  const trips = useQuery<{ trips: Trip[] }>({
    queryKey: ['trips', 'me'],
    queryFn: () => api('/api/trips'),
    refetchInterval: 15_000,
    enabled: user?.role === 'USR_DRIVER' || user?.role === 'USR_ADMIN',
  });

  const activeTrip = trips.data?.trips.find((t) => t.status === 'IN_PROGRESS') ?? null;

  // GPS pings only while a trip is IN_PROGRESS, respects background state.
  useEffect(() => {
    if (!activeTrip) {
      if (pinger.current) clearInterval(pinger.current);
      pinger.current = null;
      return;
    }
    const start = async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        toast.show('Location permission denied', { tone: 'warning' });
        return;
      }
      pinger.current = setInterval(async () => {
        if (AppState.currentState !== 'active') return;
        try {
          const pos = await Location.getLastKnownPositionAsync({ requiredAccuracy: 100 });
          if (!pos) return;
          const payload = {
            tripId: activeTrip.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyM: pos.coords.accuracy,
          };
          try {
            await api(`/api/trips/${activeTrip.id}/ping`, { method: 'POST', body: JSON.stringify(payload) });
          } catch (err) {
            if (err instanceof ApiError && err.status === 0) {
              await enqueue({
                kind: 'location.ping',
                method: 'POST',
                path: `/api/trips/${activeTrip.id}/ping`,
                body: payload,
              });
            }
          }
        } catch {
          /* no-op */
        }
      }, GPS_PING_INTERVAL_MS);
    };
    void start();
    return () => {
      if (pinger.current) clearInterval(pinger.current);
      pinger.current = null;
    };
  }, [activeTrip, toast]);

  const mutate = useMutation({
    mutationFn: (vars: { tripId: string; status: Trip['status'] }) =>
      api(`/api/trips/${vars.tripId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: vars.status }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['trips'] }),
    onError: async (err, vars) => {
      if (err instanceof ApiError && err.status === 0) {
        await enqueue({
          kind: 'trip.accept',
          method: 'PATCH',
          path: `/api/trips/${vars.tripId}`,
          body: { status: vars.status },
        });
        toast.show('Offline — queued', { tone: 'warning' });
      } else {
        toast.show(err instanceof Error ? err.message : 'Update failed', { tone: 'danger' });
      }
    },
  });

  const renderRow = useCallback(
    ({ item }: { item: Trip }) => {
      const palette: Record<Trip['status'], 'warning' | 'success' | 'default' | 'danger'> = {
        REQUESTED: 'warning',
        ACCEPTED: 'warning',
        IN_PROGRESS: 'success',
        COMPLETED: 'default',
        CANCELLED: 'danger',
      };
      return (
        <Card style={{ marginBottom: spacing.sm }}>
          <Row align="space-between">
            <Subtitle>{item.requester.profile?.fullName ?? 'Requester'}</Subtitle>
            <StatusPill label={item.status} tone={palette[item.status]} />
          </Row>
          <Caption>
            {item.origin} → {item.destination}
          </Caption>
          <Row align="space-between">
            <Caption>{item.cargoType ?? '—'}</Caption>
            <Body>{fmtSar(item.fare)}</Body>
          </Row>
          <View style={{ height: spacing.sm }} />
          {item.status === 'REQUESTED' ? (
            <Button
              label={t('driver.accept')}
              onPress={() => mutate.mutate({ tripId: item.id, status: 'ACCEPTED' })}
              fullWidth
            />
          ) : null}
          {item.status === 'ACCEPTED' ? (
            <Button
              label={t('driver.start')}
              onPress={() => mutate.mutate({ tripId: item.id, status: 'IN_PROGRESS' })}
              fullWidth
            />
          ) : null}
          {item.status === 'IN_PROGRESS' ? (
            <Button
              label={t('driver.complete')}
              onPress={() => mutate.mutate({ tripId: item.id, status: 'COMPLETED' })}
              variant="secondary"
              fullWidth
            />
          ) : null}
        </Card>
      );
    },
    [mutate]
  );

  if (user?.role !== 'USR_DRIVER' && user?.role !== 'USR_ADMIN') {
    return (
      <Screen>
        <Empty title="Drivers only" hint="This tab is visible to Driver accounts." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{t('driver.inbox')}</Title>
      {activeTrip ? (
        <Caption>Live location sharing is on while this trip is in progress.</Caption>
      ) : null}
      <View style={{ height: spacing.md }} />
      <FlatList
        data={trips.data?.trips ?? []}
        keyExtractor={(tr) => tr.id}
        renderItem={renderRow}
        refreshControl={
          <RefreshControl refreshing={trips.isFetching} onRefresh={() => void trips.refetch()} tintColor={colors.gold} />
        }
        ListEmptyComponent={<Empty title="No trips yet" />}
      />
    </Screen>
  );
}
