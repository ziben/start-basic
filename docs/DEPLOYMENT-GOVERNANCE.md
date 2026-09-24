# 部署治理

发布只允许从已经通过 `pnpm check` 的提交开始。应用发布前执行：

```powershell
pnpm install --frozen-lockfile
pnpm db:deploy
pnpm build
pnpm deploy:preflight
```

`deploy:preflight` 会检查 `BETTER_AUTH_SECRET`、`DATABASE_URL`、构建产物和 Prisma 迁移状态。设置 `DEPLOY_HEALTHCHECK_URL` 时，还会请求该地址并要求返回 2xx/3xx；生产环境可指向 `/readyz`。

PM2 更新顺序是先完成迁移和构建，再执行 `pnpm deploy:preflight`，最后使用 `pnpm run pm2:reload`。Vercel 等托管平台也必须把 `pnpm db:deploy` 作为独立的发布前步骤，不能把数据库迁移隐藏在应用启动过程中。

回滚只回滚应用版本；数据库迁移必须保持向后兼容。需要破坏性 schema 变更时，先拆成“新增兼容字段 → 应用双写/回填 → 切读 → 删除旧字段”多个发布，禁止直接回退已执行的迁移。
