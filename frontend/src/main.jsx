import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import {
  Bike, BookOpen, Camera, ChevronRight, CircleUserRound, Coffee, Compass,
  Dumbbell, Film, Flame, Heart, LayoutGrid, LogIn, Map, MapPin, PenLine, Scissors,
  Search, Store, Ticket, Utensils, X,
} from 'lucide-react'
import { api, imageUrls } from './api'
import { demoApi } from './demo'
import { useData, usePages } from './data'
import { ComposeForm, Dataset, LoginForm, Modal, NoteCard, Notice, Photo, ShopCard, VoucherCard, VoucherRail } from './components'
import './style.css'

const empty = []
const nativeTransitions = typeof document.startViewTransition === 'function'
const nav = [
  { path: '/', icon: Compass, label: '首页发现' },
  { path: '/shops', icon: Store, label: '找好店' },
  { path: '/deals', icon: Ticket, label: '限时优惠' },
  { path: '/notes', icon: BookOpen, label: '探店笔记' },
  { path: '/me', icon: CircleUserRound, label: '我的' },
]
const icons = [
  [/美食|餐|火锅/, Utensils, 'rose'], [/咖啡|甜点|茶/, Coffee, 'peach'], [/休闲|玩乐|电影|KTV/i, Film, 'violet'],
  [/健身|运动/, Dumbbell, 'green'], [/丽人|美发|美容/, Scissors, 'pink'], [/出游|周边|旅行|游玩/, Bike, 'blue'],
]

function categories(type) {
  const [, Icon = LayoutGrid, color = 'peach'] = icons.find(([pattern]) => pattern.test(type.name)) || []
  return [Icon, color]
}

function readLocation() {
  const [path, search] = (location.hash.slice(1) || '/').split('?')
  return { path, query: new URLSearchParams(search) }
}

function go(path, params = {}) {
  const query = new URLSearchParams(params).toString()
  location.hash = path + (query ? '?' + query : '')
}

