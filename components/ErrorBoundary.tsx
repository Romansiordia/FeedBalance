import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// FIX: Changed from `extends Component<Props, State>` to `extends React.Component<Props, State>`
// to resolve a potential type resolution issue causing `this.props` to be unrecognized.
class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Algo salió mal.</h1>
          <p className="text-gray-600 mb-6 max-w-md">
            Ocurrió un error inesperado en la aplicación. Esto puede deberse a un problema temporal o a un error de configuración.
          </p>
          <Button onClick={this.handleReload} size="lg">
            <RotateCw className="mr-2 h-5 w-5" />
            Recargar la página
          </Button>
          <details className="mt-8 text-left bg-gray-200 p-3 rounded-md max-w-xl w-full">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">Detalles del Error (para desarrolladores)</summary>
            <pre className="mt-2 text-xs text-red-800 whitespace-pre-wrap break-all overflow-auto max-h-40">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
