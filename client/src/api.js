const TOKEN_KEY = 'admin_token';

export const getToken = () => { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* noop */ } };

export async function api(path, { method = 'GET', body, auth = false, form } = {}) {
  const headers = {};
  if (auth) headers.Authorization = `Bearer ${getToken()}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`/api${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (auth && res.status === 401 && path !== '/admin/login') { setToken(null); window.location.href = '/admin'; }
    throw Object.assign(new Error(data.error || 'Error'), { status: res.status });
  }
  return data;
}
