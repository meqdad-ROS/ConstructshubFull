import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Body, Button, Caption, Row, Screen, Title, StatusPill } from '../../components/ui';
import { useToast } from '../../components/toast';
import { api, ApiError } from '../../lib/api';
import { enqueue } from '../../lib/outbox';
import { fmtSar } from '../../lib/money';
import { colors, radius, spacing } from '../../lib/theme';
import { t } from '../../lib/i18n';
import { fmtRelative } from '../../lib/money';

type DisputeDetail = {
  id: string;
  raisedById: string;
  raisedBy: { id: string; name: string; email: string };
  counterpartyId: string | null;
  counterparty: { id: string; name: string; email: string } | null;
  orderId: string | null;
  order: {
    id: string;
    totalAmount: number | null;
    status: string;
    items: Array<{ id: string; name: string; quantity: number; price: number }>;
  } | null;
  projectId: string | null;
  project: { id: string; name: string; status: string } | null;
  amount: number | null;
  reason: string;
  status: string;
  ruling: string | null;
  createdAt: string;
  updatedAt: string;
  escrowHold: {
    id: string;
    amount: number;
    status: string;
    payer: { id: string; name: string };
    payee: { id: string; name: string };
  } | null;
};

type DisputeDetailData = {
  success: boolean;
  dispute: DisputeDetail;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    body: string;
    createdAt: string;
    isMine: boolean;
  }>;
  evidenceUrls: string[];
  permissions: {
    canMessage: boolean;
    canResolve: boolean;
    canViewEvidence: boolean;
  };
};

const REASON_CATEGORIES = [
  'PRODUCT_NOT_AS_DESCRIBED',
  'DAMAGED_IN_TRANSIT',
  'WRONG_ITEM_DELIVERED',
  'LATE_DELIVERY',
  'MISSING_ITEMS',
  'QUALITY_ISSUES',
  'PRICE_DISPUTE',
  'CONTRACT_BREACH',
  'PAYMENT_ISSUE',
  'MILESTONE_DISAGREEMENT',
  'OTHER',
] as const;

