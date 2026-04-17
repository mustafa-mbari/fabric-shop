"use client";

import React from "react";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="text-center py-12 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 px-4">
            <p className="font-medium mb-1">حدث خطأ غير متوقع</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-2 text-xs text-red-500 underline hover:no-underline"
            >
              إعادة المحاولة
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
