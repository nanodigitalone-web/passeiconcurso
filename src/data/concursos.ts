export type Question = {
  id: string;
  enunciado: string;
  opcoes: string[];
  correta: number;
  comentario: string;
  disciplina: string;
};

import type { Topico } from "./topicos";

export type Categoria = {
  id: string;
  nome: string;
  descricao: string;
  icon: string;
  disciplinas: string[];
  questoes: Question[];
  topicos?: Topico[];
};

export type Concurso = {
  id: string;
  nome: string;
  sigla: string;
  area: string;
  descricao: string;
  ano: string;
  inscricaoUrl?: string;
  categorias: Categoria[];
};

const mkQ = (
  id: string,
  disciplina: string,
  enunciado: string,
  opcoes: string[],
  correta: number,
  comentario: string,
): Question => ({ id, disciplina, enunciado, opcoes, correta, comentario });

const medico: Categoria = {
  id: "medico",
  nome: "Médico",
  descricao: "Concurso para Médico de Clínica Geral - MINSA",
  icon: "Stethoscope",
  disciplinas: ["Clínica Médica", "Saúde Pública", "Pediatria", "Legislação SNS"],
  questoes: [
    mkQ("m1", "Saúde Pública",
      "Qual é a principal causa de mortalidade infantil em Angola, segundo dados do MINSA?",
      ["Diarreia aguda", "Malária", "Pneumonia", "Desnutrição"], 1,
      "A malária continua a ser a principal causa de mortalidade infantil em Angola, sendo prioridade nos programas do MINSA."),
    mkQ("m2", "Clínica Médica",
      "Em paciente adulto com suspeita de malária grave, qual é o tratamento de primeira linha recomendado pelo MINSA?",
      ["Cloroquina oral", "Artesunato endovenoso", "Quinino oral", "Artemether intramuscular"], 1,
      "O Artesunato endovenoso é o tratamento de primeira linha para malária grave segundo a OMS e adoptado pelo MINSA."),
    mkQ("m3", "Pediatria",
      "Qual a idade recomendada em Angola para a primeira dose da vacina contra o sarampo?",
      ["6 meses", "9 meses", "12 meses", "15 meses"], 1,
      "Em Angola, a primeira dose da vacina contra o sarampo é administrada aos 9 meses de idade pelo PAV."),
    mkQ("m4", "Legislação SNS",
      "A Lei de Bases do Sistema Nacional de Saúde de Angola estabelece que o acesso aos cuidados primários é:",
      ["Pago integralmente", "Universal e tendencialmente gratuito", "Restrito a funcionários públicos", "Apenas para crianças"], 1,
      "A Lei de Bases (Lei 21-B/92) garante acesso universal e tendencialmente gratuito aos cuidados primários de saúde."),
    mkQ("m5", "Clínica Médica",
      "Qual é o agente etiológico mais comum da tuberculose pulmonar em Angola?",
      ["Mycobacterium bovis", "Mycobacterium tuberculosis", "Mycobacterium leprae", "Mycobacterium avium"], 1,
      "Mycobacterium tuberculosis é o agente principal, com alta prevalência em Angola sendo prioridade do PNCT."),
  ],
};

import { bancoEnfermeiro, bancoTecEnfermagem, bancoFarmaceutico } from "./bancos";

const enfermeiro: Categoria = {
  id: "enfermeiro",
  nome: "Enfermeiro",
  descricao: "Concurso para Enfermeiro Superior - MINSA",
  icon: "HeartPulse",
  disciplinas: ["Fundamentos de Enfermagem", "Saúde Materno-Infantil", "Saúde Pública", "Farmacologia", "Emergências", "Ética"],
  questoes: bancoEnfermeiro,
};

const tecEnfermagem: Categoria = {
  id: "tec-enfermagem",
  nome: "Técnico de Enfermagem",
  descricao: "Concurso para Técnico Médio de Enfermagem - MINSA",
  icon: "Syringe",
  disciplinas: ["Procedimentos", "Farmacologia", "Saúde Pública", "Emergências", "Ética"],
  questoes: bancoTecEnfermagem,
};

const farmaceutico: Categoria = {
  id: "farmaceutico",
  nome: "Farmacêutico",
  descricao: "Concurso para Farmacêutico - MINSA",
  icon: "Pill",
  disciplinas: ["Farmacologia", "Farmacotécnica", "Farmacocinética", "Farmacodinâmica", "Vias de Administração", "Farmácia Hospitalar", "Legislação"],
  questoes: bancoFarmaceutico,
};

