export type SeedWord = {
  word: string;
  ipa?: string;
  pinyin?: string;
  traditional?: string;
  meaning: string;
  pos: string;
  example: string;
  exampleVi: string;
  difficulty: number;
  level: string;
  analysis?: string;
  topic: string;
  common?: boolean;
};

export type SeedTopic = {
  slug: string;
  nameVi: string;
  description: string;
  language: "english" | "chinese";
  emoji: string;
  difficulty: number;
  estMinutes: number;
};

export type SeedAchievement = {
  code: string;
  titleVi: string;
  description: string;
  icon: string;
  xpReward: number;
  category: string;
};
