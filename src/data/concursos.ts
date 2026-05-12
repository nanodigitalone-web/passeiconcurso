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
  documentosInscricao?: string[];
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
  bancoEnfermeiroExt1, bancoTecEnfermagemExt1, bancoFarmaceuticoExt1,
  bancoMedicoExt1, bancoLabExt1, bancoFisioExt1, bancoCardioExt1, bancoPsiExt1,
} from "./bancos2";
import { bancoLabExt2 } from "./bancosLab50";
import { bancoMedicoExt2, bancoTecEnfermagemExt2 } from "./bancosExt3";
import { bancoMedicoTop50, bancoTecEnfermagemTop50, bancoLabTop50 } from "./bancosTopicos50";
import {
  topicosMedico, topicosEnfermeiro, topicosTecEnfermagem, topicosFarmaceutico,
  topicosLaboratorio, topicosFisioterapia, topicosCardio, topicosPsicologia,
} from "./topicos";

const medico: Categoria = {
  id: "medico", nome: "Médico",
  descricao: "Médico Geral / Interno de Especialidade - MINSA",
  icon: "Stethoscope",
  disciplinas: ["Clínica Médica", "Saúde Pública", "Medicina Interna", "Cirurgia/Trauma", "G&O", "Pediatria", "Ética"],
  questoes: [...bancoMedico, ...bancoMedicoExt1, ...bancoMedicoExt2], topicos: topicosMedico,
};

const enfermeiro: Categoria = {
  id: "enfermeiro", nome: "Enfermeiro",
  descricao: "Enfermeiro Superior - MINSA", icon: "HeartPulse",
  disciplinas: ["Fundamentos", "Saúde Materno-Infantil", "Saúde Pública", "Farmacologia", "Emergências", "Ética"],
  questoes: [...bancoEnfermeiro, ...bancoEnfermeiroExt1], topicos: topicosEnfermeiro,
};

const tecEnfermagem: Categoria = {
  id: "tec-enfermagem", nome: "Técnico de Enfermagem",
  descricao: "Técnico Médio de Enfermagem - MINSA", icon: "Syringe",
  disciplinas: ["Procedimentos", "Farmacologia", "Saúde Pública", "Emergências", "Ética"],
  questoes: [...bancoTecEnfermagem, ...bancoTecEnfermagemExt1, ...bancoTecEnfermagemExt2], topicos: topicosTecEnfermagem,
};

const farmaceutico: Categoria = {
  id: "farmaceutico", nome: "Farmacêutico",
  descricao: "Farmacêutico - MINSA", icon: "Pill",
  disciplinas: ["Farmacologia", "Farmacotécnica", "Farmacocinética", "Farmácia Hospitalar", "Legislação"],
  questoes: [...bancoFarmaceutico, ...bancoFarmaceuticoExt1], topicos: topicosFarmaceutico,
};

const laboratorio: Categoria = {
  id: "laboratorio", nome: "Laboratório (Médio e Superior)",
  descricao: "Análises Clínicas - MINSA", icon: "FlaskConical",
  disciplinas: ["Hematologia", "Microbiologia", "Bioquímica", "Imunohematologia", "Parasitologia"],
  questoes: [...bancoLab, ...bancoLabExt1, ...bancoLabExt2], topicos: topicosLaboratorio,
};

const fisioterapeuta: Categoria = {
  id: "fisioterapeuta", nome: "Fisioterapeuta",
  descricao: "Fisioterapia / Reabilitação - MINSA", icon: "Activity",
  disciplinas: ["Cinesiologia", "Reabilitação", "Avaliação", "Órteses"],
  questoes: [...bancoFisio, ...bancoFisioExt1], topicos: topicosFisioterapia,
};

const cardio: Categoria = {
  id: "cardiopneumologia", nome: "Cardiopneumologia",
  descricao: "Técnico de Cardiopneumologia - MINSA", icon: "HeartPulse",
  disciplinas: ["Electrocardiografia", "Função Pulmonar", "Vascular"],
  questoes: [...bancoCardio, ...bancoCardioExt1], topicos: topicosCardio,
};

const psicologia: Categoria = {
  id: "psicologia", nome: "Psicologia",
  descricao: "Psicólogo Clínico - MINSA", icon: "Brain",
  disciplinas: ["Psicopatologia", "Psicologia da Saúde", "Avaliação", "Ética"],
  questoes: [...bancoPsi, ...bancoPsiExt1], topicos: topicosPsicologia,
};

export const concursos: Concurso[] = [
  {
    id: "minsa", nome: "Ministério da Saúde", sigla: "MINSA", area: "Saúde",
    descricao: "Concurso público de ingresso externo para o SNS de Angola - 2026.",
    ano: "2026",
    inscricaoUrl: "https://recrutamento.minsa.gov.ao",
    documentosInscricao: [
      "Bilhete de Identidade (cópia legível)",
      "Certificado de habilitações literárias autenticado",
      "Cédula profissional / inscrição na ordem (quando aplicável)",
      "Curriculum Vitae actualizado",
      "Certificado de registo criminal",
      "Atestado médico actualizado",
      "Comprovativo de NIF",
      "2 fotografias tipo passe",
      "Declaração sob compromisso de honra",
    ],
    categorias: [medico, enfermeiro, tecEnfermagem, farmaceutico, laboratorio, fisioterapeuta, cardio, psicologia],
  },
];

export const getConcurso = (id: string) => concursos.find((c) => c.id === id);
export const getCategoria = (concursoId: string, catId: string) =>
  getConcurso(concursoId)?.categorias.find((c) => c.id === catId);
