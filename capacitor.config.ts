/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wdylt.app',
  appName: 'What Did You Learn Today?',
  webDir: 'www',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resizeOnFullScreen: false
    },
    EdgeToEdge: {
      backgroundColor: '#000000',
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
    },
  }
};

export default config;
