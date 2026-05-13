import { useState, useEffect } from "react";
import { IoSparklesSharp } from "react-icons/io5";
import { HiPencilAlt, HiCheck } from "react-icons/hi";
import { BsSun, BsMoonStars } from "react-icons/bs";

function App() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const API_URL = "https://your-render-backend-url.onrender.com/summarize";

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
const summarizeText = async () => {
  if (!text.trim()) return setError("Enter text first");

  setLoading(true);
  setError(null);
  setSummary("");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    // Handle backend load error
    if (response.status === 503) {
      throw new Error("AI is busy. Please try again in a moment.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Backend error");
    }

    setSummary(data.summary);
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
};

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed.");
    }
  };

  const pasteText = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setText(clip);
    } catch {
      setError("Paste failed.");
    }
  };

  return (
    <div
      className={`relative min-h-screen px-5 py-10 overflow-hidden transition-all duration-500 
        ${darkMode ? "bg-gray-900 text-white" : "bg-pink-100 text-gray-900"}`}
    >
      {/* Floating Neon Particles */}
      <div className="neon-particles"></div>

      {/* Sakura Falling */}
      <div className="sakura"></div>

      {/* HEADER */}
      {/* HEADER */}
{/* HEADER */}
<header className="relative z-20 w-full flex flex-col items-center mb-10 px-4">

  {/* Magical Title */}
  <h1
    className="
      text-3xl sm:text-4xl md:text-5xl lg:text-6xl 
      font-extrabold text-center leading-tight
      bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500
      bg-clip-text text-transparent 
      animate-gradient 
      drop-shadow-[0_0_12px_rgba(255,120,255,0.8)]
      px-2 mb-8
    "
  >
    Magical Text Summarizer
  </h1>

  {/* Dark Mode Toggle */}
  <button
    onClick={toggleDarkMode}
    className="
      absolute 
      top-2 right-2 
      sm:top-4 sm:right-4
      w-10 h-10 sm:w-12 sm:h-12
      flex items-center justify-center
      rounded-3xl backdrop-blur-xl
      bg-white/40 dark:bg-gray-800/40
      border border-white/50 dark:border-gray-600/50
      shadow-lg hover:scale-110 transition-all
      hover:shadow-[0_0_18px_#ff4dd8]
    "
  >
    {darkMode ? (
      <BsSun className="text-yellow-300 text-xl sm:text-2xl" />
    ) : (
      <BsMoonStars className="text-purple-400 text-xl sm:text-2xl" />
    )}
  </button>

</header>

    

      {/* MAIN GLASS CARD */}
      <div className="glass-card mx-auto max-w-5xl rounded-3xl p-10 relative z-10">
        <label className="text-xl font-semibold text-pink-500 flex gap-2 items-center mb-3">
          <HiPencilAlt className="drop-shadow-[0_0_5px_#ff6bd8]" />
          Enter your text
        </label>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-40 p-4 rounded-2xl bg-white/40 dark:bg-gray-800/50 backdrop-blur-xl 
          border border-white/30 dark:border-gray-700/40 focus:ring-2 focus:ring-pink-400 
          focus:shadow-[0_0_12px_#ff86e8] outline-none transition-all"
          placeholder="Paste or type text..."
        ></textarea>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={summarizeText}
            className="px-6 py-3 rounded-xl font-semibold text-white 
            bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_0_12px_#ff3dc8] 
            hover:shadow-[0_0_20px_#ff5ae2] transition-all"
          >
            Summarize ✨
          </button>

          <button
            onClick={pasteText}
            className="px-6 py-3 rounded-xl bg-white/20 dark:bg-gray-700/40 
            border border-white/40 backdrop-blur-xl hover:scale-105 transition-all"
          >
            Paste
          </button>

          <button
            onClick={() => {
              setText("");
              setSummary("");
              setError(null);
            }}
            className="px-6 py-3 rounded-xl bg-white/20 dark:bg-gray-700/40 
            border border-white/40 backdrop-blur-xl hover:scale-105 transition-all"
          >
            Clear
          </button>
        </div>

        {error && (
          <p className="text-red-500 mt-4 text-sm drop-shadow">{error}</p>
        )}

        {/* SUMMARY BOX */}
        {summary && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-pink-500 mb-2">
              Summary
            </h2>

            <div className="p-5 rounded-2xl bg-white/30 dark:bg-gray-800/40 
            backdrop-blur-xl border border-white/30 shadow-inner">
              <p>{summary}</p>
            </div>

            <button
              onClick={copyToClipboard}
              className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 
              text-white shadow-[0_0_15px_#ff3dc8] hover:shadow-[0_0_25px_#ff5ae2] transition-all flex items-center gap-2"
            >
              {copied ? <HiCheck /> : "Copy Summary"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;