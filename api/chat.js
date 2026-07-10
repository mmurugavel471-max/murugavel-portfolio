// /api/chat.js
// Vercel Serverless Function — calls OpenAI on the server side so your
// API key is never exposed to visitors' browsers.
//
// REQUIRED SETUP (do this in Vercel, not in this file):
//   1. Get an API key from https://platform.openai.com/api-keys
//   2. In Vercel: Project -> Settings -> Environment Variables
//      Add:  Name = OPENAI_API_KEY   Value = <your key>   (all environments)
//   3. Redeploy the project so the new env variable takes effect.
//
// EDIT the RESUME_CONTEXT block below with your real info — this is what
// grounds the AI's answers so it talks about YOU specifically, not generic stuff.

const RESUME_CONTEXT = `
You are a helpful assistant answering questions on behalf of Murugavel, a job
candidate, to visitors of his portfolio website (recruiters, hiring managers).

Answer only using the information below. If something is not covered here,
say you don't have that detail and suggest the visitor use the Contact page.
Keep answers short (2-4 sentences), friendly, and professional. Do not invent
facts about Murugavel that are not listed here.

--- Murugavel's info (EDIT THIS with your real details) ---
Name: Murugavel
Role: [Your job title, e.g. Full Stack Developer]
Summary: [2-3 sentence summary about your background and what you're looking for]
Skills: [List your real skills, e.g. HTML, CSS, JavaScript, Node.js, React, SQL]
Experience: [Company name, role, dates, 1-2 line description — repeat per job]
Education: [Degree, institution, years]
Projects: [Project name — short description — repeat per project]
Notice period: [e.g. Immediate / 30 days]
Work preference: [Remote / Hybrid / Onsite]
Location: Tamil Nadu, India
Contact: [Your email] | [Your phone] | [LinkedIn URL] | [GitHub URL]
--- end of info ---
`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing OPENAI_API_KEY. Add it in Vercel project settings." });
    return;
  }

  const userMessage = (req.body && req.body.message ? String(req.body.message) : "").trim();
  if (!userMessage) {
    res.status(400).json({ error: "Missing 'message' in request body." });
    return;
  }
  if (userMessage.length > 500) {
    res.status(400).json({ error: "Message too long." });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        temperature: 0.4,
        messages: [
          { role: "system", content: RESUME_CONTEXT },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", errText);
      res.status(502).json({ error: "AI service error. Please try again shortly." });
      return;
    }

    const data = await response.json();
    const reply =
      data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : "Sorry, I couldn't generate a response. Please try again.";

    res.status(200).json({ reply: reply });
  } catch (err) {
    console.error("Chat function error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
