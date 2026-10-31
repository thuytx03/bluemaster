import { AlertOctagon, RotateCcw } from "lucide-react"
import React, { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  name?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ""}] Caught error:`,
      error,
      errorInfo
    )
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="bm-m-2 bm-rounded-xl2 bm-border bm-border-danger/30 bm-bg-danger-soft bm-p-3.5 bm-text-fg">
          <div className="bm-flex bm-items-center bm-gap-2 bm-text-[12.5px] bm-font-semibold bm-text-danger">
            <AlertOctagon size={15} />
            {this.props.name || "Component"} gặp lỗi
          </div>
          <pre className="bm-mt-2 bm-max-h-40 bm-overflow-auto bm-whitespace-pre-wrap bm-break-all bm-rounded-lg bm-bg-surface/70 bm-p-2 bm-font-mono bm-text-[11px] bm-text-fg-muted">
            {this.state.error?.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bm-mt-2 bm-inline-flex bm-h-7 bm-items-center bm-gap-1.5 bm-rounded-lg bm-bg-surface bm-px-2.5 bm-text-[12px] bm-font-medium bm-text-fg bm-shadow-card hover:bm-bg-surface-2">
            <RotateCcw size={12} />
            Thử lại
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
