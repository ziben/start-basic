/**
 * PM2 Ecosystem Configuration for Zi Start Basic
 * 
 * 这个配置文件定义了如何使用PM2管理Bun应用
 * 
 * 使用方式:
 * - 启动: pnpm run pm2:start
 * - 停止: pnpm run pm2:stop
 * - 重启: pnpm run pm2:restart
 * - 零停机重载: pnpm run pm2:reload
 * - 查看日志: pnpm run pm2:logs
 * - 监控: pnpm run pm2:monit
 * 
 * 文档: https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

module.exports = {
    apps: [
        {
            name: 'zi-start-basic',

            // 使用Bun运行时
            script: 'bun',
            args: 'run server.ts',
            interpreter: 'none', // 重要：告诉PM2不使用Node.js解释器

            // 集群模式配置
            instances: process.env.PM2_INSTANCES || 'max', // 默认使用所有CPU核心
            exec_mode: 'cluster', // 集群模式，充分利用多核CPU

            // 开发模式可设置为 false，生产环境建议关闭
            watch: false,

            // 内存限制（超过后自动重启）
            max_memory_restart: '500M',

            // 自动重启配置
            autorestart: true,
            max_restarts: 10, // 最大重启次数
            min_uptime: '10s', // 最小运行时间，避免频繁重启

            // 环境变量 - 生产环境
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
                // 性能日志（按需开启）
                // ENABLE_PERF_LOGGING: 'false',
                // ASSET_PRELOAD_VERBOSE_LOGGING: 'false',
            },

            // 环境变量 - 开发环境
            env_development: {
                NODE_ENV: 'development',
                PORT: 3000,
                ENABLE_PERF_LOGGING: 'true',
                ASSET_PRELOAD_VERBOSE_LOGGING: 'true',
            },

            // 日志配置
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true, // 合并集群模式下的日志

            // 优雅关闭配置
            kill_timeout: 5000, // 5秒超时
            wait_ready: true, // 等待应用准备就绪
            listen_timeout: 10000, // 监听超时10秒

            // cron重启（可选，例如每天凌晨重启）
            // cron_restart: '0 0 * * *',

            // 忽略的监听文件（watch模式下）
            ignore_watch: [
                'node_modules',
                'logs',
                '.git',
                '*.log',
                'dist',
            ],
        },
    ],

    // PM2部署配置（可选）
    deploy: {
        production: {
            user: 'deploy',
            host: 'your-server.com',
            ref: 'origin/main',
            repo: 'git@github.com:username/zi-start-basic.git',
            path: '/var/www/zi-start-basic',
            'post-deploy': 'pnpm install && pnpm run build && pm2 reload ecosystem.config.cjs --env production',
        },
    },
}
