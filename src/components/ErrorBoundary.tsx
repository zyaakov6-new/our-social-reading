import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || "שגיאה לא צפויה" };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-8 text-center">
        {/* brand pillar + wordmark */}
        <div className="flex items-center gap-3">
          <span
            style={{ display: "block", width: "3px", height: "44px", background: "hsl(126 15% 28%)", borderRadius: "2px" }}
          />
          <h1 className="font-display text-[2.6rem] tracking-[0.14em] leading-none">AMUD</h1>
        </div>

        <div className="space-y-2 max-w-xs">
          <p className="font-serif font-bold text-lg">אוי, משהו השתבש</p>
          <p className="text-sm text-muted-foreground">
            אירעה שגיאה לא צפויה. אנחנו מצטערים על אי-הנוחות.
          </p>
          {this.state.message && (
            <p className="text-xs text-muted-foreground/60 font-mono mt-1">
              {this.state.message}
            </p>
          )}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="btn-cta px-6 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: "hsl(126 15% 28%)", color: "#fff" }}
        >
          טעינה מחדש
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
