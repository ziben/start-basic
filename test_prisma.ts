import prisma from './src/shared/lib/db'

async function main() {
  try {
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        roleId: true
      }
    })
    console.log('Success:', user)
  } catch (e: any) {
    console.error('Error details:', e.message)
    if (e.code) console.error('Error code:', e.code)
  } finally {
    await prisma.$disconnect()
  }
}

main()
