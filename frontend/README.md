# 唯爱 · 城市生活指南

基于 React + Vite 的本地生活前端。参考了[知光平台](https://github.com/sinkendlessly/zhiguang_platfrom/tree/master/zhiguang_fe-main)的导航、首页内容流和发布入口，并为商户浏览、团购优惠和探店笔记绘制了独立界面。

## 启动

使用 Node.js 22.12 或以上版本与 pnpm。

```bash
pnpm install
pnpm dev
```

- 后端模式使用 `http://localhost:5173/`，Vite 把同源 `/api` 请求转发给 `127.0.0.1:8081`，转发时去掉 `/api`。后端地址可在 `.env.local` 设置 `HMDP_BACKEND`。
- 演示模式使用 `http://localhost:5173/?mode=demo`。可以用任意有效格式的 11 位手机号与验证码 `123456` 体验登录、发布和抢券。演示操作只保存在当前页面会话中。
- `pnpm build` 输出 `dist/`。部署时把 `/api` 和 `/imgs` 交给同源反向代理，或用 `VITE_API_BASE` 和 `VITE_IMAGE_BASE` 指定地址。跨域 API 需要后端配置对应 CORS。
- 课程数据库图片以 `/imgs/` 为前缀。可用 `HMDP_IMAGE_SERVER` 在本地把这个路径代理到课程的 Nginx 静态站。附件只有建表和种子 SQL，图片服务缺失时卡片显示占位。上传还依赖后端 `SystemConstants.IMAGE_UPLOAD_DIR`，课程初始值是 Windows 路径。

## 接口对照

以提供的 `hm-dianping-init` 控制器为准。前端解析原有的 `{ success, errorMsg, data, total }` 格式。登录接口返回字符串令牌时，用原有的 `authorization` 请求头发送令牌。

| 页面功能 | Spring Boot 接口 |
| --- | --- |
| 商户分类和浏览 | `GET /shop-type/list`，`GET /shop/of/type?typeId=&current=` |
| 店名搜索和详情 | `GET /shop/of/name?name=&current=`，`GET /shop/{id}` |
| 券列表和秒杀 | `GET /voucher/list/{shopId}`，`POST /voucher-order/seckill/{id}` |
| 笔记流和点赞 | `GET /blog/hot?current=`，`PUT /blog/like/{id}` |
| 发布笔记 | `POST /upload/blog`（multipart 字段 `file`），`GET /upload/blog/delete?name=`（清理未完成的上传），`POST /blog`（`shopId/title/content/images`） |
| 短信登录 | `POST /user/code?phone=`，`POST /user/login`（`phone/code`），`POST /user/logout` |
| 个人主页 | `GET /user/me`，`GET /user/info/{id}`，`GET /blog/of/me?current=` |

原始 `init` 版中的短信、登录状态、退出和秒杀会返回「功能未完成」。发布和个人笔记需要后端向 `UserHolder` 注入登录用户。笔记详情读取列表数据，优惠列表按商户获取。当前附件的关注和评论控制器还没有业务方法。

## 界面素材

- 横幅是 Daderot 拍摄的成都宽窄巷子，转换为 WebP 并在页面中做了渐隐处理。[原图及 CC0 授权](https://commons.wikimedia.org/wiki/File:Street_scene_-_Kuanzhai_Alleys_-_Chengdu,_China_-_DSC05311.jpg)
- 全站使用自托管的霞鹜文楷屏幕版，按需加载简体中文 Unicode 子集。[字体项目](https://github.com/chawyehsu/lxgw-wenkai-webfont) · [字体授权](public/licenses/lxgw-wenkai.txt)
- 示例卡片照片来自 Unsplash。[餐厅](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4) · [咖啡馆](https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb) · [早午餐](https://images.unsplash.com/photo-1512621776951-a57141f2eefd) · [夜景](https://images.unsplash.com/photo-1519608487953-e999c86e7455)
