/**
 * Academic Search & Aliases Utility for FOLE
 * Single source of truth for normalizing queries, resolving academic aliases,
 * and performing subject-aware search across the KTU curriculum hierarchy.
 */

// Common academic subject aliases and keyword expansions
const ACADEMIC_ALIASES_MAP: Record<string, string[]> = {
  // Mathematics
  maths: ["mathematics", "calculus", "mat 101", "mat101", "mat 102", "mat102", "linear algebra"],
  math: ["mathematics", "calculus", "mat 101", "mat101", "mat 102", "mat102"],
  mathematics: ["maths", "calculus", "mat 101", "mat101", "linear algebra"],
  calculus: ["mathematics", "maths", "single variable calculus", "multivariable calculus"],
  "mat 101": ["mathematics", "maths", "engineering mathematics"],
  mat101: ["mathematics", "maths", "engineering mathematics", "mat 101"],
  "mat 102": ["mathematics", "maths", "engineering mathematics"],
  mat102: ["mathematics", "maths", "engineering mathematics", "mat 102"],
  laplace: ["laplace transforms", "laplace transform", "mathematics"],

  // Engineering Graphics / Drawing
  eg: ["engineering graphics", "engineering drawing", "est 110", "est110", "drafting", "cad", "projections"],
  ed: ["engineering graphics", "engineering drawing", "est 110", "est110"],
  graphics: ["engineering graphics", "engineering drawing", "projections", "isometric"],
  drawing: ["engineering graphics", "engineering drawing", "est 110"],
  "engineering drawing": ["engineering graphics", "est 110", "est110"],
  "engineering graphics": ["engineering drawing", "eg", "drawing", "est 110", "est110"],
  "est 110": ["engineering graphics", "engineering drawing", "eg"],
  est110: ["engineering graphics", "engineering drawing", "est 110"],
  projection: ["engineering graphics", "projections", "isometric projection", "orthographic"],
  projections: ["engineering graphics", "projection", "isometric", "orthographic"],

  // Basic Electrical Engineering
  bee: ["basics of electrical engineering", "electrical engineering", "est 130", "est130", "circuits"],
  electrical: ["basics of electrical engineering", "electrical", "bee", "est 130", "est130", "circuits"],
  circuits: ["basics of electrical engineering", "electrical engineering", "dc circuits", "ac fundamentals"],
  "est 130": ["basics of electrical engineering", "electrical engineering", "bee"],
  est130: ["basics of electrical engineering", "electrical engineering", "est 130"],

  // Data Structures & Algorithms
  dsa: ["data structures", "algorithms", "data structures & algorithms", "cst 201", "cst201"],
  ds: ["data structures", "algorithms", "cst 201"],
  "data structures": ["dsa", "algorithms", "cst 201", "cst201"],
  algorithms: ["data structures", "dsa", "cst 201"],
  "cst 201": ["data structures", "data structures & algorithms", "dsa"],
  cst201: ["data structures", "data structures & algorithms", "cst 201"],

  // Civil Engineering
  civil: ["basics of civil engineering", "civil engineering", "est 120", "est120", "surveying"],
  bce: ["basics of civil engineering", "civil engineering", "est 120"],
  "est 120": ["basics of civil engineering", "civil engineering"],
  est120: ["basics of civil engineering", "civil engineering", "est 120"],

  // Mechanical Engineering
  mech: ["basics of mechanical engineering", "mechanical engineering", "est 140", "est140", "thermodynamics"],
  mechanical: ["basics of mechanical engineering", "mechanical engineering", "est 140"],
  bme: ["basics of mechanical engineering", "mechanical engineering", "est 140"],
  thermo: ["thermodynamics", "basics of mechanical engineering"],
  thermodynamics: ["thermo", "basics of mechanical engineering"],
  "est 140": ["basics of mechanical engineering", "mechanical engineering"],
  est140: ["basics of mechanical engineering", "mechanical engineering", "est 140"],

  // Chemistry
  chem: ["chemistry", "engineering chemistry", "cyt 100", "cyt100"],
  chemistry: ["engineering chemistry", "chem", "cyt 100", "cyt100"],
  "engineering chemistry": ["chemistry", "chem", "cyt 100"],
  "cyt 100": ["engineering chemistry", "chemistry", "chem"],
  cyt100: ["engineering chemistry", "chemistry", "cyt 100"],

  // Physics
  phy: ["physics", "engineering physics", "pht 100", "pht100"],
  phys: ["physics", "engineering physics", "pht 100", "pht100"],
  physics: ["engineering physics", "phy", "pht 100", "pht100"],
  "engineering physics": ["physics", "phy", "pht 100"],
  "pht 100": ["engineering physics", "physics", "phy"],
  pht100: ["engineering physics", "physics", "pht 100"],

  // Programming
  prog: ["programming in c", "c programming", "problem solving and programming", "est 102"],
  programming: ["programming in c", "c programming", "problem solving and programming", "est 102", "python"],
  "c programming": ["programming in c", "programming", "est 102"],
  "c prog": ["programming in c", "c programming", "est 102"],
  "est 102": ["programming in c", "problem solving and programming"],
  est102: ["programming in c", "problem solving and programming", "est 102"],
  python: ["programming", "problem solving and programming"],

  // Engineering Mechanics
  mechanics: ["engineering mechanics", "est 100", "est100"],
  "engineering mechanics": ["mechanics", "est 100", "est100"],
  "est 100": ["engineering mechanics", "mechanics"],
  est100: ["engineering mechanics", "mechanics", "est 100"],

  // Humanities & Management
  constitution: ["constitution of india", "mcn 102"],
  "constitution of india": ["constitution", "mcn 102"],
  "life skills": ["hun 102"],
};

