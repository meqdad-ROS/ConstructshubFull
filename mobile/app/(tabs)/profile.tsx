import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Body, Button, Card, Caption, Divider, Row, Screen, StatusPill, Subtitle, Title } from '../../components/ui';
import { useSession } from '../../lib/session';
import { useWallet, useEstimatorQuota } from '../../lib/queries';
import { fmtSar } from '../../lib/money';
import { spacing } from '../../lib/theme';
import { t } from '../../lib/i18n';

export default function ProfileTab() {
  const router = useRouter();
  const { user, signOut } = useSession();
  const wallet = useWallet();
  const quota = useEstimatorQuota();

  return (
    <Screen>
      <Title>{user?.name ?? user?.email ?? '—'}</Title>
      <Caption>{user?.role}</Caption>
      <View style={{ height: spacing.md }} />

      <Card>
        <Caption>Wallet</Caption>
        {wallet.data ? (
          <>
            <Subtitle>
              {fmtSar(wallet.data.wallet.balance - wallet.data.wallet.reserved)}
            </Subtitle>
            <Body muted>
              In escrow {fmtSar(wallet.data.wallet.reserved)}
            </Body>
          </>
        ) : (
          <Body muted>{t('common.loading')}</Body>
        )}
      </Card>

      <View style={{ height: spacing.sm }} />
      <Card>
        <Caption>{t('nav.estimator')}</Caption>
        {quota.data?.quota ? (
          <Row align="space-between">
            <Body>
              {quota.data.quota.limit === 'unlimited'
                ? 'Unlimited'
                : t('estimator.quota', {
                    used: quota.data.quota.usedThisMonth,
                    limit: String(quota.data.quota.limit),
                  })}
            </Body>
            {quota.data.quota.limit === 'unlimited' ? (
              <StatusPill tone="gold" label="PRO" />
            ) : null}
          </Row>
        ) : null}
        <View style={{ height: spacing.sm }} />
        <Button label="Open AI Estimator" onPress={() => router.push('/estimator')} fullWidth />
      </Card>

      <View style={{ height: spacing.sm }} />
      <Card>
        <Caption>Analytics</Caption>
        <View style={{ height: spacing.xs }} />
        <Button
          label="Your analytics"
          variant="secondary"
          onPress={() => router.push('/analytics')}
          fullWidth
        />
        <View style={{ height: spacing.xs }} />
        <Button
          label="Notifications"
          variant="secondary"
          onPress={() => router.push('/notifications')}
          fullWidth
        />
      </Card>

      <View style={{ height: spacing.md }} />
      <Divider />
      <Button
        label={t('settings.sign_out')}
        variant="danger"
        onPress={() => void signOut()}
        fullWidth
      />
    </Screen>
  );
}
