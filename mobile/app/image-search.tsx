import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Body,
  Button,
  Caption,
  Card,
  Row,
  Screen,
  StatusPill,
  Subtitle,
  Title,
} from '../components/ui';
import { ImageDetectionOverlay } from '../components/image-detection-overlay';
import ImageCorrectionForm from '../components/image-search/CorrectionForm';
import { useToast } from '../components/toast';
import { api, apiUpload } from '../lib/api';
import { addToCart } from '../lib/cart';
import { t } from '../lib/i18n';
import { fmtSar } from '../lib/money';
import { colors, radius, spacing, typography } from '../lib/theme';
import {
  buildCorrectionBody,
  cartInputFromHit,
  confidenceTone,
  detectorI18nKey,
  formatConfidence,
  isAddableProduct,
  primaryProduct,
  regionTitle,
  resolveImageDimensions,
  type CorrectionReason,
  type MobileImageRegion,
  type MobileImageResult,
} from '../lib/image-search';

type PickedImage = {
  uri: string;
  name: string;
  mime: string;
  width: number;
  height: number;
};

type ReportDraft = {
  scope: number | 'missed';
  reason: CorrectionReason;
  correctedLabel: string;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export default function ImageSearchScreen() {
  const router = useRouter();
  const toast = useToast();
  const [image, setImage] = useState<PickedImage | null>(null);
  const [result, setResult] = useState<MobileImageResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [addedHitId, setAddedHitId] = useState<string | null>(null);
  const [report, setReport] = useState<ReportDraft | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const dimensions = resolveImageDimensions(
    result ?? { width: 0, height: 0 },
    { width: image?.width ?? 0, height: image?.height ?? 0 }
  );

  async function analyse(asset: ImagePicker.ImagePickerAsset) {
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      toast.show(t('image.too_large'), { tone: 'warning' });
      return;
    }

    const seq = ++requestSeq.current;
    const picked: PickedImage = {
      uri: asset.uri,
      name: asset.fileName ?? 'photo.jpg',
      mime: asset.mimeType ?? 'image/jpeg',
      width: asset.width ?? 0,
      height: asset.height ?? 0,
    };
    setImage(picked);
    setResult(null);
    setAnalyzing(true);
    setAnalysisError(null);
    setActiveIndex(null);
    setAddedHitId(null);
    setReport(null);
    setReportError(null);

    try {
      const next = await apiUpload<MobileImageResult>(
        '/api/search/image',
        { uri: picked.uri, name: picked.name, mime: picked.mime },
        undefined,
        'image'
      );
      if (seq !== requestSeq.current) return;
      setResult(next);
      setActiveIndex(next.regions.length > 0 ? 0 : null);
      if (next.regions.length === 0) {
        toast.show(t('image.empty'), { tone: 'warning' });
      }
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setAnalysisError(err instanceof Error ? err.message : t('image.analysis_failed'));
    } finally {
      if (seq === requestSeq.current) setAnalyzing(false);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.show(t('image.permission_camera'), { tone: 'warning' });
      return;
    }
    const pick = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!pick.canceled && pick.assets[0]) void analyse(pick.assets[0]);
  }

  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show(t('image.permission_library'), { tone: 'warning' });
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!pick.canceled && pick.assets[0]) void analyse(pick.assets[0]);
  }

  function clearImage() {
    requestSeq.current += 1;
    setImage(null);
    setResult(null);
    setAnalyzing(false);
    setAnalysisError(null);
    setActiveIndex(null);
    setAddedHitId(null);
    setReport(null);
    setReportError(null);
  }

  async function addHit(hit: MobileImageRegion['topHits'][number]) {
    const line = cartInputFromHit(hit);
    if (!line) return;
    try {
      await addToCart(line);
      setAddedHitId(hit.id);
      toast.show(t('image.cart_added'), { tone: 'success' });
    } catch {
      toast.show(t('image.cart_failed'), { tone: 'danger' });
    }
  }

  function openReport(scope: number | 'missed') {
    setReportError(null);
    if (scope === 'missed') {
      setReport({ scope, reason: 'missed_item', correctedLabel: '' });
      return;
    }
    const region = result?.regions[scope];
    setReport({
      scope,
      reason: 'mislabeled',
      correctedLabel: region ? regionTitle(region) : '',
    });
  }

  async function submitReport() {
    if (!report || !result) return;
    const correctedLabel = report.correctedLabel.trim();
    const needsLabel =
      report.reason === 'mislabeled' ||
      report.reason === 'missed_item' ||
      report.reason === 'other';
    if (needsLabel && !correctedLabel) return;

    const region =
      report.scope === 'missed' ? null : result.regions[report.scope] ?? null;
    if (!region && report.scope !== 'missed') return;

    setReportSubmitting(true);
    setReportError(null);
    try {
      const body = buildCorrectionBody({
        reason: report.reason,
        correctedLabel,
        detection:
          region && report.reason !== 'missed_item'
            ? {
                label: regionTitle(region),
                query: region.query,
                confidence: region.region.confidence,
                bbox: region.region.bbox,
                productId: primaryProduct(region)?.refId,
              }
            : undefined,
        detectorKind: result.detectorKind,
        imageWidth: dimensions.width,
        imageHeight: dimensions.height,
      });
      await api<{ ok: boolean; reportId: string }>('/api/search/image/corrections', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setReport(null);
      toast.show(t('image.report_sent'), { tone: 'success' });
    } catch (err) {
      setReportError(err instanceof Error ? err.message : t('image.report_failed'));
    } finally {
      setReportSubmitting(false);
    }
  }

  const reportForm = (scope: number | 'missed') =>
    report?.scope === scope ? (
      <ImageCorrectionForm
        mode={scope === 'missed' ? 'missed' : 'region'}
        context={
          scope === 'missed' || !result ? null : regionTitle(result.regions[scope])
        }
        reason={report.reason}
        correctedLabel={report.correctedLabel}
        submitting={reportSubmitting}
        error={reportError}
        onChangeReason={(reason) => setReport((draft) => (draft ? { ...draft, reason } : draft))}
        onChangeLabel={(correctedLabel) =>
          setReport((draft) => (draft ? { ...draft, correctedLabel } : draft))
        }
        onCancel={() => {
          setReport(null);
          setReportError(null);
        }}
        onSubmit={() => void submitReport()}
      />
    ) : null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Title>{t('image.heading')}</Title>
        <Body muted>{t('image.intro')}</Body>

        <Row>
          <View style={{ flex: 1 }}>
            <Button
              label={image ? t('image.retake_photo') : t('image.take_photo')}
              variant="secondary"
              onPress={() => void takePhoto()}
              disabled={analyzing}
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={image ? t('image.new_image') : t('image.choose_image')}
              variant="secondary"
              onPress={() => void chooseImage()}
              disabled={analyzing}
              fullWidth
            />
          </View>
        </Row>

        {image ? (
          <Card style={styles.previewCard}>
            <Row align="space-between">
              <Caption>
                {analyzing
                  ? t('image.analyzing')
                  : t('image.detected', { count: result?.regions.length ?? 0 })}
              </Caption>
              <Pressable onPress={clearImage} hitSlop={8} accessibilityRole="button">
                <Caption style={{ color: colors.dangerSoft }}>{t('image.clear_image')}</Caption>
              </Pressable>
            </Row>

            <ImageDetectionOverlay
              imageUri={image.uri}
              imageWidth={dimensions.width}
              imageHeight={dimensions.height}
              regions={result?.regions ?? []}
              selectedIndex={activeIndex}
              onSelect={(index) => setActiveIndex(index)}
            />

            {analyzing ? (
              <Row>
                <ActivityIndicator color={colors.gold} />
                <Caption>{t('image.analyzing')}</Caption>
              </Row>
            ) : null}

            {result ? (
              <Caption>
                {t('image.detector', {
                  name: t(detectorI18nKey(result.detectorKind)),
                })}{' '}
                ·{' '}
                {t('image.threshold', {
                  value: formatConfidence(result.confidenceThreshold),
                })}{' '}
                · {result.tookMs} ms
              </Caption>
            ) : null}
          </Card>
        ) : null}

        {analysisError ? (
          <Card style={styles.errorCard}>
            <Body style={{ color: colors.dangerSoft }}>
              {t('image.analysis_failed')} {analysisError}
            </Body>
            <Button label={t('image.try_again')} onPress={() => void chooseImage()} />
          </Card>
        ) : null}

        {result && result.regions.length === 0 && !analyzing ? (
          <Card style={styles.previewCard}>
            <Body muted>{t('image.empty')}</Body>
          </Card>
        ) : null}

        {result?.regions.map((region, index) => {
          const title = regionTitle(region);
          const tone = confidenceTone(region.region.confidence);
          const pillTone =
            tone === 'high' ? 'success' : tone === 'medium' ? 'warning' : 'danger';
          const addable = region.topHits.filter(isAddableProduct);
          return (
            <Card
              key={`${region.region.bbox.x}-${region.region.bbox.y}-${index}`}
              style={activeIndex === index ? styles.cardActive : styles.card}
            >
              <Pressable onPress={() => setActiveIndex(index)} accessibilityRole="button">
                <Row align="flex-start">
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Subtitle style={styles.cardTitle}>{title}</Subtitle>
                    <Caption>
                      {t('image.confidence', {
                        value: formatConfidence(region.region.confidence),
                      })}
                      {region.region.category ? ` · ${region.region.category}` : ''}
                    </Caption>
                  </View>
                  <StatusPill
                    label={
                      tone === 'low'
                        ? t('image.low_confidence')
                        : formatConfidence(region.region.confidence)
                    }
                    tone={pillTone}
                  />
                </Row>
              </Pressable>

              {region.region.ocrText && region.region.ocrText !== title ? (
                <Caption>{t('image.text_in_box', { text: region.region.ocrText })}</Caption>
              ) : null}

              {region.topHits.length === 0 ? (
                <Body muted>{t('image.no_match')}</Body>
              ) : (
                region.topHits.slice(0, 3).map((hit) => {
                  const canAdd = isAddableProduct(hit);
                  const meta = [hit.brand, hit.city, fmtSar(hit.priceSar)]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <View key={hit.id} style={styles.hitRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={typography.body} numberOfLines={2}>
                          {hit.title}
                        </Text>
                        <Caption>{meta}</Caption>
                      </View>
                      {canAdd ? (
                        <Button
                          label={
                            addedHitId === hit.id ? t('image.added') : t('image.add_to_cart')
                          }
                          onPress={() => void addHit(hit)}
                          disabled={addedHitId === hit.id}
                        />
                      ) : null}
                    </View>
                  );
                })
              )}

              {addable.length === 0 && region.query ? (
                <Button
                  label={t('image.search_this', { query: region.query })}
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/marketplace',
                      params: { q: region.query },
                    })
                  }
                  fullWidth
                />
              ) : null}

              <Row align="space-between">
                <Caption>{t('image.one_tap_hint')}</Caption>
                <Pressable
                  onPress={() => openReport(index)}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Caption style={{ color: colors.dangerSoft }}>
                    {t('image.report_issue')}
                  </Caption>
                </Pressable>
              </Row>

              {reportForm(index)}
            </Card>
          );
        })}

        {result ? (
          <Card style={styles.card}>
            <Subtitle>{t('image.report_missed')}</Subtitle>
            <Body muted>{t('image.report_missed_hint')}</Body>
            {report?.scope !== 'missed' ? (
              <Button
                label={t('image.report_missed_cta')}
                variant="secondary"
                onPress={() => openReport('missed')}
                fullWidth
              />
            ) : null}
            {reportForm('missed')}
          </Card>
        ) : null}

        {result && result.suggestions.length > 0 ? (
          <Card style={styles.card}>
            <Subtitle>{t('image.suggestions')}</Subtitle>
            <Caption>{t('image.suggestions_hint')}</Caption>
            <Row gap={spacing.sm} style={{ flexWrap: 'wrap' }}>
              {result.suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  style={styles.chip}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/marketplace',
                      params: { q: suggestion },
                    })
                  }
                  accessibilityRole="button"
                >
                  <Caption style={{ color: colors.gold }}>{suggestion}</Caption>
                </Pressable>
              ))}
            </Row>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing['3xl'] },
  previewCard: { gap: spacing.sm },
  errorCard: { gap: spacing.sm, borderColor: colors.danger },
  card: { gap: spacing.sm },
  cardActive: { gap: spacing.sm, borderColor: colors.gold },
  cardTitle: { marginTop: 0 },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  hitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
