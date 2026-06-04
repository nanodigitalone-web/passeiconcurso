import type { Topico } from "./topicos";
import type { Question } from "./concursos";

// Programa do Exame Final de Cirurgia Geral (PROFIM) – obtenção do grau de Médico
// Fonte: Plano de estudo de Cirurgia Geral (18 tópicos principais)
export const topicosCirurgiaGeral: Topico[] = [
  { titulo: "T18 – Sintomas e Sinais das Doenças do Tubo Digestivo", itens: [
    "Anatomia e fisiologia do tubo digestivo; semiologia cirúrgica",
    "Dor abdominal: características, tipos e sinais de alarme",
    "Distensão abdominal, náuseas, vómitos, obstipação e diarreia",
    "Sinais físicos: desidratação, icterícia, massa abdominal, ascite, hepatomegalia",
    "Exame físico do abdome: inspeção, palpação, percussão e ausculta",
  ]},
  { titulo: "T19a – Choque Hemorrágico", itens: [
    "Fisiopatologia do choque",
    "Classificação (Classes I a IV) e sinais clínicos por classe",
    "Reposição volémica: cristaloides, coloides e hemoderivados",
    "Controlo de sangramento e algoritmo de manejo",
  ]},
  { titulo: "T19b – Queimaduras", itens: [
    "Classificação por profundidade (1.º, 2.º, 3.º grau)",
    "Extensão (regra dos 9); critérios de gravidade",
    "Fisiopatologia: choque térmico, perdas evaporativas",
    "Hidratação de Parkland, curativos e indicação cirúrgica",
  ]},
  { titulo: "T19c – Atendimento Inicial ao Politraumatizado (ATLS)", itens: [
    "Protocolo ATLS; avaliação primária ABCDE",
    "Via aérea, ventilação e circulação",
    "Défice neurológico e exposição ambiental",
    "Reavaliação secundária e prioridades terapêuticas",
  ]},
  { titulo: "T19d – Trauma Torácico", itens: [
    "Mecanismos de lesão; avaliação inicial",
    "Pneumotórax simples, a tensão e aberto",
    "Hemotórax; fraturas costais; contusão pulmonar",
    "Lesão de grandes vasos; drenagem torácica",
  ]},
  { titulo: "T19e – Trauma Abdominal", itens: [
    "Trauma fechado vs penetrante; escala de trauma",
    "Indicações de laparotomia",
    "Lesões de fígado, baço e rins",
    "Manejo expectante vs cirúrgico",
  ]},
  { titulo: "T19f – Trauma Crânio-encefálico", itens: [
    "Escala de Glasgow; classificação (leve, moderado, grave)",
    "Hematoma epidural, subdural e contusão cerebral",
    "Hipertensão intracraniana; sinais de herniação",
    "Manejo neurocirúrgico inicial",
  ]},
  { titulo: "T19g – Traumatismo das Extremidades", itens: [
    "Avaliação de lesões em MMSS e MMII",
    "Lesões vasculares, nervosas e tendíneas",
    "Fraturas abertas (classificação de Gustilo-Anderson)",
    "Feridas por projéteis; manejo inicial",
  ]},
  { titulo: "T19h – Infecções Cirúrgicas das Partes Moles", itens: [
    "Conceitos gerais e fatores de risco",
    "Classificação (piogénica, flegmonosa, necrotizante)",
    "Quadro clínico geral e princípios de tratamento",
  ]},
  { titulo: "T19i – Abcesso, Furúnculos e Carbúnculos", itens: [
    "Abcesso: etiologia, diagnóstico e tratamento",
    "Furúnculos e carbúnculos: fisiopatologia e complicações",
    "Erisipela e hidrosadenite supurativa",
    "Celulite necrotizante, piomiosite e gangrena gasosa",
  ]},
  { titulo: "T19j – Abdómen Agudo", itens: [
    "Definição e classificação (obstrutivo, inflamatório, hemorrágico, vascular)",
    "Apendicite aguda (McBurney, Rovsing, psoas)",
    "Diverticulite (classificação de Hinchey)",
    "Obstrução intestinal; hemorragia digestiva; colecistite e pancreatite",
  ]},
  { titulo: "T19k – Hérnias", itens: [
    "Anatomia da região inguinal; direta vs indireta",
    "Hérnia femoral, umbilical e incisional",
    "Técnicas cirúrgicas (Lichtenstein, TAPP, TEP)",
    "Complicações: incarceração e estrangulamento",
  ]},
  { titulo: "T19l – Peritonites", itens: [
    "Classificação (primária, secundária, terciária)",
    "Fisiopatologia e quadro clínico",
    "Tratamento cirúrgico e conservador; prognóstico",
  ]},
  { titulo: "T19m – Toracocentese", itens: [
    "Indicações diagnósticas e terapêuticas; contraindicações",
    "Material necessário e via de acesso",
    "Técnica passo a passo e complicações",
  ]},
  { titulo: "T19n – Pericardiocentese", itens: [
    "Tamponamento cardíaco; sinais de Beck",
    "Via subxifoideana e técnica ecoguiada",
    "Monitorização e complicações",
  ]},
  { titulo: "T19o – Suturas", itens: [
    "Anatomia da pele; tipos de fios",
    "Pontos simples, separados, contínuos e intradérmicos",
    "Nós cirúrgicos e remoção de pontos",
    "Cicatrização e complicações da ferida operatória",
  ]},
  { titulo: "T19p – Incisão e Drenagem de Abscessos", itens: [
    "Indicações e anestesia local",
    "Técnica de incisão e exploração da cavidade",
    "Drenagem, dreno e curativo; antibioterapia adjuvante",
  ]},
  { titulo: "T19q – Imobilização de Fraturas", itens: [
    "Princípios da imobilização; tipos de talas",
    "Imobilização por região e uso de gesso",
    "Imobilização pélvica; complicações e sinais de alerta",
  ]},
];

