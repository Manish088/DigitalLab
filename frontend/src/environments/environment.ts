const isLocalDev = typeof window !== 'undefined' && window.location.port === '4200';

export const environment = {
  production: false,
  apiUrl: isLocalDev ? 'http://localhost:5000/api' : '/api'
};

