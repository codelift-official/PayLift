export async function fetchAppVersion() {
  try {
    const isMock = import.meta.env.VITE_USE_MOCKS === 'true';
    const baseUrl = isMock
      ? ''
      : (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '');

    // Standard simple GET request with no custom headers to avoid CORS preflight rejection
    const res = await fetch(`${baseUrl}/api/v1/version`);
    if (!res.ok) return { version: '1.0.3' };
    return await res.json();
  } catch {
    return { version: '1.0.3' };
  }
}
