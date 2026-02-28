import { ClassLevel, Department, TermName } from "@/types/enums";

// Ordered class progression
export const CLASS_PROGRESSION: Record<string, string | null> = {
  [ClassLevel.PRIMARY_2]: ClassLevel.PRIMARY_3,
  [ClassLevel.PRIMARY_3]: ClassLevel.PRIMARY_4,
  [ClassLevel.PRIMARY_4]: ClassLevel.PRIMARY_5,
  [ClassLevel.PRIMARY_5]: ClassLevel.JSS_1,
  [ClassLevel.JSS_1]: ClassLevel.JSS_2,
  [ClassLevel.JSS_2]: ClassLevel.JSS_3,
  [ClassLevel.JSS_3]: "SSS_1_DEPT_REQUIRED", // Requires department assignment
  [ClassLevel.SSS_1]: ClassLevel.SSS_2,
  [ClassLevel.SSS_2]: null, // Graduates
};

export const CLASS_SECTION: Record<string, "primary" | "jss" | "sss"> = {
  [ClassLevel.PRIMARY_2]: "primary",
  [ClassLevel.PRIMARY_3]: "primary",
  [ClassLevel.PRIMARY_4]: "primary",
  [ClassLevel.PRIMARY_5]: "primary",
  [ClassLevel.JSS_1]: "jss",
  [ClassLevel.JSS_2]: "jss",
  [ClassLevel.JSS_3]: "jss",
  [ClassLevel.SSS_1]: "sss",
  [ClassLevel.SSS_2]: "sss",
};

export const CLASS_ORDER: Record<string, number> = {
  [ClassLevel.PRIMARY_2]: 1,
  [ClassLevel.PRIMARY_3]: 2,
  [ClassLevel.PRIMARY_4]: 3,
  [ClassLevel.PRIMARY_5]: 4,
  [ClassLevel.JSS_1]: 5,
  [ClassLevel.JSS_2]: 6,
  [ClassLevel.JSS_3]: 7,
  [ClassLevel.SSS_1]: 8,
  [ClassLevel.SSS_2]: 9,
};

export interface TermScore {
  term: TermName;
  percentage: number;
}

export interface PromotionEligibility {
  eligible: boolean;
  reason: string;
  requiresDepartment: boolean;
  willGraduate: boolean;
  nextClass: string | null;
}

/**
 * Determine if a student should be auto-promoted.
 * A student must pass (≥50%) in ALL three terms of the session.
 */
// export function checkPromotionEligibility(
//   currentClassName: string,
//   termScores: TermScore[]
// ): PromotionEligibility {
//   const nextClass = CLASS_PROGRESSION[currentClassName];

//   if (nextClass === null) {
//     return {
//       eligible: true,
//       reason: "Student has completed SSS 2 and will graduate.",
//       requiresDepartment: false,
//       willGraduate: true,
//       nextClass: null,
//     };
//   }

//   const hasAllThreeTerms = termScores.length === 3;
//   if (!hasAllThreeTerms) {
//     return {
//       eligible: false,
//       reason: "All three term results must be available before promotion.",
//       requiresDepartment: false,
//       willGraduate: false,
//       nextClass,
//     };
//   }

//   const allPassed = termScores.every((t) => t.percentage >= 50);

//   if (!allPassed) {
//     const failedTerms = termScores
//       .filter((t) => t.percentage < 50)
//       .map((t) => t.term)
//       .join(", ");
//     return {
//       eligible: false,
//       reason: `Student failed the following term(s): ${failedTerms}. A minimum of 50% is required in all three terms.`,
//       requiresDepartment: false,
//       willGraduate: false,
//       nextClass,
//     };
//   }

//   const requiresDepartment = nextClass === "SSS_1_DEPT_REQUIRED";

//   return {
//     eligible: true,
//     reason: allPassed
//       ? "Student passed all three terms and is eligible for promotion."
//       : "Student is not eligible for promotion.",
//     requiresDepartment,
//     willGraduate: false,
//     nextClass: requiresDepartment ? null : nextClass,
//   };
// }

export function checkPromotionEligibility(
  currentClassName: string,
  termScores: TermScore[],
): PromotionEligibility {
  const nextClass = CLASS_PROGRESSION[currentClassName];

  if (nextClass === null) {
    return {
      eligible: true,
      reason: "Student has completed SSS 2 and will graduate.",
      requiresDepartment: false,
      willGraduate: true,
      nextClass: null,
    };
  }

  if (termScores.length === 0) {
    return {
      eligible: false,
      reason: "No term results available.",
      requiresDepartment: false,
      willGraduate: false,
      nextClass,
    };
  }

  // Cumulative average across all available terms must be ≥ 50%
  const average =
    termScores.reduce((sum, t) => sum + t.percentage, 0) / termScores.length;

  if (average < 50) {
    return {
      eligible: false,
      reason: `Cumulative average is ${average.toFixed(1)}%. Minimum 50% required.`,
      requiresDepartment: false,
      willGraduate: false,
      nextClass,
    };
  }

  const requiresDepartment = nextClass === "SSS_1_DEPT_REQUIRED";

  return {
    eligible: true,
    reason: `Cumulative average is ${average.toFixed(1)}%. Student is eligible for promotion.`,
    requiresDepartment,
    willGraduate: false,
    nextClass: requiresDepartment ? null : nextClass,
  };
}

export function getSSSClassName(department: Department): ClassLevel | null {
  if (department === Department.NONE) return null;
  return ClassLevel.SSS_1;
}
