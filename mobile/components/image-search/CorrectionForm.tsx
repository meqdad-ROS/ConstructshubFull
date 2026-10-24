import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Caption, Field } from '../ui';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { t } from '../../lib/i18n';
import {
  CORRECTION_REASONS,
  type CorrectionReason,
} from '../../lib/image-search';

export type ImageCorrectionFormProps = {
  mode: 'region' | 'missed';
  context?: string | null;
  reason: CorrectionReason;
  correctedLabel: string;
  submitting: boolean;
  error?: string | null;
  notice?: string | null;
  onChangeReason: (reason: CorrectionReason) => void;
  onChangeLabel: (label: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export default function ImageCorrectionForm({
  mode,
  context,
  reason,
  correctedLabel,
  submitting,
  error,
  notice,
  onChangeReason,
  onChangeLabel,
  onCancel,
  onSubmit,
}: ImageCorrectionFormProps) {
  const requiresLabel =
    reason === 'mislabeled' || reason === 'missed_item' || reason === 'other';

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>
        {mode === 'missed' ? t('image.report_missed') : t('image.report_issue')}
      </Text>
      {context ? (
        <Caption>{t('image.report_context', { label: context })}</Caption>
      ) : null}

      <Text style={styles.label}>{t('image.report_reason')}</Text>
      <View style={styles.reasons}>
        {CORRECTION_REASONS.map((value) => {
          const active = value === reason;
          return (
            <Pressable
              key={value}
              onPress={() => onChangeReason(value)}
              disabled={submitting}
              style={[styles.reason, active && styles.reasonActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.reasonText, active && styles.reasonTextActive]}>
                {t(`image.reason_${value}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {requiresLabel ? (
        <Field
          label={
            reason === 'missed_item'
              ? t('image.missed_label')
              : t('image.correct_label')
          }
          value={correctedLabel}
          onChangeText={onChangeLabel}
          placeholder={
            reason === 'missed_item'
              ? t('image.missed_placeholder')
              : t('image.correct_placeholder')
          }
          maxLength={120}
          editable={!submitting}
          error={error}
        />
      ) : null}

      <Caption>{t('image.privacy')}</Caption>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button
            label={t('common.cancel')}
            variant="ghost"
            onPress={onCancel}
            disabled={submitting}
            fullWidth
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={submitting ? t('image.sending') : t('image.send_report')}
            onPress={onSubmit}
            loading={submitting}
            disabled={requiresLabel && !correctedLabel.trim()}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.sm,
  },
  title: { ...typography.subtitle },
  label: { ...typography.label },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reason: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  reasonActive: { borderColor: colors.gold, backgroundColor: colors.brown },
  reasonText: { ...typography.caption, color: colors.muted },
  reasonTextActive: { color: colors.gold, fontWeight: '700' },
  notice: {
    ...typography.caption,
    color: '#86efac',
    backgroundColor: '#064e3b',
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
