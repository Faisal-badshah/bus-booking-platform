import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Catches render-time errors in the route tree so one bad row/page never blanks
// the entire app. Renders a recoverable fallback instead of a white screen.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground mt-1">
              This section failed to load. You can try again or reload the page.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
