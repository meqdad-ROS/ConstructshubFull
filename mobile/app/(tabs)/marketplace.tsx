import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Body, Button, Card, Caption, Empty, Row, Screen, StatusPill, Subtitle, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useAutocomplete, useSearch, type SearchHit } from '../../lib/queries';
import { apiUpload } from '../../lib/api';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { fmtSar } from '../../lib/money';
import { t } from '../../lib/i18n';

export default function MarketplaceScreen() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [committed, setCommitted] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const autocomplete = useAutocomplete(query);
  const search = useSearch(
    { q: committed, kinds: ['PRODUCT', 'SUPPLIER'] },
    { enabled: committed.length > 0 }
  );

  const commit = useCallback((text: string) => {
    setCommitted(text.trim());
  }, []);

  const onImageSearch = useCallback(async () => {
    try {
      const pick = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (pick.canceled || !pick.assets[0]) return;
      setUploadingImage(true);
      const asset = pick.assets[0];
      const result = await apiUpload<{ regions: Array<{ query: string }> }>(
        '/api/search/image',
        { uri: asset.uri, name: asset.fileName ?? 'photo.jpg', mime: asset.mimeType ?? 'image/jpeg' },
        undefined,
        'image'
      );
      const first = result.regions[0]?.query;
      if (first) {
        setQuery(first);
        commit(first);
        toast.show(`Detected: ${first}`, { tone: 'success' });
      } else {
        toast.show('No labels detected in the image', { tone: 'warning' });
      }
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Image search failed', { tone: 'danger' });
    } finally {
      setUploadingImage(false);
    }
  }, [commit, toast]);

  const onVoiceSearch = useCallback(async () => {
    // The real recording UX would use expo-av — kept to a short upload
    // path here. For a fully-featured recorder see TODO in the file.
    try {
      const pick = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (pick.canceled || !pick.assets[0]) return;
      setUploadingAudio(true);
      const asset = pick.assets[0];
      const result = await apiUpload<{ transcription?: string }>(
        '/api/search/voice?runSearch=0',
        { uri: asset.uri, name: asset.name, mime: asset.mimeType ?? 'audio/webm' },
        undefined,
        'audio'
      );
      if (result.transcription) {
        setQuery(result.transcription);
        commit(result.transcription);
      } else {
        toast.show('Transcription empty', { tone: 'warning' });
      }
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Voice search failed', { tone: 'danger' });
    } finally {
      setUploadingAudio(false);
    }
  }, [commit, toast]);

  const header = useMemo(
    () => (
      <View style={{ gap: spacing.md, paddingBottom: spacing.sm }}>
        <Row>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => commit(query)}
            returnKeyType="search"
            placeholder={t('market.search_placeholder')}
            placeholderTextColor={colors.mutedSoft}
            style={styles.input}
            accessibilityLabel={t('common.search')}
          />
        </Row>
        <Row>
          <View style={{ flex: 1 }}>
            <Button
              label={t('market.voice_search')}
              variant="secondary"
              onPress={onVoiceSearch}
              loading={uploadingAudio}
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('market.image_search')}
              variant="secondary"
              onPress={onImageSearch}
              loading={uploadingImage}
              fullWidth
            />
          </View>
        </Row>
        {query.length >= 2 && autocomplete.data?.hits && query !== committed ? (
          <Card style={{ padding: spacing.sm }}>
            {autocomplete.data.hits.slice(0, 6).map((h) => (
              <Pressable
                key={`${h.kind}-${h.refId}`}
                style={styles.suggest}
                onPress={() => {
                  setQuery(h.title);
                  commit(h.title);
                }}
              >
                <Body>{h.title}</Body>
                <Caption>{h.kind.toLowerCase()}</Caption>
              </Pressable>
            ))}
          </Card>
        ) : null}
      </View>
    ),
    [autocomplete.data, commit, committed, onImageSearch, onVoiceSearch, query, uploadingAudio, uploadingImage]
  );

  const renderHit = useCallback(
    ({ item }: { item: SearchHit }) => (
      <Pressable
        onPress={() => {
          if (item.kind === 'PRODUCT') router.push(`/product/${item.refId}`);
        }}
      >
        <Card style={{ marginBottom: spacing.sm }}>
          <Row align="space-between">
            <View style={{ flex: 1, gap: 4 }}>
              <Subtitle>{item.title}</Subtitle>
              <Row gap={spacing.sm}>
                {item.isSponsored ? <StatusPill tone="gold" label="Sponsored" /> : null}
                {item.verified ? <StatusPill tone="success" label="Verified" /> : null}
                {!item.inStock ? <StatusPill tone="danger" label="Out" /> : null}
              </Row>
              <Row gap={spacing.sm}>
                {item.brand ? <Caption>{item.brand}</Caption> : null}
                {item.city ? <Caption>· {item.city}</Caption> : null}
              </Row>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Body>{fmtSar(item.priceSar)}</Body>
              {item.rating > 0 ? <Caption>★ {item.rating.toFixed(1)}</Caption> : null}
            </View>
          </Row>
        </Card>
      </Pressable>
    ),
    [router]
  );

  return (
    <Screen>
      <Title>{t('nav.marketplace')}</Title>
      <View style={{ height: spacing.md }} />
      <FlatList<SearchHit>
        data={committed ? search.data?.hits ?? [] : []}
        keyExtractor={(h) => `${h.kind}-${h.refId}`}
        renderItem={renderHit}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={search.isFetching}
            onRefresh={() => void search.refetch()}
            tintColor={colors.gold}
          />
        }
        ListEmptyComponent={
          committed ? (
            <Empty title={t('market.no_results')} hint={t('market.no_results.hint')} />
          ) : (
            <Empty title="Start typing" hint="Try “16mm rebar” or “plumber in Riyadh”." />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    backgroundColor: colors.inkSoft,
    color: colors.paper,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    fontSize: 16,
  },
  suggest: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: 2,
  },
});
