import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Body, Button, Caption, Row, Screen, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { api, ApiError } from '../../lib/api';
import { enqueue } from '../../lib/outbox';
import { colors, radius, spacing } from '../../lib/theme';
import { t } from '../../lib/i18n';
import { fmtRelative } from '../../lib/money';

type ThreadView = {
  thread: { id: string; subject: string | null; members: Array<{ id: string; name: string }> } | null;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    body: string;
    createdAt: string;
    isMine: boolean;
  }>;
};

export default function ChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const toast = useToast();
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  const q = useQuery<ThreadView>({
    queryKey: ['messages', 'thread', threadId],
    queryFn: () => api(`/api/messages/threads/${threadId}`),
    refetchInterval: 10_000,
    enabled: Boolean(threadId),
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
    qc.setQueryData<ThreadView>(['messages', 'thread', threadId], (prev: ThreadView | undefined) =>
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
      await api(`/api/messages/threads/${threadId}`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      await q.refetch();
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        await enqueue({
          kind: 'message.send',
          method: 'POST',
          path: `/api/messages/threads/${threadId}`,
          body: { content: text },
        });
        toast.show('Offline — message queued', { tone: 'warning' });
      } else {
        toast.show(err instanceof Error ? err.message : 'Send failed', { tone: 'danger' });
        setDraft(text);
      }
    }
  }, [draft, qc, q, threadId, toast]);

  const counterpart = q.data?.thread?.members.find((m) => m.id !== 'me')?.name ?? 'Conversation';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.ink }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <Screen padded={false}>
        <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
          <Title>{counterpart}</Title>
        </View>
        <FlatList
          ref={listRef}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          data={q.data?.messages ?? []}
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
