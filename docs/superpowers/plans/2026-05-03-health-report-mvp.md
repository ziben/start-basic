# Health Report MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first-pass health management module that stores manually pasted OCR text from physical exam reports and parses metrics into structured database rows.

**Architecture:** Add a `health` vertical module with Prisma models, OCR provider abstraction, parser, service, Server Functions, React Query hooks, and authenticated app routes. The first OCR provider accepts manual text so the workflow is usable before connecting a real OCR vendor.

**Tech Stack:** TanStack Start, React 19, TanStack Query, Prisma, Zod, Vitest.

---

### Task 1: Data Contract

**Files:**
- Modify: `db/prisma/schema/01-auth.prisma.part`
- Create: `db/prisma/schema/07-health.prisma.part`

- [x] Add report, metric catalog, and metric result models.
- [x] Merge Prisma schema and regenerate Prisma client.

### Task 2: Parser And OCR Boundary

**Files:**
- Create: `src/modules/health/shared/ocr/health-ocr-provider.ts`
- Create: `src/modules/health/shared/ocr/manual-text-ocr-provider.ts`
- Create: `src/modules/health/shared/ocr/parse-health-report-text.ts`
- Create: `src/modules/health/shared/ocr/parse-health-report-text.test.ts`

- [x] Implement a provider interface that returns plain OCR text.
- [x] Implement a manual text provider.
- [x] Implement line-based metric extraction and tests.

### Task 3: Health Service And Server Functions

**Files:**
- Create: `src/modules/health/shared/services/health-report.service.ts`
- Create: `src/modules/health/shared/server-fns/health-report.fn.ts`
- Create: `src/modules/health/shared/hooks/use-health-reports.ts`
- Create: `src/modules/health/module.ts`
- Modify: `src/modules/index.ts`

- [x] Create reports from OCR text and parsed metric rows.
- [x] List user reports and fetch report details.
- [x] Register the health module.

### Task 4: App UI Routes

**Files:**
- Create: `src/modules/health/features/reports/health-reports-page.tsx`
- Create: `src/modules/health/features/reports/new-health-report-page.tsx`
- Create: `src/modules/health/features/reports/health-report-detail-page.tsx`
- Create: `src/modules/health/index.ts`
- Create: `src/routes/_authenticated/_app/health/reports.tsx`
- Create: `src/routes/_authenticated/_app/health/reports/new.tsx`
- Create: `src/routes/_authenticated/_app/health/reports/$reportId.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`

- [x] Add report list, creation, and detail screens.
- [x] Add a fallback sidebar entry for health reports.

### Task 5: Verification

- [x] Run focused parser tests.
- [x] Run route generation.
- [x] Run TypeScript check.
