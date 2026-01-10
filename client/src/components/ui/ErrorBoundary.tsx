import { AlertCircle, RefreshCw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-50">
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-md w-full">
            <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">System Error</h2>
            <p className="text-slate-500 mb-6">
              The application encountered a problem displaying this page.
            </p>
            
            {/* The Actual Error Message */}
            <div className="bg-slate-900 text-slate-50 p-4 rounded-lg text-left text-xs font-mono mb-6 overflow-auto max-h-32">
              {this.state.error?.message || "Unknown Error"}
            </div>

            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}