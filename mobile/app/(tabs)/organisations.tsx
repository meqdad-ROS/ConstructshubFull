import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, View, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Body, Button, Card, Caption, Empty, Row, Screen, StatusPill, Subtitle, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useSession } from '../../lib/session';
import { api, ApiError } from '../../lib/api';
import { enqueue } from '../../lib/outbox';
import { spacing, colors } from '../../lib/theme';
import { t } from '../../lib/i18n';

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: 'OWNER' | 'MANAGER' | 'FINANCE' | 'STAFF' | 'READ_ONLY';
  invitedAt: string;
  acceptedAt: string | null;
};

type Invitation = {
  id: string;
  email: string;
  phone: string | null;
  role: 'OWNER' | 'MANAGER' | 'FINANCE' | 'STAFF' | 'READ_ONLY';
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
};

type OrganisationDetail = {
  id: string;
  name: string;
  kind: string;
  country: string;
  members: Member[];
  invitations: Invitation[];
};

const ROLE_COLORS: Record<string, 'warning' | 'success' | 'default' | 'danger'> = {
  OWNER: 'warning',
  MANAGER: 'success',
  FINANCE: 'default',
  STAFF: 'default',
  READ_ONLY: 'danger',
};

export default function OrganisationsTab() {
  const { user } = useSession();
  const toast = useToast();
  const qc = useQueryClient();

  const orgsQuery = useQuery<{ organisations: OrganisationDetail[] }>({
    queryKey: ['organisations', 'mine'],
    queryFn: () => api('/api/organisations'),
    enabled: !!user,
  });

  const palette: Record<string, 'warning' | 'success' | 'default' | 'danger'> = {
    OWNER: 'warning',
    MANAGER: 'success',
    FINANCE: 'default',
    STAFF: 'default',
    READ_ONLY: 'danger',
  };

  const renderOrg = useCallback(
    ({ item }: { item: OrganisationDetail }) => {
      const ownerCount = item.members.filter(m => m.role === 'OWNER').length;
      const managerCount = item.members.filter(m => m.role === 'MANAGER').length;
      const pendingInvites = item.invitations.filter(i => i.status === 'pending').length;

      return (
        <Card style={{ marginBottom: spacing.sm }}>
          <Row align="space-between">
            <Subtitle>{item.name}</Subtitle>
            <StatusPill label={item.kind} tone="default" />
          </Row>
          <Caption>{item.country}</Caption>
          <Row align="space-between" style={{ marginTop: spacing.xs }}>
            <Caption>{item.members.length} members</Caption>
            <Caption>{pendingInvites} pending</Caption>
          </Row>
          <Row align="space-between" style={{ marginTop: spacing.xs }}>
            <Caption>Owners: {item.members.filter(m => m.role === 'OWNER').length}</Caption>
            <Caption>Managers: {item.members.filter(m => m.role === 'MANAGER').length}</Caption>
          </Row>
          <View style={{ height: spacing.sm }} />
          <Button
            label="Manage Members"
            onPress={() => console.log('Navigate to members for', item.id)}
            fullWidth
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      );
    },
    []
  );

  if (!user) {
    return (
      <Screen>
        <Empty title="Please sign in" hint="Organisations require an account." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title style={{ marginBottom: spacing.md }}>My Organisations</Title>
      {orgsQuery.isLoading ? (
        <Caption style={{ color: colors.muted }}>Loading organisations…</Caption>
      ) : orgsQuery.data?.organisations.length === 0 ? (
        <Empty
          title="No organisations yet"
          hint="Create your first organisation to start collaborating."
        />
      ) : (
        <FlatList
          data={orgsQuery.data?.organisations ?? []}
          keyExtractor={(o) => o.id}
          renderItem={renderOrg}
          refreshControl={
            <RefreshControl
              refreshing={orgsQuery.isFetching}
              onRefresh={() => void orgsQuery.refetch()}
              tintColor={colors.gold}
            />
          }
          ListEmptyComponent={<Empty title="No organisations" />}
        />
      )}
    </Screen>
  );
}