/**
 * Normalizes an academic search query by trimming, lowercasing,
 * collapsing multiple whitespace characters, and normalizing punctuation.
 */
export function normalizeAcademicQuery(raw: string): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/[\-_/\\,.:;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips all spaces and punctuation to create a compact alphanumeric string
 * for code matching (e.g., "MAT-101" -> "mat101", "EST 110" -> "est110").
 */
export function compactCode(raw: string): string {
  if (!raw) return "";
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Returns all candidate search terms for a query, including:
 * 1. The original normalized query
 * 2. The compact version without spaces
 * 3. Any mapped aliases
 * 4. Distinct individual significant words
 */
export function getAcademicCandidateTerms(rawQuery: string): string[] {
  const normalized = normalizeAcademicQuery(rawQuery);
  if (!normalized) return [];

  const compact = compactCode(rawQuery);
  const terms = new Set<string>([normalized]);

  if (compact && compact !== normalized) {
    terms.add(compact);
  }

  // Direct alias expansion
  if (ACADEMIC_ALIASES_MAP[normalized]) {
    for (const alias of ACADEMIC_ALIASES_MAP[normalized]) {
      terms.add(alias);
      const compactAlias = compactCode(alias);
      if (compactAlias) terms.add(compactAlias);
    }
  }

  // Compact key alias expansion (e.g. "mat101" -> "mat 101")
  if (compact && ACADEMIC_ALIASES_MAP[compact]) {
    for (const alias of ACADEMIC_ALIASES_MAP[compact]) {
      terms.add(alias);
    }
  }

  // Token-level expansions for multi-word queries (e.g. "engineering drawing")
  const tokens = normalized.split(" ").filter((t) => t.length > 2);
  for (const token of tokens) {
    if (ACADEMIC_ALIASES_MAP[token]) {
      for (const alias of ACADEMIC_ALIASES_MAP[token]) {
        terms.add(alias);
      }
    }
  }

  return Array.from(terms);
}

/**
 * Checks whether an academic target text matches a search query or its aliases.
 */
export function matchesAcademicTarget(
  target: string | null | undefined,
  query: string,
  candidateTerms?: string[]
): boolean {
  if (!target) return false;
  const normalizedTarget = normalizeAcademicQuery(target);
  const compactTarget = compactCode(target);
  const terms = candidateTerms || getAcademicCandidateTerms(query);

  for (const term of terms) {
    if (normalizedTarget.includes(term)) return true;
    if (compactTarget.includes(compactCode(term))) return true;
  }

  return false;
}

/**
 * Checks whether a subject matches the search query or any of its aliases.
 * Supports title, code, and short_description.
 */
export function matchesSubjectQuery(
  subject: {
    title?: string | null;
    code?: string | null;
    short_description?: string | null;
    description?: string | null;
  },
  query: string,
  candidateTerms?: string[]
): boolean {
  const terms = candidateTerms || getAcademicCandidateTerms(query);

  if (subject.title && matchesAcademicTarget(subject.title, query, terms)) return true;
  if (subject.code && matchesAcademicTarget(subject.code, query, terms)) return true;
  if (subject.short_description && matchesAcademicTarget(subject.short_description, query, terms)) return true;
  if (subject.description && matchesAcademicTarget(subject.description, query, terms)) return true;

  return false;
}

