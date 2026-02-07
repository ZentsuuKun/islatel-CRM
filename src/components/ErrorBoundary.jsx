import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="p-4 rounded bg-danger bg-opacity-10 border border-danger">
                    <h5 className="text-danger fw-bold">Something went wrong.</h5>
                    <details className="text-secondary small mt-2">
                        <summary>Error Details</summary>
                        <pre className="mt-2 text-danger">{this.state.error && this.state.error.toString()}</pre>
                        <pre className="mt-2 text-muted">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
