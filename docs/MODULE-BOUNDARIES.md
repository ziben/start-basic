# Module Boundaries

This project uses `src/modules` as the explicit capability registry. A module must be registered in
`src/modules/index.ts` and mirrored in `src/modules/module-diagnostics.ts` when it exposes shared
runtime capability.

## Current Modules

| Module | Dependencies | Exports | Page Entry |
| --- | --- | --- | --- |
| `auth` | none | `runtime.auth`, `runtime.getAuth` | sign-in, session, RBAC gates |
| `payment` | `auth` | payment order services, payment events | admin payment features and payment APIs |
| `health` | `auth` | `HealthReportService` | `/admin/health` style diagnostics when enabled |
| `audit` | `auth` | `LogService`, `writeAuditLog`, `writeSystemLog` | `/admin/log` |
| `navigation` | `auth` | `NavGroupService`, `NavItemService` | `/admin/navigation`, sidebar data |

## Rules

- Shared modules may depend on `auth` when they need authenticated server functions.
- Shared module sources under `src/modules/*/shared` must not import `src/modules/admin/features/*`.
- Admin pages may consume shared modules, but shared modules should not consume admin pages or table components.
- New shared capabilities should add a module contract test and a module diagnostics entry in the same change.

## Verification

Run the module contract tests after changing module boundaries:

```powershell
pnpm vitest run src/modules/index.test.ts src/modules/module-diagnostics.test.ts src/modules/module-boundaries.test.ts
```

For browser smoke, check:

- `/admin/modules` shows the module count, dependencies, exports, and no action items.
- `/admin/log` still loads system and audit logs.
- `/admin/navigation` still loads menu groups and items after `navigation` shared code moves.
