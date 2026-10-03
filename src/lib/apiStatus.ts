export async function checkApiHealth(): Promise<boolean> {
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (!apiUrl || import.meta.env.VITE_USE_MOCKS === 'true') {
    return true;
  }

  try {
    const res = await fetch(`${apiUrl}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
