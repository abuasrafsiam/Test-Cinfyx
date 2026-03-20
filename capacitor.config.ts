import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cinefyx.app',
  appName: 'Cinefyx',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: "#000000",
      androidScaleType: "CENTER",
      showSpinner: false,
      androidSplashResourceName: "splash",
      splashFullScreen: true,
      splashImmersive: true
    },
    ScreenOrientation: {
      // Allow orientation changes
    },
    StatusBar: {
      // Status bar configuration
    }
  }
};

export default config;

