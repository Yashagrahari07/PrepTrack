export type GoalType =
  | 'sde_backend'
  | 'sde_frontend'
  | 'sde_fullstack'
  | 'dsa_competitive'
  | 'jee_advanced'
  | 'gate_cs'
  | 'certification_aws'
  | 'certification_gcp'
  | 'certification_azure'
  | 'language_learning'
  | 'custom';

export interface GoalOption {
  value: GoalType;
  label: string;
  targetHours: number;
}

export interface GoalGroup {
  group: string;
  items: GoalOption[];
}

export const GOAL_GROUPS: GoalGroup[] = [
  {
    group: 'Software Engineering',
    items: [
      { value: 'sde_backend', label: 'SDE 1 Backend Engineering', targetHours: 15 },
      { value: 'sde_frontend', label: 'SDE 1 Frontend Engineering', targetHours: 12 },
      { value: 'sde_fullstack', label: 'SDE 1 Full-Stack Engineering', targetHours: 18 },
    ],
  },
  {
    group: 'Competitive Exams',
    items: [
      { value: 'dsa_competitive', label: 'DSA / Competitive Programming', targetHours: 20 },
      { value: 'jee_advanced', label: 'JEE Advanced (India)', targetHours: 25 },
      { value: 'gate_cs', label: 'GATE Computer Science', targetHours: 20 },
    ],
  },
  {
    group: 'Cloud Certifications',
    items: [
      { value: 'certification_aws', label: 'AWS Certification', targetHours: 10 },
      { value: 'certification_gcp', label: 'Google Cloud Certification', targetHours: 10 },
      { value: 'certification_azure', label: 'Azure Certification', targetHours: 10 },
    ],
  },
  {
    group: 'Other',
    items: [
      { value: 'language_learning', label: 'Language Learning', targetHours: 7 },
      { value: 'custom', label: 'Custom Goal', targetHours: 10 },
    ],
  },
];

export const GOAL_LABELS: Record<GoalType, string> = {
  sde_backend: 'SDE 1 Backend Engineering',
  sde_frontend: 'SDE 1 Frontend Engineering',
  sde_fullstack: 'SDE 1 Full-Stack Engineering',
  dsa_competitive: 'DSA / Competitive Programming',
  jee_advanced: 'JEE Advanced (India)',
  gate_cs: 'GATE Computer Science',
  certification_aws: 'AWS Certification',
  certification_gcp: 'Google Cloud Certification',
  certification_azure: 'Azure Certification',
  language_learning: 'Language Learning',
  custom: 'Custom Goal',
};

export const GOAL_MESSAGES: Record<GoalType, string> = {
  sde_backend: 'Consistency is your greatest advantage. Keep building momentum toward your SDE 1 Backend target.',
  sde_frontend: 'Consistency builds great products. Keep building toward your Frontend SDE goal.',
  sde_fullstack: 'Full-stack mastery comes from daily reps. Stay consistent.',
  dsa_competitive: 'Every problem solved is a pattern mastered. Keep the streak alive.',
  jee_advanced: 'JEE demands depth and speed. Daily practice is non-negotiable.',
  gate_cs: 'GATE rewards conceptual clarity. Study smart, stay consistent.',
  certification_aws: 'Cloud certifications validate what you build. Keep practicing.',
  certification_gcp: 'Cloud certifications validate what you build. Keep practicing.',
  certification_azure: 'Cloud certifications validate what you build. Keep practicing.',
  language_learning: 'Fluency comes from daily exposure. Keep the streak alive.',
  custom: '',
};

export const DEFAULT_REFERENCE_URL = 'https://neetcode.io/practice/practice/neetcode150';

export const SDE_GOAL_TYPES: GoalType[] = ['sde_backend', 'sde_frontend', 'sde_fullstack', 'dsa_competitive'];