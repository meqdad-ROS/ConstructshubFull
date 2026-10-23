import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { Body, Button, Caption, Row, Screen, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { api, ApiError, API_BASE_URL } from '../../lib/api';
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
    attachments?: Array<{
      id: string;
      contentType: string;
      sizeBytes: number;
      filename: string;
      url: string | null;
      urlExpiresAt: string | null;
    }>;
  }>;
};

type AttachmentToken = {
  token: string;
  uploadUrl: string;
  expiresAt: string;
  maxSizeBytes: number;
  allowedMime: string[];
};

export default function ChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const toast = useToast();
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
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
                attachments: [],
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

  const pickImage = useCallback(async () => {
    try {
      const pick = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (pick.canceled || !pick.assets[0]) return;
      await uploadAttachment(pick.assets[0].uri, pick.assets[0].fileName ?? 'photo.jpg', pick.assets[0].mimeType ?? 'image/jpeg');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Image pick failed', { tone: 'danger' });
    }
  }, [threadId, toast]);

  const pickDocument = useCallback(async () => {
    try {
      const pick = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf', 'video/*', 'audio/*', 'text/plain'] });
      if (pick.canceled || !pick.assets[0]) return;
      const asset = pick.assets[0];
      await uploadAttachment(asset.uri, asset.name ?? 'file', asset.mimeType ?? 'application/octet-stream');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Document pick failed', { tone: 'danger' });
    }
  }, [threadId, toast]);

  const uploadAttachment = async (uri: string, filename: string, mime: string) => {
    setUploadingAttachment(true);
    try {
      // Step 1: Get upload token
      const tokenResp = await api<AttachmentToken>(`/api/messages/threads/${threadId}/attachments`, {
        method: 'POST',
        body: JSON.stringify({
          ttlSeconds: 600,
          maxSizeBytes: 20 * 1024 * 1024,
          allowedMime: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/mp4', 'text/plain'],
        }),
      });

      // Step 2: Upload the file using the token
      const form = new FormData();
      form.append('file', { uri, name: filename, type: mime } as unknown as Blob);
      
      const res = await fetch(`${API_BASE_URL}${tokenResp.uploadUrl}`, {
        method: 'PUT',
        headers: {
          'x-attachment-token': tokenResp.token,
          'x-attachment-filename': filename,
        },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
      }

      await q.refetch();
      toast.show('Attachment sent', { tone: 'success' });
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Upload failed', { tone: 'danger' });
    } finally {
      setUploadingAttachment(false);
    }
  };

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
            <View style={{ width: '100%' }}>
              <Row align={item.isMine ? 'flex-end' : 'flex-start'}>
                <View
                  style={[
                    styles.bubble,
                    item.isMine ? styles.bubbleMine : styles.bubbleOther,
                  ]}
                >
                  {item.body && <Body>{item.body}</Body>}
                  {item.attachments?.map((att: { id: string; contentType: string; sizeBytes: number; filename: string; url: string | null; urlExpiresAt: string | null }) => (
                    <Pressable key={att.id} onPress={() => att.url && openUrl(att.url)}>
                      <View style={styles.attachment}>
                        <Body>{attachmentIcon(att.contentType)} {att.filename}</Body>
                        <Caption>{formatBytes(att.sizeBytes)}</Caption>
                      </View>
                    </Pressable>
                  ))}
                  <Caption>{fmtRelative(item.createdAt)}</Caption>
                </View>
              </Row>
            </View>
          )}
          ListEmptyComponent={<Caption>{q.isLoading ? t('common.loading') : t('messages.empty')}</Caption>}
        />
        <View style={styles.compose}>
          <Button
            label={t('messages.attach_image')}
            variant="ghost"
            onPress={pickImage}
            disabled={uploadingAttachment}
          />
          <Button
            label={t('messages.attach_file')}
            variant="ghost"
            onPress={pickDocument}
            disabled={uploadingAttachment}
          />
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

async function openUrl(url: string) {
  await Linking.openURL(url);
}

function attachmentIcon(mime: string): string {
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('video/')) return '🎥';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime === 'application/pdf') return '📄';
  return '📎';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    flexWrap: 'wrap',
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
  attachment: {
    gap: 2,
    paddingVertical: 4,
  },
});