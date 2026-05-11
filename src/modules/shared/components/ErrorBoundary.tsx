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
        <div style={{
          padding: 16,
          margin: 8,
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: 8,
          color: "#991b1b",
          fontSize: 12,
          fontFamily: "monospace"
        }}>
          <strong>⚠️ {this.props.name || "Component"} Error:</strong>
          <pre style={{ marginTop: 4, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {this.state.error?.message}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
