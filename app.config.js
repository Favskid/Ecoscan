// app.config.js — dynamic config so we can inject env vars into expo-constants
// API keys are read from the .env file at build time via process.env.

module.exports = {
  expo: {
    owner: 'favskid',
    name: 'EcoScan',
    slug: 'ecoscan',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'ecoscan',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/images/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#2E7D32',
    },
    ios: { supportsTablet: false },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/icon.png',
        backgroundColor: '#2E7D32',
      },
      package: 'com.ecoscan.app',
    },
    web: { favicon: './assets/images/icon.png' },
    plugins: [
      ['expo-router', { origin: 'https://replit.com/' }],
      'expo-font',
      'expo-web-browser',
      [
        'expo-camera',
        { cameraPermission: 'EcoScan needs camera access to identify recyclable materials.' },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    // ⬇ API keys injected here — accessible via Constants.expoConfig.extra
    extra: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
      eas: {
        projectId: '7c2dcbf1-913c-4733-b975-b80d4bb585ce',
      },
    },
  },
};
