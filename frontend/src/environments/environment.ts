function resolveApiUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:5000/api';
  
  // 1. User manual override (configured from Mobile App Settings or Web)
  try {
    const custom = localStorage.getItem('DIGITLAB_API_URL');
    if (custom && custom.trim()) {
      const clean = custom.trim().replace(/\/+$/, '');
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
  } catch {}

  // 2. Check if running inside Mobile App (Capacitor WebView on Android/iOS)
  const isCapacitor = (window as any).Capacitor !== undefined || 
                      window.location.protocol === 'capacitor:' ||
                      (window.location.origin.includes('localhost') && window.location.port === '');
  
  if (isCapacitor) {
    // Default to the host PC's Wi-Fi network IP for local wireless testing
    return 'http://192.168.0.196:5000/api';
  }

  // 3. Web Browser in development
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) {
    return `http://${host}:5000/api`;
  }

  // 4. Default relative path for web
  return '/api';
}

export const environment = {
  production: false,
  get apiUrl(): string {
    return resolveApiUrl();
  }
};
