import { useState, useEffect } from "react";
import { HiPencilAlt, HiCheck } from "react-icons/hi";
import { 
  BsLightningCharge, 
  BsListUl, 
  BsBook, 
  BsClipboard, 
  BsTrash, 
  BsDownload, 
  BsVolumeUp, 
  BsVolumeMute,
  BsStars,
  BsArrowRight,
  BsCheckCircleFill
} from "react-icons/bs";

const SAMPLE_TEXTS = {
  ai: `Artificial intelligence (AI) is transforming industries worldwide, from healthcare and finance to education and transportation. Machine learning algorithms analyze vast datasets at unprecedented speeds, identifying complex patterns and enabling automated decision-making. In medical diagnostics, AI assists physicians by detecting early signs of diseases in imaging scans with remarkable accuracy. In financial markets, predictive models assess risks and detect fraudulent transactions in milliseconds. However, the rapid advancement of AI also introduces critical ethical challenges, including algorithmic bias, data privacy concerns, and workforce disruption. Experts emphasize that responsible AI development requires robust governance, ethical oversight, transparency, and human-in-the-loop validation to ensure technology benefits society equitably.`,
  climate: `Renewable energy technologies, including solar photovoltaic panels, offshore wind turbines, and advanced grid-scale battery storage, are experiencing exponential adoption worldwide. According to global energy analysts, clean energy investments have surpassed traditional fossil fuel expenditures for three consecutive years. Solar energy efficiency has more than doubled over the past decade while production costs plummeted by over 80%. Concurrently, next-generation lithium-iron-phosphate and solid-state batteries are solving intermittent grid supply challenges by storing surplus daytime energy for peak evening demand. Transitioning away from carbon-intensive energy sources is essential to limiting global warming to 1.5 degrees Celsius and preserving planetary biodiversity.`,
  productivity: `Deep work—the ability to focus without distraction on a cognitively demanding task—is becoming increasingly rare and valuable in today's knowledge economy. Constant notifications, context switching between chat apps, and fragmented calendars severely impair cognitive throughput and creative problem-solving. Research demonstrates that every interruption requires up to 23 minutes for the human brain to regain full focus. Adopting structured routines, implementing time-blocking techniques, prioritizing asynchronous communication, and taking intentional digital disconnects can multiply productivity while substantially mitigating occupational burnout.`,
};

