export const demoTypes = [
  { id: 1, name: '美食餐厅' }, { id: 2, name: '咖啡甜点' }, { id: 3, name: '休闲玩乐' },
  { id: 4, name: '运动健身' }, { id: 5, name: '丽人美发' }, { id: 6, name: '周边出游' },
]

export const demoShops = [
  { id: 1, typeId: 1, name: '巷口·炭火小馆', area: '镋钯街', address: '锦江区镋钯街 21 号', score: 48, avgPrice: 86, images: '/media/restaurant.jpg', openHours: '11:30–22:00' },
  { id: 2, typeId: 2, name: '午后公园咖啡', area: '玉林', address: '武侯区玉林西路 18 号', score: 47, avgPrice: 36, images: '/media/cafe.jpg', openHours: '09:00–19:30' },
  { id: 3, typeId: 1, name: '野菜市场 Brunch', area: '东郊记忆', address: '成华区建设南支路 4 号', score: 46, avgPrice: 79, images: '/media/brunch.jpg', openHours: '10:00–20:30' },
  { id: 4, typeId: 3, name: '夜色放映厅', area: '望平街', address: '成华区望平街 12 号', score: 48, avgPrice: 58, images: '/media/night.jpg', openHours: '18:00–01:00' },
]

const photo = (shopId) => demoShops.find((shop) => shop.id === shopId).images

export const demoNotes = [
  { id: 101, shopId: 1, name: '栗子吃不饱', title: '镋钯街里，藏了一家烟火气小馆', images: photo(1), liked: 128, comments: 12, content: '傍晚走进镋钯街，顺着炭火味找到这家小馆。坐窗边很舒服，炭烤蔬菜和梅子气泡水值得点一份。', createTime: '2026-11-18' },
  { id: 102, shopId: 2, name: '椰椰的日记', title: '在玉林，找到了暂停键', images: photo(2), liked: 96, comments: 8, content: '一间适合坐到天黑的咖啡馆。店里后院有太阳的时候，点一杯冷萃就够了。', createTime: '2026-11-17' },
  { id: 103, shopId: 3, name: '周末不赖床', title: '带上好胃口，去吃一顿早午餐', images: photo(3), liked: 73, comments: 5, content: '周末去东郊记忆顺路吃了早午餐。菜很新鲜，酸种面包配温沙拉刚刚好。', createTime: '2026-11-16' },
  { id: 104, shopId: 4, name: '小城夜游', title: '夜里去望平街，看一部老电影', images: photo(4), liked: 54, comments: 3, content: '看完还能沿河慢慢走一圈，夜里的望平街很安静。', createTime: '2026-11-15' },
]

const until = (days) => new Date(Date.now() + days * 86400000).toISOString()
export const demoVouchers = [
  { id: 51, shopId: 1, title: '双人炭火烤肉套餐', subTitle: '巷口·炭火小馆', payValue: 8900, actualValue: 15800, type: 1, stock: 18, beginTime: until(-1), endTime: until(3), rules: '请提前预约。到店出示订单。' },
  { id: 52, shopId: 2, title: '手冲咖啡双杯券', subTitle: '午后公园咖啡', payValue: 2900, actualValue: 5600, type: 1, stock: 26, beginTime: until(-1), endTime: until(4), rules: '营业时间内可用。' },
  { id: 53, shopId: 3, title: '招牌早午餐套餐', subTitle: '野菜市场 Brunch', payValue: 5900, actualValue: 9900, type: 1, stock: 12, beginTime: until(-1), endTime: until(2), rules: '每人限购一份。' },
]

const user = { id: 99, nickName: '唯爱体验官' }
let activeUser = null
let nextBlog = 105
let nextOrder = 1000
let personalNotes = []
const uploads = new Set()

function page(items, current, size) {
  return items.slice((current - 1) * size, current * size)
}

export const demoApi = {
  types: async () => demoTypes,
  shops: async (current, { typeId, name } = {}) => page(demoShops.filter((shop) =>
    (!typeId || shop.typeId === Number(typeId)) && (!name || shop.name.toLowerCase().includes(name.toLowerCase()))), current, typeId ? 5 : 10),
  shop: async (id) => demoShops.find((shop) => shop.id === Number(id)),
  vouchers: async (shopId) => demoVouchers.filter((voucher) => voucher.shopId === Number(shopId)),
  hot: async (current) => page([...personalNotes.slice().reverse(), ...demoNotes], current, 10),
  like: async (id) => {
    const note = [...personalNotes, ...demoNotes].find((item) => item.id === id)
    if (note) { note.liked += 1; note.isLike = true }
  },
  sendCode: async () => {},
  login: async (_phone, code) => {
    if (code !== '123456') throw new Error('请使用演示验证码 123456。')
    activeUser = user
    return user
  },
  logout: async () => { activeUser = null },
  me: async () => activeUser,
  userInfo: async () => ({ introduce: '在城市里吃饭、散步和拍照。' }),
  myBlogs: async (current) => page(personalNotes.slice().reverse(), current, 10),
  seckill: async (id) => {
    const voucher = demoVouchers.find((item) => item.id === id)
    if (!activeUser || !voucher || !voucher.stock) throw new Error('当前优惠不可抢购。')
    voucher.stock -= 1
    return 'DEMO-' + ++nextOrder
  },
  upload: async (file) => {
    const url = URL.createObjectURL(file)
    uploads.add(url)
    return url
  },
  deleteImage: async (url) => {
    uploads.delete(url)
    URL.revokeObjectURL(url)
  },
  publish: async (body) => {
    // Keep only URLs created by the demo uploader during this session.
    const images = body.images.split(',').filter((path) => uploads.has(path)).join(',')
    const note = { ...body, images, id: nextBlog++, name: user.nickName, liked: 0, comments: 0, createTime: new Date().toISOString() }
    personalNotes.push(note)
    return note.id
  },
}
