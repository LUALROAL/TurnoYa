import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.turnoya.mobile',
  appName: 'TurnoYa',
  webDir: 'www',
  server: {
    // Para desarrollo local - permite conectarse a la API en localhost desde el emulador
    // androidScheme: 'http',
    // cleartext: true
  }
};

export default config;
