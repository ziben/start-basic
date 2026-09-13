import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const checks = [
  ['lint', 'pnpm', ['lint']],
  ['typecheck', 'pnpm', ['exec', 'tsc', '--noEmit']],
  ['test', 'pnpm', ['exec', 'vitest', 'run']],
  ['build', 'pnpm', ['build']],
] as const

const startedAt = new Date()
const results = checks.map(([name, command, args]) => {
  const started = Date.now()
  const executable = process.platform === 'win32' && command === 'pnpm' ? 'pnpm.cmd' : command
  const result = spawnSync(executable, args, { encoding: 'utf8' })
  return {
    name,
    command: [command, ...args].join(' '),
    passed: result.status === 0,
    durationMs: Date.now() - started,
    exitCode: result.status,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(-4000),
  }
})

const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' })
const report = {
  startedAt: startedAt.toISOString(),
  gitCommit: git.stdout?.trim() || 'unknown',
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
