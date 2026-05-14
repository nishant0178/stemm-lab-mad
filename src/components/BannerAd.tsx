import React from 'react';
import { Platform, View } from 'react-native';

// react-native-google-mobile-ads requires a custom native build.
// Wrap in try-catch so the app doesn't crash in Expo Go.
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

try {
  if (Platform.OS !== 'web') {
    const Ads = require('react-native-google-mobile-ads');
    BannerAd   = Ads.BannerAd;
    BannerAdSize = Ads.BannerAdSize;
    TestIds    = Ads.TestIds;
  }
} catch {
  // Not available in Expo Go — will work in dev/preview build
}

export default function BannerAdComponent() {
  if (Platform.OS === 'web' || !BannerAd || !BannerAdSize || !TestIds) {
    return null;
  }

  const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-3940256099942544/6300978111';

  return (
    <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
