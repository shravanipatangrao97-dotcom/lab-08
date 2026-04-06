import { useState, useEffect } from 'react';
import { DashboardProvider } from './context/DashboardContext';
import WeatherCard from './components/Dashboard/WeatherCard';
import CurrencyCard from './components/Dashboard/CurrencyCard';
import CitizenCard from './components/Dashboard/CitizenCard';
import FactCard from './components/Dashboard/FactCard';
import Chatbot from './components/Chatbot/Chatbot';
import ImageGenerator from './components/ImageGenerator/ImageGenerator';
import './App.css';

const TABS = [
  { id: 'dashboard', label: '🏙️ Dashboard' },
  { id: 'imagegen', label: '🎨 Image AI' },
];


export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sc-dark-mode');
    return saved !== null ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('sc-dark-mode', darkMode);
  }, [darkMode]);

  return (
    <DashboardProvider>
      <div className="app">
        {/* ── Navbar ── */}
        <nav className="navbar">
          <div className="navbar-inner">
            <a className="navbar-brand" href="/" aria-label="SmartCity Home">
              <span className="navbar-logo">🏙️</span>
              <span>
                <span className="navbar-name">SmartCity AI</span>
                <span className="navbar-sub">Live Dashboard</span>
              </span>
            </a>

            <div className="navbar-tabs" role="tablist">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              id="dark-mode-toggle"
              className="dark-toggle"
              onClick={() => setDarkMode(d => !d)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>

        {/* ── Main Content ── */}
        <main className="main-content" role="main">


          {/* ── Dashboard Tab ── */}
          {activeTab === 'dashboard' && (
            <div key="dashboard" className="fade-enter">
              <header className="page-header">
                <p className="page-header-eyebrow">🌐 Live Data</p>
                <h1>SmartCity AI Dashboard</h1>
                <p>Real-time city intelligence — weather, currency, citizens, and facts at a glance.</p>
              </header>

              <div className="dashboard-grid">
                <WeatherCard />
                <CurrencyCard />
                <CitizenCard />
                <FactCard />
              </div>
            </div>
          )}

          {/* ── Image Generator Tab ── */}
          {activeTab === 'imagegen' && (
            <div key="imagegen" className="fade-enter">
              <ImageGenerator />
            </div>
          )}
        </main>

        {/* ── Floating Chatbot (always visible) ── */}
        <Chatbot />
      </div>
    </DashboardProvider>
  );
}
