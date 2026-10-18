import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useSession } from '../lib/session';

export default function Index() {
  const { user, loading } = useSession();
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1220', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#f7b500" />
      </View>
    );
  }
  return <Redirect href={user ? '/(tabs)/marketplace' : '/(auth)/login'} />;
}
