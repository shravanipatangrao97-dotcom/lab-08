import { useState, useRef, useEffect } from 'react';
import './ImageGenerator.css';

const HORDE_API   = 'https://stablehorde.net/api/v2';
const ANON_KEY    = '0000000000'; // no account needed

const STYLES = [
  { label: 'None',           value: '' },
  { label: 'Photorealistic', value: ', photorealistic, ultra detailed, 8K, high quality' },
  { label: 'Digital Art',    value: ', digital art, artstation, vibrant colors, concept art' },
  { label: 'Cinematic',      value: ', cinematic lighting, movie still, dramatic, 35mm film' },
  { label: 'Anime',          value: ', anime style, studio ghibli, detailed illustration' },
  { label: 'Oil Painting',   value: ', oil painting, impressionist, textured brushwork, museum quality' },
];

const SIZES = [
  { label: '1:1 Square (512×512)',     w: 512,  h: 512  },
  { label: '16:9 Wide (768×432)',      w: 768,  h: 432  },
  { label: '9:16 Portrait (432×768)', w: 432,  h: 768  },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generateWithHorde(prompt, { w, h }, onStatus) {
  // 1. Submit generation job
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
        width:  w,
        height: h,
        steps: 20,
        sampler_name: 'k_euler',
        cfg_scale: 7,
      },
      nsfw: false,
      censor_nsfw: true,
      models: ['stable_diffusion'],
      r2: true,           // return a URL instead of base64
      shared: true,       // allows sharing for faster queue
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({}));
    throw new Error(err.message ?? `Submit failed (${submitRes.status})`);
  }

  const { id } = await submitRes.json();
  if (!id) throw new Error('No job ID returned from AI Horde.');

  // 2. Poll until done
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

    const pos  = check.queue_position ?? '?';
    const wait = check.wait_time ?? '?';
    onStatus(`Queue position: ${pos} · ~${wait}s remaining…`);
  }

  if (attempts >= 60) throw new Error('Timed out after 3 minutes. Please try again.');

  // 3. Get result
  onStatus('Fetching result…');
  const statusRes = await fetch(`${HORDE_API}/generate/status/${id}`, {
    headers: { 'apikey': ANON_KEY, 'Client-Agent': 'SmartCityAI:1.0:github.com' },
  });
  const status = await statusRes.json();

  const gen = status.generations?.[0];
  if (!gen?.img) throw new Error('No image returned. Please try again.');
  return gen.img; // URL
}

export default function ImageGenerator() {
  const [prompt, setPrompt]     = useState('');
  const [style, setStyle]       = useState(STYLES[0].value);
  const [size, setSize]         = useState(SIZES[0]);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  const progressRef = useRef(null);
  const cancelRef   = useRef(false);

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
      const finalPrompt = trimmed + style;
      const url = await generateWithHorde(finalPrompt, size, (msg) => {
        if (!cancelRef.current) setStatusMsg(msg);
      });

      if (!cancelRef.current) {
        clearInterval(progressRef.current);
        setProgress(100);
        setImageUrl(url);
        setStatusMsg('');
      }
    } catch (err) {
      if (!cancelRef.current) setError(err.message);
    } finally {
      clearInterval(progressRef.current);
      if (!cancelRef.current) setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const res  = await fetch(imageUrl);
      const blob = await res.blob();
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = `smartcity-ai-${Date.now()}.png`;
      a.click();
    } catch {
      window.open(imageUrl, '_blank');
    }
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

      {/* Style + Size controls */}
      <div className="imggen-controls">
        <div className="imggen-control-group">
          <label htmlFor="style-select" className="imggen-control-label">Style</label>
          <select id="style-select" className="imggen-select" value={style}
            onChange={e => setStyle(e.target.value)} disabled={loading}>
            {STYLES.map(s => <option key={s.label} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="imggen-control-group">
          <label htmlFor="size-select" className="imggen-control-label">Size</label>
          <select id="size-select" className="imggen-select" value={JSON.stringify(size)}
            onChange={e => setSize(JSON.parse(e.target.value))} disabled={loading}>
            {SIZES.map(s => <option key={s.label} value={JSON.stringify(s)}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Prompt */}
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

      {/* Progress */}
      {loading && (
        <div className="imggen-progress-wrap">
          <div className="imggen-progress-bar" style={{ width: `${progress}%` }} />
          <p className="imggen-progress-text">🖌️ {statusMsg || 'Working…'}</p>
        </div>
      )}

      {/* Error */}
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

      {/* Result */}
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
          <p className="imggen-prompt-label">"{prompt}{style}"</p>
          <button className="imggen-regen-btn" onClick={generateImage}>
            🔀 Generate Another
          </button>
        </div>
      )}

      {/* Empty state */}
      {!imageUrl && !loading && !error && (
        <div className="imggen-empty">
          <div className="imggen-empty-icon">🖼️</div>
          <p>Your generated image will appear here</p>
          <p className="imggen-empty-tip">
            Powered by community GPU workers · Queue time: 30–120s · Completely free
          </p>
        </div>
      )}
    </div>
  );
}
