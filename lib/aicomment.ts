
// ── Shared low-level Gemini caller ────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in environment variables");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt + "\n\nComment:" }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text)
    .join("")
    .trim();

  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

// ── Principal comment (fires on admin approval when no manual comment given) ──

interface SubjectForPrincipalComment {
  subjectName: string;
  grade: string;
  totalScore: number;
  maxTotalScore: number;
}

interface PrincipalCommentInput {
  studentName: string;
  className: string;
  termName: string;
  percentage: number;
  position: number;
  totalStudentsInClass: number;
  totalStudentsInDept: number;
  grade: string;
  subjects: SubjectForPrincipalComment[];
}

export async function generateAIPrincipalComment(
  input: PrincipalCommentInput,
): Promise<string> {
  const {
    studentName,
    className,
    termName,
    percentage,
    position,
    totalStudentsInClass,
    totalStudentsInDept,
    grade,
    subjects,
  } = input;

  // Use dept count for position text when class is split by department (SSS)
  const positionTotal =
    totalStudentsInDept > 0 && totalStudentsInDept !== totalStudentsInClass
      ? totalStudentsInDept
      : totalStudentsInClass;

  const subjectSummary = subjects
    .map((s) => `${s.subjectName}: ${s.totalScore}/${s.maxTotalScore} (${s.grade})`)
    .join(", ");

  const prompt = `Write a 2-sentence school principal's report card comment. Be formal and concise.

Facts: ${studentName}, ${className}, ${termName} term, ${percentage.toFixed(1)}%, position ${position} of ${positionTotal}, grade ${grade}, subjects: ${subjectSummary}.

Rules:
- Exactly 2 sentences, no more
- Under 15 words total
- Do not start with "I"
- Use student name only once
- End with encouragement
- Return only the comment text`;

  return callGemini(prompt);
}

// ── Teacher comment (fires when teacher clicks "AI Suggest" on empty comment) ─

interface SubjectForTeacherComment {
  subjectName: string;
  testScore: number;
  examScore: number;
  practicalScore: number;
  hasPractical: boolean;
}

interface TeacherCommentInput {
  studentName: string;
  className: string;
  termName: string;
  scores: SubjectForTeacherComment[];
}

export async function generateAITeacherComment(
  input: TeacherCommentInput,
): Promise<string> {
  const { studentName, className, termName, scores } = input;

  const totalObtained = scores.reduce(
    (sum, s) =>
      sum + s.testScore + s.examScore + (s.hasPractical ? s.practicalScore : 0),
    0,
  );
  const totalObtainable = scores.length * 100;
  const percentage =
    totalObtainable > 0 ? (totalObtained / totalObtainable) * 100 : 0;

  const subjectSummary = scores
    .map((s) => {
      const total =
        s.testScore + s.examScore + (s.hasPractical ? s.practicalScore : 0);
      return `${s.subjectName}: ${total}/100`;
    })
    .join(", ");

  const prompt = `Write a 2-sentence class teacher's report card comment. Be warm but professional.

Facts: ${studentName}, ${className}, ${termName} term, ${percentage.toFixed(1)}% overall. Scores: ${subjectSummary}.

Rules:
- Exactly 2 sentences
- Under 15 words total
- Do not start with "I"
- Use student's first name only once
- End with encouragement or advice
- Return only the comment text, no quotes`;

  return callGemini(prompt);
}
