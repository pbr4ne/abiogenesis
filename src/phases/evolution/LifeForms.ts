import { LIFEFORM_COLOURS, LifeFormDef, LifeFormType } from "./EvolutionTypes";

export const LIFEFORMS: Record<LifeFormType, LifeFormDef> = {
  prokaryote: {
    type: "prokaryote",
    iconKey: "lf_prokaryote",
    habitats: ["sea"],
    rarity: 1,
    mutatesTo: ["eukaryote", "virus"],
    colour: LIFEFORM_COLOURS.red,
  },

  eukaryote: {
    type: "eukaryote",
    iconKey: "lf_eukaryote",
    habitats: ["sea"],
    rarity: 1,
    mutatesTo: ["algae", "snail", "fungi"],
    colour: LIFEFORM_COLOURS.red,
  },

  algae: {
    type: "algae",
    iconKey: "lf_algae",
    habitats: ["sea"],
    rarity: 1,
    mutatesTo: ["tree", "flower"],
    colour: LIFEFORM_COLOURS.green,
  },

  tree: {
    type: "tree",
    iconKey: "lf_tree",
    habitats: ["land"],
    rarity: 2,
    mutatesTo: [],
    colour: LIFEFORM_COLOURS.green,
  },

  flower: {
    type: "flower",
    iconKey: "lf_flower",
    habitats: ["land"],
    rarity: 2,
    mutatesTo: [],
    colour: LIFEFORM_COLOURS.green,
  },

  snail: {
    type: "snail",
    iconKey: "lf_snail",
    habitats: ["sea"],
    rarity: 1,
    mutatesTo: ["fish", "squid"],
    colour: LIFEFORM_COLOURS.yellow,
  },

  fish: {
    type: "fish",
    iconKey: "lf_fish",
    habitats: ["sea"],
    rarity: 1,
    mutatesTo: ["amphibian"],
    colour: LIFEFORM_COLOURS.yellow,
  },

  amphibian: {
    type: "amphibian",
    iconKey: "lf_amphibian",
    habitats: ["sea", "land"],
    rarity: 2,
    mutatesTo: ["reptile"],
    colour: LIFEFORM_COLOURS.yellow,
  },

  reptile: {
    type: "reptile",
    iconKey: "lf_reptile",
    habitats: ["land"],
    rarity: 2,
    mutatesTo: ["dinosaur", "rodent"],
    colour: LIFEFORM_COLOURS.yellow,
  },

  dinosaur: {
    type: "dinosaur",
    iconKey: "lf_dinosaur",
    habitats: ["land"],
    rarity: 3,
    mutatesTo: ["bird"],
    colour: LIFEFORM_COLOURS.yellow,
  },

  bird: {
    type: "bird",
    iconKey: "lf_bird",
    habitats: ["air"],
    rarity: 2,
    mutatesTo: [],
    colour: LIFEFORM_COLOURS.yellow,
  },

  rodent: {
    type: "rodent",
    iconKey: "lf_rodent",
    habitats: ["land"],
    rarity: 3,
    mutatesTo: ["cat", "whale", "ape"],
    colour: LIFEFORM_COLOURS.orange,
  },

  cat: {
    type: "cat",
    iconKey: "lf_cat",
    habitats: ["land"],
    rarity: 3,
    mutatesTo: [],
    colour: LIFEFORM_COLOURS.orange,
  },

  whale: {
    type: "whale",
    iconKey: "lf_whale",
    habitats: ["sea"],
    rarity: 3,
    mutatesTo: [],
    colour: LIFEFORM_COLOURS.orange,
  },

  ape: {
    type: "ape",
    iconKey: "lf_ape",
    habitats: ["land"],
    rarity: 3,
    mutatesTo: ["human", "alien"],
    colour: LIFEFORM_COLOURS.orange,
  },

  human: {
    type: "human",
    iconKey: "lf_human",
    habitats: ["land"],
    rarity: 4,
    mutatesTo: [],
    colour: LIFEFORM_COLOURS.orange,
  },

  alien: {
    type: "alien",
    iconKey: "lf_alien",
    habitats: ["land"],
    rarity: 5,
    mutatesTo: [],
    colour: LIFEFORM_COLOURS.orange,
  },

  squid: {
    type: "squid",
    iconKey: "lf_squid",
    habitats: ["sea"],
    rarity: 2,
    mutatesTo: [],
    colour: LIFEFORM_COLOURS.yellow,
  },

  insect: {
    type: "insect",
    iconKey: "lf_insect",
    habitats: ["land"],
    rarity: 1,
    mutatesTo: [],
    colour: LIFEFORM_COLOURS.yellow,
  },

  fungi: {
    type: "fungi",
    iconKey: "lf_fungi",
    habitats: ["land", "sea"],
    rarity: 2,
    mutatesTo: ["crystal"],
    colour: LIFEFORM_COLOURS.purple,
  },

  crystal: {
    type: "crystal",
    iconKey: "lf_crystal",
    habitats: ["land", "sea"],
    rarity: 4,
    mutatesTo: [],
    colour: LIFEFORM_COLOURS.purple,
  },

  virus: {
    type: "virus",
    iconKey: "lf_virus",
    habitats: ["sea", "land", "air"],
    rarity: 2,
    mutatesTo: [],
    colour: LIFEFORM_COLOURS.purple,
  },
};
