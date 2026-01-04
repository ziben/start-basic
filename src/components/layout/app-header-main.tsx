import { Main } from "./main";

export function AppHeaderMain({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Main>{children}</Main>
        </>
    )
}

