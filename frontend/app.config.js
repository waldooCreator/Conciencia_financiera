// Dynamic config: inyecta apiUrl en extra para que el APK use la URL correcta
const appJson = require('./app.json');

const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://185.202.223.66:3020/api';

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl,
  },
});
