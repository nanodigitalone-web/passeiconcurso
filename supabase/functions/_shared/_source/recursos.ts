// Recursos clínicos — conteúdo de referência PAGO, servido APENAS pela edge
// function gated `recursos` (que valida acesso trial/pago). NÃO é importado pelo
// bundle do cliente, por isso nunca chega ao browser sem verificação de acesso.
//
// AVISO CLÍNICO: conteúdo base com fins de estudo. Doses e protocolos devem ser
// confirmados em fontes oficiais (normas do MINSA, OMS, bulários) antes de uso
// clínico real.

export type RecursoItem = { nome: string; valor: string; nota?: string };
export type RecursoTipo =
  | "doses"
  | "classes"
  | "algoritmos"
  | "protocolos"
  | "terminologias"
  | "sinais";
export type RecursoSeccao = {
  id: string;
  tipo: RecursoTipo;
  titulo: string;
  itens: RecursoItem[];
};
export type RecursoCategoria = {
  concursoId: string;
  categoriaId: string;
  seccoes: RecursoSeccao[];
};

const medicinaInterna: RecursoSeccao[] = [
  {
    id: "mi-doses", tipo: "doses", titulo: "Doses farmacológicas essenciais",
    itens: [
      { nome: "Adrenalina (anafilaxia)", valor: "0,3-0,5 mg IM (1:1000), repetir cada 5-15 min", nota: "Pediatria: 0,01 mg/kg" },
      { nome: "Furosemida (EAP)", valor: "20-40 mg EV lento, titular conforme resposta" },
      { nome: "Hidrocortisona", valor: "100-200 mg EV (crise asmática/anafilaxia)" },
      { nome: "Insulina rápida (CAD)", valor: "0,1 U/kg/h em perfusão EV" },
      { nome: "Salbutamol nebulizado", valor: "2,5-5 mg, repetir conforme necessário" },
      { nome: "Diazepam (convulsão)", valor: "10 mg EV/rectal, repetir 1x se necessário" },
    ],
  },
  {
    id: "mi-classes", tipo: "classes", titulo: "Fármacos por classe farmacológica",
    itens: [
      { nome: "IECA", valor: "Enalapril, Lisinopril, Captopril", nota: "HTA, ICC; cuidado na hipercaliemia" },
      { nome: "Bloqueadores dos canais de cálcio", valor: "Amlodipina, Nifedipina, Verapamil" },
      { nome: "Diuréticos de ansa", valor: "Furosemida — congestão/edema" },
      { nome: "Beta-bloqueadores", valor: "Bisoprolol, Carvedilol, Atenolol" },
      { nome: "Estatinas", valor: "Sinvastatina, Atorvastatina — dislipidemia" },
      { nome: "Antibióticos beta-lactâmicos", valor: "Amoxicilina, Ceftriaxona, Cefalexina" },
    ],
  },
  {
    id: "mi-algoritmos", tipo: "algoritmos", titulo: "Algoritmos de abordagem",
    itens: [
      { nome: "Dor torácica", valor: "ECG + tropinina → SCA? → AAS, oxigénio se SpO2<90%, referir" },
      { nome: "Cetoacidose diabética", valor: "Fluidos (SF 0,9%) → insulina → repor potássio → corrigir causa" },
      { nome: "Sépsis", valor: "Hora 1: hemoculturas, antibiótico, fluidos 30 ml/kg, lactato" },
      { nome: "AVC agudo", valor: "Avaliar tempo de início → TAC → excluir hemorragia → conduta" },
    ],
  },
  {
    id: "mi-protocolos", tipo: "protocolos", titulo: "Protocolos clínicos",
    itens: [
      { nome: "Crise hipertensiva", valor: "Diferenciar urgência de emergência; reduzir PA gradualmente (não >25% na 1ª hora)" },
      { nome: "Malária grave", valor: "Artesunato EV; vigiar hipoglicemia e nível de consciência" },
      { nome: "Insuficiência cardíaca descompensada", valor: "Oxigénio, diurético, nitrato; tratar fator precipitante" },
    ],
  },
  {
    id: "mi-terminologias", tipo: "terminologias", titulo: "Terminologias",
    itens: [
      { nome: "Dispneia", valor: "Sensação subjetiva de dificuldade respiratória" },
      { nome: "Oligúria", valor: "Diurese <400 ml/24h" },
      { nome: "Síncope", valor: "Perda transitória de consciência por hipoperfusão cerebral" },
      { nome: "Astenia", valor: "Sensação de fraqueza/falta de energia" },
    ],
  },
  {
    id: "mi-sinais", tipo: "sinais", titulo: "Sinais e sintomas-chave",
    itens: [
      { nome: "Sinal de Murphy", valor: "Dor à palpação do hipocôndrio direito na inspiração — colecistite" },
      { nome: "Sopro de Austin Flint", valor: "Sopro diastólico na insuficiência aórtica" },
      { nome: "Tríade de Cushing", valor: "HTA, bradicardia e respiração irregular — hipertensão intracraniana" },
      { nome: "Sinais de desidratação", valor: "Mucosas secas, turgor diminuído, taquicardia, hipotensão" },
    ],
  },
];

