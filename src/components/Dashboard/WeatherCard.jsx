import { useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import './Cards.css';

const weatherIcons = {
  'Clear Sky': '☀️', 'Mainly Clear': '🌤️', 'Partly Cloudy': '⛅',
  'Overcast': '☁️', 'Fog': '🌫️', 'Icy Fog': '🌫️',
  'Light Drizzle': '🌦️', 'Drizzle': '🌦️', 'Heavy Drizzle': '🌧️',
  'Light Rain': '🌧️', 'Rain': '🌧️', 'Heavy Rain': '🌧️',
  'Light Snow': '🌨️', 'Snow': '❄️', 'Heavy Snow': '❄️',
  'Rain Showers': '🌦️', 'Heavy Showers': '🌧️', 'Violent Showers': '⛈️',
  'Thunderstorm': '⛈️', 'Thunderstorm + Hail': '⛈️',
  'Heavy Thunderstorm': '⛈️', 'Unknown': '🌡️',
};

export default function WeatherCard() {
  const { weather, weatherLoading, weatherError, fetchWeather } = useDashboard();

  useEffect(() => {
    fetchWeather();
  }, []);

  const icon = weather ? (weatherIcons[weather.condition] ?? '🌡️') : '🌡️';

  return (
    <div className="card weather-card">
      <div className="card-header">
        <div className="card-icon-wrap weather-icon-wrap">🌍</div>
        <div>
          <h2 className="card-title">Live Weather</h2>
          <p className="card-subtitle">{weather?.city ?? 'Bengaluru, India'}</p>
        </div>
      </div>

      {weatherLoading && <div className="card-loader"><div className="spinner" /></div>}
      {weatherError && !weatherLoading && (
        <p className="card-error">⚠️ {weatherError}</p>
      )}
      {weather && !weatherLoading && (
        <div className="card-body">
          <div className="weather-temp">
            <span className="weather-emoji">{icon}</span>
            <span className="big-number">{weather.temperature}<sup>{weather.unit}</sup></span>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Condition</span>
              <span className="info-value">{weather.condition}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Wind Speed</span>
              <span className="info-value">{weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      )}
      <button className="card-btn" onClick={fetchWeather} disabled={weatherLoading}>
        {weatherLoading ? 'Refreshing…' : '↻ Refresh'}
      </button>
    </div>
  );
}
