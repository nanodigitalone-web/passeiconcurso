export type Topico = { titulo: string; itens: string[] };

// Tópicos oficiais MINSA – Concurso Público de Ingresso Externo 2026
// Fonte: Decreto Presidencial nº 112/24

export const topicosMedico: Topico[] = [
  { titulo: "I. Modelo para Atenção Médica Integral", itens: [
    "Princípios e bases da prática médica",
    "Elaboração da história clínica",
    "Interpretação de exames auxiliares",
    "Evolução clínica e prescrição terapêutica",
    "Prognóstico",
    "Ética na medicina actual e implicações jurídicas",
  ]},
  { titulo: "II. Saúde Pública", itens: [
    "Malária – conceito, epidemiologia, clínica, diagnóstico, complicações, tratamento",
    "Tuberculose – classificação, clínica, diagnóstico, tratamento",
    "HIV/SIDA – epidemiologia, clínica, diagnóstico, tratamento",
    "Febre Tifóide", "Leptospirose", "Cólera", "Coma – etiologia e conduta",
    "Sistema hemolinfopoético – séries vermelha, branca e plaquetária",
  ]},
  { titulo: "III. Medicina Interna", itens: [
    "Diabetes Mellitus – tipos, factores de risco, diagnóstico, complicações",
    "Hipertensão Arterial – classificação e tratamento",
    "Nefrologia / Insuficiência Renal e critérios de diálise",
    "Asma Brônquica", "Insuficiência Cardíaca", "Anemias",
  ]},
  { titulo: "IV. Cirurgia / Trauma", itens: [
    "Trauma crânio-encefálico, torácico e abdominal",
    "Hemorragias e choque",
    "Abdómen agudo",
  ]},
  { titulo: "V. Ginecologia & Obstetrícia", itens: [
    "Pré-natal e parto normal",
    "Patologias clínicas que complicam a gestação",
    "Hemorragias do 1.º, 2.º e 3.º trimestres",
  ]},
  { titulo: "VI. Pediatria & Neonatologia", itens: [
    "Recém-nascido normal e patologia neonatal",
    "Reanimação neonatal",
    "PAV e indicadores materno-infantis",
  ]},
  { titulo: "VII. Ética, Deontologia e Cultura Geral", itens: [
    "Código deontológico médico",
    "Lei de Bases do SNS de Angola",
    "Censo Populacional de Angola 2024",
    "IIMS 2023-2024",
  ]},
];

export const topicosEnfermeiro: Topico[] = [
  { titulo: "I. Fundamentos de Enfermagem", itens: [
    "História da enfermagem em Angola",
    "Processo de enfermagem (NANDA, NIC, NOC)",
    "Sinais vitais e exame físico",
  ]},
  { titulo: "II. Administração de Medicamentos", itens: [
    "Vias de administração (oral, IM, SC, EV, tópica)",
    "Cálculo de dosagens",
    "Os 5 / 9 certos da medicação",
  ]},
  { titulo: "III. Saúde Materno-Infantil", itens: [
    "Pré-natal, parto e puerpério",
    "Aleitamento materno", "PAV / Vacinação infantil",
  ]},
  { titulo: "IV. Saúde Pública", itens: [
    "Endemias em Angola: malária, tuberculose, HIV, cólera",
    "Vigilância epidemiológica",
    "Atenção primária à saúde",
  ]},
  { titulo: "V. Emergências", itens: [
    "RCP adulto, criança e neonatal",
    "Manobra de Heimlich",
    "Triagem de Manchester",
    "Choque, hemorragias e trauma",
  ]},
  { titulo: "VI. Infecções Intra-hospitalares", itens: [
    "Cadeia de transmissão",
    "Higienização das mãos (OMS)",
    "Precauções padrão e isolamentos",
    "Esterilização e desinfecção",
  ]},
  { titulo: "VII. Semiologia", itens: [
    "Aparelho respiratório, cardiovascular, digestivo e neurológico",
  ]},
  { titulo: "VIII. Ética e Deontologia", itens: [
    "Sigilo profissional", "Direitos do paciente",
    "Humanização do cuidado",
  ]},
  { titulo: "IX. Cultura Geral / Legislação", itens: [
    "Lei de Bases do SNS", "Censo 2024", "IIMS 2023-2024",
  ]},
];

export const topicosTecEnfermagem: Topico[] = [
  { titulo: "I. Procedimentos Básicos", itens: [
    "Higiene e conforto do paciente", "Posicionamentos",
    "Curativos e bandagens", "Sondagem vesical e nasogástrica",
  ]},
  { titulo: "II. Administração de Medicamentos", itens: [
    "Vias parentérica e enteral", "Cálculo de gotejamento",
  ]},
  { titulo: "III. Farmacologia básica", itens: [
    "Grupos terapêuticos essenciais", "Reacções adversas",
  ]},
  { titulo: "IV. Saúde Pública", itens: [
    "PAV", "Programas nacionais (TB, malária, HIV)",
  ]},
  { titulo: "V. Emergências", itens: [
    "RCP básica", "Heimlich", "Hemorragias e queimaduras",
  ]},
  { titulo: "VI. Ética Profissional", itens: [
    "Ética e relação técnico-paciente", "Sigilo",
  ]},
];

