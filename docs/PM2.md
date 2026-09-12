# PM2 进程管理

本项目支持两种生产部署方式：

1. **直接使用Bun运行**（简单部署）
2. **使用PM2管理**（推荐生产环境）

## 🚀 快速开始

### 方式1：Bun直接运行（推荐开发/简单部署）

```bash
# 构建
pnpm run build

# 启动
pnpm run start
```

### 方式2：PM2管理（推荐生产环境）

```bash
# 安装PM2（全局或项目依赖）
pnpm add -g pm2
# 或作为开发依赖
pnpm add -D pm2

# 构建
pnpm run build

# 启动（生产模式）
pnpm run pm2

# 启动（开发模式，带详细日志）
pnpm run pm2:dev
```

## 📋 PM2 命令列表

| 命令 | 说明 |
|------|------|
| `pnpm run pm2:start` | 启动应用（生产模式） |
| `pnpm run pm2:start:dev` | 启动应用（开发模式） |
| `pnpm run pm2:stop` | 停止应用 |
| `pnpm run pm2:restart` | 重启应用（有短暂停机） |
| `pnpm run pm2:reload` | **零停机重载**（推荐更新时使用） |
| `pnpm run pm2:delete` | 删除应用进程 |
| `pnpm run pm2:logs` | 查看实时日志 |
| `pnpm run pm2:monit` | 监控CPU/内存使用 |
| `pnpm run pm2:status` | 查看应用状态 |
| `pnpm run pm2:save` | 保存当前进程列表 |
| `pnpm run pm2:startup` | 配置开机自启动 |

## 🔧 PM2 配置说明

配置文件：`ecosystem.config.cjs`

### 主要特性

- ✅ **集群模式**：默认使用所有CPU核心（`instances: 'max'`）
- ✅ **自动重启**：应用崩溃自动重启
- ✅ **内存限制**：超过500MB自动重启
- ✅ **零停机重载**：使用 `pm2 reload` 更新应用无停机
- ✅ **日志管理**：自动记录到 `logs/` 目录
- ✅ **优雅关闭**：配合 server.ts 的 SIGTERM/SIGINT 处理

### 调整集群实例数

```bash
# 环境变量方式
PM2_INSTANCES=2 pnpm run pm2:start

# 或修改 ecosystem.config.cjs
instances: 2,  // 改为固定数量
```

### 自定义配置

编辑 `ecosystem.config.cjs` 文件，可以调整：
- 内存限制 (`max_memory_restart`)
- 日志路径 (`error_file`, `out_file`)
- 环境变量 (`env_production`, `env_development`)
- 定时重启 (`cron_restart`)

## 📊 生产部署流程

### 首次部署

```bash
# 1. 克隆代码
git clone <repository-url>
cd zi-start-basic

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 设置生产环境配置

# 4. 构建应用
pnpm run build

# 5. 启动PM2
pnpm run pm2:start

# 6. 保存进程列表（重启后恢复）
pnpm run pm2:save

# 7. 配置开机自启动
pnpm run pm2:startup
# 然后按照提示执行输出的命令
```

### 更新部署（零停机）

```bash
# 1. 拉取最新代码
git pull

# 2. 安装依赖（如有变更）
pnpm install

# 3. 重新构建
pnpm run build

# 4. 零停机重载
pnpm run pm2:reload
```

## 🖥️ 监控与调试

### 查看实时日志
```bash
pnpm run pm2:logs
```

### 监控资源使用
```bash
pnpm run pm2:monit
```

### 查看详细信息
```bash
pm2 show zi-start-basic
```

### 查看所有进程
```bash
pm2 list
```

## 🐛 常见问题

### Q: Windows下PM2不生效？
A: Windows下PM2功能有限，推荐：
- 使用WSL2 + Linux环境
- 或使用Windows Service包装器
- 或直接使用 `bun run start`

### Q: 如何清理日志？
```bash
pm2 flush  # 清空所有日志
```

### Q: 内存持续增长怎么办？
调整 `ecosystem.config.cjs` 中的 `max_memory_restart` 值，或定时重启：
```javascript
cron_restart: '0 4 * * *',  // 每天凌晨4点重启
```

### Q: 集群模式下数据库连接过多？
减少实例数量或使用连接池：
```javascript
instances: 2,  // 减少实例
```

## 🔗 相关资源

- [PM2 官方文档](https://pm2.keymetrics.io/)
- [Bun 文档](https://bun.sh/docs)
- [TanStack Start 文档](https://tanstack.com/start)

## 📝 注意事项

1. **开发环境**不建议使用PM2，直接用 `pnpm dev` 即可
2. **Docker/K8s环境**不需要PM2，容器本身提供进程管理
3. 确保 `logs/` 目录有写入权限
4. 生产环境建议配置开机自启动
5. 定期检查日志文件大小，避免磁盘占满
