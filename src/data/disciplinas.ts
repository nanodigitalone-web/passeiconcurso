// Taxonomia de áreas e disciplinas/temas de interesse.
// A app deixou de ser só de saúde: o utilizador escolhe áreas/disciplinas de
// interesse e o conteúdo (questões, trilha "Aprender", destaques) adapta-se.
// Os ids são slugs estáveis derivados do nome (ver `slugify`).

export type Area = {
  area: string;
  emoji: string;
  /** true = área de saúde (já tem banco de questões); false = ainda sem conteúdo. */
  saude: boolean;
  disciplinas: string[];
};

export const slugify = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas combinantes)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const AREAS: Area[] = [
  {
    area: "Medicina",
    emoji: "🧑‍⚕️",
    saude: true,
    disciplinas: [
      "Anatomia Humana Sistémica", "Neuroanatomia", "Histologia e Embriologia",
      "Fisiologia Humana Integrada", "Patologia Especial e Órgãos",
      "Semiologia Médica I e II", "Farmacologia Médica e Terapêutica",
      "Genética Médica e Genómica", "Imunologia Clínica", "Microbiologia Médica",
      "Parasitologia Médica", "Epidemiologia e Bioestatística",
      "Saúde Coletiva e de Família", "Ginecologia e Obstetrícia",
      "Pediatria e Neonatologia", "Cirurgia Geral e Trauma",
      "Clínica Médica (Cardio, Pneumo, Gastro)", "Psiquiatria e Saúde Mental",
      "Dermatologia", "Neurologia Clínica", "Ortopedia e Traumatologia",
      "Oftalmologia e Otorrinolaringologia", "Oncologia Clínica",
      "Medicina de Urgência e Emergência", "Medicina Legal e Bioética",
    ],
  },
  {
    area: "Enfermagem",
    emoji: "🩺",
    saude: true,
    disciplinas: [
      "Fundamentos de Enfermagem", "Bioética e Deontologia de Enfermagem",
      "Enfermagem em Saúde Comunitária", "Enfermagem na Saúde do Adulto",
      "Enfermagem na Saúde do Idoso (Geriatria)", "Enfermagem em Cuidados Paliativos",
      "Enfermagem Médico-Cirúrgica", "Enfermagem em Unidade de Cuidados Intensivos (UCI)",
      "Enfermagem Materno-Infantil e Obstetrícia", "Enfermagem Pediátrica",
      "Enfermagem em Saúde Mental e Psiquiatria", "Gestão e Administração em Enfermagem",
      "Semiotécnica Aplicada à Enfermagem", "Enfermagem em Urgência e Emergência Hospitalar",
      "Nutrição e Dietética Aplicada",
    ],
  },
  {
    area: "Fisioterapia",
    emoji: "🩻",
    saude: true,
    disciplinas: [
      "Cinesiologia Geral", "Biomecânica Humana",
      "Fisioterapia em Ortopedia e Traumatologia",
      "Fisioterapia Neurofuncional (Adulto e Pediátrica)",
      "Fisioterapia Cardiorespiratória", "Fisioterapia em Unidade de Cuidados Intensivos",
      "Cinesioterapia e Mecanoterapia", "Eletrotermofototerapia",
      "Fisioterapia Dermatofuncional", "Fisioterapia Desportiva",
      "Fisioterapia na Saúde da Mulher e do Homem", "Ergonomia e Saúde do Trabalhador",
      "Fisioterapia em Geriatria e Gerontologia", "Hidroterapia (Fisioterapia Aquática)",
      "Diagnóstico por Imagem para Fisioterapia",
    ],
  },
  {
    area: "Farmácia",
    emoji: "💊",
    saude: true,
    disciplinas: [
      "Química Orgânica Medicinal", "Farmacognosia e Fitoterapia",
      "Farmacocinética e Farmacodinâmica",
      "Tecnologia Farmacêutica (Sólidos, Líquidos e Semissólidos)",
      "Farmácia Galénica", "Química Farmacêutica", "Bromatologia e Análise de Alimentos",
      "Cosmetologia e Estética Farmacêutica", "Farmácia Clínica e Cuidados Farmacêuticos",
      "Farmacoepidemiologia e Farmacovigilância", "Gestão e Marketing Farmacêutico",
      "Biotecnologia Farmacêutica", "Controle de Qualidade de Medicamentos",
      "Toxicologia Geral e Ocupacional", "Dispositivos Médicos e Assuntos Regulamentares",
    ],
  },
  {
    area: "Análises Clínicas",
    emoji: "🔬",
    saude: true,
    disciplinas: [
      "Bioquímica Clínica I e II", "Hematologia Clínica e Hemostase",
      "Imuno-hematologia e Banco de Sangue",
      "Microbiologia Clínica (Bacteriologia e Micologia)", "Virologia Clínica",
      "Parasitologia Humana Laboratorial", "Imunodiagnóstico Humano",
      "Uroanálise e Líquidos Biológicos", "Citopatologia e Histopatologia Laboratorial",
      "Biologia Molecular Aplicada ao Diagnóstico", "Endocrinologia Laboratorial",
      "Gestão da Qualidade no Laboratório Clínico", "Instrumentação e Automação Laboratorial",
      "Toxicologia Analítica e Forense", "Genética Laboratorial e Citogenética",
    ],
  },
  {
    area: "Economia",
    emoji: "📈",
    saude: false,
    disciplinas: [
      "Introdução à Economia", "Microeconomia I", "Macroeconomia I",
      "História Económica Geral", "Econometria", "Desenvolvimento Económico",
      "Economia Internacional", "Moeda e Bancos", "Economia do Setor Público",
      "Teoria dos Jogos", "Economia Ambiental", "Finanças Públicas",
      "Pensamento Económico", "Economia Industrial",
    ],
  },
  {
    area: "Direito",
    emoji: "⚖️",
    saude: false,
    disciplinas: [
      "Introdução ao Estudo do Direito", "Direito Constitucional",
      "Direito Civil (Parte Geral)", "Direito Penal I", "Direito Processual Civil",
      "Direito do Trabalho", "Direito Administrativo", "Direito Comercial e Empresarial",
      "Direito Internacional Público", "Direito Fiscal e Tributário", "Direitos Humanos",
      "Filosofia do Direito", "Direito Processual Penal", "Direito do Ambiente",
    ],
  },
  {
    area: "Contabilidade",
    emoji: "🧾",
    saude: false,
    disciplinas: [
      "Contabilidade Financeira I", "Contabilidade de Gestão", "Auditoria Financeira",
      "Contabilidade Avançada", "Fiscalidade Portuguesa/Internacional",
      "Consolidação de Contas", "Sistemas de Informação Contabilística",
      "Contabilidade Pública", "Análise de Demonstrações Financeiras",
      "Ética e Deontologia Contabilística", "Contabilidade de Sociedades",
      "Perícia Contábil", "Relato Financeiro", "Contabilidade Orçamental",
    ],
  },
  {
    area: "Gestão",
    emoji: "📊",
    saude: false,
    disciplinas: [
      "Princípios de Gestão", "Comportamento Organizacional",
      "Gestão de Recursos Humanos", "Marketing Estratégico", "Gestão Financeira",
      "Estratégia Empresarial", "Gestão de Operações e Logística", "Empreendedorismo",
      "Negociação e Gestão de Conflitos", "Gestão de Projetos",
      "Sistemas de Apoio à Decisão", "Gestão da Qualidade", "Negócios Internacionais",
      "Responsabilidade Social Corporativa",
    ],
  },
  {
    area: "Engenharias",
    emoji: "⚙️",
    saude: false,
    disciplinas: [
      "Cálculo Diferencial e Integral", "Álgebra Linear", "Física Mecânica",
      "Química Geral", "Geometria Descritiva", "Ciência e Engenharia dos Materiais",
      "Termodinâmica Aplicada", "Mecânica dos Fluidos", "Resistência dos Materiais",
      "Eletrotecnia Geral", "Programação e Computação", "Estatística e Probabilidades",
      "Investigação Operacional", "Fenómenos de Transferência",
    ],
  },
];

/** Lista achatada de todas as disciplinas com id/area. */
export const ALL_DISCIPLINAS = AREAS.flatMap((a) =>
  a.disciplinas.map((nome) => ({ id: slugify(nome), nome, area: a.area, emoji: a.emoji, saude: a.saude })),
);

export const disciplinaById = (id: string) => ALL_DISCIPLINAS.find((d) => d.id === id);
