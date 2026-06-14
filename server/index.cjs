const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");

require("dotenv").config();
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeParseAI(text) {
  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("AI JSON parse error:", err);
    return {};
  }
}

async function callAI(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.choices[0].message.content;
}

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
});


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CareerPilot AI backend is running");
});

app.post("/api/analyze", async (req, res) => {
  const { resumeText, targetRole, jobDescription } = req.body;

  if (!resumeText || !targetRole) {
    return res.status(400).json({
      error: "resumeText and targetRole are required",
    });
  }

  const resumeAgent = await callAI(`
You are a Resume Analysis Agent.

Analyze the following resume for the role: ${targetRole}.

Resume:
${resumeText}

Provide a concise professional summary.
`);

  const skillGapAgent = await callAI(`
You are a Skill Gap Agent.

Based on the resume summary below and the job description,
list the missing skills or improvements.

Resume Summary:
${resumeAgent}

Job Description:
${jobDescription}

Return only bullet points.
`);

  const interviewAgent = await callAI(`
You are an Interview Coach Agent.

Target role: ${targetRole}

Resume:
${resumeText}

Job description:
${jobDescription}

Skill gaps:
${JSON.stringify(skillGapAgent)}

Generate ONLY 5 top interview preparation questions.

Return ONLY valid JSON:
{
"behavioralQuestions": [],
"technicalQuestions": [],
"skillGapQuestions": [],
"recommendedAnswers": []
}
`);

  const learningAgent = await callAI(`
You are a Learning Path Agent.

Target role: ${targetRole}

Resume:
${resumeText}

Job description:
${jobDescription}

Skill gaps:
${JSON.stringify(skillGapAgent)}

Create ONLY the top 5 highest-priority learning recommendations for this candidate.
Focus on the biggest skill gaps for the target role.

Return ONLY valid JSON:
{
"recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3",
    "Recommendation 4",
    "Recommendation 5"
  ]
}

Do NOT return objects. Each recommendation must be a plain string.
`);

  const coverLetterAgent = await callAI(`
You are a Cover Letter Agent.

Write a professional cover letter for this candidate based on the resume, job description, and target role.
Do NOT use placeholders like:
[Your Name]
[Date]
[Hiring Manager's Name]
[Company Name]
[Company Address]

If this information is unavailable, omit those sections completely.

Start directly with:

Dear Hiring Manager,

Write a professional one-page cover letter in 3–4 paragraphs.

Rules:
- Keep it truthful.
- Do not invent experience.
- Match the job description.
- Highlight the strongest relevant skills.
- Use a confident but professional tone.
- Return ONLY the cover letter text.

Target role:
${targetRole}

Resume:
${resumeText}

Job description:
${jobDescription}
`);

  const atsAgent = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are an ATS resume matching expert.
Compare the resume against the job description.
Return ONLY valid JSON with this exact format:

{
"atsMatchScore": 0,
"keywordMatches": [],
"missingKeywords": [],
"atsSuggestions": []
}
`
      },
      {
        role: "user",
        content: `
Target Role: ${targetRole}

Resume:
${resumeText}

Job Description:
${jobDescription || "No job description provided"}
`
      }
    ],
  });

  let atsResult = {
    atsMatchScore: 0,
    keywordMatches: [],
    missingKeywords: [],
    atsSuggestions: [],
  };

  try {
    atsResult = safeParseAI(atsAgent.choices[0].message.content);
  } catch (error) {
    console.error("ATS JSON parse error:", error);
  }

  const interviewResult = safeParseAI(interviewAgent);
  const learningResult = safeParseAI(learningAgent);

  res.json({
    matchScore: atsResult.atsMatchScore || 0,
    summary: resumeAgent,
    skillGaps: skillGapAgent.split("\n").filter(item => item.trim() !== ""),
    interviewQuestions: [
      ...(interviewResult.behavioralQuestions || []),
      ...(interviewResult.technicalQuestions || []),
      ...(interviewResult.skillGapQuestions || [])
    ],
    learningPath: learningResult.recommendations || [],
    atsMatchScore: atsResult.atsMatchScore,
    keywordMatches: atsResult.keywordMatches,
    missingKeywords: atsResult.missingKeywords,
    atsSuggestions: atsResult.atsSuggestions,
    coverLetter: coverLetterAgent,
  });
});


app.post("/api/upload-pdf", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No PDF uploaded",
      });
    }

    const parser = new PDFParse({ data: req.file.buffer, });
    const data = await parser.getText();

    res.json({
      resumeText: data.text,
    });
  } catch (error) {
    console.error("pdf upload error:", error);
    res.status(500).json({
      error: "Failed to read PDF",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});