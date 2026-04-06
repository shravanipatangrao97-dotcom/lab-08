import { createContext, useContext, useState, useCallback } from 'react';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [weather, setWeather] = useState(null);
  const [currency, setCurrency] = useState(null);
  const [citizen, setCitizen] = useState(null);
  const [fact, setFact] = useState(null);

  const [weatherLoading, setWeatherLoading] = useState(false);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [citizenLoading, setCitizenLoading] = useState(false);
  const [factLoading, setFactLoading] = useState(false);

  const [weatherError, setWeatherError] = useState(null);
  const [currencyError, setCurrencyError] = useState(null);
  const [citizenError, setCitizenError] = useState(null);
  const [factError, setFactError] = useState(null);

  // Weather codes → human-readable conditions
  const weatherCodeMap = {
    0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Icy Fog', 51: 'Light Drizzle', 53: 'Drizzle',
    55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
    71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 80: 'Rain Showers',
    81: 'Heavy Showers', 82: 'Violent Showers', 95: 'Thunderstorm',
    96: 'Thunderstorm + Hail', 99: 'Heavy Thunderstorm',
  };

  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      // Bengaluru, India coordinates
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=temperature_2m,wind_speed_10m,weather_code&timezone=Asia%2FKolkata'
      );
      if (!res.ok) throw new Error('Failed to fetch weather');
      const data = await res.json();
      const current = data.current;
      setWeather({
        temperature: current.temperature_2m,
        windSpeed: current.wind_speed_10m,
        condition: weatherCodeMap[current.weather_code] ?? 'Unknown',
        unit: data.current_units?.temperature_2m ?? '°C',
        city: 'Bengaluru',
      });
    } catch (err) {
      setWeatherError(err.message);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const fetchCurrency = useCallback(async () => {
    setCurrencyLoading(true);
    setCurrencyError(null);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/INR');
      if (!res.ok) throw new Error('Failed to fetch currency');
      const data = await res.json();
      setCurrency({
        base: 'INR',
        usd: data.rates?.USD?.toFixed(6),
        eur: data.rates?.EUR?.toFixed(6),
        gbp: data.rates?.GBP?.toFixed(6),
        updated: data.time_last_update_utc,
      });
    } catch (err) {
      setCurrencyError(err.message);
    } finally {
      setCurrencyLoading(false);
    }
  }, []);

  const fetchCitizen = useCallback(async () => {
    setCitizenLoading(true);
    setCitizenError(null);
    try {
      const res = await fetch('https://randomuser.me/api/');
      if (!res.ok) throw new Error('Failed to fetch citizen');
      const data = await res.json();
      const u = data.results[0];
      setCitizen({
        name: `${u.name.first} ${u.name.last}`,
        email: u.email,
        city: u.location.city,
        country: u.location.country,
        avatar: u.picture.large,
      });
    } catch (err) {
      setCitizenError(err.message);
    } finally {
      setCitizenLoading(false);
    }
  }, []);

  const fetchFact = useCallback(async () => {
    setFactLoading(true);
    setFactError(null);
    try {
      const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
      if (!res.ok) throw new Error('Failed to fetch fact');
      const data = await res.json();
      setFact({ text: data.text, source: data.source_url });
    } catch (err) {
      setFactError(err.message);
    } finally {
      setFactLoading(false);
    }
  }, []);

  const value = {
    weather, weatherLoading, weatherError, fetchWeather,
    currency, currencyLoading, currencyError, fetchCurrency,
    citizen, citizenLoading, citizenError, fetchCitizen,
    fact, factLoading, factError, fetchFact,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
  return ctx;
}
