import { errorMessage } from '../utils/format.js';

function AsyncState({
  loading,
  error,
  isEmpty,
  loadingText = 'Loading data...',
  emptyText = 'No records found.',
  onRetry,
  children,
}) {
  if (loading) {
    return (
      <div className="state-card state-loading">
        <p>{loadingText}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-card state-error">
        <p>{errorMessage(error)}</p>
        {onRetry && (
          <button type="button" className="button-light" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="state-card state-empty">
        <p>{emptyText}</p>
        {onRetry && (
          <button type="button" className="button-light" onClick={onRetry}>
            Refresh
          </button>
        )}
      </div>
    );
  }

  return children;
}

export default AsyncState;
