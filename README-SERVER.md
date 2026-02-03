# 服务器运行指南

## 🚀 启动服务器

### 开发环境
```powershell
# 使用 Bun 直接运行
bun run server.ts

# 或使用 npm scripts
pnpm start
```

### 生产环境
```powershell
# 设置生产环境变量后运行
$env:NODE_ENV="production"
bun run server.ts
```

## 🔄 后台运行与自动重启

由于 PM2 在 Windows 上与 Bun 存在兼容性问题，推荐使用以下方案：

### 方案 1: 使用 Windows Terminal 保持运行
最简单的方式，适用于开发和测试：
```powershell
bun run server.ts
```

### 方案 2: 使用 NSSM (推荐用于生产)
NSSM (Non-Sucking Service Manager) 可以将 Bun 服务器注册为 Windows 服务。

#### 安装 NSSM
```powershell
# 使用 Chocolatey 安装
choco install nssm

# 或从官网下载
# https://nssm.cc/download
```

#### 注册服务
```powershell
# 以管理员身份运行
nssm install zi-start-basic "X:\nodejs\node-global\bun.cmd" "run server.ts"
nssm set zi-start-basic AppDirectory "z:\labs\start-basic"
nssm set zi-start-basic AppEnvironmentExtra "NODE_ENV=production" "PORT=3000"
nssm set zi-start-basic DisplayName "Zi Start Basic Server"
nssm set zi-start-basic Description "Bun-based web server for zi-start-basic"

# 启动服务
nssm start zi-start-basic
```

#### 管理服务
```powershell
# 查看状态
nssm status zi-start-basic

# 停止服务
nssm stop zi-start-basic

# 重启服务
nssm restart zi-start-basic

# 删除服务
nssm remove zi-start-basic confirm
```

### 方案 3: 使用 Windows Task Scheduler
通过任务计划程序在启动时运行：

1. 打开任务计划程序 (`taskschd.msc`)
2. 创建基本任务
3. 触发器：系统启动时
4. 操作：启动程序
   - 程序：`bun.cmd`
   - 参数：`run server.ts`
   - 起始于：`z:\labs\start-basic`

## 📊 监控

### 查看日志
服务器日志会输出到控制台，您可以重定向到文件：

```powershell
# 输出到文件
bun run server.ts > logs/server.log 2>&1

# 使用 PowerShell 实时查看
Get-Content -Path logs/server.log -Wait -Tail 50
```

### 检查服务状态
```powershell
# 检查端口是否监听
netstat -ano | findstr :3000

# 使用浏览器访问
# http://localhost:3000
```

## 🛑 PM2 兼容性说明

**注意**: PM2 在 Windows 上与 Bun 存在兼容性问题：
- ❌ 无法获取进程 PID
- ❌ 无法监控 CPU 和内存使用
- ❌ 日志捕获不完整
- ❌ 启动失败 (spawn EINVAL)

如果必须使用 PM2，建议切换到 Node.js:
```javascript
// ecosystem.config.cjs
{
    script: 'server.ts',
    interpreter: 'node',
    interpreter_args: '--import tsx/esm',
}
```

## 🔧 环境变量

在 `.env` 文件中配置必要的环境变量：
```env
NODE_ENV=production
PORT=3000
DATABASE_URL="your-database-url"
BETTER_AUTH_SECRET="your-secret"
```
