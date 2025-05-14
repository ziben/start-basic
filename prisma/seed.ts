import { initSidebarData } from '../src/routes/api/sidebar/controller'

async function main() {
  await initSidebarData()
  console.log('侧边栏数据已初始化')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