function useLocation() {
  const [current, setCurrent] = useState(readLocation)
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = (event) => {
      if (event.newURL !== location.href) return
      const update = () => {
        setCurrent(readLocation())
        window.scrollTo(0, 0)
      }
      if (nativeTransitions && !reducedMotion.matches) {
        const transition = document.startViewTransition(() => flushSync(update))
        // Rapid navigation can skip a snapshot while still committing the route update.
        transition.ready.catch(() => {})
      } else {
        update()
      }
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  return current
}

function SearchForm({ initial, search }) {
  const [term, setTerm] = useState(initial)
  return <form role="search" className="search-bar" onSubmit={(event) => { event.preventDefault(); search(term.trim()) }}>
    <Search size={18} aria-hidden="true" />
    <input aria-label="搜索店名" placeholder="搜索店名" value={term} onChange={(event) => setTerm(event.target.value)} />
    {term && <button type="button" aria-label="清空搜索" onClick={() => setTerm('')}><X size={17} /></button>}
    <button type="submit" className="search-submit">搜索</button>
  </form>
}

function TypePicker({ rows, active = '', home = false }) {
  return <div className={'category-list ' + (home ? 'large' : 'pills')}>
    {rows.map((type) => {
      const [Icon, color] = categories(type)
      return <a className={'category ' + (String(type.id) === active ? 'picked' : '')} key={type.id} href={'#/shops?type=' + type.id}>
        <span className={'type-icon ' + color}><Icon size={home ? 23 : 16} strokeWidth={1.85} /></span>{type.name}
      </a>
    })}
    <a className={'category ' + (!home && !active ? 'picked' : '')} href="#/shops"><span className="type-icon neutral"><LayoutGrid size={home ? 21 : 16} /></span>全部分类</a>
  </div>
}

function Hero({ demo }) {
  return <section className="hero" aria-label="城市生活指南">
    <div className="hero-content">
      <div className="hero-place"><MapPin size={15} /> {demo ? '成都' : '城市生活指南'}</div>
      <h1>今天，去哪儿？</h1>
      <p>翻翻城里的好店和探店笔记。</p>
      <a className="hero-button" href="#/shops"><Compass size={17} /> 找好店</a>
    </div>
  </section>
}

function ShopGrid({ rows, types }) {
  return <div className="card-grid">
    {rows.map((shop) => <ShopCard shop={shop} category={types.find((type) => String(type.id) === String(shop.typeId))?.name} key={shop.id} />)}
  </div>
}

function Notes({ service, interaction, own = false, preview = false }) {
  const load = useCallback((page, signal) => own ? service.myBlogs(page, signal) : service.hot(page, signal), [service, own])
  const data = usePages(load, 10)
  const rows = preview ? data.rows.slice(0, 3) : data.rows
  return <Dataset {...data} more={preview ? undefined : data.more} empty="还没有探店笔记。">
    <div className="card-grid">{rows.map((note) => <NoteCard key={note.id}
      note={interaction.getNote(note)} onOpen={interaction.openNote} onLike={interaction.like}
      pending={interaction.liking.includes(note.id)} liked={Boolean(note.isLike || interaction.liked[note.id])} />)}</div>
  </Dataset>
}

function Home({ service, demo, types, controls, interaction, refresh }) {
  const load = useCallback((page, signal) => service.shops(page, { signal }), [service])
  const shops = usePages(load, 10)
  const railShops = shops.rows.slice(0, 3)
  const shopKeys = railShops.map((shop) => shop.id).join(',')
  const fetchVouchers = useCallback(async (signal) => {
    if (!shopKeys) return empty
    const results = await Promise.allSettled(shopKeys.split(',').map((id) => service.vouchers(id, signal)))
    if (results.every((result) => result.status === 'rejected')) throw results[0].reason
    return results.flatMap((result) => result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : [])
      .filter((voucher) => Number(voucher.type) === 1)
  }, [service, shopKeys])
  const offers = useData(fetchVouchers, empty)
  return <>
    <Hero demo={demo} />
    <div className="category-panel">
      <TypePicker rows={types.value.slice(0, 6)} home />
      {types.error && <Notice type="error" action={<button className="text-button" onClick={types.retry}>重试</button>}>{types.error}</Notice>}
    </div>
    <div className="home-columns">
      <div>
        <div className="section-heading"><h2><Flame size={23} /> 发现好店</h2><a href="#/shops">查看全部 <ChevronRight size={16} /></a></div>
        <Dataset {...shops} more={undefined} empty="暂时没有商户。"><ShopGrid rows={shops.rows.slice(0, 3)} types={types.value} /></Dataset>
        <div className="section-heading notes-heading"><h2><Camera size={22} /> 热门探店笔记</h2><a href="#/notes">全部笔记 <ChevronRight size={16} /></a></div>
        <Notes service={service} interaction={interaction} preview key={refresh} />
      </div>
      <VoucherRail rows={offers.value} loading={shops.loading || offers.loading} error={offers.error || shops.error}
        retry={shops.error ? shops.retry : offers.retry} {...controls} />
    </div>
  </>
}

function Shops({ service, types, typeId, term }) {
  const load = useCallback((page, signal) => service.shops(page, { typeId, name: term || undefined, signal }), [service, typeId, term])
  const shops = usePages(load, typeId ? 5 : 10)
  return <>
    <div className="page-heading"><h1>{term ? '搜索结果' : '找好店'}</h1>{term && <p>搜索店名「{term}」</p>}</div>
    {!term && <TypePicker rows={types.value} active={typeId} />}
    {!term && types.error && <Notice type="error" action={<button className="text-button" onClick={types.retry}>重试</button>}>{types.error}</Notice>}
    <Dataset {...shops} empty="没有找到符合条件的商户。"><ShopGrid rows={shops.rows} types={types.value} /></Dataset>
  </>
}

function ShopPage({ service, id, types, controls }) {
  const loadShop = useCallback((signal) => service.shop(id, signal), [service, id])
  const loadVouchers = useCallback((signal) => service.vouchers(id, signal), [service, id])
  const shop = useData(loadShop)
  const vouchers = useData(loadVouchers, empty)
  return <>
    <a className="back-link" href="#/shops">所有商户 <ChevronRight size={15} /></a>
    <Dataset rows={shop.value ? [shop.value] : empty} {...shop} empty="这家商户目前不可用。">
      {shop.value && <div className="shop-detail">
        <Photo value={shop.value.images} alt={shop.value.name} eager />
        <div className="shop-summary">
          <span className="muted">{types.value.find((type) => String(type.id) === String(shop.value.typeId))?.name}</span>
          <h1>{shop.value.name}</h1>
          {shop.value.score > 0 && <p className="rating">★ {(shop.value.score / 10).toFixed(1)} 分</p>}
          {shop.value.avgPrice != null && <p>¥{shop.value.avgPrice} / 人</p>}
          {shop.value.address && <p className="inline"><MapPin size={17} />{shop.value.address}</p>}
          {shop.value.openHours && <p>营业时间 {shop.value.openHours}</p>}
        </div>
      </div>}
    </Dataset>
    {shop.value && <>
      <div className="section-heading"><h2><Ticket size={22} /> 店铺优惠</h2></div>
      <VoucherList data={vouchers} controls={controls} />
    </>}
  </>
}

function VoucherList({ data, controls }) {
  return <Dataset rows={data.value} {...data} empty="该商户暂无优惠。">
    <div className="voucher-list">{data.value.map((voucher) => <VoucherCard voucher={voucher} key={voucher.id}
      onOrder={controls.order} ordered={controls.orders.includes(voucher.id)} pending={controls.ordering.includes(voucher.id)} />)}</div>
  </Dataset>
}

function Deals({ service, controls }) {
  const load = useCallback((page, signal) => service.shops(page, { signal }), [service])
  const shops = usePages(load, 10)
  const [selection, setSelection] = useState('')
  const selected = selection || shops.rows[0]?.id
  const loadVouchers = useCallback((signal) => selected ? service.vouchers(selected, signal) : empty, [selected, service])
  const vouchers = useData(loadVouchers, empty)
  return <>
    <div className="page-heading"><h1>限时优惠</h1><p>按商户查看优惠券和秒杀活动。</p></div>
    <Dataset {...shops} empty="暂无商户。">
      <label className="deal-select">选择商户<select value={selected || ''} onChange={(event) => setSelection(event.target.value)}>
        {shops.rows.map((shop) => <option value={shop.id} key={shop.id}>{shop.name}</option>)}
      </select></label>
    </Dataset>
    {selected && <VoucherList data={vouchers} controls={controls} />}
  </>
}

function Account({ service, user, login, logout, interaction, refresh }) {
  const load = useCallback((signal) => user?.id ? service.userInfo(user.id, signal) : null, [service, user?.id])
  const profile = useData(load)
  return <>
    <div className="page-heading"><h1>我的</h1></div>
    {user ? <>
      <div className="account-box"><div className="big-avatar"><Photo value={user.icon} />{!user.icon && <span>{(user.nickName || '我')[0]}</span>}</div>
        <div><h2>{user.nickName || '唯爱用户'}</h2>{profile.value?.introduce && <p>{profile.value.introduce}</p>}</div>
        <button className="button" onClick={logout}>退出登录</button></div>
      <div className="section-heading"><h2>我的探店笔记</h2></div>
      <Notes key={refresh} service={service} interaction={interaction} own />
    </> : <div className="account-box"><p>登录后查看你的探店笔记。</p><button className="primary" onClick={login}>登录</button></div>}
  </>
}

function NoteDetail({ note, interaction, onClose }) {
  const [selected, setSelected] = useState(0)
  const photos = (note.images || '').split(',').map((url) => url.trim()).filter(Boolean)
  const content = (note.content || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]*>/g, '')
  return <Modal title={note.title} onClose={onClose} wide>
    {photos.length > 0 && <Photo value={photos[selected]} className="note-detail-photo" />}
    {photos.length > 1 && <div className="note-gallery" aria-label="笔记图片">
      {imageUrls(note.images).map((source, index) => <button key={index} className="button" aria-pressed={selected === index}
        aria-label={'查看图片 ' + (index + 1)} onClick={() => setSelected(index)}>
        <img src={source} alt="" loading="lazy" />
      </button>)}
    </div>}
    <p className="muted">{[note.name, note.createTime?.slice(0, 10)].filter(Boolean).join(' · ')}</p>
    <p className="note-text">{content}</p>
    <div className="detail-actions">
      <button className="button" onClick={() => interaction.like(note)} disabled={Boolean(note.isLike || interaction.liked[note.id] || interaction.liking.includes(note.id))}><Heart size={17} /> 点赞 {note.liked || 0}</button>
      {note.shopId && <a className="button" href={'#/shop/' + note.shopId} onClick={onClose}><Store size={17} /> 查看关联商户</a>}
    </div>
  </Modal>
}

