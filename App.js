import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Caveat_600SemiBold, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AbloomApp from './src/AbloomApp';
import { track } from './src/lib/analytics';

SplashScreen.preventAutoHideAsync().catch(() => {});

// If anything throws while rendering, show a calm screen instead of a blank one.
// Data lives in storage, so "try again" is safe.
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) {
    track('app_error', { where: 'render' });
    if (__DEV__) console.error(error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8F0', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#3F7D48', textAlign: 'center' }}>something went sideways</Text>
        <Text style={{ fontSize: 16, color: '#62503F', textAlign: 'center', lineHeight: 23 }}>your plant and your data are safe. let’s try that again.</Text>
        <Pressable onPress={() => this.setState({ error: null })} accessibilityRole="button"
          style={{ backgroundColor: '#3F7D48', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 999, marginTop: 8 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>try again</Text>
        </Pressable>
      </View>
    );
  }
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Caveat_600SemiBold, Caveat_700Bold,
    Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold,
    ...Ionicons.font,
  });

  React.useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8F0', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3F7D48" />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: '#FFF8F0' }}>
      <ErrorBoundary>
        <AbloomApp />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
