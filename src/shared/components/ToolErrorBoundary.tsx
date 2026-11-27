import { Component, type ErrorInfo } from 'react';
import type { ToolErrorBoundaryProps } from './types';
import './ToolErrorBoundary.css';

interface ToolErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class ToolErrorBoundary extends Component<
  ToolErrorBoundaryProps,
  ToolErrorBoundaryState
> {
  state: ToolErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): ToolErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ToolErrorBoundary caught an error:', error, info);
  }

  componentDidUpdate(prevProps: ToolErrorBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const heading = this.props.toolName
      ? `${this.props.toolName} encountered an error`
      : 'Something went wrong';

    return (
      <div className="shared-error-boundary">
        <div className="shared-error-card" role="alert">
          <span className="shared-error-badge">Recovery Mode</span>
          <h1 className="shared-error-title">{heading}</h1>
          <p className="shared-error-message">{this.state.errorMessage}</p>
          <div className="shared-error-actions">
            <button
              type="button"
              className="shared-error-retry-btn"
              onClick={this.handleReset}
            >
              Try Again
            </button>
            <button
              type="button"
              className="shared-error-back-btn"
              onClick={this.props.onBack}
            >
              ← Back to Tools Hub
            </button>
          </div>
        </div>
      </div>
    );
  }
}
