// ponytail: Static Municipal Lore Registry for Midgard Stock Exchange
// Avoids database bloat and saves network bandwidth on live 5s price polling.

export interface MunicipalLoreProfile {
  cityName: string;
  region: string;
  lore: string;
  specialty: string;
}

export const MUNICIPAL_LORE: Record<string, MunicipalLoreProfile> = {
  // 📍 Phase 0: Baseline Midgard Core
  PRT: {
    cityName: "Prontera",
    region: "Rune-Midgarts Kingdom",
    specialty: "Sovereign Banking & Royal Expeditions",
    lore: "The sovereign capital of the Rune-Midgarts Kingdom. Prontera Capital underwrites royal knight expeditions, municipal infrastructure bonds, and manages the Crown's imperial treasury reserves."
  },
  GEF: {
    cityName: "Geffen",
    region: "Rune-Midgarts Kingdom",
    specialty: "Arcanetech & Synthetic Alchemy",
    lore: "Towering magical laboratory and alchemical fabrication hub. Develops cutting-edge arcanetech devices, synthetic catalyst transmutations, and high-purity gemstone catalysts."
  },
  MOR: {
    cityName: "Morroc",
    region: "Sograt Desert",
    specialty: "Desert Commerce & Relic Salvage",
    lore: "The bustling desert commerce nexus connecting foreign caravans and Sograt spice merchants. High volatility driven by exotic relic salvage and desert oasis caravan trade."
  },
  PAY: {
    cityName: "Payon",
    region: "Rune-Midgarts Kingdom",
    specialty: "Forestry, Sacred Timber & Bowcraft",
    lore: "Deep forest woodworking and agrarian collective. Supplies sacred Ironwood, architectural timber, and elite artisan bows to guilds across the continent."
  },
  ALB: {
    cityName: "Alberta",
    region: "Rune-Midgarts Kingdom",
    specialty: "Maritime Logistics & Global Shipping",
    lore: "Midgard's principal deep-water harbor and international mercantile shipping fleet. Generates steady cash flow and defensive dividends from cargo throughput and maritime logistics."
  },

  // 🚀 Phase 1: Schwarzwald Republic & Frontier High-Tech
  LHZ: {
    cityName: "Lighthalzen",
    region: "Schwarzwald Republic",
    specialty: "Biotechnology & Somatology Cybernetics",
    lore: "The omni-corporate research titan of the Schwarzwald Republic. Reinvests 100% of profits into Somatology bio-laboratories, cybernetics, and autonomous guardian robotics."
  },
  EIN: {
    cityName: "Einbroch",
    region: "Schwarzwald Republic",
    specialty: "Heavy Metallurgy & Steam Engines",
    lore: "The industrial powerhouse of steam and iron. Operates sprawling blast furnaces, locomotive networks, and mineral foundries powering continental modernization."
  },
  YUN: {
    cityName: "Yuno",
    region: "Schwarzwald Republic",
    specialty: "Ancient Juperos Physics & Floating Estates",
    lore: "Floating city academy suspended by ancient Heart of Ymir physics. Finances speculative archaeological expeditions into the Juperos core and floating estate air-rights."
  },
  HUG: {
    cityName: "Hugel",
    region: "Schwarzwald Republic",
    specialty: "Monster Racing & Coastal Leisure",
    lore: "A secluded coastal haven operating seasonal monster race tracks and coastal airship tourism. High-beta micro-cap sensitive to recreational tourism spending."
  },

  // 🏛️ Phase 2: Rune-Midgarts Domestic Expansion
  ADB: {
    cityName: "Aldebaran",
    region: "Rune-Midgarts Kingdom",
    specialty: "Teleportation Utilities & Clockwork Infrastructure",
    lore: "The ubiquitous utility monopoly providing continent-wide teleportation networks, dimensional storage, and logistics. Ultra-stable dividend aristocrat."
  },
  CMD: {
    cityName: "Comodo",
    region: "Rune-Midgarts Kingdom",
    specialty: "Casino Gaming & Nightlife Entertainment",
    lore: "The luminous tropical entertainment capital. Generates revenues from high-stakes gambling dens, beach resorts, and nightlife discretionary spending."
  },
  IZL: {
    cityName: "Izlude",
    region: "Rune-Midgarts Kingdom",
    specialty: "Maritime Defense & Arena Tournaments",
    lore: "The fortified satellite port of Prontera. Operates maritime ferry transit to Byalan Island and warrior academy tournament facilities."
  },
  LUT: {
    cityName: "Lutie",
    region: "Rune-Midgarts Kingdom",
    specialty: "Automated Toy Assembly & Seasonal Goods",
    lore: "Automated toy manufacturing and clockwork assembly plants. Highly seasonal consumer demand driven by winter solstice festival commerce."
  },

  // ☀️ Phase 3: Theocratic Sovereign & Commodities
  RAC: {
    cityName: "Rachel",
    region: "Arunafeltz States",
    specialty: "Sovereign Gold Reserves & Ecclesiastical Tithes",
    lore: "The sovereign investment fund of the Freya Temple. Holds immense physical gold reserves and steady revenue streams from compulsory ecclesiastical tithes."
  },
  VEI: {
    cityName: "Veins",
    region: "Arunafeltz States",
    specialty: "Thor Volcanic Mining & Geothermal Energy",
    lore: "Geothermal mining collective extracting rare minerals, obsidian, and heat-resistant alloys from the molten depths of Thor Volcano."
  },
  JAW: {
    cityName: "Jawaii",
    region: "Autonomous Resort",
    specialty: "Ultra-Luxury Honeymoon Hospitality",
    lore: "Exclusive honeymoon island paradise operating under complete hospitality monopoly. High-margin luxury leisure catering to elite Midgard nobility."
  },
  UMB: {
    cityName: "Umbala",
    region: "Tribal Territories",
    specialty: "Primeval Shamanic Relics & Ecotourism",
    lore: "Deep jungle shamanic cooperative. Engages in exotic timber harvesting, bungee ecotourism, and speculative primeval relic barter."
  },

  // 🌏 Phase 4: Global Cultural & Agrarian Markets
  LOU: {
    cityName: "Louyang",
    region: "Global Project",
    specialty: "Traditional Herbal Healthcare & Acupuncture",
    lore: "Ancient highland pharmacy masters cultivating rare herbal remedies, acupuncture panaceas, and traditional pharmaceuticals with inelastic demand."
  },
  MOS: {
    cityName: "Moscovia",
    region: "Global Project",
    specialty: "Taiga Timber, Prime Furs & Mineral Trust",
    lore: "Czarist timber trusts and prime sable fur traders managing vast taiga forests and subterranean gemstone deposits."
  },
  AMA: {
    cityName: "Amatsu",
    region: "Global Project",
    specialty: "Forged Katana Steel & Silk Crafts",
    lore: "Historic coastal domain known for master-forged katana steel, handcrafted tatami silk, and cultural heritage tourism."
  },
  AYO: {
    cityName: "Ayothaya",
    region: "Global Project",
    specialty: "River Delta Agriculture & Floating Markets",
    lore: "Vibrant river delta civilization trading in staple grains, exotic spices, and sacred spirit shrine craftsmanship."
  },
  GON: {
    cityName: "Gonryun",
    region: "Global Project",
    specialty: "Taoist Celestial Real Estate & Elixirs",
    lore: "Floating mountain paradise dealing in immortality peaches, celestial talismans, and luxury high-altitude cultivation real estate."
  },
  BRA: {
    cityName: "Brasilis",
    region: "Global Project",
    specialty: "Rainforest Bio-Prospecting & Festival Events",
    lore: "Lush tropical metropolis specializing in annual carnival hospitality revenues and rainforest botanical bio-prospecting."
  },
  DEW: {
    cityName: "Dewata",
    region: "Global Project",
    specialty: "Volcanic Gold Veins & Exotic Spices",
    lore: "Volcanic archipelago rich in indigenous gold veins, rare vulcanized minerals, and high-value tribal spices."
  },
  MAL: {
    cityName: "Port Malaya",
    region: "Global Project",
    specialty: "Archipelago Cargo Logistics & Healthcare",
    lore: "Rapidly expanding archipelago trade terminal handling regional cargo distribution, medical supplies, and municipal transit."
  },

  // 💀 Phase 5: Outliers & Interdimensional Markets
  NIF: {
    cityName: "Nifflheim",
    region: "Realm of the Dead",
    specialty: "Cursed Antiquities & Distressed Soul Debt",
    lore: "Underworld ghost realm dealing in cursed antiquities and distressed soul debt. High-risk, zero-regulation speculative junk investments."
  },
  DIC: {
    cityName: "El Dicastes",
    region: "Ash Vacuum Frontier",
    specialty: "Refined Bradium & Extraplanar Minerals",
    lore: "Sapha and Laphine extraplanar mining alliance extracting refined Bradium ores and Yggdrasil sap energy across the dimensional rift."
  }
};
