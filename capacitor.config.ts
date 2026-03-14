import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laesquinakiosco.app',
  appName: 'La Esquina Kiosco',
  webDir: 'out',
  server: {
    url: 'https://ber--la-esquina-kiosco.us-central1.hosted.app',
    cleartext: true
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
    },
  },
};

export default config;
