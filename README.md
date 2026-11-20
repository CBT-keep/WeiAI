# 唯爱 · 城市生活指南

「唯爱」将 React 前端与黑马点评课程初始后端放在同一个仓库中。前端包含商户发现、探店笔记和优惠券体验，开发时通过 Vite 代理访问现有 Spring Boot 接口。

| 目录 | 内容 |
| --- | --- |
| [frontend](frontend/) | React + Vite 前端、演示数据、字体和页面素材 |
| [backend](backend/) | 黑马点评 `hm-dianping-init` 的 Spring Boot / MyBatis-Plus 源码 |
| [数据库脚本](backend/src/main/resources/db/hmdp.sql) | MySQL 初始化表结构及示例数据 |

## 预览前端

使用 Node.js 22.12 或更高版本与 pnpm。

```bash
cd frontend
pnpm install
pnpm dev
```

打开 [演示模式](http://localhost:5173/?mode=demo) 可独立体验页面。演示登录使用任意有效格式的 11 位手机号和验证码 `123456`。构建命令为 `pnpm build`。[前端说明及接口对照](frontend/README.md)

## 启动初始后端

1. 准备 JDK 8、Maven、MySQL 和 Redis。在新建的 `hmdp` 数据库中导入 [初始化脚本](backend/src/main/resources/db/hmdp.sql)。
2. 在本地终端或 IDE 的运行配置中设置数据库连接环境变量。数据库密码填写在 `HMDP_DB_PASSWORD` 中。Redis 需要认证时设置 `HMDP_REDIS_PASSWORD`。

   | 环境变量 | 默认值 |
   | --- | --- |
   | `HMDP_DB_URL` | 本机 MySQL 的 `hmdp` 库，端口 `3306` |
   | `HMDP_DB_USER` | `root` |
   | `HMDP_DB_PASSWORD` | 空 |
   | `HMDP_REDIS_HOST` | `127.0.0.1` |
   | `HMDP_REDIS_PORT` | `6379` |
   | `HMDP_REDIS_PASSWORD` | 空 |

3. 在 `backend` 目录运行 `mvn spring-boot:run`，或由 IDE 启动 `com.hmdp.HmDianPingApplication`。后端默认监听 `8081`。打开 [前端后端模式](http://localhost:5173/) 即可联调。

课程初始版中的短信登录、登录状态和秒杀仍是待实现方法。真实图片服务的配置见前端说明。示例用户的手机号是占位值，表之间仍按原有用户 ID 关联。

后端课程来源和原始说明见 [backend/README.md](backend/README.md)。
