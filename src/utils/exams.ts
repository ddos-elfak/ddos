export interface Exam {
  id: string;
  title: string;
  date: string;
  time?: string;
  track: string;
  semester: number;
  period: string;
  basic: boolean;
}

export function examYear(semester: number): number {
  return Math.ceil(semester / 2);
}

export function filterExams(exams: readonly Exam[], year: number, track: string): Exam[] {
  return exams.filter((exam) => exam.basic && examYear(exam.semester) === year && exam.track === track);
}
