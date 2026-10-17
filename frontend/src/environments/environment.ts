const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isDev = typeof window !== 'undefined' && (
  window.location.port === '4200' ||
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host.startsWith('192.168.') ||
  host.startsWith('10.') ||
  host.startsWith('172.')
);

export const environment = {
  production: false,
  apiUrl: isDev ? `http://${host}:5000/api` : '/api'
};


