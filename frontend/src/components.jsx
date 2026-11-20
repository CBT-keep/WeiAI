import { useEffect, useRef, useState } from 'react'
import { Camera, ChevronRight, Heart, ImageOff, MapPin, MessageCircle, Star, Ticket, X, Zap } from 'lucide-react'
import { imageUrls, storedImage } from './api'

const currency = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 })

export function Photo({ value, alt = '', className = '', eager = false }) {
  const source = imageUrls(value)[0]
  const [failedSource, setFailedSource] = useState(null)
  return source && failedSource !== source
    ? <img className={'photo ' + className} src={source} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={() => setFailedSource(source)} />
    : <div className={'photo missing ' + className}><ImageOff size={24} aria-hidden="true" /></div>
}

export function Notice({ children, type = '', action }) {
  return <div className={'notice ' + type} role={type === 'error' ? 'alert' : 'status'}>{children}{action}</div>
}

export function Dataset({ rows, loading, error, retry, more, empty = '暂时没有内容。', children }) {
  return <>
    {rows.length > 0 && children}
    {loading && <Notice>加载中…</Notice>}
    {!loading && error && <Notice type="error" action={<button className="text-button" onClick={retry}>重试</button>}>{error}</Notice>}
    {!loading && !error && !rows.length && <Notice>{empty}</Notice>}
    {!loading && !error && more && <button className="button load-more" onClick={more}>加载更多</button>}
  </>
}

export function ShopCard({ shop, category }) {
  return <article className="card">
    <a className="card-link" href={'#/shop/' + shop.id}>
      <div className="card-image"><Photo value={shop.images} />{category && <span className="photo-tag">{category}</span>}</div>
      <div className="card-body">
        <h3>{shop.name}</h3>
        <div className="shop-meta"><span className="rating"><Star size={13} fill="currentColor" /> {shop.score > 0 ? (shop.score / 10).toFixed(1) : '暂无评分'}</span>
          {shop.area && <span className="area"><MapPin size={13} />{shop.area}</span>}</div>
        {shop.avgPrice != null && <p className="price">¥{shop.avgPrice}<span> / 人</span></p>}
      </div>
    </a>
  </article>
}

export function NoteCard({ note, onOpen, onLike, pending, liked }) {
  return <article className="card">
    <button className="note-cover" onClick={() => onOpen(note)}>
      <div className="card-image"><Photo value={note.images} /></div>
      <h3>{note.title}</h3>
    </button>
    <div className="note-meta">
      <span className="author"><span className="avatar">{(note.name || '我')[0]}</span>{note.name || '我的笔记'}</span>
      <button className={'icon-button like ' + (liked ? 'liked' : '')} aria-label={'点赞 ' + note.title} aria-pressed={liked} disabled={pending || liked} onClick={() => onLike(note)}><Heart size={15} fill={liked ? 'currentColor' : 'none'} />{note.liked || 0}</button>
      <span className="comment-count" title="评论数"><MessageCircle size={14} />{note.comments || 0}</span>
    </div>
  </article>
}

export function VoucherCard({ voucher, onOrder, pending, ordered, compact = false }) {
  const timed = Number(voucher.type) === 1
  const begin = timed ? Date.parse(voucher.beginTime) : NaN
  const end = timed ? Date.parse(voucher.endTime) : NaN
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const boundary = [begin, end].filter((time) => time > now).sort((a, b) => a - b)[0]
    if (!boundary) return
    const timer = setTimeout(() => setNow(Date.now()), Math.min(2147483647, Math.max(0, boundary - Date.now())))
    return () => clearTimeout(timer)
  }, [begin, end, now])
  const early = begin > now
  const expired = end <= now
  const soldOut = timed && voucher.stock != null && voucher.stock <= 0
  const label = ordered ? '已抢购' : expired ? '已结束' : early ? '未开始' : soldOut ? '已抢完' : '抢购'
  const value = (cents) => currency.format(cents / 100)
  return <article className={'voucher ' + (compact ? 'compact' : '')}>
    <div className="voucher-icon"><Ticket size={19} /></div>
    <div className="voucher-content">
      <h3>{voucher.title}</h3>
      {voucher.subTitle && <p>{voucher.subTitle}</p>}
      <div className="voucher-price"><strong>¥{value(voucher.payValue)}</strong>{voucher.actualValue > voucher.payValue && <del>¥{value(voucher.actualValue)}</del>}</div>
      {!compact && voucher.rules && <p className="voucher-rules">{voucher.rules}</p>}
      {!compact && timed && voucher.stock != null && <p>剩余 {voucher.stock} 张</p>}
    </div>
    {timed
      ? <button className="grab" disabled={pending || ordered || expired || early || soldOut} onClick={() => onOrder(voucher)}>{pending ? '提交中' : label}</button>
      : <span className="regular">到店优惠</span>}
  </article>
}

export function VoucherRail({ rows, loading, error, retry, order, orders, ordering }) {
  return <aside className="rail">
    <div className="rail-heading"><span className="bolt"><Zap size={17} /></span><h2>限时好券</h2></div>
    {loading && <Notice>加载中…</Notice>}
    {error && <Notice type="error" action={<button className="text-button" onClick={retry}>重试</button>}>{error}</Notice>}
    {!loading && !error && !rows.length && <Notice>暂无优惠券。</Notice>}
    {rows.slice(0, 3).map((voucher) => <VoucherCard key={voucher.id} voucher={voucher} onOrder={order} ordered={orders.includes(voucher.id)} pending={ordering.includes(voucher.id)} compact />)}
    <a className="all-deals" href="#/deals">查看全部优惠 <ChevronRight size={16} /></a>
  </aside>
}

