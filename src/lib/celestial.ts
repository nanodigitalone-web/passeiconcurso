// Corpos celestes da trilha Aprender — partilhado entre a página da trilha
// e o widget compacto da Home.

export type CelestialBody = { nome: string; icone: string; cor: string; brilho: string; sistema: string };

export const CORPOS: CelestialBody[] = [
  { nome: "Terra",          icone: "🌍", cor: "#22c55e", brilho: "#16a34a", sistema: "Sistema Solar"   },
  { nome: "Lua",            icone: "🌙", cor: "#94a3b8", brilho: "#64748b", sistema: "Sistema Solar"   },
  { nome: "Marte",          icone: "🔴", cor: "#ef4444", brilho: "#b91c1c", sistema: "Sistema Solar"   },
  { nome: "Mercúrio",       icone: "🪨", cor: "#a8a29e", brilho: "#78716c", sistema: "Sistema Solar"   },
  { nome: "Vénus",          icone: "🌟", cor: "#fbbf24", brilho: "#d97706", sistema: "Sistema Solar"   },
  { nome: "Júpiter",        icone: "🪐", cor: "#f97316", brilho: "#c2410c", sistema: "Sistema Solar"   },
  { nome: "Saturno",        icone: "💛", cor: "#eab308", brilho: "#a16207", sistema: "Sistema Solar"   },
  { nome: "Úrano",          icone: "🩵", cor: "#22d3ee", brilho: "#0891b2", sistema: "Sistema Solar"   },
  { nome: "Neptuno",        icone: "💙", cor: "#6366f1", brilho: "#4338ca", sistema: "Sistema Solar"   },
  { nome: "Plutão",         icone: "⚫", cor: "#6b7280", brilho: "#374151", sistema: "Sistema Solar"   },
  { nome: "Próxima Cen.",   icone: "🔺", cor: "#f43f5e", brilho: "#be123c", sistema: "Alpha Centauri" },
  { nome: "Alpha Cen A",    icone: "☀️", cor: "#fde047", brilho: "#ca8a04", sistema: "Alpha Centauri" },
  { nome: "Alpha Cen B",    icone: "🌠", cor: "#fb923c", brilho: "#ea580c", sistema: "Alpha Centauri" },
  { nome: "Neb. Órion",     icone: "🌌", cor: "#a855f7", brilho: "#7e22ce", sistema: "Via Láctea"     },
  { nome: "Sagitário A*",   icone: "🕳️", cor: "#334155", brilho: "#0f172a", sistema: "Via Láctea"     },
  { nome: "Cisne X-1",      icone: "✴️", cor: "#0ea5e9", brilho: "#0369a1", sistema: "Via Láctea"     },
  { nome: "Eta Carinae",    icone: "💥", cor: "#fde68a", brilho: "#b45309", sistema: "Via Láctea"     },
  { nome: "Sirius B",       icone: "⬜", cor: "#e0f2fe", brilho: "#7dd3fc", sistema: "Via Láctea"     },
  { nome: "Andrómeda",      icone: "🌀", cor: "#8b5cf6", brilho: "#5b21b6", sistema: "Galáxias"       },
  { nome: "Triângulo M33",  icone: "🔮", cor: "#ec4899", brilho: "#9d174d", sistema: "Galáxias"       },
  { nome: "Gr. Nuvem Mag.", icone: "🌟", cor: "#06b6d4", brilho: "#0e7490", sistema: "Galáxias"       },
  { nome: "NGC 1300",       icone: "🌐", cor: "#d946ef", brilho: "#a21caf", sistema: "Galáxias"       },
  { nome: "Quasar 3C 273",  icone: "⚡", cor: "#f0abfc", brilho: "#a21caf", sistema: "Universo"       },
  { nome: "Big Bang",       icone: "♾️", cor: "#f9fafb", brilho: "#e2e8f0", sistema: "Universo"       },
];

export const getCorpo = (lvl: number) => CORPOS[(lvl - 1) % CORPOS.length];
export const getCiclo = (lvl: number) => Math.floor((lvl - 1) / CORPOS.length) + 1;
