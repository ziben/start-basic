# 架构评审报告（2026-09-26）

> 评审范围：`z:/labs/start-basic` 全量源码 + 构建产物 + 文档
> 评审方式：静态结构分析、依赖与耦合统计、构建产物度量、文档一致性核对
> 结论一句话：**骨架是对的，肉长歪了。** 分层清晰、模块契约有雏形、可观测性认真做了，但 `admin` 已经膨胀成一个"第二应用"，模块体系只落地了一半，数据库层存在事实与文档的分裂。

---

## 一、现状数据快照

| 指标 | 数值 | 判读 |
| --- | --- | --- |
| 手写源码文件（排除 generated/routeTree） | 710 | 中型项目，已进入"必须靠约束而非靠记忆"的规模 |
| 业务模块数 | 10（admin/ai/audit/auth/dashboard/health/mobile/navigation/payment/settings） | 分域合理 |
| `modules/admin` 文件数 | **242 / 407 = 59.5%** | 严重失衡，一个模块吃掉全部业务代码的六成 |
| 已注册进 module-registry 的模块 | 5 / 10 | 模块体系半成品 |
| 路由文件 | 72 | 其中 6 条是重复路由 |
| Server Functions | 161 处 `createServerFn` | 数据入口以 ServerFn 为主，API Route 仅 9 个 |
| 测试文件 | 45（其中 admin 仅 4） | 覆盖与代码量成反比 |
| shadcn UI 组件 | 54 | 全量入库，多数为低频使用 |
| 空目录 | 20 | 脚手架残留 |
| 首屏 JS chunk | 722 KB（未压缩），chat 500 KB，CSS 186 KB | 偏大 |
| 数据库迁移目录 | 2 套（sqlite 15 / pg 8）+ drizzle 残留 2 套 | 事实双轨 |
| 根目录日志/快照垃圾 | 14 个文件，其中 5 个 `.txt` 已入库 | 卫生问题 |

---

## 二、做得对的地方（先别急着自我否定）

这几条是真金白银，重构时**不要动**：

1. **分层链完整**：`View → Hook → Query → ServerFn → Service → DB`，方向单一，没有组件里直接写 Prisma 的野路子（`getDb` 调用点仅 14 处，全部落在 service / infrastructure 层）。
2. **模块契约已有雏形**：`src/core/module-registry.ts` + `defineModule({ key, version, dependencies, exports })`，payment 模块还声明了 `events`（`payment.order.paid` 等）+ `event-bus`。这是这个仓库里最值钱的资产。
3. **边界有测试兜底**：`module-boundaries.test.ts` 用静态扫描强制 `dependencies` 声明，越界即失败。绝大多数项目连这个意识都没有。
4. **Query Key 集中管理**：`src/shared/lib/query-keys.ts` 全量 key 工厂函数化，配合 `CACHE_TIME` 三级分层。缓存失效可以精确打击。
5. **可观测性认真做了**：`requestId` 贯穿、system log / audit log 双轨、慢查询 200ms 阈值、浏览器 FCP/LCP/TTFB 上报且请求体限 512 字节白名单、`/healthz` `/readyz` 探针、质量基线 JSON 归档。
6. **生产服务器自研且克制**：`server.ts` 的静态资源混合加载（小文件预载 + 大文件按需）、ETag、按需 gzip、优雅关闭，考虑得比很多"直接 nitro 一把梭"的项目细。

---

## 三、问题清单

### P0 — 结构性风险，不处理会持续放大

#### 1. `admin` 模块已经不是模块，是第二个应用

- **证据**：`src/modules/admin` 242 文件；`features/organization` 56、`rbac` 41、`identity` 36、`navigation` 34；路由侧 `_authenticated/admin/` 下 24 个页面。
- **后果**：任何改动都要在 242 个文件里定位；模块边界测试**不覆盖** admin（因为 admin 没进 registry），等于最大一块代码在监管之外；新功能的"默认落点"就是 admin，熵增不可逆。
- **建议**：按子域把它拆成 5 个平级模块，各自提供 `module.ts` 并注册进 `moduleRegistry`：
  ```
  modules/identity       (users / account / session / verification)
  modules/organization   (organizations / departments / members / invitations)
  modules/rbac           (roles / permissions / org-roles / role-nav-group)
  modules/navigation     (navgroup / navitem) —— 与现有 navigation 模块合并
  modules/system-config  (system-config / i18n / module-diagnostics)
  ```
  `admin` 退化为**壳**：只保留 layout、菜单编排、路由聚合。拆分后每个模块天然受边界测试约束。
- **迁移策略**：按子域逐个搬，一次一个 PR，用 `module-boundaries.test.ts` 验证边界后再搬下一个。不要搞 big bang。

#### 2. 数据库层：事实与文档互相打脸