export function Modal({ title, onClose, children, wide = false }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => { if (element.open) element.close() }
  }, [])
  return <dialog ref={dialog} className={wide ? 'wide' : ''} aria-label={title} onClose={onClose}
    onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="dialog-inner">
      <div className="dialog-heading"><h2>{title}</h2><button className="icon-button" aria-label="关闭" onClick={onClose}><X size={22} /></button></div>
      {children}
    </div>
  </dialog>
}

export function LoginForm({ service, demo, onLogin }) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [expires, setExpires] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const seconds = Math.max(0, Math.ceil((expires - now) / 1000))
  const validPhone = /^1\d{10}$/.test(phone.trim())
  useEffect(() => {
    if (!seconds) return
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [seconds])
  async function submit(event) {
    event.preventDefault()
    if (!validPhone || !code.trim() || busy) return
    setBusy('login')
    setError('')
    try { onLogin(await service.login(phone.trim(), code.trim())) }
    catch (failure) { setError(failure.message) }
    finally { setBusy('') }
  }
  async function sendCode() {
    setBusy('send')
    setError('')
    setMessage('')
    try {
      await service.sendCode(phone.trim())
      setNow(Date.now())
      setExpires(Date.now() + 60000)
      setMessage(demo ? '演示验证码为 123456。' : '验证码请求成功。')
    } catch (failure) { setError(failure.message) }
    finally { setBusy('') }
  }

  return <form className="stack-form" onSubmit={submit}>
    <label>手机号<input inputMode="tel" placeholder="输入 11 位手机号" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={11} required /></label>
    <label>验证码</label>
    <div className="code-row"><input aria-label="验证码" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={6} />
      <button type="button" className="button" disabled={!validPhone || !!busy || seconds > 0} onClick={sendCode}>{seconds ? seconds + ' 秒后重发' : '获取验证码'}</button></div>
    {demo && !message && <p className="muted">演示可使用任意 11 位有效格式手机号和验证码 123456。</p>}
    {message && <Notice>{message}</Notice>}
    {error && <Notice type="error">{error}</Notice>}
    <button className="primary" disabled={!validPhone || !code.trim() || !!busy}>{busy === 'login' ? '登录中…' : '登录'}</button>
  </form>
}

export function ComposeForm({ service, initialShops, onPublish }) {
  const [shops, setShops] = useState(initialShops)
  const [term, setTerm] = useState('')
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const filesRef = useRef(photos)
  filesRef.current = photos
  useEffect(() => () => {
    for (const photo of filesRef.current) URL.revokeObjectURL(photo.preview)
  }, [])

  async function search() {
    setBusy('search')
    setError('')
    try { setShops(await service.shops(1, { name: term.trim() }) || []) }
    catch (failure) { setError(failure.message) }
    finally { setBusy('') }
  }
  async function publish(event) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    const title = String(data.get('title')).trim()
    const content = String(data.get('content')).trim()
    const shopId = Number(data.get('shopId'))
    if (!title || !content || !shopId) { setError('请选择商户，并填写标题与正文。'); return }
    setBusy('publish')
    setError('')
    const uploaded = []
    let publishing = false
    try {
      for (const photo of photos) uploaded.push(await service.upload(photo.file))
      publishing = true
      const id = await service.publish({ shopId, title, content, images: uploaded.map(storedImage).join(',') })
      onPublish(id)
    } catch (failure) {
      if (!publishing) await Promise.allSettled(uploaded.map((path) => service.deleteImage(path)))
      setError(failure.message)
    } finally { setBusy('') }
  }
  function selectPhotos(event) {
    const selected = [...event.target.files].slice(0, 9 - photos.length)
    setPhotos([...photos, ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) }))])
    event.target.value = ''
  }
  function removePhoto(photo) {
    URL.revokeObjectURL(photo.preview)
    setPhotos(photos.filter((item) => item !== photo))
  }
  return <form className="stack-form" onSubmit={publish}>
    <label>关联商户</label>
    <div className="code-row"><input aria-label="查找商户" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="输入店名查找" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (!busy) search() } }} />
      <button className="button" disabled={!!busy} type="button" onClick={search}>查找</button></div>
    <select name="shopId" required aria-label="选择商户" key={shops.map((shop) => shop.id).join(',')} defaultValue=""><option value="" disabled>{shops.length ? '选择商户' : '暂无匹配商户'}</option>{shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}</select>
    <label>标题<input name="title" placeholder="给这次探店取个标题" maxLength={100} required /></label>
    <label>探店心得<textarea name="content" placeholder="写下值得分享的细节…" rows={5} maxLength={2000} required /></label>
    <div className="upload-row">
      {photos.map((photo) => <div className="thumbnail" key={photo.preview}><img src={photo.preview} alt="" /><button type="button" disabled={!!busy} aria-label="移除图片" onClick={() => removePhoto(photo)}><X size={15} /></button></div>)}
      {photos.length < 9 && <label className="upload"><Camera size={20} />添加照片<input type="file" accept="image/*" multiple onChange={selectPhotos} disabled={!!busy} /></label>}
    </div>
    {error && <Notice type="error">{error}</Notice>}
    <button className="primary" disabled={!!busy}>{busy === 'publish' ? '正在发布…' : '发布笔记'}</button>
  </form>
}