function App() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [summaryMode, setSummaryMode] = useState("concise");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // API endpoints: prefer env var, fallback to local backend in dev or render backend in prod
  const isDev = import.meta.env.DEV;
  const API_URL =
    import.meta.env.VITE_API_URL ||
    (isDev
      ? "http://localhost:5000/summarize"
      : "https://summrize-backend-1.onrender.com/summarize");

  // Ping backend on initial load to wake up free cloud instance (Render spins down on idle)
  useEffect(() => {
    if (!isDev && API_URL.startsWith("http")) {
      const pingUrl = API_URL.replace(/\/summarize$/, "/");
      fetch(pingUrl).catch(() => {
        // Silent catch for background wake-up ping
      });
    }
  }, [isDev, API_URL]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getWordCount = (str) => {
    const trimmed = str.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  };

  const originalWordCount = getWordCount(text);
  const summaryWordCount = getWordCount(summary);
  const reductionPercentage = originalWordCount > 0 && summaryWordCount > 0
    ? Math.max(0, Math.round(((originalWordCount - summaryWordCount) / originalWordCount) * 100))
    : 0;

  const summarizeText = async () => {
    if (!text.trim()) {
      setError("Please enter or paste some text first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSummary("");

    // Stop ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: summaryMode }),
      });

      let data = {};
      const rawText = await response.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { error: rawText || `Server returned status ${response.status}` };
      }

      if (response.status === 503) {
        throw new Error("AI service is waking up or busy. Please try again in a few seconds.");
      }

      if (!response.ok) {
        const errorDetail = data.details || data.error || `Server error (${response.status})`;
        throw new Error(errorDetail);
      }

      if (!data.summary) {
        throw new Error("AI returned an empty summary.");
      }

      setSummary(data.summary);
    } catch (e) {
      console.error("Summarization error:", e);
      if (e.name === "TypeError" || (e.message && e.message.toLowerCase().includes("failed to fetch"))) {
        if (API_URL.includes("localhost") || API_URL.includes("127.0.0.1")) {
          setError("Cannot connect to local backend server. Make sure your server is running (run 'npm run server' or 'npm run dev:all') on port 5000.");
        } else {
          setError("Cannot connect to cloud backend. The server on Render might be waking up from sleep (takes ~30-50s). Please wait a moment and try again.");
        }
      } else {
        setError(e.message || "Failed to generate summary. Please check your backend connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Failed to copy to clipboard.");
    }
  };

  const pasteText = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText(clip);
        setError(null);
      }
    } catch {
      setError("Could not access clipboard. Please paste manually into the textarea.");
    }
  };

  const loadSample = (type) => {
    if (SAMPLE_TEXTS[type]) {
      setText(SAMPLE_TEXTS[type]);
      setError(null);
      setSummary("");
    }
  };

  const downloadSummary = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `summary-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleSpeech = () => {
    if (!window.speechSynthesis) {
      setError("Speech synthesis is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!summary) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="dark-mesh-bg text-slate-100 min-h-screen px-4 sm:px-6 py-6 sm:py-10 relative overflow-x-hidden">
      {/* Floating Ambient Glow Orbs */}
      <div className="glow-orb-1" aria-hidden="true" />
      <div className="glow-orb-2" aria-hidden="true" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* NAVBAR */}
        <nav className="flex items-center justify-between mb-8 sm:mb-10 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white transform hover:scale-105 transition-transform">
              <BsStars className="text-xl" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                SummariAI
              </span>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>AI Engine Ready</span>
              </div>
            </div>
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 text-xs font-bold mb-4 shadow-xs">
            <BsStars className="text-indigo-400" />
            <span>High-Speed AI Text Condenser</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight sm:leading-tight mb-3">
            <span className="text-white">
              Turn Long Text Into{" "}
            </span>
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Clear Insights
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
            Distill articles, documents, notes, and essays into concise summaries or actionable bullet points in seconds.
          </p>
        </section>

        {/* MAIN APPLICATION CARD */}
        <main className="dark-glass-card rounded-3xl p-5 sm:p-8 animate-fade-in-up">
          {/* Quick Samples Header */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
            <label htmlFor="source-text-input" className="text-sm sm:text-base font-bold flex items-center gap-2 text-slate-200">
              <HiPencilAlt className="text-lg text-purple-400" />
              Source Text
            </label>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-semibold">Try sample:</span>
              <button
                type="button"
                onClick={() => loadSample("ai")}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                🤖 AI & Tech
              </button>
              <button
                type="button"
                onClick={() => loadSample("climate")}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                🌱 Climate
              </button>
              <button
                type="button"
                onClick={() => loadSample("productivity")}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                ⚡ Focus
              </button>
            </div>
          </div>

          {/* Text Input Area */}
          <div className="relative group">
            <textarea
              id="source-text-input"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              className="textarea-glow w-full h-44 sm:h-52 p-4 sm:p-5 rounded-2xl bg-slate-900/80 
              border border-slate-700 focus:border-purple-500 outline-none resize-none text-slate-100 placeholder:text-slate-500 text-sm sm:text-base font-normal leading-relaxed shadow-xs"
              placeholder="Paste or type long articles, documents, notes, or essays here..."
            />
            {text && (
              <div className="absolute bottom-3.5 right-3.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 pointer-events-none shadow-xs">
                {originalWordCount} words • {text.length} chars
              </div>
            )}
          </div>

          {/* Mode Selector */}
          <div className="mt-6">
            <div className="text-xs font-bold text-slate-400 mb-2.5 uppercase tracking-wider">
              Summary Mode
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "concise", label: "Concise", icon: BsLightningCharge, desc: "Fast & direct" },
                { id: "bullets", label: "Bullet Points", icon: BsListUl, desc: "Key highlights" },
                { id: "short", label: "Key Takeaway", icon: BsStars, desc: "1-2 sentences" },
                { id: "detailed", label: "Detailed", icon: BsBook, desc: "Comprehensive" },
              ].map((m) => {
                const IconComponent = m.icon;
                const isSelected = summaryMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSummaryMode(m.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-950/70 border-2 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/30 font-bold shadow-xs"
                        : "bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/60 text-slate-300 hover:border-slate-600 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                      <IconComponent className={isSelected ? "text-indigo-400" : "text-slate-400"} />
                      <span className={isSelected ? "text-white" : "text-slate-200"}>{m.label}</span>
                    </div>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? "text-indigo-300 font-semibold" : "text-slate-400 font-medium"}`}>
                      {m.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-700/60">
            <div className="flex items-center gap-2">
              <button
                id="summarize-btn"
                onClick={summarizeText}
                disabled={loading || !text.trim()}
                className={`px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-bold text-white tracking-wide
                bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 
                shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-[1.015] active:scale-[0.985] 
                transition-all flex items-center gap-2 cursor-pointer ${
                  loading || !text.trim() ? "opacity-60 cursor-not-allowed shadow-none" : ""
                }`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Summarizing...</span>
                  </>
                ) : (
                  <>
                    <BsStars className="text-lg" />
                    <span>Summarize Text</span>
                    <BsArrowRight className="text-sm ml-0.5" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="paste-btn"
                onClick={pasteText}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              >
                <BsClipboard className="text-slate-300 text-sm" />
                Paste
              </button>

              <button
                type="button"
                id="clear-btn"
                onClick={() => {
                  setText("");
                  setSummary("");
                  setError(null);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }}
                disabled={!text && !summary}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-800 text-slate-300 hover:text-red-400 font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <BsTrash className="text-sm" />
                Clear
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mt-5 p-4 rounded-2xl bg-red-950/50 border border-red-800 text-red-200 text-sm font-medium flex items-start gap-3 animate-slide-down shadow-xs">
              <span className="text-lg leading-none text-red-400">⚠️</span>
              <div className="flex-1">
                <p className="font-bold text-red-100 mb-0.5">Error</p>
                <p className="text-xs sm:text-sm text-red-200 leading-normal">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-300 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* SUMMARY RESULT CARD */}
          {summary && (
            <section className="mt-8 pt-6 border-t border-slate-700/60 animate-fade-in-up">
              {/* Summary Header & Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <BsCheckCircleFill className="text-lg" />
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      Your Summary
                    </h2>
                  </div>
                  {reductionPercentage > 0 && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-xs">
                      ↓ {reductionPercentage}% shorter
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 font-mono font-bold">
                  {summaryWordCount} words
                </div>
              </div>

              {/* Summary Text Box */}
              <div 
                id="summary-output-container"
                className="dark-summary-panel p-5 sm:p-6 rounded-2xl shadow-xs text-slate-100 text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-normal selection:bg-indigo-600 selection:text-white border border-slate-700/80"
              >
                {summary}
              </div>

              {/* Summary Actions */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    id="copy-summary-btn"
                    onClick={copyToClipboard}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xs shadow-indigo-500/25 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <HiCheck className="text-lg" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <BsClipboard className="text-sm" />
                        Copy Summary
                      </>
                    )}
                  </button>

                  <button
                    id="download-summary-btn"
                    onClick={downloadSummary}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                  >
                    <BsDownload className="text-sm" />
                    Download .txt
                  </button>

                  <button
                    id="speech-toggle-btn"
                    onClick={toggleSpeech}
                    className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer ${
                      isSpeaking
                        ? "bg-indigo-950/70 border-2 border-indigo-500 text-indigo-200 font-bold animate-pulse"
                        : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white"
                    }`}
                  >
                    {isSpeaking ? <BsVolumeMute className="text-base" /> : <BsVolumeUp className="text-base" />}
                    {isSpeaking ? "Stop Voice" : "Read Aloud"}
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* FOOTER */}
        <footer className="mt-8 sm:mt-12 text-center text-xs text-slate-400 font-semibold">
          Powered by Groq High-Speed LLM Inference • AI Text Summarizer
        </footer>
      </div>
    </div>
  );
}

export default App;