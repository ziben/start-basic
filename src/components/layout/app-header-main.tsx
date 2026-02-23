import { Main } from "./main";

type AppHeaderMainProps = React.HTMLAttributes<HTMLElement> & {
    fixed?: boolean
    fluid?: boolean
}

export function AppHeaderMain({ children, ...props }: AppHeaderMainProps) {
    return (
        <>
            <Main {...props}>{children}</Main>
        </>
    )
}
