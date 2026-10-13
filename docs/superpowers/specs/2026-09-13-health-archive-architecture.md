# 多人多期体检档案系统架构决策

## 决策

基于现有 TanStack Start/React/Prisma 全栈基座实现 Web 管理端，Flutter 暂不作为首发客户端。

## 依据

- 仓库已有健康报告 MVP：`HealthReport`、`HealthMetricCatalog`、`HealthMetricResult`。
- 已有认证、RBAC、路由、数据库和部署基础设施。
- 当前核心场景是 PDF/OCR 导入、人工复核、大屏表格和跨期比较，Web 更匹配。
- Flutter 在当前阶段会重复建设客户端认证、权限、报告预览和表单能力。

## 扩展边界

新增 `Person`、`FollowUpTask`、`ReportImportJob`、`AuditEvent`。保留原始报告和原始 OCR 文本；结构化指标必须带单位、参考范围、异常标记、页码和解析置信度。跨期比较按归一化指标 code 与兼容单位进行，缺失值不估算。

## Flutter 触发条件

只有在需要相机扫描、离线采集、蓝牙设备接入、推送提醒或 App 商店分发时再启动 Flutter 客户端；服务端领域模型和 API 保持复用。

## 关联设计交付物

`C:\Users\zi\Documents\Codex\2026-09-13\q\outputs\health-architecture.md`