export const topicosFarmaceutico: Topico[] = [
  { titulo: "I. Farmacologia Geral", itens: [
    "Farmacocinética: ADME (absorção, distribuição, metabolismo, excreção)",
    "Farmacodinâmica: receptores, agonistas, antagonistas",
    "Interacções medicamentosas",
  ]},
  { titulo: "II. Farmacotécnica", itens: [
    "Formas farmacêuticas sólidas, líquidas e semi-sólidas",
    "Manipulação magistral", "Cálculos farmacêuticos",
  ]},
  { titulo: "III. Vias de Administração", itens: [
    "Enteral, parentérica, tópica, inalatória, sublingual",
  ]},
  { titulo: "IV. Farmácia Hospitalar", itens: [
    "Selecção de medicamentos numa unidade hospitalar",
    "Ciclo logístico (selecção, programação, aquisição, armazenamento, distribuição)",
    "Medicamentos de alta vigilância (high-alert)",
    "Farmacovigilância", "Antibioterapia racional",
  ]},
  { titulo: "V. Legislação e Ética Farmacêutica", itens: [
    "Regulamentação ARMED", "Receituário de psicotrópicos",
    "Boas Práticas de Farmácia",
  ]},
  { titulo: "VI. Cultura Geral", itens: [
    "Censo Populacional de Angola 2024", "Lei de Bases do SNS",
  ]},
];

export const topicosLaboratorio: Topico[] = [
  { titulo: "I. Hematologia", itens: ["Hemograma", "Coagulação", "Imunohematologia / grupos sanguíneos"]},
  { titulo: "II. Microbiologia", itens: ["Bactérias, vírus, fungos e parasitas", "Colorações (Gram, Ziehl-Neelsen)", "Antibiograma"]},
  { titulo: "III. Bioquímica Clínica", itens: ["Glicemia", "Função renal e hepática", "Lípidos"]},
  { titulo: "IV. Parasitologia", itens: ["Nematodes, cestodes, protozoários"]},
  { titulo: "V. Imunologia", itens: ["Princípios de imunidade", "Serologias"]},
  { titulo: "VI. Cultura Geral", itens: ["Censo 2024", "Lei de Bases do SNS"]},
];

export const topicosFisioterapia: Topico[] = [
  { titulo: "I. Anatomia e Cinesiologia", itens: ["Sistema osteomuscular", "Biomecânica articular"]},
  { titulo: "II. Avaliação em Fisioterapia", itens: ["Goniometria", "Escalas funcionais (Ashworth, Barthel)"]},
  { titulo: "III. Reabilitação", itens: ["Neurológica (AVC, TCE)", "Ortopédica e traumática", "Cardio-respiratória"]},
  { titulo: "IV. Fisioterapia em amputados", itens: ["Pré e pós-protetização"]},
  { titulo: "V. Órteses e Próteses", itens: ["Princípios da biomecânica ortética"]},
  { titulo: "VI. Cultura Geral", itens: ["IIMS 2023-2024", "Censo 2024"]},
];

export const topicosCardio: Topico[] = [
  { titulo: "I. Electrocardiografia", itens: ["Ondas, intervalos e segmentos", "Arritmias", "Isquemia e enfarte"]},
  { titulo: "II. Função Pulmonar", itens: ["Espirometria", "Padrões obstrutivo e restritivo"]},
  { titulo: "III. Ultrassonografia Vascular", itens: ["Doppler arterial e venoso"]},
  { titulo: "IV. Hipertensão Pulmonar", itens: ["Conceito, diagnóstico e conduta"]},
  { titulo: "V. Cultura Geral", itens: ["Censo 2024", "Lei de Bases do SNS"]},
];

export const topicosPsicologia: Topico[] = [
  { titulo: "I. Psicopatologia", itens: ["Perturbações do humor", "Ansiedade", "Esquizofrenia"]},
  { titulo: "II. Psicologia da Saúde", itens: ["Modelo biopsicossocial", "Adesão terapêutica"]},
  { titulo: "III. Avaliação psicológica", itens: ["Entrevista clínica", "Testes psicométricos"]},
  { titulo: "IV. Ética", itens: ["Consentimento informado", "Sigilo profissional"]},
  { titulo: "V. Cultura Geral", itens: ["Censo 2024", "IIMS 2023-2024"]},
];
