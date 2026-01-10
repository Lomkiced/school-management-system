import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./button";

interface Props {
  children?: ReactNode;
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
    console.error("CRITICAL UI ERROR:", error, errorInfo);
  }

  private handleHardReset = () => {
    // 1. Clear ALL Local Storage (The "Nuclear" Option)
    localStorage.clear();
    // 2. Clear Session Storage
    sessionStorage.clear();
    // 3. Reload
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
          <div className="max-w-lg w-full bg-white shadow-2xl rounded-2xl p-8 text-center border border-slate-200">
            <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Crashed</h1>
            <p className="text-slate-500 mb-8">
              A critical error occurred. This usually happens when the browser holds "stale" data from an older version of the system.
            </p>
            
            <div className="bg-slate-950 text-slate-200 p-4 rounded-lg text-left mb-8 overflow-auto max-h-40 shadow-inner">
               <p className="text-xs text-red-400 font-mono mb-2 uppercase tracking-wider">Error Details:</p>
               <code className="text-xs font-mono break-all">
                 {this.state.error?.message || "Unknown Error"}
               </code>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-12 text-base">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Simple Reload
              </Button>
              
              <Button onClick={this.handleHardReset} variant="destructive" className="w-full h-12 text-base shadow-lg shadow-red-200">
                <Trash2 className="mr-2 h-4 w-4" />
                Factory Reset (Clear Cache & Login)
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}