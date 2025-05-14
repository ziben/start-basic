import { faker } from '@faker-js/faker'
import { AdminUser } from './schema'

export const adminUsers: AdminUser[] = Array.from({ length: 20 }, () => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  return {
    id: faker.string.uuid(),
    username: faker.internet.username({ firstName, lastName }).toLowerCase(),
    email: faker.internet.email({ firstName }).toLowerCase(),
    phoneNumber: faker.phone.number({ style: 'international' }),
    status: faker.helpers.arrayElement(['active', 'inactive', 'invited', 'suspended']),
    role: faker.helpers.arrayElement(['admin', 'manager', 'user']),
    firstName,
    lastName,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  }
})
