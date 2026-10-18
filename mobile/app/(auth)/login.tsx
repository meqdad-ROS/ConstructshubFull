import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Caption, Field, Row, Screen, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useSession } from '../../lib/session';
import { spacing } from '../../lib/theme';
import { t } from '../../lib/i18n';

export default function LoginScreen() {
  const router = useRouter();
  const toast = useToast();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/marketplace');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('login.fail');
      toast.show(msg, { tone: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
          <Title>{t('brand.name')}</Title>
          <Caption>{t('login.title')}</Caption>
          <Field
            label={t('login.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Field
            label={t('login.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          <Button
            label={loading ? '…' : t('login.cta')}
            onPress={submit}
            loading={loading}
            disabled={!email || !password}
            fullWidth
          />
          <Row align="center">
            <Body muted>Need an account? Register from the web.</Body>
          </Row>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