function App() {
  const { path, query } = useLocation()
  const [demo, setDemo] = useState(() => {
    const mode = new URLSearchParams(location.search).get('mode')
    return mode ? mode === 'demo' : import.meta.env.VITE_DEMO_MODE === 'true'
  })
  const service = demo ? demoApi : api
  const [user, setUser] = useState(null)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [liked, setLiked] = useState({})
  const [liking, setLiking] = useState([])
  const [orders, setOrders] = useState([])
  const [ordering, setOrdering] = useState([])
  const [refresh, setRefresh] = useState(0)
  const session = useRef(0)
  const inFlight = useRef({ likes: new Set(), orders: new Set() })
  const loadTypes = useCallback((signal) => service.types(signal), [service])
  const types = useData(loadTypes, empty)
  const status = (message, error = false) => setToast({ message, error })
  useEffect(() => {
    const controller = new AbortController()
    const initialSession = session.current
    service.me(controller.signal).then((account) => {
      if (!controller.signal.aborted && session.current === initialSession) setUser(account || null)
    }, () => {})
    return () => controller.abort()
  }, [service])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5500)
    return () => clearTimeout(timer)
  }, [toast])

  function changeMode() {
    const enabled = !demo
    const url = new URL(location.href)
    url.searchParams.set('mode', enabled ? 'demo' : 'live')
    url.hash = '/'
    location.assign(url)
  }
  function requireUser(kind) {
    setModal(user ? { kind } : { kind: 'login', next: kind })
  }
  async function like(note) {
    const pending = inFlight.current.likes
    if (pending.has(note.id) || liked[note.id] || note.isLike) return
    pending.add(note.id)
    setLiking((previous) => [...previous, note.id])
    try {
      await service.like(note.id)
      setLiked((previous) => ({ ...previous, [note.id]: (note.liked || 0) + 1 }))
    } catch (error) { status(error.message, true) }
    finally {
      pending.delete(note.id)
      setLiking((previous) => previous.filter((id) => id !== note.id))
    }
  }
  async function order(voucher) {
    if (!user) { setModal({ kind: 'login' }); return }
    const pending = inFlight.current.orders
    if (pending.has(voucher.id) || orders.includes(voucher.id)) return
    const currentSession = session.current
    pending.add(voucher.id)
    setOrdering((previous) => [...previous, voucher.id])
    try {
      const id = await service.seckill(voucher.id)
      if (session.current === currentSession) setOrders((previous) => [...previous, voucher.id])
      status(id != null ? '抢购成功，订单号 ' + id : '抢购请求成功。')
    } catch (error) { status(error.message, true) }
    finally {
      pending.delete(voucher.id)
      setOrdering((previous) => previous.filter((id) => id !== voucher.id))
    }
  }
  async function logout() {
    try {
      await service.logout()
      session.current += 1
      setUser(null)
      setOrders([])
      status('已退出登录。')
    }
    catch (error) { status(error.message, true) }
  }

  const interaction = {
    openNote: (note) => setModal({ kind: 'note', note }), like, liked, liking,
    getNote: (note) => ({ ...note, liked: liked[note.id] ?? note.liked }),
  }
  const controls = { order, orders, ordering }
  const term = query.get('q') || ''
  const typeId = query.get('type') || ''
  const active = path.startsWith('/shop/') ? '/shops' : path
  const close = () => setModal(null)
  const login = () => setModal({ kind: 'login' })

  let page
  if (path === '/shops') page = <Shops key={demo + '|' + typeId + '|' + term} {...{ service, types, typeId, term }} />
  else if (/^\/shop\/\d+$/.test(path)) page = <ShopPage key={path} id={path.split('/')[2]} {...{ service, types, controls }} />
  else if (path === '/deals') page = <Deals {...{ service, controls }} />
  else if (path === '/notes') page = <><div className="page-heading"><h1>探店笔记</h1><p>来自城市里的探店记录。</p></div><Notes key={refresh} {...{ service, interaction }} /></>
  else if (path === '/me') page = <Account {...{ service, user, login, logout, interaction, refresh }} />
  else page = <Home {...{ service, demo, types, controls, interaction, refresh }} />

  return <div className="app">
    <aside className="sidebar">
      <a className="brand" href="#/" aria-label="唯爱首页"><span className="brand-mark"><Heart strokeWidth={1.7} size={22} /></span><span>唯爱<small>城市生活指南</small></span></a>
      <nav aria-label="主导航">{nav.map(({ path: to, icon: Icon, label }) => <a key={to} className={active === to ? 'active' : ''} aria-current={active === to ? 'page' : undefined} href={'#' + to} aria-label={label}><Icon size={20} strokeWidth={1.8} /><span>{label}</span></a>)}</nav>
      <div className="sidebar-bottom">
        <div className="mode-card"><Map size={17} /><div><strong>{demo ? '演示模式' : '后端模式'}</strong><button onClick={changeMode}>{demo ? '切换到后端' : '预览演示数据'}</button></div></div>
      </div>
    </aside>
    <div className="shell">
      <header className="topbar">
        <a className="brand compact-brand" href="#/" aria-label="唯爱首页"><span className="brand-mark"><Heart size={17} strokeWidth={1.7} /></span><span>唯爱</span></a>
        <SearchForm key={term} initial={term} search={(value) => go('/shops', value ? { q: value } : {})} />
        <div className="top-actions">
          <button className="primary write" onClick={() => requireUser('compose')} aria-label="写探店笔记"><PenLine size={17} /><span>写笔记</span></button>
          <button className="profile-button" onClick={user ? () => go('/me') : login} aria-label={user ? '我的主页' : '登录'}>
            {user ? <CircleUserRound size={19} /> : <LogIn size={18} />}<span>{user?.nickName || '登录'}</span>
          </button>
        </div>
      </header>
      <main className="main">
        <div key={path + '?' + query} className={nativeTransitions ? undefined : 'route-fade'}>{page}</div>
      </main>
      <footer><span>唯爱 · 城市生活指南</span><button className="text-button mobile-mode" onClick={changeMode}>{demo ? '演示模式 · 切换到后端' : '预览演示数据'}</button></footer>
    </div>
    {modal?.kind === 'login' && <Modal title="手机号登录" onClose={close}>
      <LoginForm service={service} demo={demo} onLogin={(account) => {
        session.current += 1
        setUser(account)
        setModal(modal.next ? { kind: modal.next } : null)
        status('登录成功。')
      }} />
    </Modal>}
    {modal?.kind === 'compose' && <Modal title="写探店笔记" onClose={close} wide>
      <ComposeForm service={service} initialShops={empty} onPublish={() => { close(); setRefresh((value) => value + 1); go('/me'); status('笔记已发布。') }} />
    </Modal>}
    {modal?.kind === 'note' && <NoteDetail note={interaction.getNote(modal.note)} interaction={interaction} onClose={close} />}
    {toast && <div className={'toast ' + (toast.error ? 'error' : '')} role={toast.error ? 'alert' : 'status'}>{toast.message}<button className="icon-button" aria-label="关闭提示" onClick={() => setToast(null)}><X size={16} /></button></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
