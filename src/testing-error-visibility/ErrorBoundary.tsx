import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * GlobalErrorBoundary
 * 
 * Prevents the entire app from going "White Screen" if a single component crashes.
 * Instead, it shows a premium recovery screen.
 */
class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = "/";
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-card rounded-2xl shadow-medium p-8 text-center border-t-4 border-destructive">
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>

                        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                            Well, this is embarrassing...
                        </h1>

                        <p className="text-muted-foreground mb-6">
                            The application encountered an unexpected error. Don't worry, your data is safe.
                        </p>

                        <div className="bg-muted p-4 rounded-xl mb-8 text-left overflow-auto max-h-32">
                            <p className="text-xs font-mono text-destructive break-words">
                                {this.state.error?.toString()}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                onClick={this.handleReset}
                                className="w-full"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            <Button
                                variant="hero"
                                onClick={this.handleGoHome}
                                className="w-full"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Go Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
