// Inyecta apiUrl en Constants.expoConfig.extra.apiUrl
// EAS Build lee EXPO_PUBLIC_API_URL del eas.json o .env.production
const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://185.202.223.66:3020/api';

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl,
  },
});
