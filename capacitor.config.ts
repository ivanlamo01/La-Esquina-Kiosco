import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.almacenmgd.app',
  appName: 'Almacen MGD',
  webDir: 'out',
  server: {
    url: 'https://lodemarta--la-esquina-kiosco.us-central1.hosted.app',
    cleartext: true
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
    },
  },
};

export default config;
