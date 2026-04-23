import { useState } from "react";
import { IoSparklesSharp } from "react-icons/io5";
import { HiPencilAlt, HiCheck } from "react-icons/hi";

function App() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const countWords = (str) =>
    str.trim().split(/\s+/).filter((w) => w.length > 0).length;

  const countSentences = (str) =>
    str.trim().split(/[.!?]+/).filter((s) => s.trim().length > 0).length;

  const pasteText = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
    } catch {
      setError("Failed to paste. Use Ctrl+V.");
    }
  };

  const summarizeText = async () => {
    if (!text.trim()) {
      setError("Enter text first");
      return;
    }

    setLoading(true);
    setError(null);
    setSummary("");

    try {
      const response = await fetch("http://localhost:5000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Backend error");
      }

      setSummary(data.summary);
    } catch (err) {
      console.error("❌ FRONTEND ERROR:", err);
      setError(err.message);
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

  const clearAll = () => {
    setText("");
    setSummary("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black px-4 py-10">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          <IoSparklesSharp className="text-purple-600" />
          AI Text Summarizer
        </h1>
        <p className="text-gray-600 mt-2">React Frontend + Node.js Backend</p>
      </div>

      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl p-8 border border-gray-200">
        <label className="font-semibold mb-2 block">Enter your text</label>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-40 border rounded-lg p-4 bg-gray-50 focus:ring-2 focus:ring-purple-400 outline-none transition-all"
          placeholder="Type or paste text here..."
        />

        <div className="mt-3 text-gray-500 text-sm">
          {countWords(text)} words • {countSentences(text)} sentences
        </div>

        <div className="mt-5 flex gap-3 flex-wrap">
          <button onClick={pasteText} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition">
            Paste Text
          </button>

          <button onClick={clearAll} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition">
            Clear
          </button>

          <button
            onClick={summarizeText}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold disabled:opacity-50 transition"
          >
            {loading ? "Thinking..." : "Summarize with AI"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {summary && (
          <div className="mt-8 border-t pt-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-purple-800">Resulting Summary</h2>
              <button 
                onClick={copyToClipboard} 
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition"
              >
                {copied ? <><HiCheck className="text-green-500" /> Copied!</> : <><HiPencilAlt /> Copy Summary</>}
              </button>
            </div>

            <div className="p-5 bg-purple-50 rounded-lg text-gray-800 leading-relaxed border border-purple-100">
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;