const base = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')
const imageBase = (import.meta.env.VITE_IMAGE_BASE || '').replace(/\/$/, '')
const tokenKey = 'weiai.hmdp.token'

export function setToken(value) {
  if (typeof value === 'string' && value) localStorage.setItem(tokenKey, value)
  else localStorage.removeItem(tokenKey)
}

export function imageUrls(value) {
  return (value || '').split(',').map((url) => url.trim()).filter(Boolean).map((url) => {
    if (/^(https?:\/\/|\/media\/|blob:)/i.test(url)) return url
    const path = '/' + url.replace(/^\/+/, '')
    return imageBase + (path.startsWith('/imgs/') ? path : '/imgs' + path)
  })
}

export function storedImage(value) {
  const url = String(value)
  if (/^(https?:\/\/|blob:)/i.test(url) || url.startsWith('/imgs/')) return url
  return '/imgs/' + url.replace(/^\/+/, '')
}

// A Snowflake order id can exceed Number.MAX_SAFE_INTEGER in a raw JSON response.
function parseOrderId(raw) {
  return JSON.parse(raw.replace(/("data"\s*:\s*)(\d{16,})(?=\s*[,}])/g, '$1"$2"'))
}

async function request(path, { method = 'GET', query, body, signal, orderId } = {}) {
  const params = new URLSearchParams(
    Object.entries(query || {}).filter(([, value]) => value != null),
  )
  const token = localStorage.getItem(tokenKey)
  const multipart = body instanceof FormData
  const headers = { Accept: 'application/json' }
  if (token) headers.authorization = token
  if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(base + path + (params.size ? '?' + params : ''), {
      method, headers, signal, credentials: 'same-origin',
      body: multipart || body === undefined ? body : JSON.stringify(body),
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error('无法连接后端，请确认 Spring Boot 服务已启动。')
  }
  if (response.status === 401) {
    setToken(null)
    throw new Error('登录已失效，请重新登录。')
  }
  let result
  try {
    result = orderId ? parseOrderId(await response.text()) : await response.json()
  } catch {
    throw new Error('后端返回了无法识别的响应（HTTP ' + response.status + '）。')
  }
  if (!response.ok || result?.success !== true) {
    throw new Error(result?.errorMsg || '请求失败（HTTP ' + response.status + '）。')
  }
  return result.data
}

const segment = (value) => encodeURIComponent(value)
export const api = {
  types: (signal) => request('/shop-type/list', { signal }),
  shops: (current, { typeId, name, signal } = {}) => typeId
    ? request('/shop/of/type', { query: { typeId, current }, signal })
    : request('/shop/of/name', { query: { name, current }, signal }),
  shop: (id, signal) => request('/shop/' + segment(id), { signal }),
  vouchers: (shopId, signal) => request('/voucher/list/' + segment(shopId), { signal }),
  seckill: (id) => request('/voucher-order/seckill/' + segment(id), { method: 'POST', orderId: true }),
  hot: (current, signal) => request('/blog/hot', { query: { current }, signal }),
  like: (id) => request('/blog/like/' + segment(id), { method: 'PUT' }),
  myBlogs: (current, signal) => request('/blog/of/me', { query: { current }, signal }),
  publish: (body) => request('/blog', { method: 'POST', body }),
  upload: (file) => {
    const body = new FormData()
    body.append('file', file)
    return request('/upload/blog', { method: 'POST', body })
  },
  deleteImage: (name) => request('/upload/blog/delete', { query: { name } }),
  sendCode: (phone) => request('/user/code', { method: 'POST', query: { phone } }),
  login: async (phone, code) => {
    setToken(await request('/user/login', { method: 'POST', body: { phone, code } }))
    return request('/user/me')
  },
  me: (signal) => request('/user/me', { signal }),
  userInfo: (id, signal) => request('/user/info/' + segment(id), { signal }),
  logout: async () => {
    await request('/user/logout', { method: 'POST' })
    setToken(null)
  },
}
