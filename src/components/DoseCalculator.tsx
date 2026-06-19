import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { RecursoItem } from "@/services";
import {
  parsePerKg, parseFrequency, parseConcentrations, computeDose, fmt,
  type Concentration,
} from "@/lib/doseParser";
import { Calculator, ChevronsUpDown, Check, AlertTriangle, Weight } from "lucide-react";
import { cn } from "@/lib/utils";

type DrugOption = { item: RecursoItem; key: string };

export const DoseCalculator = ({ itens }: { itens: RecursoItem[] }) => {
  const [open, setOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [peso, setPeso] = useState("");
  const [concIdx, setConcIdx] = useState<number>(-1);

  // Only drugs with a parseable mg/kg posology can be calculated.
  const options = useMemo<DrugOption[]>(
    () =>
      itens
        .filter((it) => parsePerKg(it.valor) !== null)
        .map((it, i) => ({ item: it, key: `${it.nome}-${i}` })),
    [itens],
  );

  const selected = options.find((o) => o.key === selectedKey)?.item ?? null;

  const concentrations = useMemo<Concentration[]>(
    () => (selected?.nota ? parseConcentrations(selected.nota) : []),
    [selected],
  );

  const pe(weight: number) => weight; // noop placeholder (kept tree-shake friendly)

  const peso_n = parseFloat(peso.replace(",", "."));
  const perKg = selected ? parsePerKg(selected.valor) : null;
  const freq = selected ? parseFrequency(selected.valor) : null;

  const result =
    perKg && peso_n > 0 ? computeDose(perKg, peso_n, freq) : null;

  const conc = concIdx >= 0 ? concentrations[concIdx] : null;

  return (
    <Card className="mb-5 border-primary/20 bg-primary/5 p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Calculator className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold leading-tight">Calculadora de dose</h3>
          <p className="text-[11px] text-muted-foreground">
            Pesquise o fármaco, indique o peso e a apresentação para estimar a dose.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Drug search */}
        <div className="space-y-1.5">
          <Label className="text-xs">Fármaco</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between rounded-xl font-normal"
              >
                <span className="truncate">{selected ? selected.nome : "Pesquisar fármaco..."}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Pesquisar fármaco..." />
                <CommandList>
                  <CommandEmpty>Sem fármacos calculáveis.</CommandEmpty>
                  <CommandGroup>
                    {options.map((o) => (
                      <CommandItem
                        key={o.key}
                        value={o.item.nome}
                        onSelect={() => {
                          setSelectedKey(o.key);
                          setConcIdx(-1);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedKey === o.key ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">{o.item.nome}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Weight */}
        <div className="space-y-1.5">
          <Label htmlFor="peso" className="text-xs">Peso (kg)</Label>
          <div className="relative">
            <Weight className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="peso"
              inputMode="decimal"
              placeholder="Ex.: 12"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>
        </div>
      </div>

      {/* Presentation */}
      {selected && concentrations.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <Label className="text-xs">Apresentação (para calcular o volume)</Label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setConcIdx(-1)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                concIdx === -1
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              Apenas mg
            </button>
            {concentrations.map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setConcIdx(i)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                  concIdx === i
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {selected && (
        <div className="mt-4 rounded-xl bg-card p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Posologia base</p>
          <p className="mb-3 text-sm font-medium">{selected.valor}</p>

          {!result ? (
            <p className="text-sm text-muted-foreground">Indique um peso válido para calcular.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3 rounded-lg bg-primary/10 px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">Por dose</span>
                <span className="font-display text-base font-bold text-primary">
                  {fmt(result.perDoseMin)}
                  {result.perDoseMax !== result.perDoseMin && ` – ${fmt(result.perDoseMax)}`} mg
                  {conc && (
                    <span className="ml-1 text-sm font-semibold text-foreground">
                      ({fmt(result.perDoseMin / conc.mgPerMl)}
                      {result.perDoseMax !== result.perDoseMin &&
                        ` – ${fmt(result.perDoseMax / conc.mgPerMl)}`}{" "}
                      ml)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 px-3 text-xs text-muted-foreground">
                <span>Total diário</span>
                <span className="font-semibold text-foreground">
                  {fmt(result.dailyMin)}
                  {result.dailyMax !== result.dailyMin && ` – ${fmt(result.dailyMax)}`} mg
                  {result.freqPerDay ? ` · ${fmt(result.freqPerDay)}x/dia` : ""}
                </span>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] font-medium text-warning-strong">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Estimativa automática a partir do texto. Confirme sempre a dose, a dose máxima e a
              apresentação nas normas oficiais antes de prescrever.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
