import { faker } from '@faker-js/faker'
import { type AdminUser } from './schema'

export const adminUsers: AdminUser[] = Array.from({ length: 20 }, () => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  return {
    id: faker.string.uuid(),
    name: `${firstName} ${lastName}`,
    username: faker.internet.username({ firstName, lastName }).toLowerCase(),
    email: faker.internet.email({ firstName }).toLowerCase(),
    emailVerified: faker.datatype.boolean?.() ?? true,
    image: null,
    role: faker.helpers.arrayElement(['admin', 'manager', 'user']),
    banned: faker.datatype.boolean?.() ? null : false,
    banReason: null,
    banExpires: null,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  }
})