function formatReasonCategory(category: string): string {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(amount: number | null): string {
  if (amount == null) return '—';
  return `SAR ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const palette: Record<string, 'warning' | 'success' | 'default' | 'danger'> = {
  OPEN: 'warning',
  RULED: 'success',
  CLOSED: 'default',
};

export default function DisputeDetailScreen({ route }: { route: { params: { disputeId: string } } }) {
  const { disputeId } = route.params;
  const toast = useToast();
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  const q = useQuery<DisputeDetailData>({
    queryKey: ['dispute', 'detail', disputeId],
    queryFn: () => api(`/api/disputes/${disputeId}/detail`),
    refetchInterval: 15_000,
    enabled: Boolean(disputeId),
  });

  useEffect(() => {
    if (q.data?.messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [q.data?.messages.length]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    const optimisticId = `tmp-${Date.now()}`;
    qc.setQueryData<DisputeDetailData>(['dispute', 'detail', disputeId], (prev: DisputeDetailData | undefined) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: optimisticId,
                senderId: 'me',
                senderName: 'You',
                body: text,
                createdAt: new Date().toISOString(),
                isMine: true,
              },
            ],
          }
        : prev
    );
    try {
      await api(`/api/messages/threads/${disputeId}`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      await q.refetch();
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        await enqueue({
          kind: 'message.send',
          method: 'POST',
          path: `/api/messages/threads/${disputeId}`,
          body: { content: text },
        });
        toast.show('Offline — message queued', { tone: 'warning' });
      } else {
        toast.show(err instanceof Error ? err.message : 'Send failed', { tone: 'danger' });
        setDraft(text);
      }
    }
  }, [draft, qc, q, disputeId, toast]);

  if (q.isLoading) {
    return (
      <Screen>
        <Title>Loading dispute…</Title>
      </Screen>
    );
  }

  if (!q.data?.success || !q.data?.dispute) {
    return (
      <Screen>
        <Title>Dispute not found</Title>
      </Screen>
    );
  }

  const { dispute, messages, evidenceUrls, permissions } = q.data;

  const reasonCategory = dispute.reason.split(':')[0] ?? 'OTHER';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.ink }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <Screen padded={false}>
        <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
          <Row align="space-between">
            <Title>Dispute {dispute.id.slice(0, 8).toUpperCase()}</Title>
            <StatusPill label={dispute.status} tone={palette[dispute.status] ?? 'default'} />
          </Row>
        </View>

        <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
          <Row align="space-between" style={{ marginBottom: spacing.sm }}>
            <Subtitle>Amount in Question</Subtitle>
            <Body>{formatAmount(dispute.amount)}</Body>
          </Row>
          <Row align="space-between" style={{ marginBottom: spacing.sm }}>
            <Subtitle>Reason</Subtitle>
            <Body>{formatReasonCategory(reasonCategory)}</Body>
          </Row>
          <Row align="space-between" style={{ marginBottom: spacing.sm }}>
            <Subtitle>Escrow Status</Subtitle>
            <Body>{dispute.escrowHold?.status ?? 'None'}</Body>
          </Row>
          <Row align="space-between">
            <Subtitle>Created</Subtitle>
            <Caption>{formatDate(dispute.createdAt)}</Caption>
          </Row>
        </View>

        <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
          <Title style={{ marginBottom: spacing.sm }}>Description</Title>
          <Body>{dispute.reason}</Body>
        </View>

        {dispute.order && (
          <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
            <Title style={{ marginBottom: spacing.sm }}>Related Order</Title>
            <Row align="space-between" style={{ marginBottom: spacing.xs }}>
              <Subtitle>Status</Subtitle>
              <StatusPill label={dispute.order.status} tone="default" />
            </Row>
            <Row align="space-between" style={{ marginBottom: spacing.xs }}>
              <Subtitle>Total</Subtitle>
              <Body>{formatAmount(dispute.order.totalAmount)}</Body>
            </Row>
            <Row align="space-between">
              <Subtitle>Items</Subtitle>
              <Caption>{dispute.order.items.length} item(s)</Caption>
            </Row>
          </View>
        )}

        {dispute.project && (
          <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
            <Title style={{ marginBottom: spacing.sm }}>Related Project</Title>
            <Body>{dispute.project.name}</Body>
            <Caption>{dispute.project.status}</Caption>
          </View>
        )}

        {dispute.escrowHold && (
          <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
            <Title style={{ marginBottom: spacing.sm }}>Escrow Hold</Title>
            <Row align="space-between" style={{ marginBottom: spacing.xs }}>
              <Subtitle>Hold Amount</Subtitle>
              <Body>{formatAmount(dispute.escrowHold.amount)}</Body>
            </Row>
            <Row align="space-between" style={{ marginBottom: spacing.xs }}>
              <Subtitle>Status</Subtitle>
              <StatusPill label={dispute.escrowHold.status} tone="default" />
            </Row>
            <Row align="space-between" style={{ marginBottom: spacing.xs }}>
              <Subtitle>Payer</Subtitle>
              <Caption>{dispute.escrowHold.payer.name}</Caption>
            </Row>
            <Row align="space-between">
              <Subtitle>Payee</Subtitle>
              <Caption>{dispute.escrowHold.payee.name}</Caption>
            </Row>
          </View>
        )}

        {evidenceUrls.length > 0 && (
          <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
            <Title style={{ marginBottom: spacing.sm }}>Evidence</Title>
            <FlatList
              data={evidenceUrls}
              keyExtractor={(_, idx) => String(idx)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => console.log('View evidence', item)}
                  style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.divider }}
                >
                  <Image
                    source={{ uri: item }}
                    style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
          <Title style={{ marginBottom: spacing.sm }}>Thread</Title>
          <FlatList
            ref={listRef}
            contentContainerStyle={{ paddingBottom: spacing.lg, gap: spacing.sm }}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <Row align={item.isMine ? 'flex-end' : 'flex-start'}>
                <View
                  style={[
                    styles.bubble,
                    item.isMine ? styles.bubbleMine : styles.bubbleOther,
                  ]}
                >
                  <Body>{item.body}</Body>
                  <Caption>{fmtRelative(item.createdAt)}</Caption>
                </View>
              </Row>
            )}
            ListEmptyComponent={<Caption>{q.isLoading ? t('common.loading') : t('messages.empty')}</Caption>}
          />
        </View>

        {permissions.canMessage && (
          <View style={styles.compose}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={send}
              returnKeyType="send"
              placeholder={t('messages.compose')}
              placeholderTextColor={colors.mutedSoft}
              multiline
              style={styles.input}
              maxLength={5000}
            />
            <Button label={t('common.send')} onPress={send} disabled={!draft.trim()} />
          </View>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: 4,
  },
  bubbleMine: { backgroundColor: colors.brown, alignSelf: 'flex-end' },
  bubbleOther: { backgroundColor: colors.inkSoft, alignSelf: 'flex-start' },
  compose: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopColor: colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.inkSoft,
    color: colors.paper,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    maxHeight: 120,
    fontSize: 15,
  },
});