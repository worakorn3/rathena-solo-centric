import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an unhandled error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bento-card p-4 flex flex-col items-center justify-center text-center space-y-2 border-danger/40 bg-danger/5 my-2">
          <div className="w-8 h-8 rounded-full bg-danger/15 flex items-center justify-center text-danger">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="font-bold text-xs text-primary">
            {this.props.fallbackTitle || "Component Temporarily Unavailable"}
          </div>
          <p className="text-[11px] text-muted max-w-xs font-sans">
            {this.props.fallbackMessage ||
              "An unexpected error occurred in this module. The rest of the dashboard remains operational."}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1 text-[10px] font-mono font-bold text-accent hover:text-accent/80 transition-colors pt-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