- **证据**：
  - 代码事实：唯一客户端是 `src/infrastructure/db/prisma-client.ts`，用 `@prisma/adapter-pg`（PostgreSQL）。Drizzle 在 `src/` 中 **0 引用**。
  - 残留：`db/drizzle/` 两个迁移目录、`package.json` 仍装 `@prisma/adapter-libsql`、**20 个空目录**里就有 `src/db/drizzle`。
  - 文档：`docs/ARCHITECTURE.md` 白纸黑字写"ORM: Prisma + Drizzle"；`README.md` 与 `CLAUDE.md` 都写 `DATABASE_URL=file:./db/dev.db`（SQLite）。
  - 迁移双轨：`db/prisma/migrations`（15 个，SQLite 产物）与 `db/prisma/migrations_pg`（8 个），`prisma.config.ts` 指向 `migrations_pg`。
- **后果**：新人按 README 配 SQLite → 跑 `migrations` → 与线上 PG schema 分叉；`@prisma/adapter-libsql` 是无用的攻击面与安装体积。
- **建议**：
  1. 删除 `db/drizzle/`、`src/db/drizzle/`、`db/prisma/migrations`（SQLite 旧迁移，保留历史归档即可）。
  2. 从 `package.json` 移除 `@prisma/adapter-libsql`。
  3. 文档统一为 PG，删掉"Prisma + Drizzle"的表述。
  4. 加一条 CI 检查：`prisma migrate diff` 校验 schema 与迁移一致，杜绝 drift。

#### 3. 鉴权中间件：110 行代码复制两遍，且状态码是错的

- **证据**：`src/middleware.ts` 中 `withAuth` 与 `withAdminAuth` 除角色判断外**逐行相同**（requestId、IP、UA、body 读取、audit 闭包、system log、catch 分支，全部重写了一遍）。
- **附带 bug**：未登录（无 session）时返回 **403**，语义上应为 401。客户端无法区分"没登录"和"没权限"，重定向逻辑只能靠猜。
- **建议**：抽一个工厂，让差异只留在 predicate：
  ```ts
  const withSession = (opts: { roles?: string[]; onFail?: ... }) => (handler) => async (ctx) => { ... }
  export const withAuth = withSession({})
  export const withAdminAuth = withSession({ roles: ['admin', 'superadmin'] })
  ```
  同时把 403/401 分开：无 session → 401 + `WWW-Authenticate`；有 session 无角色 → 403。

#### 4. 模块体系只落地了一半

- **证据**：`src/modules/index.ts` 只注册了 auth / payment / health / audit / navigation 五个；`admin`、`ai`、`dashboard`、`settings`、`mobile` 五个模块**没有 `module.ts`**。
- **后果**：边界测试扫的是 `src/modules/<key>/shared`，未注册模块的跨模块 import 完全不受约束；`defineModule` 的 `dependencies` 声明形同虚设——你建了一套法律，但只管辖一半人口。
- **建议**：所有模块补齐 `module.ts`（哪怕 `dependencies: []`），注册进 registry；边界测试范围从 `shared/` 扩展到 `features/` 与 `src/routes/` 的跨模块引用。

---

### P1 — 质量与性能，影响交付速度和运行成本

#### 5. 首屏包体偏大，且用调高阈值的方式"解决"了警告

- **证据**：`dist/client/assets/index-*.js` 722 KB、`chat-*.js` 500 KB、`index-*.css` 186 KB；`vite.config.ts` 里 `chunkSizeWarningLimit: 800`（默认 500）。
- **吐槽**：把体重秤的刻度改大，体重并不会下降。
- **建议**：
  - `build.rollupOptions.output.manualChunks` 拆出 `vendor-react`、`vendor-radix`、`vendor-charts`、`vendor-editor`。
  - `chat` chunk 里的 `react-markdown` + `highlight.js` + `rehype-*`、dashboard 里的 `recharts`、admin 里的 `dnd-kit`，全部改为路由级动态 `import()`。
  - CSS 186 KB：Tailwind v4 检查是否有大量未 purge 的动态类名；字体文件（82 KB ttf + 73 KB woff2）确认是否需要自托管。
  - `chunkSizeWarningLimit` 调回 500，让警告重新有意义。

#### 6. `vite-plugin-inspect` 在生产构建里启用

- **证据**：`vite.config.ts` 的 `plugins: [Inspect(), ...]`，无条件启用。
- **后果**：拖慢构建，且 inspect 产物会暴露模块图谱。
- **建议**：`...(process.env.NODE_ENV === 'development' ? [Inspect()] : [])`。

#### 7. 文档三方漂移

- **证据**：
  - `README.md`：`src/modules/`、`src/shared/`，无 `features/`。
  - `CLAUDE.md`：`src/features/` 为主，且写"Prisma schema 在 `prisma/schema.prisma`"（实际在 `db/prisma/schema.prisma`），写"Database: LibSQL (SQLite)"（实际 PG）。
  - `docs/ARCHITECTURE.md`：模块名还写着"原 system-admin""原 identity"的历史别名。
