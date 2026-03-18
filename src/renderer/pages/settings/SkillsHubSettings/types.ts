export type SkillInfo = {
  name: string;
  description: string;
  location: string;
  isCustom: boolean;
};

export type ExternalSource = {
  name: string;
  path: string;
  source: string;
  skills: Array<{ name: string; description: string; path: string }>;
};
