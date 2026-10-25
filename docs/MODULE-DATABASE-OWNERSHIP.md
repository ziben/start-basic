# 模块数据库所有权

每个模块只拥有自己声明的表和迁移。跨模块数据必须通过模块服务接口或事件访问，不得直接读取对方 Prisma model。当前仍使用单一 Prisma Client 和合并 schema；该约束为未来拆分数据库保留迁移路径。

## 所有权清单

权威清单在 `src/modules/module-boundaries.test.ts` 的 `TABLE_OWNER`（本测试是门禁，本节只是导览）：

- `auth`：user、account、session、member、role、rolePermission、organizationRole、organizationRolePermission
- `navigation`：navGroup、navItem、roleNavGroup、userRoleNavGroup
- `payment`：paymentOrder
- `audit`：auditLog、systemLog
- `health`：healthPerson、healthReport、healthMetricResult、healthMetricCatalog
- `question-bank`：questionBank、bankQuestion、questionKnowledgePoint、questionPaper、questionPaperSection、questionPaperItem、questionImportBatch
- `ai`（页面组织目录，模块尚未注册）：aIConversation、aIMessage

## 检测范围

`module-boundaries.test.ts` 对全部注册模块源码（不含测试文件）执行：

- 识别 `prisma.X`、`const p = prisma` 别名、`const { user } = prisma` 解构、`const db = await getDb()`
  句柄、`Prisma.TransactionClient` 事务参数，以及 `(await import('@/shared/lib/db')).default` 动态导入别名。
- 数据库访问只允许出现在 `shared/`、`services/`、`server-fns/` 数据层；features/pages 引入
  `@/shared/lib/db` 即违规。
- 访问 `TABLE_OWNER` 中归属其他模块的表即违规，命中 `PRISMA_OWNERSHIP_EXCEPTIONS` 的显式例外除外。

## 显式例外（重新划分所有权前不得扩大）

- `identity → auth`：管理端身份页面直接读写 user/account/session。
- `organization → auth`：组织/部门/成员管理直接读取 member。
- `rbac → auth, navigation`：角色分配与后台 RBAC server-fns 直接读写 role/rolePermission/roleNavGroup。

上述例外是历史结构的如实记录，收敛它们需要先确认所有权重新划分（Linear 跟踪），不得新增同类访问。
