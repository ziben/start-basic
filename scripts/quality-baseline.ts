import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const checks = [
  ['lint', 'pnpm', ['lint']],
  ['typecheck', 'pnpm', ['typecheck']],
  ['test', 'pnpm', ['exec', 'vitest', 'run']],
  ['build', 'pnpm', ['build']],
] as const

const startedAt = new Date()
const git = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })
const state = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
const results = checks.map(([name, command, args]) => {
  const started = Date.now()
  console.log(`Running ${name}...`)
  // Windows 的 pnpm.cmd 需要 shell；命令仅来自上面的固定列表。
  const options = { encoding: 'utf8' as const, timeout: 600_000, maxBuffer: 20 * 1024 * 1024 }
  const result =
    process.platform === 'win32'
      ? spawnSync([command, ...args].join(' '), { ...options, shell: true })
      : spawnSync(command, args, options)
  return {
    name,
    command: [command, ...args].join(' '),
    passed: result.status === 0 && !result.error,
    durationMs: Date.now() - started,
    exitCode: result.status,
    error: result.error?.message,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(-4000),
  }
})

const report = {
  startedAt: startedAt.toISOString(),
  gitCommit: git.stdout?.trim() || 'unknown',
  workingTree: state.stdout?.trim() || 'clean',
  passed: results.every((result) => result.passed),
  checks: results,
}

mkdirSync('docs/baselines', { recursive: true })
const reportPath = join('docs/baselines', `${startedAt.toISOString().replace(/[:.]/g, '-')}.json`)
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(`Quality baseline: ${report.passed ? 'PASS' : 'FAIL'}`)
console.log(`Report: ${reportPath}`)
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name} (${result.durationMs}ms)`)
}

process.exitCode = report.passed ? 0 : 1
