import { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundaryWithRecovery extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    if (import.meta.env.PROD) {
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Oups! Quelque chose s'est mal passé
                </h1>
                <p className="text-gray-600">
                  Une erreur inattendue s'est produite
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Bug className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Message d'erreur:
                  </p>
                  <p className="text-sm text-gray-600 font-mono break-words">
                    {this.state.error.message}
                  </p>
                  {import.meta.env.DEV && this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        Détails techniques (dev mode)
                      </summary>
                      <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40 p-2 bg-white rounded border border-gray-200">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Vous pouvez essayer les actions suivantes:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <motion.button
                  onClick={this.handleReset}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réessayer
                </motion.button>

                <motion.button
                  onClick={this.handleReload}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recharger la page
                </motion.button>

                <motion.button
                  onClick={this.handleGoHome}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  <Home className="w-4 h-4" />
                  Retour accueil
                </motion.button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Si le problème persiste, veuillez contacter le support technique.
                <br />
                Code erreur: {this.state.error.name || 'UNKNOWN'}
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorFallback({
  error,
  reset,
  title = 'Une erreur est survenue',
  message = 'Nous nous excusons pour le désagrément.'
}: {
  error: Error;
  reset: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {message}
          </p>
          <p className="text-xs text-gray-500 mb-4 font-mono break-words">
            {error.message}
          </p>
          <motion.button
            onClick={reset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm"
          >
            Réessayer
          </motion.button>
        </div>
      </div>
    </div>
  );
}
