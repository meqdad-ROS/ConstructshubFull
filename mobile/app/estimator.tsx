import { useState } from 'react';
import { FlatList, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Body, Button, Card, Caption, Divider, Empty, Row, Screen, StatusPill, Subtitle, Title } from '../components/ui';
import { useToast } from '../components/toast';
import { apiUpload, ApiError } from '../lib/api';
import { useEstimatorQuota } from '../lib/queries';
import { fmtSar } from '../lib/money';
import { spacing } from '../lib/theme';
import { t } from '../lib/i18n';

type EstimateLine = {
  input: { description: string; quantity: number; unit: string };
  primary: {
    productId: string;
    title: string;
    supplier?: string | null;
    unitPriceSar: number;
    totalSar: number;
    rating: number;
    inStock: boolean;
  } | null;
  alternatives: Array<{ productId: string; title: string; unitPriceSar: number }>;
  bsddHint?: { name: string } | null;
  unmatchedReason?: string;
};

type EstimateResponse = {
  analysis?: unknown;
  estimate: {
    lines: EstimateLine[];
    totals: {
      subtotalSar: number;
      vatSar: number;
      totalSar: number;
      matchedCount: number;
      unmatchedCount: number;
    };
    tookMs: number;
  };
  estimateId?: string | null;
};

const IFC_EXT = ['ifc'];
const DOC_EXT = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'txt'];

export default function EstimatorScreen() {
  const toast = useToast();
  const quota = useEstimatorQuota();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<EstimateResponse | null>(null);
  const [via, setVia] = useState<'ifc' | 'document' | null>(null);

  const pick = async () => {
    const pickRes = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (pickRes.canceled || !pickRes.assets[0]) return;
    const asset = pickRes.assets[0];
    const ext = (asset.name ?? '').toLowerCase().split('.').pop() ?? '';
    const endpoint =
      IFC_EXT.includes(ext) ? '/api/search/ifc' : DOC_EXT.includes(ext) ? '/api/search/document' : null;
    if (!endpoint) {
      toast.show(`Unsupported file: .${ext}`, { tone: 'warning' });
      return;
    }
    setUploading(true);
    setVia(endpoint === '/api/search/ifc' ? 'ifc' : 'document');
    try {
      const resp = await apiUpload<EstimateResponse>(
        endpoint,
        { uri: asset.uri, name: asset.name ?? 'upload', mime: asset.mimeType ?? 'application/octet-stream' }
      );
      setResult(resp);
      await quota.refetch();
      toast.show(`Priced ${resp.estimate.lines.length} lines`, { tone: 'success' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        toast.show('Free estimator quota exhausted — upgrade on web.', { tone: 'warning' });
      } else {
        toast.show(err instanceof Error ? err.message : 'Upload failed', { tone: 'danger' });
      }
    } finally {
      setUploading(false);
    }
  };

  const q = quota.data?.quota;
  const quotaBadge = q
    ? q.limit === 'unlimited'
      ? 'Unlimited'
      : t('estimator.quota', { used: q.usedThisMonth, limit: String(q.limit) })
    : null;

  return (
    <Screen>
      <Title>{t('estimator.title')}</Title>
      {quotaBadge ? <Caption>{quotaBadge}</Caption> : null}
      <View style={{ height: spacing.md }} />
      <Button
        label={uploading ? 'Analysing…' : t('estimator.pick_file')}
        onPress={pick}
        loading={uploading}
        fullWidth
      />
      <View style={{ height: spacing.md }} />

      {result ? (
        <FlatList
          data={result.estimate.lines}
          keyExtractor={(_, i) => String(i)}
          ListHeaderComponent={<ResultHeader result={result} via={via} />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm }}>
              <Row align="space-between">
                <Subtitle>{item.input.description}</Subtitle>
                {item.primary ? (
                  <StatusPill tone="success" label="Priced" />
                ) : (
                  <StatusPill tone="warning" label="Unmatched" />
                )}
              </Row>
              <Caption>
                {item.input.quantity} {item.input.unit}
              </Caption>
              {item.primary ? (
                <>
                  <Row align="space-between">
                    <Body>{item.primary.title}</Body>
                    <Body>{fmtSar(item.primary.totalSar)}</Body>
                  </Row>
                  {item.primary.supplier ? <Caption>{item.primary.supplier}</Caption> : null}
                </>
              ) : (
                <Caption>
                  No matching product.
                  {item.bsddHint ? ` bSDD hint: ${item.bsddHint.name}` : ''}
                </Caption>
              )}
            </Card>
          )}
          ListEmptyComponent={<Empty title="No line items extracted" />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        />
      ) : (
        <Empty
          title="Pick a file"
          hint="IFC (.ifc) uses the sandbox parser if available. PDFs, Word and Excel use the heuristic + LLM extractor."
        />
      )}
    </Screen>
  );
}

function ResultHeader({ result, via }: { result: EstimateResponse; via: string | null }) {
  const t_ = result.estimate.totals;
  return (
    <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
      <Row gap={spacing.sm}>
        <StatusPill tone="gold" label={via ?? 'estimate'} />
        <StatusPill
          tone={t_.unmatchedCount > 0 ? 'warning' : 'success'}
          label={`${t_.matchedCount} / ${t_.matchedCount + t_.unmatchedCount} priced`}
        />
      </Row>
      <Card>
        <Row align="space-between">
          <Body muted>{t('estimator.sub_total')}</Body>
          <Body>{fmtSar(t_.subtotalSar)}</Body>
        </Row>
        <Row align="space-between">
          <Body muted>{t('estimator.vat')}</Body>
          <Body>{fmtSar(t_.vatSar)}</Body>
        </Row>
        <Divider />
        <Row align="space-between">
          <Subtitle>{t('estimator.total')}</Subtitle>
          <Subtitle>{fmtSar(t_.totalSar)}</Subtitle>
        </Row>
      </Card>
    </View>
  );
}
