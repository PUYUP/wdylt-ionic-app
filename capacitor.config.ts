/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wdylt.app',
  appName: 'What Did You Learn Today?',
  webDir: 'www',
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
    Keyboard: {
      resizeOnFullScreen: false
    },
    EdgeToEdge: {
      backgroundColor: '#000000',
    },
    StatusBar: {
      overlaysWebView: true,
      style: "DARK",
    },
  }
};

export default config;
