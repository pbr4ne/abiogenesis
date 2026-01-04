import { LifeFormDef, LifeFormType } from "./EvolutionTypes";

export const LIFEFORMS: Record<LifeFormType, LifeFormDef> = {
  prokaryote: {
    type: "prokaryote",
    iconKey: "lf_prokaryote",
    habitats: ["sea"],
    rarity: 1,
    mutatesTo: ["eukaryote", "virus"],
    colour: { r: 255, g: 92, b: 92 }
  },

  eukaryote: {
    type: "eukaryote",
    iconKey: "lf_eukaryote",
    habitats: ["sea"],
    rarity: 1,
    mutatesTo: ["algae", "mollusk", "fungi"],
    colour: { r: 255, g: 176, b: 77 }
  },

  algae: {
    type: "algae",
    iconKey: "lf_algae",
    habitats: ["sea"],
    rarity: 1,
    mutatesTo: ["tree", "flower"],
    colour: { r: 56, g: 214, b: 140 }
  },

  tree: {
    type: "tree",
    iconKey: "lf_tree",
    habitats: ["land"],
    rarity: 2,
    mutatesTo: [],
    colour: { r: 40, g: 186, b: 72 }
  },

  flower: {
    type: "flower",
    iconKey: "lf_flower",
    habitats: ["land"],
    rarity: 2,
    mutatesTo: [],
    colour: { r: 255, g: 92, b: 209 }
  },

  mollusk: {
    type: "mollusk",
    iconKey: "lf_mollusk",
    habitats: ["sea"],
    rarity: 1,
    mutatesTo: ["fish", "octopus", "insect"],
    colour: { r: 0, g: 227, b: 255 }
  },

  fish: {
    type: "fish",
    iconKey: "lf_fish",
    habitats: ["sea"],
    rarity: 1,
    mutatesTo: ["amphibian"],
    colour: { r: 64, g: 143, b: 255 }
  },

  amphibian: {
    type: "amphibian",
    iconKey: "lf_amphibian",
    habitats: ["sea", "land"],
    rarity: 2,
    mutatesTo: ["reptile"],
    colour: { r: 168, g: 255, b: 76 }
  },

  reptile: {
    type: "reptile",
    iconKey: "lf_reptile",
    habitats: ["land"],
    rarity: 2,
    mutatesTo: ["dinosaur", "rodent"],
    colour: { r: 255, g: 224, b: 60 }
  },

  dinosaur: {
    type: "dinosaur",
    iconKey: "lf_dinosaur",
    habitats: ["land"],
    rarity: 3,
    mutatesTo: ["bird"],
    colour: { r: 255, g: 92, b: 40 }
  },

  bird: {
    type: "bird",
    iconKey: "lf_bird",
    habitats: ["air"],
    rarity: 2,
    mutatesTo: [],
    colour: { r: 176, g: 120, b: 255 }
  },

  rodent: {
    type: "rodent",
    iconKey: "lf_rodent",
    habitats: ["land"],
    rarity: 3,
    mutatesTo: ["cat", "whale", "ape"],
    colour: { r: 255, g: 151, b: 235 }
  },

  cat: {
    type: "cat",
    iconKey: "lf_cat",
    habitats: ["land"],
    rarity: 3,
    mutatesTo: [],
    colour: { r: 255, g: 112, b: 176 }
  },

  whale: {
    type: "whale",
    iconKey: "lf_whale",
    habitats: ["sea"],
    rarity: 3,
    mutatesTo: [],
    colour: { r: 0, g: 168, b: 255 }
  },

  ape: {
    type: "ape",
    iconKey: "lf_ape",
    habitats: ["land"],
    rarity: 3,
    mutatesTo: ["human", "alien"],
    colour: { r: 255, g: 168, b: 0 }
  },

  human: {
    type: "human",
    iconKey: "lf_human",
    habitats: ["land"],
    rarity: 4,
    mutatesTo: [],
    colour: { r: 0, g: 255, b: 195 }
  },

  alien: {
    type: "alien",
    iconKey: "lf_alien",
    habitats: ["land"],
    rarity: 5,
    mutatesTo: [],
    colour: { r: 154, g: 255, b: 0 }
  },

  octopus: {
    type: "octopus",
    iconKey: "lf_octopus",
    habitats: ["sea"],
    rarity: 2,
    mutatesTo: [],
    colour: { r: 110, g: 92, b: 255 }
  },

  insect: {
    type: "insect",
    iconKey: "lf_insect",
    habitats: ["land"],
    rarity: 1,
    mutatesTo: [],
    colour: { r: 255, g: 255, b: 0 }
  },

  fungi: {
    type: "fungi",
    iconKey: "lf_fungi",
    habitats: ["land", "sea"],
    rarity: 2,
    mutatesTo: ["crystal"],
    colour: { r: 185, g: 60, b: 255 }
  },

  crystal: {
    type: "crystal",
    iconKey: "lf_crystal",
    habitats: ["land", "sea"],
    rarity: 4,
    mutatesTo: [],
    colour: { r: 0, g: 255, b: 255 }
  },

  virus: {
    type: "virus",
    iconKey: "lf_virus",
    habitats: ["sea", "land", "air"],
    rarity: 2,
    mutatesTo: [],
    colour: { r: 255, g: 0, b: 120 }
  }
};
