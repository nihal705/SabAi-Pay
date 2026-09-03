// Temporary compatibility bridge for older screens that still call axios with
// an absolute localhost URL. New code must use apiService directly.
import axios from 'axios';

const configuredBase = (process.env.REACT_APP_API_URL || '/api').replace(/\/$/, '');
const legacyBase = 'http://localhost:5000/api';

axios.interceptors.request.use((config) => {
  if (typeof config.url === 'string' && config.url.startsWith(legacyBase)) {
    config.url = `${configuredBase}${config.url.slice(legacyBase.length)}`;
    // Once rewritten, make the request relative to the deployed frontend origin.
    config.baseURL = undefined;
  }
  return config;
});
