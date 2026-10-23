import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
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

type TimeLog = {
  id: string;
  checkIn: string;
  checkOut: string | null;
  latitude: number | null;
  longitude: number | null;
  contractId: string | null;
  minutes: number | null;
  contract?: { jobTitle: string; rate: number; rateUnit: string } | null;
};

export default function ShiftTab() {
  const { user } = useSession();
  const toast = useToast();
  const qc = useQueryClient();

  const timeLogs = useQuery<{ timeLogs: TimeLog[] }>({
    queryKey: ['timeLogs', 'me'],
    queryFn: () => api('/api/worker/time-logs'),
    refetchInterval: 30_000,
    enabled: user?.role === 'USR_WORKER' || user?.role === 'USR_ADMIN',
  });

  // Request location permission on mount
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then((perm) => {
      if (perm.status !== 'granted') {
        toast.show('Location permission needed for check-in', { tone: 'warning' });
      }
    });
  }, [toast]);

  const checkInMutation = useMutation({
    mutationFn: (vars: { contractId?: string; latitude?: number; longitude?: number }) =>
      api('/api/worker/time-logs?action=check-in', {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
    onSuccess: () => {
      toast.show('Checked in successfully', { tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['timeLogs'] });
    },
    onError: async (err, vars) => {
      if (err instanceof ApiError && err.status === 0) {
        await enqueue({
          kind: 'timeLog.checkIn',
          method: 'POST',
          path: '/api/worker/time-logs?action=check-in',
          body: vars,
        });
        toast.show('Offline — check-in queued', { tone: 'warning' });
      } else {
        toast.show(err instanceof Error ? err.message : 'Check-in failed', { tone: 'danger' });
      }
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: (vars: { timeLogId: string; latitude?: number; longitude?: number }) =>
      api('/api/worker/time-logs?action=check-out', {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
    onSuccess: () => {
      toast.show('Checked out successfully', { tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['timeLogs'] });
    },
    onError: async (err, vars) => {
      if (err instanceof ApiError && err.status === 0) {
        await enqueue({
          kind: 'timeLog.checkOut',
          method: 'POST',
          path: '/api/worker/time-logs?action=check-out',
          body: vars,
        });
        toast.show('Offline — check-out queued', { tone: 'warning' });
      } else {
        toast.show(err instanceof Error ? err.message : 'Check-out failed', { tone: 'danger' });
      }
    },
  });

  const handleCheckIn = async (contractId?: string) => {
    let position: Location.LocationObject | null = null;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        toast.show('Location permission required for check-in', { tone: 'danger' });
        return;
      }
      position = await Location.getLastKnownPositionAsync({ requiredAccuracy: 100 });
    } catch {
      toast.show('Could not get location', { tone: 'danger' });
      return;
    }

    if (!position) {
      toast.show('Location not available', { tone: 'danger' });
      return;
    }

    checkInMutation.mutate({
      contractId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  };

  const handleCheckOut = async (timeLogId: string) => {
    let position: Location.LocationObject | null = null;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        toast.show('Location permission required for check-out', { tone: 'danger' });
        return;
      }
      position = await Location.getLastKnownPositionAsync({ requiredAccuracy: 100 });
    } catch {
      // Ignore location error on check-out
    }

    checkOutMutation.mutate({
      timeLogId,
      latitude: position?.coords.latitude,
      longitude: position?.coords.longitude,
    });
  };

  const formatTime = (iso: string): string => {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatMinutes = (mins: number | null): string => {
    if (!mins) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (user?.role !== 'USR_WORKER' && user?.role !== 'USR_ADMIN') {
    return (
      <Screen>
        <Empty title="Workers only" hint="This tab is visible to Worker accounts." />
      </Screen>
    );
  }

  const activeLog = timeLogs.data?.timeLogs.find((t) => !t.checkOut) ?? null;

  const totalMinutes = timeLogs.data?.timeLogs
    .filter((l) => l.checkOut)
    .reduce((sum, l) => sum + (l.minutes ?? 0), 0) ?? 0;

  return (
    <Screen>
      <Title>{t('worker.shift')}</Title>
      <View style={{ height: spacing.md }} />

      {/* Current Status Card */}
      <Card style={{ marginBottom: spacing.md }}>
        <Row align="space-between" style={{ marginBottom: spacing.sm }}>
          <Subtitle>Current Status</Subtitle>
          <StatusPill
            label={activeLog ? 'ON SHIFT' : 'OFF SHIFT'}
            tone={activeLog ? 'success' : 'default'}
          />
        </Row>

        {activeLog ? (
          <>
            <Row align="space-between" style={{ marginBottom: spacing.xs }}>
              <Caption>Checked In</Caption>
              <Body>{formatTime(activeLog.checkIn)}</Body>
            </Row>
            {activeLog.contract && (
              <>
                <Row align="space-between" style={{ marginBottom: spacing.xs }}>
                  <Caption>Contract</Caption>
                  <Body>{activeLog.contract.jobTitle}</Body>
                </Row>
                <Row align="space-between" style={{ marginBottom: spacing.xs }}>
                  <Caption>Rate</Caption>
                  <Body>{fmtSar(activeLog.contract.rate)} / {activeLog.contract.rateUnit.toLowerCase()}</Body>
                </Row>
              </>
            )}
            <View style={{ height: spacing.sm }} />
            <Button
              label={t('worker.checkOut')}
              onPress={() => handleCheckOut(activeLog.id)}
              variant="secondary"
              fullWidth
              loading={checkOutMutation.isPending}
            />
          </>
        ) : (
          <>
            <Row align="space-between" style={{ marginBottom: spacing.xs }}>
              <Caption>Total Hours (All Time)</Caption>
              <Body>{formatMinutes(totalMinutes)}</Body>
            </Row>
            <View style={{ height: spacing.sm }} />
            <Button
              label={t('worker.checkIn')}
              onPress={() => handleCheckIn()}
              fullWidth
              loading={checkInMutation.isPending}
            />
          </>
        )}
      </Card>

      <Title style={{ marginBottom: spacing.sm }}>Recent Shifts</Title>
      <Card>
        {timeLogs.isLoading ? (
          <Caption style={{ color: colors.muted }}>Loading…</Caption>
        ) : timeLogs.data?.timeLogs.length === 0 ? (
          <Empty title="No shifts yet" hint="Check in to start tracking your hours." />
        ) : (
          <FlatList
            data={timeLogs.data?.timeLogs ?? []}
            keyExtractor={(l) => l.id}
            renderItem={({ item }) => (
              <Card style={{ marginBottom: spacing.sm }}>
                <Row align="space-between">
                  <Subtitle>{item.contract?.jobTitle ?? 'No Contract'}</Subtitle>
                  <StatusPill
                    label={item.checkOut ? 'COMPLETED' : 'ACTIVE'}
                    tone={item.checkOut ? 'success' : 'default'}
                  />
                </Row>
                <Row align="space-between">
                  <Caption>{formatDate(item.checkIn)} {formatTime(item.checkIn)}</Caption>
                </Row>
                {item.checkOut && (
                  <Row align="space-between">
                    <Caption>{formatDate(item.checkOut!)} {formatTime(item.checkOut!)}</Caption>
                    <Body>{formatMinutes(item.minutes)}</Body>
                  </Row>
                )}
              </Card>
            )}
            refreshControl={
              <RefreshControl
                refreshing={timeLogs.isFetching}
                onRefresh={() => void timeLogs.refetch()}
                tintColor={colors.gold}
              />
            }
            ListEmptyComponent={<Empty title="No shifts yet" />}
          />
        )}
      </Card>
    </Screen>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatMinutes(mins: number | null): string {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}