const Q = (id: string, disciplina: string, enunciado: string, opcoes: string[], correta: number, comentario: string): Question =>
  ({ id, disciplina, enunciado, opcoes, correta, comentario });

export const questoesCirurgiaGeral: Question[] = [
  // T18 - Sintomas e Sinais do TGI
  Q("cir-t18-1","Sintomas do TGI","A dor abdominal de início súbito, intensa e máxima desde o começo é mais sugestiva de:",["Apendicite aguda inicial","Perfuração de víscera oca","Gastroenterite","Cólica biliar simples"],1,"A dor súbita e máxima desde o início sugere perfuração (ex.: úlcera perfurada) com peritonite."),
  Q("cir-t18-2","Sintomas do TGI","O sinal de Murphy positivo é característico de:",["Apendicite","Colecistite aguda","Pancreatite","Diverticulite"],1,"A interrupção da inspiração à palpação do hipocôndrio direito (sinal de Murphy) indica colecistite aguda."),
  Q("cir-t18-3","Sintomas do TGI","Vómitos fecaloides são típicos de:",["Obstrução intestinal baixa","Hemorragia digestiva alta","Refluxo gastroesofágico","Gastrite aguda"],0,"O conteúdo fecaloide resulta de estase e proliferação bacteriana na obstrução intestinal distal."),
  Q("cir-t18-4","Sintomas do TGI","A sequência correta do exame físico do abdome é:",["Palpação, percussão, ausculta, inspeção","Inspeção, ausculta, percussão, palpação","Ausculta, palpação, inspeção, percussão","Percussão, inspeção, ausculta, palpação"],1,"No abdome a ausculta precede a palpação para não alterar os ruídos hidroaéreos."),
  Q("cir-t18-5","Sintomas do TGI","A icterícia com colúria e acolia fecal indica padrão:",["Hemolítico","Obstrutivo (colestático)","Hepatocelular leve","Fisiológico"],1,"Colúria e acolia traduzem colestase/obstrução das vias biliares (bilirrubina direta elevada)."),

  // T19a - Choque Hemorrágico
  Q("cir-t19a-1","Choque Hemorrágico","A taquicardia com pressão arterial ainda normal e ligeira ansiedade corresponde ao choque hemorrágico:",["Classe I","Classe II","Classe III","Classe IV"],1,"Classe II (perda 15-30%): taquicardia, redução da pressão de pulso, PA sistólica ainda preservada."),
  Q("cir-t19a-2","Choque Hemorrágico","A perda volémica estimada na Classe III do choque hemorrágico é de:",["Até 15%","15-30%","30-40%","Mais de 40%"],2,"Classe III corresponde a 30-40% de perda do volume sanguíneo, com hipotensão franca."),
  Q("cir-t19a-3","Choque Hemorrágico","O fluido inicial de reposição no choque hemorrágico do adulto é:",["Glicose a 5%","Cristaloide isotónico aquecido","Coloide hiperoncótico","Plasma fresco isolado"],1,"Inicia-se com cristaloide isotónico (Ringer lactato/SF) aquecido; transfundir se não responder."),
  Q("cir-t19a-4","Choque Hemorrágico","O primeiro sinal de choque compensado em jovens costuma ser:",["Hipotensão","Taquicardia","Coma","Anúria total"],1,"A taquicardia é precoce; a hipotensão surge tardiamente após esgotar os mecanismos compensatórios."),

  // T19b - Queimaduras
  Q("cir-t19b-1","Queimaduras","Pela regra dos 9 no adulto, todo o membro inferior corresponde a:",["9%","18%","27%","36%"],1,"Cada membro inferior representa 18% da superfície corporal no adulto."),
  Q("cir-t19b-2","Queimaduras","A queimadura de 2.º grau profundo caracteriza-se por:",["Eritema sem flictenas","Flictenas e dor intensa, com base rósea","Base pálida/branca e menor dor","Carbonização indolor"],2,"O 2.º grau profundo apresenta base pálida e dor reduzida por lesão de terminações nervosas."),
  Q("cir-t19b-3","Queimaduras","A fórmula de Parkland para reposição nas primeiras 24h utiliza:",["2 mL × peso × %SCQ","4 mL × peso × %SCQ","6 mL × peso × %SCQ","10 mL × peso × %SCQ"],1,"Parkland: 4 mL de Ringer lactato × peso (kg) × %SCQ, metade nas primeiras 8 horas."),
  Q("cir-t19b-4","Queimaduras","Na fórmula de Parkland, metade do volume calculado deve ser administrada em:",["Primeiras 4 horas","Primeiras 8 horas","Primeiras 12 horas","Primeiras 24 horas"],1,"Metade nas primeiras 8 horas (a contar do momento da queimadura) e o restante nas 16 horas seguintes."),

  // T19c - ATLS
  Q("cir-t19c-1","ATLS","Na avaliação primária do ATLS, a letra 'A' representa:",["Analgesia","Via aérea com controlo da coluna cervical","Avaliação neurológica","Acesso venoso"],1,"'A' = Airway (via aérea) com proteção da coluna cervical."),
  Q("cir-t19c-2","ATLS","A sequência correta do ABCDE no ATLS é:",["Via aérea, respiração, circulação, neurológico, exposição","Circulação, via aérea, respiração, exposição, neurológico","Respiração, circulação, via aérea, neurológico, exposição","Via aérea, circulação, respiração, exposição, neurológico"],0,"ABCDE: Airway, Breathing, Circulation, Disability, Exposure."),
  Q("cir-t19c-3","ATLS","O 'D' do ABCDE avalia principalmente:",["Drenagem torácica","Défice neurológico (Glasgow e pupilas)","Diurese","Desfibrilhação"],1,"'D' = Disability: nível de consciência (Glasgow), pupilas e sinais focais."),

  // T19d - Trauma Torácico
  Q("cir-t19d-1","Trauma Torácico","O tratamento imediato do pneumotórax hipertensivo é:",["Radiografia de tórax urgente","Descompressão com agulha/toracostomia","Intubação e ventilação","Pericardiocentese"],1,"O pneumotórax a tensão é diagnóstico clínico; trata-se de imediato com descompressão por agulha seguida de drenagem."),
  Q("cir-t19d-2","Trauma Torácico","O hemotórax maciço é definido por drenagem inicial de sangue superior a:",["500 mL","1000 mL","1500 mL","3000 mL"],2,"Drenagem inicial >1500 mL (ou >200 mL/h por 2-4h) indica hemotórax maciço com possível toracotomia."),
  Q("cir-t19d-3","Trauma Torácico","O local clássico de descompressão por agulha no pneumotórax a tensão é:",["2.º espaço intercostal, linha médio-clavicular","5.º espaço intercostal, linha axilar posterior","4.º espaço intercostal, linha esternal","8.º espaço intercostal, linha escapular"],0,"Descompressão no 2.º EIC na linha médio-clavicular (ou 5.º EIC linha axilar anterior, conforme protocolo)."),

  // T19e - Trauma Abdominal
  Q("cir-t19e-1","Trauma Abdominal","A indicação mais clara de laparotomia de urgência no trauma abdominal é:",["Dor leve à palpação","Instabilidade hemodinâmica com peritonite/evisceração","Náusea isolada","Hematúria microscópica"],1,"Peritonite, evisceração ou instabilidade hemodinâmica refratária impõem laparotomia imediata."),
  Q("cir-t19e-2","Trauma Abdominal","O órgão mais frequentemente lesado no trauma abdominal fechado é:",["Pâncreas","Baço","Bexiga","Esófago"],1,"O baço é o órgão mais comummente lesado no trauma abdominal fechado."),
  Q("cir-t19e-3","Trauma Abdominal","O tratamento conservador (não operatório) do trauma esplénico exige:",["Peritonite associada","Estabilidade hemodinâmica e monitorização","Sempre esplenectomia","Hemoglobina normal apenas"],1,"O manejo não operatório só é possível em doente hemodinamicamente estável e monitorizado."),

  // T19f - TCE
  Q("cir-t19f-1","TCE","Um TCE com Escala de Glasgow de 8 classifica-se como:",["Leve","Moderado","Grave","Sem alteração"],2,"Glasgow ≤8 é TCE grave e implica geralmente proteção da via aérea (intubação)."),
  Q("cir-t19f-2","TCE","O hematoma epidural está classicamente associado a lesão da:",["Veia cava","Artéria meníngea média","Carótida interna","Veia jugular"],1,"O hematoma epidural decorre tipicamente de lesão da artéria meníngea média, com intervalo lúcido."),
  Q("cir-t19f-3","TCE","A pontuação mínima da Escala de Coma de Glasgow é:",["0","1","3","5"],2,"A pontuação mínima é 3 (1+1+1) e a máxima é 15."),

  // T19g - Trauma Extremidades
  Q("cir-t19g-1","Trauma de Extremidades","A classificação de Gustilo-Anderson aplica-se a:",["Queimaduras","Fraturas expostas (abertas)","Lesões nervosas","Luxação do ombro"],1,"Gustilo-Anderson estratifica as fraturas abertas conforme tamanho da ferida e contaminação."),
  Q("cir-t19g-2","Trauma de Extremidades","Sinal de isquemia de membro por lesão vascular é:",["Pulso amplo e quente","Ausência de pulso, palidez e dor","Edema isolado","Eritema localizado"],1,"Os '5 P' (dor, palidez, ausência de pulso, parestesia, paralisia) indicam isquemia."),

  // T19h/i - Infecções de Partes Moles
  Q("cir-t19i-1","Infecções de Partes Moles","O tratamento definitivo de um abcesso cutâneo formado é:",["Apenas antibiótico oral","Incisão e drenagem","Apenas calor local","Corticoide tópico"],1,"O abcesso formado exige incisão e drenagem; o antibiótico é adjuvante em casos selecionados."),
  Q("cir-t19i-2","Infecções de Partes Moles","A erisipela é causada principalmente por:",["Estafilococos coagulase-negativos","Estreptococos beta-hemolíticos","Clostridium","Pseudomonas"],1,"A erisipela é uma dermo-hipodermite causada por estreptococos beta-hemolíticos do grupo A."),
  Q("cir-t19i-3","Infecções de Partes Moles","A crepitação subcutânea com dor desproporcional sugere:",["Erisipela simples","Infecção necrotizante / gangrena gasosa","Furúnculo","Celulite ligeira"],1,"Dor desproporcional, crepitação e toxemia indicam fasceíte/gangrena gasosa — emergência cirúrgica."),
  Q("cir-t19i-4","Infecções de Partes Moles","O tratamento da fasceíte necrotizante baseia-se em:",["Observação clínica","Desbridamento cirúrgico precoce e antibioterapia de largo espectro","Apenas antibiótico oral","Curativo compressivo"],1,"O desbridamento cirúrgico agressivo e precoce, com antibióticos de largo espectro, é determinante."),

  // T19j - Abdome Agudo
  Q("cir-t19j-1","Abdómen Agudo","O ponto de McBurney é referência para o diagnóstico de:",["Colecistite","Apendicite aguda","Pancreatite","Diverticulite"],1,"O ponto de McBurney (terço externo da linha espinho-umbilical direita) é doloroso na apendicite."),
  Q("cir-t19j-2","Abdómen Agudo","A classificação de Hinchey é utilizada na:",["Apendicite","Diverticulite complicada","Hérnia inguinal","Pancreatite"],1,"Hinchey estratifica a diverticulite aguda complicada (abcesso, peritonite purulenta/fecal)."),
  Q("cir-t19j-3","Abdómen Agudo","A causa mais frequente de obstrução do intestino delgado no adulto é:",["Volvo","Aderências pós-operatórias","Íleo biliar","Áscaris"],1,"As bridas/aderências pós-cirúrgicas são a principal causa de obstrução do delgado no adulto."),
  Q("cir-t19j-4","Abdómen Agudo","A classificação de Forrest aplica-se à:",["Hemorragia digestiva alta (úlcera)","Apendicite","Peritonite","Pancreatite"],0,"Forrest avalia o estigma endoscópico de hemorragia digestiva alta de origem péptica."),
  Q("cir-t19j-5","Abdómen Agudo","O sinal de Cullen e o sinal de Grey-Turner sugerem:",["Apendicite","Pancreatite aguda grave (hemorrágica)","Colecistite","Hérnia estrangulada"],1,"Equimose periumbilical (Cullen) e em flancos (Grey-Turner) indicam pancreatite necro-hemorrágica."),

  // T19k - Hérnias
  Q("cir-t19k-1","Hérnias","A hérnia inguinal indireta caracteriza-se por:",["Sair medialmente aos vasos epigástricos","Passar pelo canal inguinal, lateral aos vasos epigástricos","Ocorrer no triângulo femoral","Ser sempre umbilical"],1,"A hérnia indireta passa pelo anel inguinal profundo, lateral aos vasos epigástricos inferiores."),
  Q("cir-t19k-2","Hérnias","A hérnia que não reduz e apresenta sinais de sofrimento vascular do conteúdo é:",["Redutível","Encarcerada","Estrangulada","Externa"],2,"A hérnia estrangulada tem comprometimento isquémico do conteúdo — urgência cirúrgica."),
  Q("cir-t19k-3","Hérnias","A técnica de Lichtenstein para hérnia inguinal utiliza:",["Sutura simples sem tela","Tela (prótese) livre de tensão","Apenas via laparoscópica","Ressecção intestinal"],1,"Lichtenstein é a hernioplastia aberta com tela, livre de tensão."),

  // T19l - Peritonites
  Q("cir-t19l-1","Peritonites","A peritonite bacteriana espontânea (primária) ocorre tipicamente em doentes com:",["Apendicite","Cirrose e ascite","Hérnia","Trauma torácico"],1,"A peritonite primária associa-se a ascite do cirrótico, sem foco cirúrgico evidente."),
  Q("cir-t19l-2","Peritonites","A peritonite secundária resulta mais comummente de:",["Disseminação hematogénica","Perfuração de víscera oca","Reação alérgica","Origem viral"],1,"A peritonite secundária deve-se à contaminação por perfuração/víscera (ex.: apêndice, úlcera)."),

  // T19m - Toracocentese
  Q("cir-t19m-1","Toracocentese","Para drenar líquido pleural, a punção deve ser feita:",["Na borda superior da costela inferior","Na borda inferior da costela superior","Sobre o corpo da costela","Na linha média esternal"],0,"Punciona-se na borda superior da costela inferior para evitar o feixe vásculo-nervoso intercostal."),
  Q("cir-t19m-2","Toracocentese","Complicação imediata frequente da toracocentese é:",["Pneumotórax","Embolia gorda","Fratura de fémur","Trombose venosa profunda"],0,"O pneumotórax iatrogénico é a complicação imediata mais comum da toracocentese."),

  // T19n - Pericardiocentese
  Q("cir-t19n-1","Pericardiocentese","A tríade de Beck do tamponamento cardíaco inclui:",["Febre, tosse e dispneia","Hipotensão, turgência jugular e abafamento de bulhas","Bradicardia, midríase e cianose","Dor torácica, vómito e icterícia"],1,"Tríade de Beck: hipotensão, distensão das jugulares e hipofonese das bulhas cardíacas."),
  Q("cir-t19n-2","Pericardiocentese","A via clássica de punção na pericardiocentese é:",["Subxifoideana","Intercostal posterior","Supraclavicular","Femoral"],0,"A via subxifoideana, idealmente ecoguiada, é a abordagem clássica da pericardiocentese."),

  // T19o - Suturas
  Q("cir-t19o-1","Suturas","Um exemplo de fio de sutura absorvível é:",["Seda","Náilon (polipropileno)","Ácido poliglicólico (Vicryl)","Aço"],2,"Vicryl (poliglactina) é absorvível; seda, náilon e aço são não absorvíveis."),
  Q("cir-t19o-2","Suturas","A sutura intradérmica tem como principal vantagem:",["Maior tensão","Melhor resultado estético","Remoção mais difícil","Maior risco de infeção"],1,"A sutura intradérmica oferece melhor resultado estético por não deixar marcas dos pontos."),

  // T19p - Incisão e Drenagem
  Q("cir-t19p-1","Incisão e Drenagem","Após incisão e drenagem de um abcesso, é fundamental:",["Fechar a cavidade primariamente","Explorar e desfazer loculações da cavidade","Não colocar nenhum curativo","Evitar lavagem"],1,"Deve-se romper as loculações e manter drenagem; geralmente não se faz fecho primário."),

  // T19q - Imobilização
  Q("cir-t19q-1","Imobilização de Fraturas","O princípio básico da imobilização de uma fratura é:",["Imobilizar só o foco da fratura","Imobilizar a articulação acima e abaixo do foco","Imobilizar apenas a articulação distal","Não imobilizar articulações"],1,"Imobilizam-se as articulações proximal e distal ao foco de fratura."),
  Q("cir-t19q-2","Imobilização de Fraturas","Sinal de alerta de síndrome compartimental sob gesso é:",["Prurido leve","Dor desproporcional e parestesias","Sensação de calor agradável","Ausência total de queixas"],1,"Dor desproporcional, parestesias e dor ao estiramento passivo alertam para síndrome compartimental."),
];
