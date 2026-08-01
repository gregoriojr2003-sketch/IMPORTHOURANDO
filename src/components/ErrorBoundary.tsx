import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch (e) {
      window.location.reload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">Ops! Ocorreu um erro na aplicação</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Capturamos uma falha inesperada na renderização da interface para evitar a tela branca de erro.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-700 text-left space-y-1">
                <span className="text-[10px] font-mono text-red-400 font-bold block uppercase">Detalhes do Log:</span>
                <p className="text-[11px] font-mono text-slate-300 break-all line-clamp-3">
                  {this.state.error.message || 'Erro desconhecido'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-[#3483FA] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Página</span>
              </button>

              <button
                onClick={this.handleClearStorage}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Limpar Cache & Resetar</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500">
              IMPORTHOURANDO &bull; Sistema de Automação e Monitoramento de Ofertas
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
