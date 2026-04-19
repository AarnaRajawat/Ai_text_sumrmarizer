import { GoogleGenAI } from "@google/genai";
import { useState } from "react";
import { IoSparklesSharp } from "react-icons/io5";

function App() {
  const [text, setText] = useState(" ");
  const [summary, setSummary] = useState(" ");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const countWords = (str) => {
    return str
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const countSentences = (str) => {
    return str
      .trim()
      .split(/[/!?]+/)
      .filter((sentence) => sentence.trim().length > 0).length;
  };

 

  const pasteText = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
    } catch (error) {
      console.error("Failed to paste", error);
      setError("Failed to paste from clipboard please use Ctrl+V to paste");
    }
  };

  const summarizeText = async () => {
    if (!text.trim()) {
      setError("Please enter some text to summmarize.");
      return;
    }

    if (text.trim().length < 50) {
      setError(
        "text is too short to summarize. Please enter at least 50 characters",
      );
      return;
    }
    setLoading(true);
    setError(null);
    setSummary(" ");

    try {
      const ai = new GoogleGenAI({
        apiKey: import.meta.env.VITE_GEMINI_API_key,
      });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents:
          "please Provide a concise summary of the following text:\n\n" + text,
      });
      const responseText = response.text;
      console.log("AI Response: ", responseText)
      setSummary(responseText)


    } catch (err) {
      console.error("summarization failed", err);
      setError(err.message || "An error occurred while summarizing the text");
    }
    finally{
      setLoading(false)
    }
  };

  const copyToClipboard = async () => {
    try{
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(()=> setCopied(false), 2000)

    } catch (error) {
      console.error("Failed to copy:", error)
      setError("Failed to copy clipboard . Please try again .")
    }
  }

  const clearAll = () => {
    setText("");
    setSummary("");
    setError(null);
    setCopied(false);
  }



  return <div className="min-h-screen bg-linear-to-br from-purple-100 via-blue-100 to-pink-100">
  
  
  {/* <button onClick={summarizeText}>summarize</button> */}
  <div className="container mx-auto px-4 py-12">
    <div className="text-center mb-12">
      <h1 className="text-6xl font-bold mb-4 bg-linear-to-r from-purple-600 md:text-5xl lg:text-6xl  to-blue-600 bg-clip-text text-transparent flex items-center justify-center gap-3"> 
        <IoSparklesSharp className="text-purple-600" /> AI Text Summarizer</h1>
        <p className="text-xl text-base-content/70 font-medium">Powered by Google gemini AI</p>
    </div>
    <div className="card bg-base-content shadow-2xl max-w-5xl mx-auto">
      <div className="card bg-base-content shadow-2xl max-w-5xl mx-auto">
        <div className="card-body p-8">
          <div>
            <label className="text-lg font-semibold">
              Enter your text
            </label>
          </div>
          <div className="tooltip">
            <div className="tooltip " data-tip={`${text.length} characters`}>
              <div className="badge badge-lg badge-ghost gap-2">
                {countWords(text)} words & {countSentences(text)} sentences


              </div>


            </div>

          </div>

        </div>
      </div>
      <div >

      </div>

    </div>

  </div>


  
  
   </div>;
}

export default App;
