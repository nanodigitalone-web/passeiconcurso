import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced to console so it shows up in logs instead of a blank screen.
    console.error("App crash captured by ErrorBoundary:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-soft px-6">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 h-14 w-14 text-warning" />
            <h1 className="mb-2 font-display text-2xl font-bold">Algo correu mal</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Ocorreu um erro ao carregar esta página. Tente novamente.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={this.handleReset} className="rounded-full bg-gradient-primary">
                Tentar de novo
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => (window.location.href = "/")}>
                Ir para o início
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
