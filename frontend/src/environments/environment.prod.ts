export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window as any).__API_URL__) 
    ? (window as any).__API_URL__ 
    : 'http://localhost:5000/api'
};
