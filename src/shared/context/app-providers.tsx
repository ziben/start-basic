import { AuthProvider } from '~/shared/context/auth-context'
import { DirectionProvider } from '~/shared/context/direction-provider'
import { LocaleProvider } from '~/shared/context/locale-context'
import { ThemeProvider } from '~/shared/context/theme-provider'

type AppProvidersProps = {
    children: React.ReactNode
}

/**
 * Global App Providers
 * Wraps the application with all necessary global contexts
 * avoiding "Provider Hell" in the root component.
 */
export function AppProviders({ children }: AppProvidersProps) {
    return (
        <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
            <DirectionProvider>
                <LocaleProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </LocaleProvider>
            </DirectionProvider>
        </ThemeProvider>
    )
}
