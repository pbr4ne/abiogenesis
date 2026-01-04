export type Habitat = "sea" | "land" | "air";

export type RGB = {
  r: number;
  g: number;
  b: number;
};

export const LIFEFORM_COLOURS = {
  red: { r: 220, g: 60, b: 60 },
  orange: { r: 240, g: 140, b: 40 },
  yellow: { r: 240, g: 220, b: 80 },
  green: { r: 80, g: 200, b: 120 },
  blue: { r: 70, g: 140, b: 230 },
  purple: { r: 160, g: 90, b: 200 }
} as const;

export type LifeFormColourKey = keyof typeof LIFEFORM_COLOURS;

export type LifeFormType =
  | "prokaryote"
  | "eukaryote"
  | "algae"
  | "tree"
  | "flower"
  | "snail"
  | "fish"
  | "amphibian"
  | "reptile"
  | "dinosaur"
  | "bird"
  | "rodent"
  | "cat"
  | "whale"
  | "ape"
  | "human"
  | "alien"
  | "squid"
  | "insect"
  | "fungi"
  | "crystal"
  | "virus";

export type LifeFormDef = {
  type: LifeFormType;
  iconKey: string;
  habitats: Habitat[];
  rarity: number;
  mutatesTo: LifeFormType[];
  colour: RGB;
};

export type LifeFormInstance = {
  id: string;
  type: LifeFormType;
  mutationRate: number;
  reproductionRate: number;
  survivalRate: number;
  row: number;
  col: number;
};
