import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 rounded-[3rem] border-2 border-red-200">
          <h3 className="text-red-700 font-bold text-xl mb-2">Component Crashed</h3>
          <p className="text-sm text-red-600 mb-6">{this.state.error?.toString()}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            className="bg-red-600 text-white px-6 py-3 rounded-full text-sm font-bold shadow-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
