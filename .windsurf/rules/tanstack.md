---
trigger: manual
---

File Organization
For larger applications, consider organizing server-side code into separate files. Here's one approach:


src/utils/
├── users.functions.ts   # Server function wrappers (createServerFn)
├── users.server.ts      # Server-only helpers (DB queries, internal logic)
└── schemas.ts           # Shared validation schemas (client-safe)
.functions.ts - Export createServerFn wrappers, safe to import anywhere
.server.ts - Server-only code, only imported inside server function handlers
.ts (no suffix) - Client-safe code (types, schemas, constants)