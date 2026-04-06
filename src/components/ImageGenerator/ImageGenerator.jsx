import { useState, useRef, useEffect } from 'react';
import './ImageGenerator.css';
import './ImageGeneratorHistory.css';

const HORDE_API = 'https://stablehorde.net/api/v2';
const ANON_KEY = '0000000000';


const sleep = ms => new Promise(r => setTimeout(r, ms));

// ✅ FIX: Handle both base64 and URL responses from AI Horde
function buildImageSrc(img) {
  if (!img) return null;
  if (img.startsWith('http')) return img; // it's a URL
  // it's a raw base64 string — add the data URI prefix
  return `data:image/webp;base64,${img}`;
}

async function generateWithHorde(prompt, { w, h }, onStatus) {
  onStatus('Submitting to AI Horde…');

  const submitRes = await fetch(`${HORDE_API}/generate/async`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Client-Agent': 'SmartCityAI:1.0:github.com',
    },
    body: JSON.stringify({
      prompt,
      params: {
        n: 1,
        width: w,
        height: h,
        steps: 20,
        sampler_name: 'k_euler',
        cfg_scale: 7,
      },
      nsfw: false,
      censor_nsfw: true,
      models: ['stable_diffusion'],
      r2: false,      // ✅ FIX: Set false to get base64 back reliably
      shared: true,
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({}));
    throw new Error(err.message ?? `Submit failed (${submitRes.status})`);
  }

  const { id } = await submitRes.json();
  if (!id) throw new Error('No job ID returned from AI Horde.');

  // Poll until done
  let attempts = 0;
  while (attempts < 60) {
    await sleep(3000);
    attempts++;

    const checkRes = await fetch(`${HORDE_API}/generate/check/${id}`, {
      headers: { 'apikey': ANON_KEY, 'Client-Agent': 'SmartCityAI:1.0:github.com' },
    });
    const check = await checkRes.json();

    if (check.faulted) throw new Error('AI Horde generation failed. Try a different prompt.');
    if (check.done) break;

    const pos = check.queue_position ?? '?';
    const wait = check.wait_time ?? '?';
    onStatus(`Queue position: ${pos} · ~${wait}s remaining…`);
  }

  if (attempts >= 60) throw new Error('Timed out after 3 minutes. Please try again.');

  onStatus('Fetching result…');
  const statusRes = await fetch(`${HORDE_API}/generate/status/${id}`, {
    headers: { 'apikey': ANON_KEY, 'Client-Agent': 'SmartCityAI:1.0:github.com' },
  });
  const status = await statusRes.json();

  const gen = status.generations?.[0];
  if (!gen?.img) throw new Error('No image returned. Please try again.');

  // ✅ FIX: Use helper to handle both base64 and URL
  return buildImageSrc(gen.img);
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [history, setHistory] = useState([]);

  const progressRef = useRef(null);
  const cancelRef = useRef(false);

  useEffect(() => () => clearInterval(progressRef.current), []);

  const generateImage = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    cancelRef.current = false;
    setLoading(true);
    setError(null);
    setImageUrl(null);
    setProgress(0);
    setStatusMsg('Submitting…');

    clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 2, 88));
    }, 1500);

    try {
      const url = await generateWithHorde(trimmed, { w: 512, h: 512 }, (msg) => {
        if (!cancelRef.current) setStatusMsg(msg);
      });

      if (!cancelRef.current) {
        clearInterval(progressRef.current);
        setProgress(100);
        setImageUrl(url);
        setStatusMsg('');
        setHistory(prev => [
          { id: Date.now(), imageUrl: url, prompt: trimmed },
          ...prev
        ]);
      }
    } catch (err) {
      if (!cancelRef.current) setError(err.message);
    } finally {
      clearInterval(progressRef.current);
      if (!cancelRef.current) setLoading(false);
    }
  };

  // ✅ FIX: Download works for both base64 data URIs and external URLs
  const downloadImage = async () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `smartcity-ai-${Date.now()}.png`;
    a.click();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateImage();
    }
  };

  return (
    <div className="imggen-container">
      <div className="imggen-hero">
        <div className="imggen-hero-icon">🎨</div>
        <h2 className="imggen-title">AI Image Generator</h2>
        <p className="imggen-subtitle">
          Powered by <strong>AI Horde</strong> (Stable Diffusion) · Free · No API key needed
        </p>
      </div>

      <div className="imggen-input-wrap">
        <textarea
          id="image-prompt-input"
          className="imggen-textarea"
          placeholder="e.g. A futuristic smart city at night with glowing neon lights…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={loading}
        />
        <button id="generate-image-btn" className="imggen-btn"
          onClick={generateImage} disabled={loading || !prompt.trim()}>
          {loading
            ? <><div className="imggen-spinner" /> Generating…</>
            : <><span>✨</span> Generate Image</>}
        </button>
      </div>

      {loading && (
        <div className="imggen-progress-wrap">
          <div className="imggen-progress-bar" style={{ width: `${progress}%` }} />
          <p className="imggen-progress-text">🖌️ {statusMsg || 'Working…'}</p>
        </div>
      )}

      {error && !loading && (
        <div className="imggen-error">
          <span>⚠️</span>
          <div>
            <p>{error}</p>
            <p className="imggen-error-tip">
              AI Horde uses community GPU workers — queue times vary (usually 30–120s).
            </p>
          </div>
        </div>
      )}

      {imageUrl && !loading && (
        <div className="imggen-result">
          <div className="imggen-img-wrap">
            <img src={imageUrl} alt={prompt} className="imggen-image" />
            <div className="imggen-img-overlay">
              <button className="imggen-download-btn" onClick={downloadImage}>
                ⬇ Download Image
              </button>
            </div>
          </div>
          <p className="imggen-prompt-label">"{prompt}"</p>
          <button className="imggen-regen-btn" onClick={generateImage}>
            🔀 Generate Another
          </button>
        </div>
      )}

      {!imageUrl && !loading && !error && (
        <div className="imggen-empty">
          <div className="imggen-empty-icon">🖼️</div>
          <p>Your generated image will appear here</p>
          <p className="imggen-empty-tip">
            Powered by community GPU workers · Queue time: 30–120s · Completely free
          </p>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="imggen-history">
          <h3 className="imggen-history-title">📚 Generation History</h3>
          <div className="imggen-history-grid">
            {history.map(item => (
              <div key={item.id} className="imggen-history-item">
                <img src={item.imageUrl} alt={item.prompt} className="imggen-history-img" />
                <div className="imggen-history-overlay">
                  <p className="imggen-history-prompt">"{item.prompt}"</p>
                  <button 
                    className="imggen-history-download" 
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = item.imageUrl;
                      a.download = `smartcity-ai-${item.id}.png`;
                      a.click();
                    }}
                    title="Download"
                  >
                    ⬇
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}