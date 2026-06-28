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
  {
    id: "ped-doses-analgesicos", tipo: "doses", titulo: "Analgésicos, antipiréticos e AINEs",
    itens: [
      { nome: "Dipirona (Metamizol)", valor: "10-25 mg/kg/dose VO, IM ou IV, 6/6h ou 8/8h", nota: "Gotas (500 mg/ml), Solução oral (50 mg/ml), Ampolas (500 mg/ml)" },
      { nome: "Ibuprofeno", valor: "5-10 mg/kg/dose VO, 6/6h ou 8/8h; máx 40 mg/kg/dia", nota: "Gotas (50 e 100 mg/ml), Suspensão (20 mg/ml), Comprimidos (200 e 400 mg)" },
      { nome: "Paracetamol (Acetaminofeno)", valor: "10-15 mg/kg/dose VO ou retal, 4/4h ou 6/6h; máx 75 mg/kg/dia (até 4 g/dia)", nota: "Gotas (200 mg/ml), Solução (32 mg/ml), Comprimidos (500 mg), Supositórios" },
    ],
  },
  {
    id: "ped-doses-antibioticos", tipo: "doses", titulo: "Antibióticos de uso sistémico",
    itens: [
      { nome: "Amoxicilina", valor: "Leve/moderada: 40-50 mg/kg/dia 8/8h ou 12/12h; grave (OMA/pneumonia): 80-90 mg/kg/dia", nota: "Suspensão (250 e 500 mg/5 ml), Cápsulas/Comprimidos (500 e 875 mg)" },
      { nome: "Amoxicilina + Clavulanato", valor: "40-90 mg/kg/dia (base amoxicilina) 8/8h ou 12/12h", nota: "Suspensão (250+62,5 ou 400+57 mg/5 ml), Frasco-ampola IV" },
      { nome: "Azitromicina", valor: "10 mg/kg/dia VO dose única, 3-5 dias; faringite estrept.: 12 mg/kg/dia 5 dias", nota: "Suspensão (200 mg/5 ml), Comprimidos (500 mg)" },
      { nome: "Cefalotina", valor: "50-100 mg/kg/dia IV/IM profunda em 4 doses (6/6h); grave até 150 mg/kg/dia", nota: "Frasco-ampola 1 g" },
      { nome: "Ceftriaxona", valor: "Geral: 50-75 mg/kg/dia IV/IM dose única ou 12/12h; meningite: 100 mg/kg/dia 12/12h", nota: "Frasco-ampola 500 mg e 1 g" },
      { nome: "Claritromicina", valor: "15 mg/kg/dia VO em 2 doses (12/12h); máx 1 g/dia", nota: "Suspensão (125 e 250 mg/5 ml), Comprimidos (250 e 500 mg)" },
      { nome: "Oxacilina", valor: "Leve/moderada: 50-100 mg/kg/dia IV 6/6h; grave: 100-200 mg/kg/dia 4/4h ou 6/6h", nota: "Frasco-ampola 500 mg" },
      { nome: "Vancomicina", valor: "RN (meningite): 15 mg/kg/dose IV 8/8h ou 12/12h; crianças: 40-60 mg/kg/dia 6/6h (máx 2-4 g/dia); infusão ≥60 min", nota: "Frasco-ampola 500 mg e 1 g" },
    ],
  },
  {
    id: "ped-doses-anticonvulsivantes", tipo: "doses", titulo: "Anticonvulsivantes e sedativos críticos",
    itens: [
      { nome: "Diazepam", valor: "Crise aguda: 0,2-0,3 mg/kg/dose IV lenta (máx 1 mg/min), repetir 1-2x; retal: 0,5 mg/kg/dose", nota: "Ampolas 10 mg/2 ml, Comprimidos (5 e 10 mg)" },
      { nome: "Fenobarbital", valor: "Ataque (crise neonatal/EME): 15-20 mg/kg IV lenta; manutenção 3-5 mg/kg/dia VO/IV 12/12h", nota: "Gotas (40 mg/ml; 1 gota=1 mg), Comprimidos (100 mg), Ampolas (200 mg/2 ml)" },
      { nome: "Fenitoína", valor: "Ataque (EME): 15-20 mg/kg IV (diluir em SF 0,9%, infusão lenta); manutenção 5-8 mg/kg/dia 12/12h", nota: "Suspensão (20 mg/ml), Ampolas (50 mg/ml)" },
      { nome: "Midazolam", valor: "Sedação/crise: 0,1-0,2 mg/kg/dose IV ou IM; infusão contínua: 1-6 mcg/kg/min", nota: "Ampolas 5 mg/5 ml, 15 mg/3 ml e 50 mg/10 ml" },
    ],
  },
  {
    id: "ped-doses-antiemeticos", tipo: "doses", titulo: "Antieméticos e procinéticos",
    itens: [
      { nome: "Domperidona", valor: "0,25 mg/kg/dose VO 3-4x/dia (15-30 min antes das refeições)", nota: "Suspensão (1 mg/ml)" },
      { nome: "Metoclopramida", valor: "0,1-0,15 mg/kg/dose VO/IM/IV até 8/8h; evitar <1 ano (reações extrapiramidais)", nota: "Gotas (4 mg/ml), Solução oral, Ampolas (10 mg/2 ml)" },
      { nome: "Ondansetrona", valor: "0,15 mg/kg/dose VO/IM/IV 8/8h; máx 4 mg (pequenas) ou 8 mg (maiores)", nota: "Solução (2 mg/5 ml), Comprimidos dispersíveis (4 e 8 mg), Ampolas (2 mg/ml)" },
    ],
  },
  {
    id: "ped-doses-hidratacao", tipo: "doses", titulo: "Hidratação e suporte hidroeletrolítico",
    itens: [
      { nome: "Sais de Reidratação Oral (SRO)", valor: "Plano A: 50-100 ml (<2a) ou 100-200 ml (>2a) após cada evacuação; Plano B: 50-100 ml/kg VO em 4h", nota: "Envelopes para 1 L de água (padrão OMS baixa osmolaridade)" },
      { nome: "Expansão (SF 0,9%/Ringer)", valor: "Choque: 20 ml/kg IV em 15-20 min, repetir conforme hemodinâmica", nota: "Bolsas SF 0,9%, Glicosado 5%, Glicofisiológico" },
      { nome: "Manutenção (Holliday-Segar)", valor: "100 ml/kg primeiros 10 kg + 50 ml/kg próximos 10 kg + 20 ml/kg cada kg adicional", nota: "Via IV" },
    ],
  },
  {
    id: "ped-doses-antiparasitarios", tipo: "doses", titulo: "Antiparasitários e antifúngicos",
    itens: [
      { nome: "Albendazol", valor: ">2a: 400 mg dose única (oxiúrus, ascaris, ancilostoma, tricuríase); giardíase/estrongiloidíase: 400 mg/dia 3-5 dias", nota: "Suspensão (40 mg/ml), Comprimidos mastigáveis (400 mg)" },
      { nome: "Anfotericina B (desoxicolato)", valor: "Inicial 0,25-0,5 mg/kg/dia IV, aumentar até 1 mg/kg/dia (1,5 em graves); infundir 2-6h protegido da luz", nota: "Frasco-ampola 50 mg" },
      { nome: "Fluconazol", valor: "Candidíase sistémica: 6-12 mg/kg/dia 1x; mucocutânea: 3-6 mg/kg/dia; máx 600 mg/dia", nota: "Cápsulas (50, 100 e 150 mg), Bolsa IV (2 mg/ml - 100 ml)" },
      { nome: "Mebendazol", valor: "Nematódeos: 100 mg 12/12h por 3 dias; repetir após 3 semanas se indicado", nota: "Suspensão (20 mg/ml), Comprimidos (100 mg)" },
      { nome: "Metronidazol", valor: "Giardíase: 15-20 mg/kg/dia 8/8h 5d; amebíase: 35-50 mg/kg/dia 8/8h 7-10d; anaeróbios: 30 mg/kg/dia 6/6h ou 8/8h", nota: "Suspensão (40 mg/ml), Comprimidos (250 e 400 mg), Bolsa IV (5 mg/ml - 100 ml)" },
      { nome: "Nitazoxanida", valor: ">1a: 0,35 ml (7,5 mg)/kg 12/12h por 3 dias, com alimentos", nota: "Suspensão (20 mg/ml), Comprimidos revestidos (500 mg)" },
      { nome: "Nistatina", valor: "Prematuros/lactentes: 1-2 ml (100.000-200.000 UI) 4x/dia; maiores: 1-6 ml 4x/dia (bochechar antes de engolir)", nota: "Suspensão oral (100.000 UI/ml)" },
    ],
  },
  {
    id: "ped-doses-corticoides", tipo: "doses", titulo: "Corticosteroides",
    itens: [
      { nome: "Dexametasona", valor: "Anti-inflam.: 0,08-0,3 mg/kg/dia 6/6h ou 12/12h; edema cerebral: 1-2 mg/kg inicial + 1-1,5 mg/kg/dia 6/6h; crupe: 0,6 mg/kg/dose IM/VO única", nota: "Elixir (0,1 mg/ml), Comprimidos (0,5 e 4 mg), Injetável (2,5 e 4 mg/ml)" },
      { nome: "Hidrocortisona", valor: "Asma/anafilaxia: ataque 5-10 mg/kg/dose IV, manutenção 5 mg/kg/dose 6/6h; insuf. adrenal: 10-20 mg/m²/dia 8/8h", nota: "Frasco-ampola 100 mg e 500 mg" },
      { nome: "Metilprednisolona", valor: "Anti-inflam./asma grave: 1-2 mg/kg/dia IV 6/6h ou 12/12h; pulsoterapia: 10-30 mg/kg/dia (máx 1 g/dia) 1-2h por 3 dias", nota: "Frasco-ampola 40, 125, 500 mg e 1 g" },
      { nome: "Prednisolona/Prednisona", valor: "1-2 mg/kg/dia dose matinal ou 12/12h; máx 60 mg/dia; desmame se >7-10 dias", nota: "Solução 1 e 3 mg/ml (prednisolona), Comprimidos 5, 20 e 50 mg (prednisona)" },
    ],
  },
  {
    id: "ped-doses-antihistaminicos", tipo: "doses", titulo: "Anti-histamínicos (antialérgicos)",
    itens: [
      { nome: "Cetirizina", valor: "6m-2a: 2,5 mg 1x/dia; 2-5a: 2,5-5 mg/dia; >6a: 10 mg/dia dose única", nota: "Solução (1 mg/ml), Gotas (10 mg/ml)" },
      { nome: "Dexclorfeniramina", valor: "2-6a: 0,5 mg 6/6h ou 8/8h (máx 3 mg/dia); 6-12a: 1 mg 6/6h ou 8/8h (máx 6 mg/dia)", nota: "Xarope (2 mg/5 ml), Gotas (2,8 mg/ml; 1 gota=0,1 mg), Comprimidos (2 mg)" },
      { nome: "Hidroxizina", valor: "2 mg/kg/dia em 3-4 tomadas (6/6h ou 8/8h); máx 50 mg/dia (pequenas)", nota: "Xarope (2 mg/ml), Comprimidos (25 mg)" },
      { nome: "Loratadina", valor: "2-5a (<30 kg): 5 mg 1x/dia; >6a (>30 kg): 10 mg 1x/dia", nota: "Xarope (1 mg/ml), Comprimidos (10 mg)" },
      { nome: "Prometazina", valor: ">2a: 0,5-1 mg/kg/dia VO ou IM profunda 8/8h ou 12/12h; evitar IV direto (risco de necrose)", nota: "Comprimidos (25 mg), Ampolas (50 mg/2 ml)" },
    ],
  },
  {
    id: "ped-doses-broncodilatadores", tipo: "doses", titulo: "Broncodilatadores e antiasmáticos",
    itens: [
      { nome: "Aminofilina", valor: "Ataque: 3-5 mg/kg/dose IV diluída em 20-30 min; manutenção 4-6 mg/kg/dose 6/6h IV ou VO", nota: "Comprimidos (100 e 200 mg), Ampolas (24 mg/ml - 240 mg/10 ml)" },
      { nome: "Fenoterol", valor: "Nebulização: 1 gota/3-5 kg em 3-4 ml SF 0,9% 4/4h ou 6/6h; máx 10 gotas (0,5 ml)", nota: "Solução gotas (5 mg/ml; 20 gotas=1 ml)" },
      { nome: "Ipratrópio (brometo)", valor: "Nebulização: <1a 10 gotas (0,25 mg), >1a 20 gotas (0,5 mg) em SF 4/4h ou 6/6h; spray 1-2 jatos 6/6h", nota: "Solução (0,25 mg/ml; 20 gotas=1 ml), Spray (20 mcg/jato)" },
      { nome: "Salbutamol", valor: "VO: 0,1-0,2 mg/kg/dose 6/6h ou 8/8h; nebulização: 0,05-0,1 mg/kg/dose (1 gota/2-3 kg, máx 10-20 gotas) em 3 ml SF; spray: 2-4 jatos cada 20 min na 1ª hora", nota: "Xarope (2 mg/5 ml), Nebulização (5 mg/ml), Spray (100 mcg/jato)" },
    ],
  },
  {
    id: "ped-doses-gastro", tipo: "doses", titulo: "Trato gastrintestinal (protetores e antissecretores)",
    itens: [
      { nome: "Omeprazol", valor: "RGE/dispepsia: 0,5-1,5 mg/kg/dia dose única matinal em jejum", nota: "Cápsulas gastrorresistentes (10, 20 e 40 mg), Frasco-ampola IV (40 mg)" },
      { nome: "Ranitidina", valor: "VO: 2-4 mg/kg/dose 12/12h (4-8 mg/kg/dia); IV: 1-2 mg/kg/dose lenta 8/8h", nota: "Xarope (15 mg/ml), Comprimidos (150 e 300 mg), Ampolas (50 mg/2 ml)" },
    ],
  },
  {
    id: "ped-doses-vitaminas", tipo: "doses", titulo: "Vitaminas e suplementos minerais",
    itens: [
      { nome: "Sulfato Ferroso", valor: "Tratamento anemia: 3-5 mg/kg/dia de ferro elementar em 1-2 tomadas (longe das refeições/leite); profilaxia: 1-2 mg/kg/dia", nota: "Gotas pediátricas, Xarope, Comprimidos (verificar ferro elementar)" },
      { nome: "Zinco (sulfato/gluconato)", valor: "Diarreia aguda: <6m 10 mg/dia, >6m 20 mg/dia, dose única por 10-14 dias", nota: "Solução/Xarope, Comprimidos dispersíveis" },
    ],
  },
  {
    id: "ped-doses-analgesicos-ext", tipo: "doses", titulo: "Analgésicos, antitérmicos e opióides (complemento)",
    itens: [
      { nome: "Ácido acetilsalicílico (AAS)", valor: "Analgésico/antitérmico: 10-15 mg/kg/dia 4/4h ou 6/6h; anti-inflamatório: 60-100 mg/kg/dia 6/6h ou 8/8h", nota: "Comprimidos 100 e 500 mg, Gotas 10 mg/gota. Evitar em viroses (risco de Síndrome de Reye)" },
      { nome: "Ácido mefenâmico", valor: ">14 anos: 500 mg 8/8h", nota: "Comprimidos 500 mg" },
      { nome: "Benzidamina", valor: "<6a: 1,5 mg/kg/dose 6/6h ou 8/8h; 6-14a: 50 mg/dose 12/12h ou 24/24h; >14a: 50 mg/dose 6/6h ou 8/8h", nota: "Solução oral 30 mg/ml, Drágea 50 mg, Colutório 1,5 mg/ml" },
      { nome: "Cetoprofeno", valor: ">1a: 1 gota/kg 6/6h ou 8/8h; 7-11a: 25 gotas 6/6h ou 8/8h; >11a: 50 gotas 6/6h ou 8/8h; adulto: 200-300 mg/dia 8/8h", nota: "Cápsulas 50 mg, Cáps. liberação prolongada 160 e 320 mg, Injetável 100 mg, Gotas 20 mg/ml" },
      { nome: "Diclofenaco potássico", valor: ">1a: VO 2-3 mg/kg/dia 6/6h ou 12/12h; retal 0,5-2 mg/kg; tópico até 4x/dia. Não usar EV (apenas IM no glúteo)", nota: "Gotas 0,5 mg/gota, Drágeas 50 mg, Supositório 12,5/25/75 mg, Suspensão 2 mg/ml, Gel 1%, Ampolas 75 mg" },
      { nome: "Diclofenaco sódico", valor: "VO e IM: 2-3 mg/kg/dia 12/12h", nota: "Cápsulas 100 mg, Ampolas 75 mg/3 ml, Supositórios 50 mg, Comprimidos entéricos 50 mg, Comp. retard 100 mg, Gel 1%" },
      { nome: "Indometacina", valor: ">2a: 2-4 mg/kg/dia 8/8h; máx 150 mg/dia", nota: "Supositórios 100 mg" },
      { nome: "Morfina", valor: "VO: 0,2-0,5 mg/kg 1-6x/dia; RN IV: 0,05-0,2 mg/kg/dose 2-4h ou infusão 0,01-0,04 mg/kg/h; crianças: manutenção 0,1-0,2 mg/kg/dose 2-4h (máx 15 mg/dose)", nota: "Comprimidos 10 e 30 mg, Solução oral 10 mg/ml, Cápsulas 30/60/100 mg. Opióide controlado" },
      { nome: "Naproxeno", valor: ">2a: analgesia/anti-inflam. 5-7 mg/kg 8/8h ou 12/12h; doença inflamatória 10-15 mg/kg/dia 12/12h (máx 1.000 mg/dia)", nota: "Comprimidos 250 e 500 mg" },
      { nome: "Nimesulida", valor: ">12a: 50-100 mg 12/12h (comprimidos, granulado ou supositórios)", nota: "Comprimidos 100 mg, Gotas 50 mg/ml, Suspensão 10 e 18 mg/ml, Granulado, Supositórios 50 e 100 mg" },
      { nome: "Petidina", valor: "1-1,5 mg/kg SC ou IM; máx 100 mg", nota: "Ampolas 100 mg/2 ml e 50 mg/ml. Opióide controlado" },
      { nome: "Piroxicam", valor: ">1a: 0,4-0,6 mg/kg/dia 24/24h; >12a: 20 mg 12/12h ou 24/24h", nota: "Comprimidos/cápsulas 20 mg, Comp. revestidos 10 e 20 mg, Gotas 10 mg/ml, Injetável 40 mg/2 ml" },
      { nome: "Tramadol", valor: "1-2 mg/kg/dose 4/4h ou 6/6h; máx 400 mg/dia", nota: "Gotas 50 e 100 mg/ml, Comprimidos/cápsulas 50 mg, Comp. retard 100 mg, Solução oral 100 mg/ml, Ampolas 50 e 100 mg" },
    ],
  },
  {
    id: "ped-doses-antibioticos-ext", tipo: "doses", titulo: "Antibióticos de uso sistémico (complemento)",
    itens: [
      { nome: "Amicacina", valor: "RN conforme idade gestacional 7,5-10 mg/kg/dose 8/8h a 24/24h; crianças: 15 mg/kg/dia 8/8h ou dose única", nota: "Ampolas 100, 250 e 500 mg/2 ml" },
      { nome: "Amoxicilina + Sulbactam", valor: "Suspensão <2a: 1 ml/kg/dia 8/8h; >12a: 500-1.000 mg 12/12h; IV <12a: 60-75 mg/kg/dia em 2-3 doses; >12a: 1.500 mg 8/8h", nota: "Suspensão 50 ou 100 mg/ml, Comprimidos 500 mg e 1 g, Frasco-ampola 750 e 1.500 mg" },
      { nome: "Ampicilina", valor: "RN: 25-50 mg/kg/dose IV (meningite/sepse: 100 mg/kg/dose); crianças: 100-200 mg/kg/dia 4/4h ou 6/6h; graves: 300 mg/kg/dia 6/6h", nota: "Suspensão 250 mg/5 ml, Cápsulas/Comprimidos 500 mg e 1 g, Frasco-ampola 500 e 1.000 mg" },
      { nome: "Ampicilina + Sulbactam", valor: "RN <7 dias: 75 mg/kg/dia 12/12h; RN e crianças: 150 mg/kg/dia 6/6h ou 8/8h (IM ou IV)", nota: "Pó para injetável 1,5 e 3,0 g" },
      { nome: "Aztreonam", valor: "RN <2 kg: 60-90 mg/kg/dia; RN >2 kg: 90-120 mg/kg/dia; crianças: 90-120 mg/kg/dia 6/6h ou 8/8h", nota: "Frasco-ampola 0,5 e 1,0 g" },
      { nome: "Cefaclor", valor: "20 mg/kg/dia 8/8h ou 12/12h; graves 40 mg/kg/dia 12/12h; máx 1 g/dia", nota: "Suspensão 250 e 375 mg/5 ml, Cápsulas 250 e 500 mg, Drágeas 375 e 750 mg" },
      { nome: "Cefadroxila", valor: "30 mg/kg/dia 8/8h ou 12/12h; máx 2 g/dia", nota: "Suspensão 250 e 500 mg/5 ml, Cápsulas 500 mg, Comprimidos 1 g" },
      { nome: "Cefalexina", valor: "50-100 mg/kg/dia 6/6h; >12a: 500 mg 6/6h", nota: "Suspensão 250 mg/5 ml, Gotas 100 mg/ml, Cáps./drágeas/comprimidos 500 mg" },
      { nome: "Cefazolina", valor: "RN: 40 mg/kg/dose IM/IV 12/12h; crianças: 50-100 mg/kg/dia IV 8/8h; máx 6 g/dia", nota: "Frasco-ampola 1 g e 250/500 mg (IM)" },
      { nome: "Cefepima", valor: "RN e crianças até 40 kg: 50 mg/kg 2x/dia; maiores: 1-2 g IM/IV 2x/dia (máx 2 g 2-3x/dia)", nota: "Frasco-ampola 500 mg, 1 e 2 g" },
      { nome: "Cefotaxima", valor: "RN: 100 mg/kg/dose 12/12h; crianças: 100-200 mg/kg/dia 6/6h ou 8/8h", nota: "Frasco-ampola 0,5 e 1,0 g" },
      { nome: "Cefprozila", valor: "30 mg/kg/dia 12/12h", nota: "Suspensão 250 mg/5 ml, Comprimidos 500 mg" },
      { nome: "Ceftazidima", valor: "RN: 30 mg/kg/dose IM/IV 8/8h; crianças: 100-150 mg/kg/dia IV 8/8h", nota: "Frasco-ampola 1 e 2 g" },
      { nome: "Cefuroxima", valor: "RN: 50-100 mg/kg/dia IM/IV 12/12h; crianças IV: 75-150 mg/kg/dia 8/8h (máx 6 g/dia); VO: 30 mg/kg/dia 12/12h", nota: "Frasco-ampola 750 mg, Suspensão 125 e 250 mg/5 ml, Comprimidos 250 e 500 mg" },
      { nome: "Cloranfenicol", valor: "50-100 mg/kg/dia 6/6h; máx 4 g/dia", nota: "Frasco-ampola 1 g, Xarope 0,272 g/5 ml, Drágea 250 e 500 mg, Cápsula 250 mg" },
      { nome: "Clindamicina", valor: "VO RN: 5-7,5 mg/kg/dose 8/8h; crianças: 20-30 mg/kg/dia 6/6h (máx 1,8 g/dia); IV: 25-40 mg/kg/dia 6/6h ou 8/8h (máx 2 g/dia)", nota: "Ampolas 300 e 600 mg, Frasco-ampola 150 mg/ml" },
      { nome: "Doxiciclina", valor: ">9a: ataque 200 mg 12/12h; manutenção 100 mg 1x/dia; máx 200 mg/dia", nota: "Cápsulas/drágeas 100 e 200 mg" },
      { nome: "Eritromicina", valor: "30-50 mg/kg/dia 6/6h; máx 4 g/dia", nota: "Suspensão 125 e 250 mg/5 ml, Drágeas/Comprimidos 250 e 500 mg, Gotas 100 mg/ml" },
      { nome: "Espiramicina", valor: "150.000 UI/kg/dia em 2-3 doses (ex.: 15 kg = 3 cáps/dia; 30 kg = 6 cáps/dia)", nota: "Comprimidos 250 mg e 1,5 MUI" },
      { nome: "Gentamicina", valor: "RN conforme idade gestacional 2,5 mg/kg/dose 8/8h a 24/24h; crianças: 5-7 mg/kg 1x/dia", nota: "Solução injetável 20 e 40 mg, Ampolas 20, 80 e 280 mg" },
      { nome: "Imipenem/Cilastatina", valor: "RN: 20 mg/kg/dose IV/IM 8/8h ou 12/12h; crianças: 50-100 mg/kg/dia IV 6/6h; máx 4 g/dia", nota: "Frasco para infusão IV 500 mg, Frasco-ampola IM 500 mg" },
      { nome: "Lincomicina", valor: ">1a: VO 30-60 mg/kg/dia 6/6h ou 8/8h; IM 10 mg/kg/dia 8/8h ou 12/12h; IV 10-20 mg/kg/dia 8/8h ou 12/12h", nota: "Cápsulas 500 mg, Injetável 300 mg/ml e 600 mg/2 ml" },
      { nome: "Meropenem", valor: "RN: sepse 20 mg/kg/dose 12/12h; meningite/Pseudomonas 40 mg/kg/dose 8/8h (máx 2 g/dia); crianças: 40-60 mg/kg/dia 6/6h", nota: "Frasco para infusão IV 500 mg e 1 g" },
      { nome: "Nitrofurantoína", valor: "Tratamento: 5-7 mg/kg/dia 6/6h; profilaxia: 1-2,5 mg/kg/dia 1-2x/dia (máx 100 mg/dia)", nota: "Suspensão 5 mg/ml, Cápsulas 100 mg" },
      { nome: "Penicilina G cristalina", valor: "Crianças: 100.000-300.000 UI/kg/dia em 4-6 doses (máx 400.000 UI/kg/dia); RN: 50.000 UI em 2 doses por 14 dias", nota: "Frasco-ampola 1, 5 e 10 milhões UI" },
      { nome: "Penicilina G benzatina", valor: "<25 kg: 50.000 UI/kg dose única; >25 kg: 1.200.000 UI dose única IM", nota: "Frasco-ampola 300.000, 600.000 e 1.200.000 UI" },
      { nome: "Penicilina V", valor: "25.000-50.000 UI/kg/dia 6/6h ou 8/8h", nota: "Comprimidos 500.000 UI, Suspensão 400.000 UI/5 ml" },
      { nome: "Sulfametoxazol + Trimetoprima (Cotrimoxazol)", valor: "6-8 mg TMP/kg/dia 12/12h (5sem-6m: 20/100 mg; 6m-5a: 40/200 mg; 6-12a: 80/400 mg; >12a: 160/800 mg, todos 12/12h)", nota: "Suspensão 40+200 ou 80+400 mg/5 ml, Comprimidos 80/400 e 160/800 mg, IV 80/400 mg/5 ml" },
      { nome: "Rifampicina", valor: "RN: 10-20 mg/kg/dose 24/24h; crianças: 10-20 mg/kg/dia 1-2x; profilaxia meningococo 10 mg/kg/dose 12/12h 2 dias; H. influenzae 20 mg/kg/dia 4 dias", nota: "Suspensão 20 mg/ml, Gotas 150 mg/ml, Injetável IV 50 mg/ml, IM 250 mg" },
      { nome: "Teicoplanina", valor: "Neutropenia febril: 10 mg/kg/dose 12/12h por 3 doses, depois 10-20 mg/kg/dia; germes oportunistas: 3-6 mg/kg/dia", nota: "Frasco-ampola 200 e 400 mg" },
    ],
  },
  {
    id: "ped-doses-anticonvulsivantes-ext", tipo: "doses", titulo: "Ansiolíticos, hipnóticos e anticonvulsivantes (complemento)",
    itens: [
      { nome: "Carbamazepina", valor: "RN: 5-10 mg/kg/dia 12/12h (titular até 10-20 mg/kg/dia); crianças: 10-20 mg/kg/dia 6/6h ou 8/8h; nível sérico 4-12 µg/ml", nota: "Comprimidos 200 e 400 mg, Suspensão 2%, Comp. liberação lenta 200 e 400 mg" },
      { nome: "Clobazam", valor: "<2a: 0,5-1,5 mg/kg/dia em 2 tomadas; 2-16a: iniciar 5 mg/dia (máx 40 mg/dia); adulto: 5-15 mg/dia", nota: "Comprimidos 10 e 20 mg" },
      { nome: "Clonazepam", valor: "<10a: 0,01-0,03 mg/kg/dia, titular até 0,1-0,3 mg/kg/dia 8/8h; >10a: 0,05-0,2 mg/kg/dia 8/8h (máx 20 mg/dia)", nota: "Gotas 2,5 mg/ml (1 gota=0,1 mg), Comprimidos 0,5 e 2 mg" },
      { nome: "Gabapentina", valor: "3-12a: iniciar 10-15 mg/kg/dia 8/8h; média 25-40 mg/kg/dia 8/8h", nota: "Cápsulas 300 mg" },
      { nome: "Hidrato de cloral", valor: "RN: 25 mg/kg/dose 6/6h ou 8/8h; crianças: 20-50 mg/kg/dose 2-4x/dia (máx 500 mg/dose)", nota: "Frasco 100 mg/ml" },
      { nome: "Lamotrigina", valor: ">17 kg: 2-5 mg/kg/dia 12/12h (titulação lenta — risco de rash)", nota: "Comprimidos 25, 50 e 100 mg" },
      { nome: "Oxcarbazepina", valor: "4-16a: 8-10 mg/kg/dia 12/12h", nota: "Comprimidos 300 e 600 mg, Suspensão 6%" },
      { nome: "Topiramato", valor: "1-3 mg/kg/dia dose única à noite; manutenção 5-9 mg/kg/dia 12/12h", nota: "Cápsulas 15 e 25 mg, Comprimidos 25, 50 e 100 mg" },
      { nome: "Valproato de sódio", valor: ">6a: 10-15 mg/kg/dia 8/8h ou 12/12h (titular conforme resposta)", nota: "Xarope 250 mg/5 ml, Cápsulas 250 mg, Comp. revestidos 300 e 500 mg" },
      { nome: "Vigabatrina", valor: "40-80 mg/kg/dia 12/12h", nota: "Comprimidos 500 mg" },
    ],
  },
  {
    id: "ped-doses-antiemeticos-ext", tipo: "doses", titulo: "Antieméticos e procinéticos (complemento)",
    itens: [
      { nome: "Alizaprida", valor: "5 mg/kg/dia", nota: "Gotas 12 mg/ml, Comprimidos 50 mg, Ampolas 50 mg/2 ml" },
      { nome: "Bromoprida", valor: "VO: 0,5-1 mg/kg/dia (3-6 gotas/kg/dia) 6/6h ou 8/8h; injetável: 0,5-1 mg/kg/dia", nota: "Gotas 4 mg/ml, Solução oral 1 mg/ml, Cápsulas/Comprimidos 10 mg" },
      { nome: "Clorpromazina", valor: ">2a: 1 mg/kg/dia 8/8h ou 12/12h (máx 40 mg/dia <5a; 75 mg/dia >5a)", nota: "Comprimidos 25 e 100 mg, Ampolas 25 mg/5 ml, Gotas 1 mg/gota" },
      { nome: "Dimenidrato (+ B6)", valor: "Solução: 0,5 ml/kg 6/6h ou 8/8h; gotas (>2a): 1,25 mg/kg (1 gota/kg) 6/6h ou 8/8h; comp. (6-12a): 25-50 mg 6/6h ou 8/8h", nota: "Sol. oral 12,5 mg/5 ml, Comprimidos 50 e 100 mg, Gotas 25 mg/ml, Ampolas IM/IV" },
      { nome: "Granisetrona", valor: ">2a: 10-20 µg/kg, 15-60 min antes da quimioterapia", nota: "Ampolas 1 mg/ml" },
    ],
  },
  {
    id: "ped-doses-antiespasmodicos", tipo: "doses", titulo: "Antiespasmódicos e antiflatulentos",
    itens: [
      { nome: "Dicloverina", valor: "Lactentes: 5 mg 6/6h ou 8/8h; crianças: 10 mg 6/6h ou 8/8h", nota: "Frascos 20 mg/ml" },
      { nome: "Dimeticona/Simeticona", valor: "Lactentes: 4-6 gotas 3x/dia; até 12a: 6-12 gotas 3x/dia; >12a: 16 gotas 3x/dia", nota: "Emulsão oral 75 mg/ml, Comprimidos 40 mg, Gotas 75 mg/ml" },
      { nome: "Escopolamina (butilbrometo)", valor: "VO: 0,5 mg (1 gota)/kg 6/6h ou 8/8h", nota: "Gotas 10 mg/ml, Drágeas 10 mg" },
    ],
  },
];

export const recursos: RecursoCategoria[] = [
  { concursoId: "licenciatura-medicina", categoriaId: "medicina-interna", seccoes: medicinaInterna },
  { concursoId: "licenciatura-medicina", categoriaId: "pediatria", seccoes: pediatria },
];

export const getRecursos = (concursoId: string, categoriaId: string) =>
  recursos.find((r) => r.concursoId === concursoId && r.categoriaId === categoriaId);
