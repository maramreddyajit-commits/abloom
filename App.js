import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useFonts, Caveat_400Regular, Caveat_500Medium, Caveat_600SemiBold, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { ComingSoon_400Regular } from '@expo-google-fonts/coming-soon';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AbloomApp from './src/AbloomApp';

export default function App() {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_500Medium,
    Caveat_600SemiBold,
    Caveat_700Bold,
    ComingSoon_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8F0', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#5A8F5A" />
        <Text style={{ marginTop: 12, color: '#5A8F5A', fontSize: 16 }}>loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AbloomApp />
    </SafeAreaProvider>
  );
}
