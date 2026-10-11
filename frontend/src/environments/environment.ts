const isLocalDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
) && window.location.port !== '5000' && window.location.port !== '80';

export const environment = {
  production: false,
  apiUrl: isLocalDev ? 'http://localhost:5000/api' : '/api'
};

