import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, View } from 'react-native';
import { Body, Button, Card, Caption, Divider, Row, Screen, Subtitle, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useSession } from '../../lib/session';
import { api } from '../../lib/api';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
} from '../../lib/biometric';
import { getLocale, setLocale, SUPPORTED } from '../../lib/i18n';
import { spacing } from '../../lib/theme';
import { t } from '../../lib/i18n';

type Prefs = {
  email: boolean;
  push: boolean;
  sms: boolean;
  orderUpdates: boolean;
  priceDrops: boolean;
  promos: boolean;
};

const DEFAULT: Prefs = {
  email: true,
  push: true,
  sms: false,
  orderUpdates: true,
  priceDrops: true,
  promos: false,
};

export default function SettingsTab() {
  const { signOut, user } = useSession();
  const toast = useToast();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabledState] = useState(false);
  const [locale, setLocaleState] = useState(getLocale());

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ preferences: Prefs }>('/api/notifications/preferences');
        setPrefs({ ...DEFAULT, ...data.preferences });
      } catch {
        /* defaults stand */
      }
      setBioAvailable(await isBiometricAvailable());
      setBioEnabledState(await isBiometricEnabled());
      setLoading(false);
    })();
  }, []);

  const toggle = useCallback(
    (key: keyof Prefs) => async (value: boolean) => {
      const prior = prefs;
      setPrefs({ ...prefs, [key]: value });
      try {
        await api('/api/notifications/preferences', {
          method: 'PATCH',
          body: JSON.stringify({ [key]: value }),
        });
      } catch (err) {
        setPrefs(prior);
        toast.show(err instanceof Error ? err.message : 'Save failed', { tone: 'danger' });
      }
    },
    [prefs, toast]
  );

  const toggleBio = useCallback(
    async (value: boolean) => {
      setBioEnabledState(value);
      await setBiometricEnabled(value);
    },
    []
  );

  const changeLocale = useCallback(
    async (next: 'en' | 'ar') => {
      await setLocale(next);
      setLocaleState(next);
      Alert.alert('Restart required', 'Reopen the app for the layout direction to update.');
    },
    []
  );

  return (
    <ScrollView style={{ backgroundColor: '#0b1220' }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>{t('nav.settings')}</Title>

      <Card>
        <Subtitle>{t('settings.locale')}</Subtitle>
        <Row>
          {SUPPORTED.map((code) => (
            <View style={{ flex: 1 }} key={code}>
              <Button
                label={code === 'ar' ? 'عربي' : 'English'}
                variant={locale === code ? 'primary' : 'secondary'}
                onPress={() => void changeLocale(code)}
                fullWidth
              />
            </View>
          ))}
        </Row>
      </Card>

      <Card>
        <Row align="space-between">
          <Subtitle>{t('settings.biometric')}</Subtitle>
          <Switch
            value={bioEnabled}
            onValueChange={toggleBio}
            disabled={!bioAvailable}
          />
        </Row>
        {!bioAvailable ? (
          <Caption>Biometric unlock is unavailable on this device.</Caption>
        ) : null}
      </Card>

      <Card>
        <Subtitle>{t('settings.notifications')}</Subtitle>
        {loading ? (
          <Body muted>{t('common.loading')}</Body>
        ) : (
          <>
            <PrefRow label="Email" value={prefs.email} onValueChange={toggle('email')} />
            <PrefRow label="Push" value={prefs.push} onValueChange={toggle('push')} />
            <PrefRow label="SMS" value={prefs.sms} onValueChange={toggle('sms')} />
            <Divider />
            <PrefRow
              label="Order updates"
              value={prefs.orderUpdates}
              onValueChange={toggle('orderUpdates')}
            />
            <PrefRow
              label="Price drops"
              value={prefs.priceDrops}
              onValueChange={toggle('priceDrops')}
            />
            <PrefRow label="Promotions" value={prefs.promos} onValueChange={toggle('promos')} />
          </>
        )}
      </Card>

      <Card>
        <Caption>Signed in as</Caption>
        <Body>{user?.email}</Body>
        <Caption>{user?.role}</Caption>
      </Card>

      <Button label={t('settings.sign_out')} variant="danger" onPress={() => void signOut()} fullWidth />
    </ScrollView>
  );
}

function PrefRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <Row align="space-between">
      <Body>{label}</Body>
      <Switch value={value} onValueChange={onValueChange} />
    </Row>
  );
}
