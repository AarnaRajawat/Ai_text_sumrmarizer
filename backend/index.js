import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();

// 1. Middleware
app.use(cors({
  origin: [
      "http://localhost:5173",
      "https://textsumrizer.netlify.app"
    ],
  methods: ["POST", "GET"],
}));
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;

// Debugging
console.log("🔑 BACKEND API KEY =", API_KEY ? "Loaded" : "NOT Loaded");

// 2. Summarize Route
app.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // UPDATED URL: Changed /v1/ to /v1beta/
   const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: `Summarize this text concisely:\n\n${text}` }]
          }
        ]
      },
      { headers: { "Content-Type": "application/json" } }
    );

    // Navigate the JSON response structure
    const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      return res.status(500).json({ error: "AI returned an empty response." });
    }

    res.json({ summary: result });

  } catch (error) {
    console.error("❌ BACKEND ERROR:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Backend error", 
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});