# 健康管理模块设计与实施边界

## 当前基线

项目已经具备健康报告 MVP：

- `HealthReport` 保存报告标题、体检日期、来源文件名和原始 OCR 文本。
- `HealthMetricCatalog` 保存指标字典。
- `HealthMetricResult` 保存报告内的原始指标、数值、单位、参考范围和异常标记。
- `/health/reports/new` 支持手动粘贴 OCR 文本。
- `/health/reports` 和详情页支持报告查询。
- 当前报告直接归属于登录用户，无法表达同一用户下的不同人员和不同期次。

## 第一阶段目标

把健康报告 MVP 扩展为可用的多人健康档案：

1. 一个登录用户可以维护多个健康档案人员。
2. 每份报告必须归属一个档案人员。
3. 报告列表、详情和新建报告都显示并校验人员。
4. 保留已有报告和原始 OCR 内容。
5. 继续使用现有手动 OCR 入口，不接入真实 PDF/OCR 厂商。

第一阶段完成后，可以稳定支持“某个人的多期报告归档”。这比先做异步任务、提醒、诊断建议更接近现有代码能力，也能尽快验证核心数据模型。

## 数据边界

### 新增 `HealthPerson`

建议字段：

- `id`
- `ownerUserId`
- `name`
- `gender`（可选）
- `birthDate`（可选）
- `relationLabel`（可选，例如本人、配偶、父母）
- `note`（可选）
- `createdAt`
- `updatedAt`

权限规则：

- 服务端所有查询都必须同时限制 `ownerUserId`。
- 前端人员选择器只展示当前用户可访问的人员。
- 不把 `personId` 的校验交给前端。

### 调整 `HealthReport`

新增：

- `personId`
- `person` 关系

首个迁移保留 `personId` 可空，以避免未经确认地改写历史报告。新建报告必须传入有效的 `personId`。历史报告在列表中归入“未分配人员”，后续再提供显式归档动作。

继续保留：

- `userId` 作为数据拥有者和权限边界。
- `examDate` 作为报告日期。
- `ocrText` 作为原始证据。
- 指标的原始名称、原始行、单位、参考范围和解析标记。

## 第一阶段调用链

```text
route
  -> health feature page
  -> health server function
  -> HealthPersonService / HealthReportService
  -> Prisma health tables
```

服务接口保持小而稳定：

- `HealthPersonService.listForUser(userId)`
- `HealthPersonService.createForUser(userId, input)`
- `HealthReportService.createFromManualText(userId, input)`
- `HealthReportService.listForUser(userId, input)`
- `HealthReportService.getByIdForUser(reportId, userId)`

报告服务负责校验 `personId` 属于当前用户，再写入报告。页面不直接访问 Prisma。

## 第一阶段文件范围

预计修改：

- `db/prisma/schema/07-health.prisma.part`
- `db/prisma/schema.prisma`（通过现有合并脚本生成）
- `src/modules/health/shared/services/health-report.service.ts`
- `src/modules/health/shared/server-fns/health-report.fn.ts`
- `src/modules/health/shared/hooks/use-health-reports.ts`
- `src/modules/health/features/reports/new-health-report-page.tsx`
- `src/modules/health/features/reports/health-reports-page.tsx`
- `src/modules/health/features/reports/health-report-detail-page.tsx`
- `src/modules/health/module.ts`
- `src/modules/module-diagnostics.ts`

预计新增：

- `src/modules/health/shared/services/health-person.service.ts`
- `src/modules/health/shared/server-fns/health-person.fn.ts`
- `src/modules/health/shared/hooks/use-health-persons.ts`
- `db/prisma/migrations_pg/<timestamp>_add_health_person/migration.sql`
- `src/modules/health/shared/services/health-person.service.test.ts`

不修改：

- 现有 OCR 解析器。
- 现有认证实现。
- 现有导航数据库结构。
- 其他业务模块。

## 后续阶段

### 第二阶段：人工复核

只有在需要处理真实 PDF/OCR 误识别时加入：

- 结构化预览。
- 指标逐项修正。
- 复核状态。
- 修改前后值和操作者记录。

当前 `AuditLog` 已可作为审计基础。只有现有审计字段无法表达复核差异时，才新增健康专用审计表。

### 第三阶段：跨期比较

按以下条件比较：

- 同一 `personId`。
- 相同指标 `code`。
- 单位兼容。
- 缺失值保持空白。

比较结果只描述数值变化，不生成疾病诊断。

### 第四阶段：随访任务

当用户确认需要任务闭环后，再新增 `FollowUpTask`：

- 任务标题。
- 关联人员。
- 关联报告或指标。
- 截止日期。
- 状态。
- 备注。

提醒、通知和周期任务不在第一阶段实现。

## 暂缓项

- `ReportImportJob`：当前导入是同步手动文本流程，没有异步消费者。
- 真实 PDF/OCR 接入：现有 `HealthOcrProvider` 已留出替换点，但缺少稳定供应商和文件存储契约。
- 医学诊断和处方建议：报告事实、医生意见和系统记录必须保持分离。
- Flutter 客户端：当前 Web 管理端已经覆盖首发场景。
- 组织级共享档案：当前数据边界是登录用户，未确认组织业务前不扩大权限模型。

## 验收条件

第一阶段至少验证：

1. 用户不能读取其他用户的人员或报告。
2. 新报告必须绑定当前用户的人员。
3. 无效或越权 `personId` 被服务端拒绝。
4. 历史无人员报告仍可查询。
5. 人员列表和报告列表使用有界查询。
6. 现有 OCR 解析测试继续通过。
7. Prisma 类型、路由生成和健康模块测试通过。

数据库迁移只完成静态检查和本地可执行准备。未执行部署或真实环境迁移前，不宣称生产数据已升级。

## 实施顺序

1. 增加 `HealthPerson` 和可空 `HealthReport.personId`。
2. 创建人员服务和 Server Functions。
3. 在报告服务中增加服务端归属校验。
4. 在新建报告页面加入人员选择。
5. 在列表和详情页显示人员。
6. 添加最小服务测试并运行定向检查。
7. 由用户确认后再执行数据库迁移和部署。