const pediatria: RecursoSeccao[] = [
  {
    id: "ped-doses", tipo: "doses", titulo: "Doses farmacológicas essenciais (pediatria)",
    itens: [
      { nome: "Paracetamol", valor: "10-15 mg/kg/dose 6/6h (máx 60 mg/kg/dia)" },
      { nome: "Amoxicilina", valor: "50-90 mg/kg/dia divididos 8/8h ou 12/12h" },
      { nome: "Adrenalina (anafilaxia)", valor: "0,01 mg/kg IM (1:1000), máx 0,3 mg" },
      { nome: "Diazepam (convulsão)", valor: "0,2-0,5 mg/kg EV/rectal" },
      { nome: "SRO (desidratação)", valor: "Plano B: 75 ml/kg em 4h" },
      { nome: "Salbutamol nebulizado", valor: "0,15 mg/kg/dose (mín 2,5 mg)" },
    ],
  },
  {
    id: "ped-classes", tipo: "classes", titulo: "Fármacos por classe farmacológica",
    itens: [
      { nome: "Antipiréticos/analgésicos", valor: "Paracetamol, Ibuprofeno" },
      { nome: "Antibióticos 1ª linha", valor: "Amoxicilina, Cotrimoxazol, Ceftriaxona" },
      { nome: "Broncodilatadores", valor: "Salbutamol, Brometo de ipratrópio" },
      { nome: "Antimaláricos", valor: "Artemeter-lumefantrina; Artesunato (grave)" },
      { nome: "Antiparasitários", valor: "Albendazol, Mebendazol" },
    ],
  },
  {
    id: "ped-algoritmos", tipo: "algoritmos", titulo: "Algoritmos AIDI/abordagem",
    itens: [
      { nome: "Criança com diarreia", valor: "Avaliar desidratação → Plano A/B/C → zinco + SRO" },
      { nome: "Pneumonia (AIDI)", valor: "Tiragem/FR elevada → antibiótico oral; sinais de perigo → referir" },
      { nome: "Febre", valor: "Pesquisar malária; excluir sinais de perigo geral" },
      { nome: "Sinais gerais de perigo", valor: "Não bebe/mama, vomita tudo, convulsões, letargia → referência urgente" },
    ],
  },
  {
    id: "ped-protocolos", tipo: "protocolos", titulo: "Protocolos clínicos",
    itens: [
      { nome: "Desnutrição aguda grave", valor: "F75 → F100; tratar hipoglicemia, hipotermia, infecção" },
      { nome: "Sepse neonatal", valor: "Ampicilina + Gentamicina; suporte e referência" },
      { nome: "Reanimação neonatal", valor: "Secar, estimular, posicionar, ventilar se FC<100" },
    ],
  },
  {
    id: "ped-terminologias", tipo: "terminologias", titulo: "Terminologias",
    itens: [
      { nome: "Tiragem subcostal", valor: "Retração da parede torácica inferior — sinal de dificuldade respiratória" },
      { nome: "Marasmo", valor: "Desnutrição energética grave com emaciação" },
      { nome: "Kwashiorkor", valor: "Desnutrição proteica com edema" },
      { nome: "Fontanela", valor: "Espaço membranoso entre os ossos do crânio do lactente" },
    ],
  },
  {
    id: "ped-sinais", tipo: "sinais", titulo: "Sinais e sintomas-chave",
    itens: [
      { nome: "Fontanela deprimida", valor: "Desidratação" },
      { nome: "Fontanela abaulada", valor: "Hipertensão intracraniana/meningite" },
      { nome: "Sinal da prega", valor: "Turgor cutâneo diminuído — desidratação" },
      { nome: "Reflexo de Moro", valor: "Reflexo primitivo presente no RN normal" },
    ],
  },
];

export const recursos: RecursoCategoria[] = [
  { concursoId: "licenciatura-medicina", categoriaId: "medicina-interna", seccoes: medicinaInterna },
  { concursoId: "licenciatura-medicina", categoriaId: "pediatria", seccoes: pediatria },
];

export const getRecursos = (concursoId: string, categoriaId: string) =>
  recursos.find((r) => r.concursoId === concursoId && r.categoriaId === categoriaId);
