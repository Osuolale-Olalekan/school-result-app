// lib/aicomment.ts
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
  totalStudentsInDept: number; // <-- ADDED: used for the actual position text
  grade: string;
  subjects: SubjectForComment[];
}

export async function generateAIPrincipalComment(
  input: CommentInput,
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

  // Use department count for position display when it differs from class count.
  // If they are the same (Primary/JSS with no department split), it makes no difference.
  const positionTotal =
    totalStudentsInDept > 0 && totalStudentsInDept !== totalStudentsInClass
      ? totalStudentsInDept
      : totalStudentsInClass;

  const subjectSummary = subjects
    .map(
      (s) =>
        `${s.subjectName}: ${s.totalScore}/${s.maxTotalScore} (${s.grade})`,
    )
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt + "\n\nComment:" }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.5,
        },
      }),
    },
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

// // lib/ai-comment.ts
// // Generates a principal's comment for a report card using Google Gemini Flash.
// // Only called when the admin does not provide a manual comment on approval.

// interface SubjectForComment {
//   subjectName: string;
//   grade: string;
//   totalScore: number;
//   maxTotalScore: number;
// }

// interface CommentInput {
//   studentName: string;
//   className: string;
//   termName: string;
//   percentage: number;
//   position: number;
//   totalStudentsInClass: number;
//   grade: string;
//   subjects: SubjectForComment[];
// }

// export async function generateAIPrincipalComment(
//   input: CommentInput,
// ): Promise<string> {
//   const {
//     studentName,
//     className,
//     termName,
//     percentage,
//     position,
//     totalStudentsInClass,
//     grade,
//     subjects,
//   } = input;

//   const subjectSummary = subjects
//     .map(
//       (s) =>
//         `${s.subjectName}: ${s.totalScore}/${s.maxTotalScore} (${s.grade})`,
//     )
//     .join(", ");

//   const prompt = `Write a 2-sentence school principal's report card comment. Be formal and concise.

// Facts: ${studentName}, ${className}, ${termName} term, ${percentage.toFixed(1)}%, position ${position} of ${totalStudentsInClass}, grade ${grade}, subjects: ${subjectSummary}.

// Rules:
// - Exactly 2 sentences, no more
// - Under 15 words total
// - Do not start with "I"
// - Use student name only once
// - End with encouragement
// - Return only the comment text`;

//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) {
//     throw new Error("GEMINI_API_KEY is not set in environment variables");
//   }

//   const response = await fetch(
//     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [{ text: prompt + "\n\nComment:" }],
//           },
//         ],
//         generationConfig: {
//           maxOutputTokens: 500,
//           temperature: 0.5,
//         },
//       }),
//     },
//   );

//   if (!response.ok) {
//     const errorBody = await response.text();
//     throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
//   }

//   const data = (await response.json()) as {
//     candidates: Array<{
//       content: {
//         parts: Array<{ text: string }>;
//       };
//     }>;
//   };

//   const text = data.candidates?.[0]?.content?.parts
//     ?.map((p) => p.text)
//     .join("")
//     .trim();

//   if (!text) {
//     throw new Error("Gemini returned an empty response");
//   }

//   return text;
// }
