// doseParser — best-effort extraction of posology from the free-text resource
// strings (e.g. "10-15 mg/kg/dose 6/6h"). It powers the dose calculator. The
// data is human-written so parsing is heuristic; the UI always shows a clear
// "confirm against official references" disclaimer.

const toNum = (s: string) => parseFloat(s.replace(",", "."));

export type PerKgDose = {
  min: number;
  max: number;
  per: "dose" | "dia" | "unknown";
  raw: string;
};

export type Concentration = {
  label: string;
  /** milligrams contained per 1 ml. */
  mgPerMl: number;
};

/** Doses per day inferred from frequency text (e.g. "8/8h" -> 3). */
export function parseFrequency(text: string): number | null {
  const interval = text.match(/(\d+)\s*\/\s*(\d+)\s*h/);
  if (interval) {
    const h = parseInt(interval[2], 10);
    if (h > 0) return 24 / h;
  }
  const xDia = text.match(/(\d+)\s*x\s*\/?\s*dia/i);
  if (xDia) return parseInt(xDia[1], 10);
  const vezes = text.match(/(\d+)\s*vez(?:es)?\s*(?:ao|por)\s*dia/i);
  if (vezes) return parseInt(vezes[1], 10);
  if (/dose única|1\s*x\s*\/?\s*dia|24\s*\/\s*24\s*h|1\s*vez\s*ao\s*dia|uma\s*vez\s*ao\s*dia|dose diária/i.test(text)) {
    return 1;
  }
  return null;
}

/** First mg/kg posology found in the text. */
export function parsePerKg(text: string): PerKgDose | null {
  const range = text.match(
    /(\d+(?:[.,]\d+)?)\s*(?:a|-|–|—|até)\s*(\d+(?:[.,]\d+)?)\s*mg\s*\/\s*kg(\s*\/\s*(dose|dia))?/i,
  );
  if (range) {
    return {
      min: toNum(range[1]),
      max: toNum(range[2]),
      per: (range[4]?.toLowerCase() as "dose" | "dia") || "unknown",
      raw: range[0],
    };
  }
  const single = text.match(/(\d+(?:[.,]\d+)?)\s*mg\s*\/\s*kg(\s*\/\s*(dose|dia))?/i);
  if (single) {
    const v = toNum(single[1]);
    return {
      min: v,
      max: v,
      per: (single[3]?.toLowerCase() as "dose" | "dia") || "unknown",
      raw: single[0],
    };
  }
  return null;
}

/** Liquid concentrations found in the presentation text (mg/ml, mg/X ml). */
export function parseConcentrations(text: string): Concentration[] {
  const out: Concentration[] = [];
  const seen = new Set<number>();
  const re = /(\d+(?:[.,]\d+)?)\s*mg\s*\/\s*(\d+(?:[.,]\d+)?)?\s*ml/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const mg = toNum(m[1]);
    const ml = m[2] ? toNum(m[2]) : 1;
    if (ml <= 0) continue;
    const mgPerMl = mg / ml;
    const key = Math.round(mgPerMl * 1000);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label: m[2] ? `${m[1]} mg/${m[2]} ml` : `${m[1]} mg/ml`, mgPerMl });
  }
  return out;
}

export type DoseResult = {
  perDoseMin: number;
  perDoseMax: number;
  dailyMin: number;
  dailyMax: number;
  freqPerDay: number | null;
};

/** Compute the dose for a given weight using a parsed posology + frequency. */
export function computeDose(
  perKg: PerKgDose,
  weightKg: number,
  freqPerDay: number | null,
): DoseResult {
  const totalMin = perKg.min * weightKg;
  const totalMax = perKg.max * weightKg;

  if (perKg.per === "dia") {
    const f = freqPerDay && freqPerDay > 0 ? freqPerDay : null;
    return {
      dailyMin: totalMin,
      dailyMax: totalMax,
      perDoseMin: f ? totalMin / f : totalMin,
      perDoseMax: f ? totalMax / f : totalMax,
      freqPerDay: f,
    };
  }

  // per dose (or unknown -> assume per dose)
  const f = freqPerDay && freqPerDay > 0 ? freqPerDay : null;
  return {
    perDoseMin: totalMin,
    perDoseMax: totalMax,
    dailyMin: f ? totalMin * f : totalMin,
    dailyMax: f ? totalMax * f : totalMax,
    freqPerDay: f,
  };
}

export const fmt = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? r.toString() : r.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
};
