// lib/ai-comment.ts
// Generates a principal's comment for a report card using Google Gemini Flash.
// Only called when the admin does not provide a manual comment on approval.

interface SubjectForComment {
  subjectName: string;
  grade: string;
  totalScore: number;
  maxTotalScore: number;
}

interface CommentInput {
  studentName: string;
  className: string;
  termName: string;
  percentage: number;
  position: number;
  totalStudentsInClass: number;
  grade: string;
  subjects: SubjectForComment[];
}

export async function generateAIPrincipalComment(
  input: CommentInput
): Promise<string> {
  const {
    studentName,
    className,
    termName,
    percentage,
    position,
    totalStudentsInClass,
    grade,
    subjects,
  } = input;

  const subjectSummary = subjects
    .map((s) => `${s.subjectName}: ${s.totalScore}/${s.maxTotalScore} (${s.grade})`)
    .join(", ");

  const prompt = `You are a school principal writing a brief, formal end-of-term comment on a student's report card.

Student: ${studentName}
Class: ${className}
Term: ${termName} Term
Overall Score: ${percentage.toFixed(1)}%
Position in Class: ${position} out of ${totalStudentsInClass}
Overall Grade: ${grade}
Subject Scores: ${subjectSummary}

Write a single short paragraph (2–3 sentences) as a principal's comment. 
- Be encouraging but honest
- Reference their performance level (excellent, good, needs improvement, etc.)
- Mention one or two notable strengths or areas to improve based on the subject scores
- Use formal, professional school report language
- Do NOT use the student's name more than once
- Do NOT start with "I" 
- Return only the comment text, nothing else`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as {
    candidates: Array<{
      content: {
        parts: Array<{ text: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text)
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}