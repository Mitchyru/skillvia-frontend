import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Accept': 'application/json' },
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sv_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  if (!(cfg.data instanceof FormData)) {
    cfg.headers['Content-Type'] = 'application/json'
  }
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sv_token')
      localStorage.removeItem('sv_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
