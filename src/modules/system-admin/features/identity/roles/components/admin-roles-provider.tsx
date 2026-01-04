import { RolesProvider } from '../context/roles-context'

export function AdminRolesProvider({ children }: { children: React.ReactNode }) {
    return <RolesProvider>{children}</RolesProvider>
}