- **后果**：AI 编码助手和新人都会被错误文档带偏——`CLAUDE.md` 尤其致命，它是给 AI 看的。
- **建议**：以 `docs/ARCHITECTURE.md` 为唯一事实源，`README.md` 只放快速开始 + 链接，重写 `CLAUDE.md`（顺手把不存在的命令 `pnpm check-types`、`pnpm deps` 删掉或补上）。

#### 8. 路由重复与命名混乱

- **证据**：`_authenticated/admin/profile/settings/{account,appearance,display,notifications,index,route}.tsx` 与 `_authenticated/settings/` 下同名 6 个文件；另有 `admin/rolenavgroup.tsx`、`admin/userrolenavgroup.tsx`（全小写无连字符，与其他 kebab-case 路由不一致）。
- **建议**：settings 页面抽为 `src/modules/settings/features/*` 的共享组件，两条路由各自引用，不再复制文件；路由文件名统一 kebab-case（`role-nav-group.tsx`）。

#### 9. 测试分布与代码量成反比

- **证据**：45 个测试文件中，`admin`（242 文件）只有 4 个；payment / health / auth / infrastructure 覆盖相对扎实。
- **建议**：不需要追覆盖率数字，但要给 admin 拆出来的每个新模块配 **service 层单测 + 一个 hook 测试**作为门槛。service 是纯逻辑，最容易测，也是最容易出线上事故的地方。

#### 10. 同步写日志可能成为 DB 写放大源

- **证据**：`withAuth`/`withAdminAuth` 每个请求结束都 `writeSystemLog`，且 `log.requestBody.enabled` 打开时还会读请求体入库。
- **建议**：`void` 只是不等待，不代表不占连接池。改为进程内批量缓冲（如 200 条或 500ms flush 一次）再批量插入；请求体记录默认关闭，且增加字段脱敏（password/token/card）。

---

### P2 — 卫生问题，半小时能清完

11. **删 20 个空目录**：`src/config`、`src/db/drizzle`、`src/modules/admin/shared/services`（文档里写的服务层位置，实际是空的）、`navigation/navgroup/{data,hooks,server-fns,services}` 等一整套空壳。
12. **清理根目录 14 个日志文件**：`build*.log`、`tsc*.txt`、`tsc-errors.log`、`typecheck.log`、`vite_debug.log`（246 KB）。其中 `tsc-check.txt`、`tsc-check3.txt`、`tsc-check4.txt`、`tsc_output.txt`、`db/db_push_output.txt` **已被 git 跟踪**，需要从版本库移除并补 `.gitignore`（`*.log`、`*.txt` 除白名单）。
13. **删 `features/_template`** 或改为真正的 generator 脚本（`scripts/` 里已有 generate-routes.ts，可以加一个 `scaffold-feature.ts`）。
14. **54 个 shadcn 组件全量入库**：确认低频组件（aspect-ratio / menubar / carousel / resizable 等）是否真的在用，未使用的删掉，减少 AI 误用与维护面。

---

## 四、演进路线（按依赖顺序，别跳步）

```
阶段一（1～2 天，零风险）
  清垃圾：空目录 / 根日志 / .gitignore / 移除 libsql adapter / Inspect 只在 dev
  修文档：CLAUDE.md 重写，README 瘦身，ARCHITECTURE 唯一事实源

阶段二（2～3 天，收益最高）
  中间件工厂化（withAuth / withAdminAuth 合并 + 401/403 修正）
  数据库收敛到 PG 单轨 + CI schema drift 检查
  路由去重（settings 组件化）+ 命名规范化

阶段三（1～2 周，主战场）
  admin 拆分：identity → organization → rbac → navigation → system-config
  每拆一个：补 module.ts → 注册 → 跑边界测试 → 补 service 单测
  admin 退化为壳

阶段四（持续）
  包体优化：manualChunks + 路由级动态导入，阈值调回 500
  日志写入批量化 + 脱敏
  shadcn 组件裁剪
```

**关键约束**：阶段三必须在阶段一/二之后。带着错误的文档和复制粘贴的中间件去拆 242 个文件，等于在流沙上盖楼。

---

## 五、一句话总结

这个项目的架构**设计意图是清晰的**——模块化、契约化、可观测，这三件事你想明白了并且落地了一半。现在的问题不是"设计错了"，而是**执行停在了半山腰**：模块契约建好了却只管辖 5 个模块，分层定好了却让 admin 长成了 242 文件的巨物，数据库早就统一到 PG 了文档还在讲 SQLite + Drizzle。

先把半山腰的活干完，比重新设计一套漂亮架构划算得多。
