import type { Topico } from "./topicos";
import type { Question } from "./concursos";

// Programa de Ginecologia e Obstetrícia — Licenciatura em Medicina.
// Conteúdo base adaptado ao perfil epidemiológico de Angola (saúde materna,
// pré-natal, urgências obstétricas e ginecologia geral).
export const topicosGinecoObstetricia: Topico[] = [
  { titulo: "Ciclo Menstrual e Endocrinologia Reprodutiva", itens: [
    "Eixo hipotálamo-hipófise-ovário; FSH, LH, estrogénio e progesterona",
    "Fases folicular, ovulatória e lútea",
    "Distúrbios menstruais: amenorreia, oligomenorreia, menorragia",
    "Síndrome dos ovários poliquísticos (SOP)",
  ]},
  { titulo: "Assistência Pré-Natal", itens: [
    "Cálculo da idade gestacional e DPP (regra de Naegele)",
    "Número e conteúdo das consultas; exames de rotina",
    "Suplementação de ferro e ácido fólico; profilaxia da malária na gravidez",
    "Imunização antitetânica e rastreio de VIH/sífilis (PTV)",
  ]},
  { titulo: "Trabalho de Parto e Puerpério", itens: [
    "Períodos do trabalho de parto; partograma",
    "Mecanismo do parto e assistência ao parto normal",
    "Puerpério normal e patológico",
    "Aleitamento materno e contracepção pós-parto",
  ]},
  { titulo: "Urgências Obstétricas", itens: [
    "Hemorragias do 1º trimestre: aborto e gravidez ectópica",
    "Hemorragias do 3º trimestre: placenta prévia e descolamento",
    "Pré-eclâmpsia e eclâmpsia",
    "Hemorragia pós-parto e sepse puerperal",
  ]},
  { titulo: "Ginecologia Geral", itens: [
    "Infecções do tracto genital inferior e DIP",
    "Rastreio do cancro do colo do útero (IVA / citologia)",
    "Miomas, endometriose e massas anexiais",
    "Planeamento familiar e métodos contraceptivos",
  ]},
];

