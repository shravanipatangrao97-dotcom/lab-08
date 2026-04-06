import { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import './Chatbot.css';

const HF_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3';

function buildContextString({ weather, currency, citizen, fact }) {
  const parts = [];
  if (weather) {
    parts.push(
      `Weather in ${weather.city}: ${weather.temperature}${weather.unit}, ` +
      `${weather.condition}, wind ${weather.windSpeed} km/h`
    );
  }
  if (currency) {
    parts.push(
      `Currency (INR base): 1 INR = ${currency.usd} USD, ${currency.eur} EUR, ${currency.gbp} GBP`
    );
  }
  if (citizen) {
    parts.push(
      `Current citizen profile: ${citizen.name}, ${citizen.email}, from ${citizen.city}, ${citizen.country}`
    );
  }
  if (fact) {
    parts.push(`City fact: ${fact.text}`);
  }
  return parts.join('. ');
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '👋 Hi! I\'m your SmartCity AI assistant. Ask me anything about the current dashboard data — weather, exchange rates, citizen profile, or the city fact!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { weather, currency, citizen, fact } = useDashboard();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const context = buildContextString({ weather, currency, citizen, fact });
    const systemPrompt = `You are a helpful SmartCity AI assistant. Answer questions ONLY based on the following real-time dashboard data. Do not make up information beyond this context.\n\nCurrent Dashboard Data:\n${context || 'No data loaded yet. Tell the user to wait for the dashboard to load.'}`;
    const prompt = `<s>[INST] ${systemPrompt}\n\nUser question: ${text} [/INST]`;

    try {
      const apiKey = import.meta.env.VITE_HF_API_KEY;
      if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
        throw new Error('No Hugging Face API key configured. Please add VITE_HF_API_KEY to your .env.local file.');
      }

      const res = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 400,
            temperature: 0.4,
            return_full_text: false,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `API error ${res.status}`);
      }

      const data = await res.json();
      const reply = Array.isArray(data)
        ? data[0]?.generated_text?.trim()
        : data?.generated_text?.trim();

      setMessages(prev => [...prev, { role: 'assistant', text: reply || 'Sorry, I could not generate a response.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ Error: ${err.message}`, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const clearHistory = () => {
    setMessages([{ role: 'assistant', text: '👋 Chat cleared! Ask me anything about the current dashboard data.' }]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="chatbot-toggle-btn"
        className={`chatbot-fab ${open ? 'fab-open' : ''}`}
        onClick={() => setOpen(prev => !prev)}
        aria-label="Toggle chatbot"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window ${open ? 'chatbot-window--open' : ''}`} role="dialog" aria-label="AI Chatbot">
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">🤖</div>
            <div>
              <p className="chatbot-title">SmartCity AI</p>
              <p className="chatbot-status">
                <span className="status-dot" />
                {loading ? 'Thinking…' : 'Online'}
              </p>
            </div>
          </div>
          <button className="chatbot-clear-btn" onClick={clearHistory} title="Clear history">🗑️</button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble-wrap ${msg.role === 'user' ? 'user-wrap' : 'assistant-wrap'}`}>
              <div className={`chat-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'} ${msg.isError ? 'bubble-error' : ''}`}>
                {msg.text}
                {msg.role === 'assistant' && !msg.isError && (
                  <button
                    className={`copy-btn ${copied === idx ? 'copied' : ''}`}
                    onClick={() => copyText(msg.text, idx)}
                    title="Copy response"
                  >
                    {copied === idx ? '✓' : '⎘'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="assistant-wrap">
              <div className="chat-bubble bubble-assistant typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input-area">
          <textarea
            ref={inputRef}
            id="chatbot-input"
            className="chatbot-input"
            placeholder="Ask about weather, currency, citizen…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            id="chatbot-send-btn"
            className="chatbot-send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {loading ? <div className="mini-spinner" /> : '➤'}
          </button>
        </div>
      </div>
    </>
  );
}
