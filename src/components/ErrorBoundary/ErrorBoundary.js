import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние для отображения fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Логируем ошибку
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI при ошибке
      return (
        <div className="error-boundary">
          <h2>Что-то пошло не так 😕</h2>
          <p>Произошла ошибка в приложении. Попробуйте обновить страницу.</p>
          <button onClick={() => window.location.reload()}>
            Обновить страницу
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="error-details">
              <details>
                <summary>Детали ошибки (только для разработчиков)</summary>
                <pre>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
