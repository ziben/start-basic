# Module Boundaries

This project uses `src/modules` as the explicit capability registry. A module must be registered in
`src/modules/index.ts` and mirrored in `src/modules/module-diagnostics.ts` when it exposes shared
runtime capability.

## Current Modules

| Module          | Dependencies     | Exports                                         | Page Entry                                     |
| --------------- | ---------------- | ----------------------------------------------- | ---------------------------------------------- |
| `auth`          | none             | `runtime.auth`, `runtime.getAuth`               | sign-in, session, RBAC gates                   |
| `payment`       | `auth`           | payment order services, payment events          | admin payment features and payment APIs        |
| `health`        | `auth`           | `HealthPersonService`, `HealthReportService`    | health persons/reports, comparison             |
| `audit`         | `auth`           | `LogService`, `writeAuditLog`, `writeSystemLog` | `/admin/log`                                   |
| `navigation`    | `auth`           | `NavGroupService`, `NavItemService`             | `/admin/navigation`, sidebar data              |
| `identity`      | `auth`           | admin identity pages                            | `/admin/users`, `/admin/session`, account      |
| `organization`  | `auth`           | org/department/member/invitation services       | `/admin/organization*`                         |
| `rbac`          | `auth`           | role assignment services, RBAC server fns       | `/admin/rbac*`, system/org roles               |
| `system-config` | `auth`           | system config pages/services                    | `/admin/system-config`                         |
| `question-bank` | `auth`           | question bank services                          | `/question-bank` workbench                     |

## Page-Organization Directories (unregistered)

`src/modules` also contains page-organization directories that are NOT capability modules. They must
stay in the allowlist checked by `module-boundaries.test.ts` (`constrains unregistered module
directories...`) with a reason; adding a new business capability means registering a module, not
adding a silent directory:

| Directory   | Reason                                                                        |
| ----------- | ----------------------------------------------------------------------------- |
| `admin`     | 旧管理端兼容层：仅转发到 payment/audit/navigation 等真实实现（转发-only）        |
| `ai`        | AI 聊天页面组织目录：数据访问在 `shared/services`，表所有权见数据库所有权文档     |
| `dashboard` | 仪表盘展示组件目录，不含数据访问                                                |
| `mobile`    | 移动端页面组织目录，复用 Web 路由                                               |
| `settings`  | 设置页面组织目录                                                                |

## Rules

- Shared modules may depend on `auth` when they need authenticated server functions.
- Registered module sources must only import their own module or declared dependencies (static,
  dynamic, and relative imports are all resolved by `module-boundaries.test.ts`).
- Database access is only allowed in the data layer (`shared/`, `services/`, or `server-fns/`).
  Feature/page sources importing `@/shared/lib/db` fail the boundary test.
- Cross-module table ownership is enforced for direct `prisma.X`, aliases (`const p = prisma`),
  destructuring (`const { user } = prisma`), `getDb()` handles, and transaction clients. Historical
  exceptions are explicit in `PRISMA_OWNERSHIP_EXCEPTIONS` (see
  [MODULE-DATABASE-OWNERSHIP.md](./MODULE-DATABASE-OWNERSHIP.md)).
- Shared module sources under `src/modules/*/shared` must not import `src/modules/admin/features/*`.
- Admin pages may consume shared modules, but shared modules should not consume admin pages or table components.
- New shared capabilities should add a module contract test and a module diagnostics entry in the same change.
- `COMPATIBILITY_IMPORTS` entries are forward-only re-export paths; they must not reintroduce
  business logic into the legacy admin tree.

## Verification

Run the module contract tests after changing module boundaries:

```powershell
pnpm vitest run src/modules/index.test.ts src/modules/module-diagnostics.test.ts src/modules/module-boundaries.test.ts
```

For browser smoke, check:

- `/admin/modules` shows the module count, dependencies, exports, and no action items.
- `/admin/log` still loads system and audit logs.
- `/admin/navigation` still loads menu groups and items after `navigation` shared code moves.
