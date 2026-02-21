import React, { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
    children: ReactNode
    fallbackMessage?: string
}

type State = {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Uncaught error in ErrorBoundary:', error, errorInfo)
    }

    public handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Card className='border-destructive/50 bg-destructive/10 max-w-2xl mx-auto my-8'>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-destructive'>
                            <AlertTriangle className='h-5 w-5' />
                            {this.props.fallbackMessage || '组件渲染异常'}
                        </CardTitle>
                        <CardDescription className='text-destructive/80'>
                            Oops, something went wrong while rendering this component.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {this.state.error && (
                            <pre className='text-xs bg-background/50 p-4 rounded-md overflow-auto max-h-[200px] border border-destructive/20 text-muted-foreground'>
                                {this.state.error.message}
                                {'\n'}
                                {this.state.error.stack}
                            </pre>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant='outline'
                            className='gap-2 text-destructive hover:bg-destructive/20 hover:text-destructive'
                            onClick={this.handleRetry}
                        >
                            <RefreshCcw className='h-4 w-4' />
                            尝试恢复
                        </Button>
                    </CardFooter>
                </Card>
            )
        }

        return this.props.children
    }
}
