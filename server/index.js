import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/status", (_req, res) => {
  res.json({ aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post("/api/plan", async (req, res) => {
  const { tasks, date, startTime, endTime, language, preferences, order } = req.body || {};
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "API_KEY_MISSING", message: "Gemini API key is not configured on the server." });
  }
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: "NO_TASKS", message: "Add at least one task." });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // The model name can be changed here as Google's model availability evolves.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.35 }
    });
    const lang = language === "en" ? "English" : "Russian";
    const prompt = `
You are WILDWORLD AI, a careful personal day-planning assistant.
Respond ONLY with valid JSON in ${lang}. Do not wrap in markdown.
Create a realistic schedule using the user's actual tasks and constraints.
Respect the available interval, deadlines, estimated durations and priorities.
Do not schedule outside the interval. Include short breaks where practical.
If all tasks do not fit, do not pretend they fit: identify what should be moved.
Never invent tasks. Keep task ids exactly as provided.
JSON schema:
{
 "title": "string",
 "summary": "string",
 "fits": true,
 "overloadMessage": "string",
 "blocks": [{"taskId":"string","taskTitle":"string","start":"HH:MM","end":"HH:MM","duration":30,"priority":"high|medium|low","note":"string","kind":"task|break"}],
 "recommendations": ["string"],
 "deferredTaskIds": ["string"]
}
Planning date: ${date}
Available time: ${startTime}–${endTime}
Preferred order: ${order}
Additional wishes: ${preferences || "None"}
Tasks:
${JSON.stringify(tasks)}
`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.blocks)) throw new Error("AI returned an unexpected response.");
    res.json({ plan: parsed, model: "gemini-2.5-flash" });
  } catch (error) {
    console.error("Gemini planning error:", error);
    res.status(502).json({
      error: "AI_REQUEST_FAILED",
      message: "The AI service could not create a plan. Check the server key, model availability and connection."
    });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));
app.listen(port, () => console.log(`WILDWORLD AI running at http://localhost:${port}`));