export const questoesGinecoObstetricia: Question[] = [
  {
    id: "go-1", disciplina: "Assistência Pré-Natal",
    enunciado: "Pela regra de Naegele, qual a data provável do parto (DPP) para uma DUM em 10 de Janeiro?",
    opcoes: ["10 de Setembro", "17 de Outubro", "03 de Outubro", "17 de Setembro"],
    correta: 1,
    comentario: "Regra de Naegele: somar 7 dias e subtrair 3 meses (ou somar 9). 10/Jan + 7 dias = 17/Jan; - 3 meses = 17 de Outubro.",
  },
  {
    id: "go-2", disciplina: "Urgências Obstétricas",
    enunciado: "Gestante de 34 semanas com hemorragia vaginal indolor, sangue vivo e útero relaxado. O diagnóstico mais provável é:",
    opcoes: ["Descolamento prematuro da placenta", "Placenta prévia", "Rotura uterina", "Trabalho de parto"],
    correta: 1,
    comentario: "Hemorragia indolor, de sangue vivo, com útero relaxado no 3º trimestre sugere placenta prévia. O descolamento cursa com dor e hipertonia uterina.",
  },
  {
    id: "go-3", disciplina: "Urgências Obstétricas",
    enunciado: "Critério que define pré-eclâmpsia grave:",
    opcoes: ["PA 140/90 mmHg sem proteinúria", "Edema de membros inferiores", "PA ≥160/110 mmHg com proteinúria/sinais de gravidade", "Náuseas no 1º trimestre"],
    correta: 2,
    comentario: "Pré-eclâmpsia grave: PA ≥160/110 mmHg e/ou sinais de gravidade (cefaleia, alterações visuais, dor epigástrica, plaquetopenia, lesão renal/hepática).",
  },
  {
    id: "go-4", disciplina: "Trabalho de Parto e Puerpério",
    enunciado: "A causa mais frequente de hemorragia pós-parto imediata é:",
    opcoes: ["Atonia uterina", "Retenção de restos placentários", "Lacerações do canal", "Distúrbios da coagulação"],
    correta: 0,
    comentario: "Os '4 T': Tónus (atonia — causa mais comum), Trauma, Tecido (restos) e Trombina (coagulopatia). A atonia uterina responde por cerca de 70-80% dos casos.",
  },
  {
    id: "go-5", disciplina: "Ciclo Menstrual e Endocrinologia Reprodutiva",
    enunciado: "A ovulação ocorre tipicamente em resposta a:",
    opcoes: ["Pico de FSH", "Pico de LH", "Queda da progesterona", "Aumento da prolactina"],
    correta: 1,
    comentario: "O pico de LH a meio do ciclo desencadeia a ovulação, cerca de 24-36 horas após o seu início.",
  },
  {
    id: "go-6", disciplina: "Ginecologia Geral",
    enunciado: "Método de rastreio do cancro do colo do útero mais usado em contextos de recursos limitados em Angola:",
    opcoes: ["Colposcopia", "Inspecção Visual com Ácido Acético (IVA)", "Ressonância magnética", "Biópsia em cone"],
    correta: 1,
    comentario: "A IVA é uma estratégia de rastreio acessível e de baixo custo (ver e tratar), recomendada em locais com recursos limitados.",
  },
  {
    id: "go-7", disciplina: "Urgências Obstétricas",
    enunciado: "Mulher com atraso menstrual, dor pélvica e hemorragia, com teste de gravidez positivo e útero vazio à ecografia. Suspeita-se de:",
    opcoes: ["Aborto completo", "Gravidez ectópica", "Mola hidatiforme", "Gravidez gemelar"],
    correta: 1,
    comentario: "Teste positivo com útero vazio e dor/hemorragia sugere gravidez ectópica — emergência que pode evoluir para rotura e choque.",
  },
  {
    id: "go-8", disciplina: "Assistência Pré-Natal",
    enunciado: "Na prevenção da transmissão vertical do VIH (PTV), a conduta correcta é:",
    opcoes: ["Suspender o aleitamento sempre", "Iniciar TARV na mãe e profilaxia no RN", "Adiar o tratamento para o pós-parto", "Apenas cesariana eletiva"],
    correta: 1,
    comentario: "A PTV baseia-se em iniciar/manter TARV materna, profilaxia ARV no recém-nascido e aconselhamento sobre alimentação do lactente.",
  },
  {
    id: "go-9", disciplina: "Trabalho de Parto e Puerpério",
    enunciado: "O partograma serve principalmente para:",
    opcoes: ["Calcular a idade gestacional", "Monitorizar a progressão do trabalho de parto", "Avaliar a maturidade pulmonar fetal", "Diagnosticar diabetes gestacional"],
    correta: 1,
    comentario: "O partograma regista graficamente a dilatação cervical e a descida fetal ao longo do tempo, permitindo detectar trabalho de parto prolongado/obstruído.",
  },
  {
    id: "go-10", disciplina: "Ginecologia Geral",
    enunciado: "Tríade clássica da doença inflamatória pélvica (DIP):",
    opcoes: ["Febre, dor à mobilização do colo e dor anexial", "Cefaleia, edema e hipertensão", "Icterícia, prurido e colúria", "Tosse, febre e dispneia"],
    correta: 0,
    comentario: "DIP cursa tipicamente com dor pélvica baixa, dor à mobilização do colo ('sinal do candelabro') e dor/sensibilidade anexial, frequentemente com febre.",
  },
  {
    id: "go-11", disciplina: "Urgências Obstétricas",
    enunciado: "Fármaco de eleição na prevenção e tratamento das convulsões na eclâmpsia:",
    opcoes: ["Diazepam", "Sulfato de magnésio", "Fenitoína", "Nifedipina"],
    correta: 1,
    comentario: "O sulfato de magnésio é o fármaco de eleição para prevenir e controlar as convulsões na pré-eclâmpsia grave/eclâmpsia.",
  },
  {
    id: "go-12", disciplina: "Ciclo Menstrual e Endocrinologia Reprodutiva",
    enunciado: "Achado clínico-laboratorial característico da SOP:",
    opcoes: ["Hipogonadismo com FSH muito elevado", "Hiperandrogenismo e oligo/anovulação", "Hiperprolactinemia isolada", "Hipotiroidismo primário"],
    correta: 1,
    comentario: "A SOP define-se (critérios de Roterdão) por hiperandrogenismo, disfunção ovulatória e/ou ovários policísticos à ecografia.",
  },
];
