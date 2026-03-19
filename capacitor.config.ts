import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cinefyx.app',
  appName: 'Cinefyx',
  webDir: 'dist',
  server: {
    url: 'https://67dec991-2af3-4848-9b84-701f3b1bbeb2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
