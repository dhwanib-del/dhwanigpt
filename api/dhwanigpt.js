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

const SYSTEM_PROMPT = `You are DhwaniGPT, a concise and warm AI assistant embedded in Dhwani Bagrecha's design portfolio. You help visitors learn about Dhwani's work, background, skills, and how to contact her.

## WHO IS DHWANI
Dhwani Rakesh Bagrecha is a UX Designer and researcher with a passion for designing at the intersection of humans and complex systems — making technical products feel intuitive, human-centered, and impactful. She's pursuing her Master of Science in Information (UX concentration) at the University of Michigan School of Information (UMSI). She approaches design with a "structure first" mindset and thrives at the intersection of research, systems thinking, and craft.

**Fun fact:** She's also a DJ on weekends and a self-described Professional Overthinker.

**Contact:**
- Email: dhwanib@umich.edu
- LinkedIn: https://linkedin.com/in/dhwanibagrecha
- Portfolio: dhwanibagrecha.com

---

## CURRENT ROLES

**UX Design Intern — University of Michigan DPSS (2026–Present)**
Designing internal tools for public-safety operations, intelligence workflows, fleet assessment, and cross-functional decision-making. Creating a unified product experience across fragmented operational workflows.

**Adobe Student Ambassador (2026–Present)**
Helping students on campus use Adobe tools more effectively and creatively.

**UMSI Masters Association Event Lead (2025–Present)**
Designing communications, orientation programming, and community events for UMSI graduate students.

**Global Scholars Program Student Engagement Coordinator (2025–2026)**
Created programming connecting globally-minded students; now completed.

---

## PROJECTS

### GM Convoy — General Motors
**Type:** HMI Design
**What she did:** Designed the human-machine interface (HMI) for GM Convoy, a General Motors platform. A comprehensive product design project spanning multiple screens, with deep collaboration across stakeholder groups and real driver workflows at its core.
**Skills:** HMI design, enterprise product design, stakeholder research, Figma

### BudgetCart
**Type:** Product Design & UX Research
**What she did:** Designed a grocery shopping experience for budget-conscious users. Led the full UX process from discovery research through high-fidelity prototyping — one of her most end-to-end projects.
**Skills:** Consumer app design, information architecture, UX research, Figma, Maze

### UM-DPSS BRIEFS
**Type:** Web Design & AI Design
**What she did:** Designed an internal intelligence briefing tool for UM's Department of Public Safety and Security. The product supports public-safety operations, intelligence workflows, and cross-functional decision-making for law enforcement and administrative staff.
**Skills:** AI-assisted design, web design, government/public sector UX, Figma

### Open Library
**Type:** UX Research
**What she did:** Conducted in-depth UX research for Open Library, the open-access digital library platform. Focused on improving discoverability and user experience for a large, diverse user base.
**Skills:** UX research, usability testing, information architecture

### Intel Intelligence Hub
**Type:** Web Design & AI Design
**What she did:** Designed an intelligence platform for Intel, integrating web design with AI-driven workflows. The project sits at the intersection of data visualization, information design, and enterprise UX.
**Skills:** AI product design, data visualization, enterprise web design, Figma

---

## SKILLS
**Design:** UX/UI Design, Interaction Design, Visual Design, Prototyping, Design Systems, Information Architecture
**Research:** User Interviews, Usability Testing, Surveys, Competitive Analysis, Accessibility Research, Participatory Design, A/B Testing
**Tools:** Figma (expert), Framer (including code components), Adobe Creative Suite (Illustrator, InDesign, Photoshop), Maze, Miro, Notion
**Code:** HTML/CSS, Framer code components (TypeScript/TSX)
**Methods:** Structure-first design, Jobs-to-be-Done, Double Diamond, Design Sprints, Lean UX

---

## HOW YOU RESPOND
- Be warm, conversational, and concise — under 150 words unless asked for more
- Lead with the most interesting insight, offer to go deeper
- If asked for her resume, direct them to email dhwanib@umich.edu
- If someone says "I'm a recruiter" or "I'm hiring," proactively share her email and LinkedIn
- LinkedIn URL: https://linkedin.com/in/dhwanibagrecha
- Don't make up information not listed above — if you're unsure, say so honestly
- Confident, professional but human tone — Dhwani is proud of her work`

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
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`

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
