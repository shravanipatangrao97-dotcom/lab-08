import { useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import './Cards.css';

export default function CurrencyCard() {
  const { currency, currencyLoading, currencyError, fetchCurrency } = useDashboard();

  useEffect(() => {
    fetchCurrency();
  }, []);

  return (
    <div className="card currency-card">
      <div className="card-header">
        <div className="card-icon-wrap currency-icon-wrap">💱</div>
        <div>
          <h2 className="card-title">Exchange Rates</h2>
          <p className="card-subtitle">Base: Indian Rupee (INR)</p>
        </div>
      </div>

      {currencyLoading && <div className="card-loader"><div className="spinner" /></div>}
      {currencyError && !currencyLoading && (
        <p className="card-error">⚠️ {currencyError}</p>
      )}
      {currency && !currencyLoading && (
        <div className="card-body">
          <div className="currency-list">
            {[
              { flag: '🇺🇸', label: 'USD', value: currency.usd },
              { flag: '🇪🇺', label: 'EUR', value: currency.eur },
              { flag: '🇬🇧', label: 'GBP', value: currency.gbp },
            ].map(({ flag, label, value }) => (
              <div key={label} className="currency-row">
                <span className="currency-flag">{flag}</span>
                <span className="currency-label">1 INR → {label}</span>
                <span className="currency-value">{value}</span>
              </div>
            ))}
          </div>
          {currency.updated && (
            <p className="card-meta">
              Updated: {new Date(currency.updated).toLocaleString()}
            </p>
          )}
        </div>
      )}
      <button className="card-btn" onClick={fetchCurrency} disabled={currencyLoading}>
        {currencyLoading ? 'Refreshing…' : '↻ Refresh'}
      </button>
    </div>
  );
}
