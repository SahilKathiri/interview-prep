import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class SolutionErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8">
          <p className="text-red-400 font-mono text-sm font-semibold mb-2">
            Runtime error in solution
          </p>
          <pre className="text-red-300 font-mono text-xs whitespace-pre-wrap bg-zinc-900 rounded-lg p-4 border border-zinc-800">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            className="mt-4 px-3 py-1.5 text-xs rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
