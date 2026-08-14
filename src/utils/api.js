export function getApiBase() {
  const base = import.meta.env.VITE_API_BASE
  if (!base) return ''
  return String(base).replace(/\/$/, '')
}

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : '/' + path
  return getApiBase() + p
}

export async function apiFetch(path, options = {}) {
  const headers = Object.assign({}, options.headers || {})
  const token = localStorage.getItem('token')
  if (token && !headers.Authorization) {
    headers.Authorization = 'Bearer ' + token
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  return fetch(apiUrl(path), Object.assign({}, options, { headers }))
}
