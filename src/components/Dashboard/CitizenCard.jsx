import { useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import './Cards.css';

export default function CitizenCard() {
  const { citizen, citizenLoading, citizenError, fetchCitizen } = useDashboard();

  useEffect(() => {
    fetchCitizen();
  }, []);

  return (
    <div className="card citizen-card">
      <div className="card-header">
        <div className="card-icon-wrap citizen-icon-wrap">👤</div>
        <div>
          <h2 className="card-title">Citizen Profile</h2>
          <p className="card-subtitle">Random City Resident</p>
        </div>
      </div>

      {citizenLoading && <div className="card-loader"><div className="spinner" /></div>}
      {citizenError && !citizenLoading && (
        <p className="card-error">⚠️ {citizenError}</p>
      )}
      {citizen && !citizenLoading && (
        <div className="card-body">
          <div className="citizen-profile">
            <img
              src={citizen.avatar}
              alt={citizen.name}
              className="citizen-avatar"
            />
            <div className="citizen-info">
              <p className="citizen-name">{citizen.name}</p>
              <p className="citizen-detail">✉️ {citizen.email}</p>
              <p className="citizen-detail">📍 {citizen.city}, {citizen.country}</p>
            </div>
          </div>
        </div>
      )}
      <button className="card-btn" onClick={fetchCitizen} disabled={citizenLoading}>
        {citizenLoading ? 'Refreshing…' : '↻ Refresh'}
      </button>
    </div>
  );
}
