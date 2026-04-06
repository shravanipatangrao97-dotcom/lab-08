import { useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import './Cards.css';

export default function FactCard() {
  const { fact, factLoading, factError, fetchFact } = useDashboard();

  useEffect(() => {
    fetchFact();
  }, []);

  return (
    <div className="card fact-card">
      <div className="card-header">
        <div className="card-icon-wrap fact-icon-wrap">💡</div>
        <div>
          <h2 className="card-title">City Fact of the Day</h2>
          <p className="card-subtitle">Did you know?</p>
        </div>
      </div>

      {factLoading && <div className="card-loader"><div className="spinner" /></div>}
      {factError && !factLoading && (
        <p className="card-error">⚠️ {factError}</p>
      )}
      {fact && !factLoading && (
        <div className="card-body">
          <div className="fact-quote">
            <span className="fact-quote-mark">"</span>
            <p className="fact-text">{fact.text}</p>
            <span className="fact-quote-mark closing">"</span>
          </div>
          {fact.source && (
            <a
              href={fact.source}
              target="_blank"
              rel="noopener noreferrer"
              className="fact-source"
            >
              → Source
            </a>
          )}
        </div>
      )}
      <button className="card-btn" onClick={fetchFact} disabled={factLoading}>
        {factLoading ? 'Refreshing…' : '↻ Refresh'}
      </button>
    </div>
  );
}
