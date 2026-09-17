// ─────────────────────────────────────────────────────────────────────────────
// api/dhwanigpt.js  —  Vercel Serverless Function (FREE with Google Gemini)
//
// SETUP (all free, no credit card):
//  1. Go to aistudio.google.com → "Get API key" → create one → copy it
//  2. Go to vercel.com → sign up with GitHub → New Project → import a repo
//     (create a blank GitHub repo, add this file to api/dhwanigpt.js, push)
//  3. In Vercel dashboard → Settings → Environment Variables → add:
//       GEMINI_API_KEY = AIza...
//  4. Deploy → copy URL: https://your-app.vercel.app/api/dhwanigpt
//  5. In Framer, select DhwaniGPT component → paste URL into "API Endpoint"
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are DhwaniGPT, a concise and warm AI assistant embedded in Dhwani Bhanushali's design portfolio. You help visitors learn about Dhwani's work, background, skills, and how to contact her.

## WHO IS DHWANI
Dhwani Bagrecha is a UX Designer and researcher with a passion for designing at the intersection of humans and complex systems — making technical products feel intuitive, human-centered, and impactful. She earned her Master of Science in Information (UX concentration) from the University of Michigan School of Information (UMSI) in December 2025, and her BS in Psychology (with minors in Entrepreneurship & Innovation and Leadership of Organizations) from Michigan State University in three years.

**Contact:**
- Email: dhwanib@umich.edu
- LinkedIn: https://linkedin.com/in/dhwanibagrecha
- Portfolio: dhwanibagrecha.com

---

## CASE STUDIES & IMPACT

### DPSS — Washtenaw County Department of Public Social Services
**Role:** UX Researcher & Designer
**What she did:** Redesigned the benefits navigation experience for residents seeking county social services. Ran participatory design sessions and usability tests with 20+ real beneficiaries. Presented findings to county commissioners.
**Impact:** 38% reduction in task completion time · 50,000+ residents served · improved accessibility compliance
**Skills:** Participatory design, government UX, accessibility research, usability testing, Figma, Dovetail

### Amazon — Alexa Smart Home / Devices
**Role:** UX Design Intern (Summer 2024)
**What she did:** Designed a revamped onboarding flow for Alexa smart home devices (0→1, shipped to production). Ran A/B testing to validate design decisions.
**Impact:** 22% reduction in onboarding drop-off · shipped to millions of Alexa device users · design system contributions adopted by the team
**Skills:** 0→1 design, A/B testing, design systems, cross-functional collaboration, Figma

### GM Convoy — General Motors
**Role:** Product Design Intern
**What she did:** Designed the GM Convoy B2B logistics platform for trucking/supply chain. Created 40+ screens. Conducted 15 stakeholder and driver interviews.
**Impact:** 31% improvement in driver task success rate · 40+ screens · 15 stakeholder interviews synthesized
**Skills:** Enterprise UX, B2B product design, systems design, Figma, Miro

### BudgetCart
**Role:** Lead UX Designer (Capstone)
**What she did:** Grocery shopping app for budget-conscious users. Led full UX process from discovery to high-fidelity prototype.
**Impact:** 89% task success rate (n=30) · 4.6/5 satisfaction score · top capstone at UMSI
**Skills:** Consumer mobile, information architecture, Figma, Maze

### MaizeTix
**Role:** Product Designer
**What she did:** Ticketing platform for University of Michigan events. Reduced friction in ticket purchasing and improved event discovery.
**Impact:** 45% reduction in time-to-purchase · 500+ students in pilot
**Skills:** Mobile UX, event-tech, Figma

### Iska Press
**Role:** Digital Design Lead
**What she did:** Built digital brand identity and publication layout system for an independent literary press. Designed 20+ editorial layouts.
**Skills:** Editorial design, brand identity, typography, Figma, Adobe InDesign

### Partiful
**Role:** UX Research Intern
**What she did:** Discovery research for new social event features. Conducted 12 user interviews; insights adopted into Q3 product roadmap.
**Skills:** Generative research, affinity mapping, social product UX, Dovetail

---

## SKILLS
**Design:** UX/UI, Interaction Design, Visual Design, Prototyping, Design Systems, Information Architecture
**Research:** User Interviews, Usability Testing, Surveys, Competitive Analysis, Accessibility Research, Participatory Design, A/B Testing
**Tools:** Figma (expert), Framer, Maze, Dovetail, Miro, Notion, Adobe Creative Suite
**Code:** HTML/CSS, React basics, Framer code components (TypeScript)
**Methods:** Jobs-to-be-Done, Design Sprints, Double Diamond, Lean UX, Atomic Design

---

## HOW YOU RESPOND
- Be warm, conversational, and concise — under 150 words unless asked for more
- Lead with the most interesting metric or insight, offer to go deeper
- If asked for her resume, direct them to email dhwanib@umich.edu
- If someone says "I'm a recruiter" or "I'm hiring," proactively share her email and LinkedIn
- LinkedIn URL: https://linkedin.com/in/dhwanibagrecha
- Don't make up information not listed above
- Confident, professional but human tone`

export default async function handler(req, res) {
    // ── CORS ──────────────────────────────────────────────────────────────────
    const origin = req.headers.origin || ""
    const isFramer =
        /\.framer\.app$/.test(origin) ||
        /\.framer\.website$/.test(origin) ||
        /\.framerusercontent\.com$/.test(origin) ||
        origin.includes("framer.com") ||
        process.env.NODE_ENV === "development"

    res.setHeader("Access-Control-Allow-Origin", isFramer ? origin : "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") return res.status(200).end()
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

    // ── Validate ──────────────────────────────────────────────────────────────
    const { message, history = [] } = req.body || {}
    if (!message?.trim()) return res.status(400).json({ error: "message required" })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" })

    // ── Build conversation for Gemini ─────────────────────────────────────────
    // Gemini uses { role: "user" | "model", parts: [{ text }] }
    const historyMessages = Array.isArray(history)
        ? history
              .filter((m) => m.role && m.content)
              .slice(-10)
              .map((m) => ({
                  role: m.role === "assistant" ? "model" : "user",
                  parts: [{ text: String(m.content) }],
              }))
        : []

    const contents = [
        ...historyMessages,
        { role: "user", parts: [{ text: message.trim() }] },
    ]

    // ── Call Gemini API ───────────────────────────────────────────────────────
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents,
                generationConfig: {
                    maxOutputTokens: 450,
                    temperature: 0.7,
                },
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("Gemini API error:", data)
            throw new Error(data.error?.message || `HTTP ${response.status}`)
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!reply) throw new Error("Empty response from Gemini")

        return res.status(200).json({ reply })
    } catch (e) {
        console.error("DhwaniGPT error:", e)
        return res.status(500).json({ error: "Something went wrong. Try again." })
    }
}