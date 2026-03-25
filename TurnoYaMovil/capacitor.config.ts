import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.turnoya.app',
  appName: 'TurnoYa',
  webDir: 'www',
  plugins: {
    GoogleSignIn: {
      clientId: '504093820497-06quvb9dkvfkfn9ts06256id729gcjt4.apps.googleusercontent.com',
      scopes: ['profile', 'email']
    }
  }
};

export default config;
