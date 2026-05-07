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

import { bancoEnfermeiro, bancoTecEnfermagem, bancoFarmaceutico } from "./bancos";
import { bancoMedico, bancoLab, bancoFisio, bancoCardio, bancoPsi } from "./bancosExtra";
import {
  topicosMedico, topicosEnfermeiro, topicosTecEnfermagem, topicosFarmaceutico,
  topicosLaboratorio, topicosFisioterapia, topicosCardio, topicosPsicologia,
} from "./topicos";

const medico: Categoria = {
  id: "medico", nome: "Médico",
  descricao: "Médico Geral / Interno de Especialidade - MINSA",
  icon: "Stethoscope",
  disciplinas: ["Clínica Médica", "Saúde Pública", "Medicina Interna", "Cirurgia/Trauma", "G&O", "Pediatria", "Ética"],
  questoes: bancoMedico, topicos: topicosMedico,
};

const enfermeiro: Categoria = {
  id: "enfermeiro", nome: "Enfermeiro",
  descricao: "Enfermeiro Superior - MINSA", icon: "HeartPulse",
  disciplinas: ["Fundamentos", "Saúde Materno-Infantil", "Saúde Pública", "Farmacologia", "Emergências", "Ética"],
  questoes: bancoEnfermeiro, topicos: topicosEnfermeiro,
};

const tecEnfermagem: Categoria = {
  id: "tec-enfermagem", nome: "Técnico de Enfermagem",
  descricao: "Técnico Médio de Enfermagem - MINSA", icon: "Syringe",
  disciplinas: ["Procedimentos", "Farmacologia", "Saúde Pública", "Emergências", "Ética"],
  questoes: bancoTecEnfermagem, topicos: topicosTecEnfermagem,
};

const farmaceutico: Categoria = {
  id: "farmaceutico", nome: "Farmacêutico",
  descricao: "Farmacêutico - MINSA", icon: "Pill",
  disciplinas: ["Farmacologia", "Farmacotécnica", "Farmacocinética", "Farmácia Hospitalar", "Legislação"],
  questoes: bancoFarmaceutico, topicos: topicosFarmaceutico,
};

const laboratorio: Categoria = {
  id: "laboratorio", nome: "Laboratório (Médio e Superior)",
  descricao: "Análises Clínicas - MINSA", icon: "FlaskConical",
  disciplinas: ["Hematologia", "Microbiologia", "Bioquímica", "Imunohematologia", "Parasitologia"],
  questoes: bancoLab, topicos: topicosLaboratorio,
};

const fisioterapeuta: Categoria = {
  id: "fisioterapeuta", nome: "Fisioterapeuta",
  descricao: "Fisioterapia / Reabilitação - MINSA", icon: "Activity",
  disciplinas: ["Cinesiologia", "Reabilitação", "Avaliação", "Órteses"],
  questoes: bancoFisio, topicos: topicosFisioterapia,
};

const cardio: Categoria = {
  id: "cardiopneumologia", nome: "Cardiopneumologia",
  descricao: "Técnico de Cardiopneumologia - MINSA", icon: "HeartPulse",
  disciplinas: ["Electrocardiografia", "Função Pulmonar", "Vascular"],
  questoes: bancoCardio, topicos: topicosCardio,
};

const psicologia: Categoria = {
  id: "psicologia", nome: "Psicologia",
  descricao: "Psicólogo Clínico - MINSA", icon: "Brain",
  disciplinas: ["Psicopatologia", "Psicologia da Saúde", "Avaliação", "Ética"],
  questoes: bancoPsi, topicos: topicosPsicologia,
};

export const concursos: Concurso[] = [
  {
    id: "minsa", nome: "Ministério da Saúde", sigla: "MINSA", area: "Saúde",
    descricao: "Concurso público de ingresso externo para o SNS de Angola - 2026.",
    ano: "2026",
    inscricaoUrl: "https://recrutamento.minsa.gov.ao",
    categorias: [medico, enfermeiro, tecEnfermagem, farmaceutico, laboratorio, fisioterapeuta, cardio, psicologia],
  },
];

export const getConcurso = (id: string) => concursos.find((c) => c.id === id);
export const getCategoria = (concursoId: string, catId: string) =>
  getConcurso(concursoId)?.categorias.find((c) => c.id === catId);