const laboratorio: Categoria = {
  id: "laboratorio",
  nome: "Laboratório (Médio e Superior)",
  descricao: "Técnico Médio e Superior de Análises Clínicas - MINSA",
  icon: "FlaskConical",
  disciplinas: ["Hematologia", "Microbiologia", "Bioquímica"],
  questoes: [
    mkQ("l1", "Hematologia",
      "O hematócrito normal em adulto masculino é aproximadamente:",
      ["20-30%", "30-38%", "40-54%", "55-65%"], 2,
      "Hematócrito normal masculino: 40-54%; feminino: 36-48%."),
    mkQ("l2", "Microbiologia",
      "A coloração de Ziehl-Neelsen é usada para identificar:",
      ["Gram positivos", "Bacilos álcool-ácido resistentes", "Fungos", "Vírus"], 1,
      "Ziehl-Neelsen evidencia BAAR (Mycobacterium tuberculosis), essencial no diagnóstico de TB."),
    mkQ("l3", "Bioquímica",
      "Glicemia em jejum considerada normal:",
      ["< 70 mg/dL", "70-99 mg/dL", "100-125 mg/dL", "≥ 126 mg/dL"], 1,
      "Glicemia em jejum normal: 70-99 mg/dL. 100-125 indica pré-diabetes; ≥126 diabetes."),
  ],
};

const fisioterapeuta: Categoria = {
  id: "fisioterapeuta",
  nome: "Fisioterapeuta",
  descricao: "Concurso para Fisioterapeuta - MINSA",
  icon: "Activity",
  disciplinas: ["Cinesiologia", "Reabilitação", "Avaliação"],
  questoes: [
    mkQ("ft1", "Cinesiologia",
      "O músculo principal da flexão do cotovelo é:",
      ["Tríceps", "Bíceps braquial", "Deltóide", "Coracobraquial"], 1,
      "O bíceps braquial é o principal flexor do cotovelo, auxiliado por braquial e braquiorradial."),
    mkQ("ft2", "Reabilitação",
      "Após AVC, a reabilitação motora deve idealmente iniciar:",
      ["Após 1 mês", "Após estabilização clínica, ainda no hospital", "Após alta", "Após 6 meses"], 1,
      "Início precoce, ainda na fase hospitalar após estabilização, melhora prognóstico funcional."),
    mkQ("ft3", "Avaliação",
      "A escala de Ashworth modificada avalia:",
      ["Dor", "Espasticidade", "Força muscular", "Equilíbrio"], 1,
      "A escala de Ashworth modificada avalia o tónus muscular / espasticidade."),
  ],
};

const cardio: Categoria = {
  id: "cardiopneumologia",
  nome: "Cardiopneumologia",
  descricao: "Técnico de Cardiopneumologia - MINSA",
  icon: "HeartPulse",
  disciplinas: ["Electrocardiografia", "Função Pulmonar"],
  questoes: [
    mkQ("c1", "Electrocardiografia",
      "A onda P no ECG representa:",
      ["Despolarização ventricular", "Repolarização ventricular", "Despolarização auricular", "Repolarização auricular"], 2,
      "A onda P representa a despolarização auricular; o complexo QRS a despolarização ventricular."),
    mkQ("c2", "Função Pulmonar",
      "O VEF1/CVF reduzido (<70%) é característico de:",
      ["Doença restritiva", "Doença obstrutiva", "Padrão normal", "Atelectasia"], 1,
      "VEF1/CVF <70% é o critério clássico para distúrbios obstrutivos como DPOC e asma."),
  ],
};

const psicologia: Categoria = {
  id: "psicologia",
  nome: "Psicologia",
  descricao: "Concurso para Psicólogo Clínico - MINSA",
  icon: "Brain",
  disciplinas: ["Psicopatologia", "Psicologia da Saúde", "Ética"],
  questoes: [
    mkQ("p1", "Psicopatologia",
      "Segundo o DSM-5, sintomas de depressão major devem persistir por no mínimo:",
      ["1 semana", "2 semanas", "1 mês", "3 meses"], 1,
      "O critério temporal para depressão major no DSM-5 é de pelo menos 2 semanas."),
    mkQ("p2", "Psicologia da Saúde",
      "O modelo biopsicossocial considera:",
      ["Apenas factores biológicos", "Factores biológicos, psicológicos e sociais", "Apenas factores sociais", "Factores espirituais apenas"], 1,
      "Engel (1977) propôs o modelo integrando dimensões biológicas, psicológicas e sociais da saúde."),
    mkQ("p3", "Ética",
      "O consentimento informado em psicoterapia deve ser:",
      ["Verbal apenas", "Tácito", "Documentado e esclarecido", "Dispensável"], 2,
      "O consentimento informado deve ser documentado, esclarecido sobre objectivos, métodos e limites."),
  ],
};

export const concursos: Concurso[] = [
  {
    id: "minsa",
    nome: "Ministério da Saúde",
    sigla: "MINSA",
    area: "Saúde",
    descricao: "Concurso público nacional para profissionais de saúde do SNS de Angola.",
    ano: "2026",
    categorias: [medico, enfermeiro, tecEnfermagem, farmaceutico, laboratorio, fisioterapeuta, cardio, psicologia],
  },
];

export const getConcurso = (id: string) => concursos.find((c) => c.id === id);
export const getCategoria = (concursoId: string, catId: string) =>
  getConcurso(concursoId)?.categorias.find((c) => c.id === catId);
