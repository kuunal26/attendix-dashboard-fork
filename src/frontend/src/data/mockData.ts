export interface Subject {
  code: string;
  name: string;
  color: string;
}

export const SECTION_LABELS: Record<string, string> = {
  first_year: "First Year",
  second_year: "Second Year",
  third_year: "Third Year",
  btech: "B.Tech",
};

// Empty placeholders for components not yet migrated
export const subjects: Subject[] = [];
