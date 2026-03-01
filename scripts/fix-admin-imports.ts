/**
 * 自动化修复外部导入路径
 * 读取 admin/shared 的 re-export 层，建立旧路径 -> 新路径的映射
 * 并自动替换 src 目录下所有文件中的旧路径。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'z:/labs/start-basic/src'
const SHARED_DIR = path.join(ROOT, 'modules/admin/shared')

// 构建映射表
const importMap = new Map<string, string>()

const dirsToScan = ['server-fns', 'services', 'hooks', 'types']

for (const dir of dirsToScan) {
    const dirPath = path.join(SHARED_DIR, dir)
    if (!fs.existsSync(dirPath)) continue

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))

    for (const file of files) {
        const filePath = path.join(dirPath, file)
        const content = fs.readFileSync(filePath, 'utf-8')

        // 查找目标导出路径: from '~/modules/admin/features/...'
        const match = content.match(/from\s+['"](~\/modules\/admin\/features\/[^'"]+)['"]/)
        if (match) {
            const newPath = match[1]
            const baseName = file.replace(/\.tsx?$/, '')

            // 旧路径的所有变体
            const oldPath1 = `~/modules/admin/shared/${dir}/${baseName}`
            const oldPath2 = `@/modules/admin/shared/${dir}/${baseName}`
            const oldPath3 = `../shared/${dir}/${baseName}` // 相对路径需要特别处理，在下面的替换环节做
            const oldPath4 = `../../shared/${dir}/${baseName}`
            const oldPath5 = `../../../shared/${dir}/${baseName}`
            const oldPath6 = `../../../../shared/${dir}/${baseName}`

            importMap.set(oldPath1, newPath)
            importMap.set(oldPath2, newPath)

            // 添加省略 .ts 扩展名的匹配（如果有）
            console.log(`Mapping '${dir}/${baseName}' -> '${newPath}'`)
        }
    }
}

console.log(`\nBuilt ${importMap.size} direct path mappings.`)

// 递归遍历所有处理文件
function walkDir(dir: string, callback: (filePath: string) => void) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                walkDir(filePath, callback)
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            callback(filePath)
        }
    }
}

let modifiedCount = 0

walkDir(ROOT, (filePath) => {
    // 我们要修复所有文件，包括 shared 目录自身可能还有乱的交叉引用
    let content = fs.readFileSync(filePath, 'utf-8')
    let changed = false

    // 1. 替换直接匹配
    for (const [oldPath, newPath] of importMap.entries()) {
        // 处理带或不带引号的 import
        const re1 = new RegExp(`['"]${oldPath}['"]`, 'g')
        if (re1.test(content)) {
            content = content.replace(re1, `'${newPath}'`)
            changed = true
        }
    }

    // 2. 替换相对路径，比如 '../../shared/hooks/x' 变成 newPath
    // 为了安全，我们用正则查找 from 里面包含 shared/(hooks|server-fns|types|services)/xxx
    const relativeMatch = /from\s+['"]((?:\.\.\/)+shared\/(server-fns|services|hooks|types)\/([^'"]+))['"]/g
    content = content.replace(relativeMatch, (match, fullOldPath, dir, baseName) => {
        // 重建绝对旧路径
        const oldPathKey = `~/modules/admin/shared/${dir}/${baseName}`
        if (importMap.has(oldPathKey)) {
            changed = true
            return `from '${importMap.get(oldPathKey)}'`
        }
        return match
    })

    // 3. 动态导入: import('../../shared/...')
    const dynamicRelativeMatch = /import\s*\(\s*['"]((?:\.\.\/)+shared\/(server-fns|services|hooks|types)\/([^'"]+))['"]\s*\)/g
    content = content.replace(dynamicRelativeMatch, (match, fullOldPath, dir, baseName) => {
        const oldPathKey = `~/modules/admin/shared/${dir}/${baseName}`
        if (importMap.has(oldPathKey)) {
            changed = true
            return `import('${importMap.get(oldPathKey)}')`
        }
        return match
    })

    const dynamicAbsoluteMatch = /import\s*\(\s*['"]([~@]\/modules\/admin\/shared\/(server-fns|services|hooks|types)\/([^'"]+))['"]\s*\)/g
    content = content.replace(dynamicAbsoluteMatch, (match, fullOldPath, dir, baseName) => {
        const oldPathKey = `~/modules/admin/shared/${dir}/${baseName}`
        if (importMap.has(oldPathKey)) {
            changed = true
            return `import('${importMap.get(oldPathKey)}')`
        }
        return match
    })

    // 如果是在 re-export 文件自身，不要修改最后一行从 feature 里 export 出去的，上面已经确保我们只替换 oldPath
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8')
        modifiedCount++
        console.log(`Updated: ${filePath}`)
    }
})

console.log(`\nSuccessfully updated ${modifiedCount} files.`)
