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

  // ===================== CASOS CLÍNICOS COMPLEXOS (60) =====================

  // 1 - Pré-operatório
  Q("cir-cc-1","Pré-operatório","Homem de 68 anos, diabético e hipertenso, vai ser submetido a herniorrafia eletiva. HbA1c 9,2%. A conduta pré-operatória mais correta é:",["Operar de imediato sem ajustes","Adiar e otimizar o controlo glicémico antes da cirurgia eletiva","Suspender todos os anti-hipertensivos por 1 semana","Iniciar antibiótico profilático por 7 dias"],1,"Em cirurgia eletiva com mau controlo metabólico (HbA1c elevada) deve-se adiar e otimizar a glicemia para reduzir infeção e deiscência."),
  Q("cir-cc-2","Pré-operatório","Paciente em uso crónico de varfarina precisa de cirurgia eletiva. A conduta habitual é:",["Manter a varfarina inalterada","Suspender 5 dias antes e fazer ponte com heparina se alto risco trombótico","Dobrar a dose no dia da cirurgia","Administrar vitamina K endovenosa de rotina semanas antes"],1,"Suspende-se a varfarina ~5 dias antes (INR alvo <1,5) e faz-se bridging com HBPM/heparina em doentes de alto risco tromboembólico."),
  Q("cir-cc-3","Pré-operatório","Na avaliação do risco cardíaco pré-operatório, o índice de Lee (RCRI) NÃO inclui:",["Cirurgia de alto risco","Doença isquémica do coração","Idade isolada como variável","Insuficiência renal (creatinina >2 mg/dL)"],2,"O índice de Lee inclui cirurgia de alto risco, doença coronária, IC, AVC/AIT, diabetes insulinodependente e creatinina >2; a idade isolada não é variável do RCRI."),
  Q("cir-cc-4","Pré-operatório","Tempo mínimo de jejum recomendado para líquidos claros antes de anestesia eletiva é:",["12 horas","8 horas","2 horas","Não é necessário jejum"],2,"Protocolos modernos (ERAS) permitem líquidos claros até 2 horas antes da indução anestésica."),

  // 2 - Pós-operatório
  Q("cir-cc-5","Pós-operatório","No 3.º dia pós-laparotomia o doente faz febre, taquicardia e dor com saída de líquido turvo pela ferida. A principal hipótese é:",["Atelectasia simples","Infeção do sítio cirúrgico / deiscência com peritonite","TVP de membro inferior","Reação ao anestésico"],1,"Febre tardia (3.º-5.º dia) com secreção purulenta e dor sugere infeção do sítio cirúrgico, podendo haver deiscência da anastomose."),
  Q("cir-cc-6","Pós-operatório","Febre nas primeiras 24-48h pós-operatórias tem como causa mais comum:",["Infeção de ferida","Atelectasia pulmonar","Abcesso intra-abdominal","Infeção urinária"],1,"A febre muito precoce associa-se tipicamente a atelectasia; recomenda-se fisioterapia respiratória e mobilização."),
  Q("cir-cc-7","Pós-operatório","Doente no 5.º dia pós-op de prótese de anca com dor súbita no peito, dispneia e hipoxemia. A suspeita imediata é:",["Pneumonia","Tromboembolismo pulmonar","Edema agudo cardiogénico","Crise de ansiedade"],1,"Dispneia súbita com hipoxemia e taquicardia no pós-operatório de cirurgia ortopédica sugere TEP — investigar e anticoagular."),
  Q("cir-cc-8","Pós-operatório","Íleo paralítico pós-operatório prolongado caracteriza-se por:",["Ruídos hidroaéreos aumentados e diarreia","Distensão, ausência de ruídos e parada de eliminação de gases/fezes","Dor em cólica intensa e rítmica","Hematémese"],1,"O íleo adinâmico cursa com distensão, silêncio abdominal e ausência de trânsito; manejo de suporte e correção de distúrbios."),

  // 3 - Instrumentação e suturas
  Q("cir-cc-9","Instrumentação e Suturas","Para apreensão e tração de tecidos resistentes (aponevrose), o instrumento mais indicado é:",["Pinça de Adson dente de rato","Pinça de Kocher","Pinça mosquito","Pinça anatómica fina"],1,"A pinça de Kocher (com dentes) é robusta para tecidos resistentes; pinças anatómicas são para tecidos delicados."),
  Q("cir-cc-10","Instrumentação e Suturas","Numa laceração facial em criança, para melhor estética e menor reação tecidual, escolhe-se:",["Fio grosso de seda 2-0","Fio monofilamentar fino (náilon 5-0/6-0)","Fio de aço","Categute cromado 0"],1,"Em face usa-se monofilamento fino (5-0/6-0) com remoção precoce para melhor resultado estético."),
  Q("cir-cc-11","Instrumentação e Suturas","Ferida contaminada por mordedura de cão com 8 horas de evolução. A conduta de sutura mais adequada é:",["Fecho primário imediato","Limpeza, desbridamento e fecho primário tardio/cicatrização por 2.ª intenção","Sutura sob alta tensão","Selar com cola sem limpeza"],1,"Feridas contaminadas/mordeduras tardias não devem ser fechadas primariamente; preferir fecho tardio ou 2.ª intenção, com profilaxia antitetânica/antirrábica."),

  // 4 - Abdómen agudo
  Q("cir-cc-12","Abdómen Agudo","Mulher de 30 anos, atraso menstrual, dor pélvica súbita, lipotímia e Blumberg positivo, hipotensa. A principal hipótese é:",["Apendicite aguda","Gravidez ectópica rota","Diverticulite","Pancreatite"],1,"Dor pélvica + atraso menstrual + instabilidade hemodinâmica sugere gravidez ectópica rota (abdome agudo hemorrágico) — βhCG e ecografia."),
  Q("cir-cc-13","Abdómen Agudo","Idoso com fibrilhação auricular, dor abdominal intensa desproporcional ao exame físico e acidose láctica. Suspeita-se de:",["Gastroenterite","Isquemia mesentérica aguda","Cólica renal","Constipação"],1,"Dor desproporcional ao exame, FA (fonte embólica) e acidose láctica indicam isquemia mesentérica aguda — angio-TC urgente."),
  Q("cir-cc-14","Abdómen Agudo","Achado radiológico de pneumoperitónio (ar sob a cúpula diafragmática) indica habitualmente:",["Obstrução simples","Perfuração de víscera oca","Apendicite não complicada","Cólica biliar"],1,"O pneumoperitónio traduz perfuração de víscera oca, exigindo, em regra, laparotomia."),

  // 5 - Hemorragias digestivas
  Q("cir-cc-15","Hemorragia Digestiva","Cirrótico com hematémese volumosa e instabilidade. Após estabilização e EDA, o tratamento endoscópico de eleição das varizes esofágicas é:",["Injeção de adrenalina isolada","Ligadura elástica das varizes","Clip metálico","Eletrocoagulação da mucosa sã"],1,"A ligadura elástica é o tratamento endoscópico de eleição das varizes esofágicas, associada a vasoativos (terlipressina/octreótido) e antibiótico."),
  Q("cir-cc-16","Hemorragia Digestiva","Fármaco vasoativo usado na hemorragia varicosa para reduzir a pressão portal é:",["Dopamina","Terlipressina/octreótido","Noradrenalina em bólus","Furosemida"],1,"Terlipressina ou análogos da somatostatina (octreótido) reduzem o fluxo esplâncnico e a pressão portal."),
  Q("cir-cc-17","Hemorragia Digestiva","Na hemorragia digestiva alta NÃO varicosa por úlcera péptica, além da EDA terapêutica, o tratamento clínico de base é:",["Inibidor da bomba de protões EV em dose alta","Beta-bloqueante","Laxante","Corticoide EV"],0,"Os IBP EV em dose alta estabilizam o coágulo e reduzem ressangramento na HDA péptica."),
  Q("cir-cc-18","Hemorragia Digestiva","Sangue vivo pelo recto (hematoquézia) volumosa, em doente estável, com EDA normal, orienta investigação para:",["Esófago","Estômago","Cólon/intestino (colonoscopia)","Pulmão"],2,"Hematoquézia com EDA normal aponta para fonte baixa — colonoscopia (diverticulose, angiodisplasia)."),

  // 6 - Apendicite
  Q("cir-cc-19","Apendicite","Jovem com dor periumbilical que migra para FID, anorexia, febre baixa e Blumberg positivo. O diagnóstico e conduta são:",["Diverticulite — antibiótico ambulatório","Apendicite aguda — apendicectomia","Cólica renal — analgesia","Gastrite — IBP"],1,"A história clássica de migração da dor para a FID com irritação peritoneal é apendicite aguda, tratada com apendicectomia."),
  Q("cir-cc-20","Apendicite","Sobre as fases evolutivas da apendicite, a sequência correta é:",["Gangrenosa → fleimonosa → catarral → perfurada","Catarral → fleimonosa (supurativa) → gangrenosa → perfurada","Perfurada → catarral → gangrenosa","Fleimonosa → catarral → perfurada"],1,"A evolução é catarral (congestiva) → fleimonosa/supurativa → gangrenosa → perfurada."),
  Q("cir-cc-21","Apendicite","Doente reoperado após apendicectomia por febre persistente e massa dolorosa em FID no 6.º dia. A causa mais provável é:",["Hérnia incisional","Abcesso intra-abdominal residual","Fístula biliar","TVP"],1,"Pacientes com apendicite voltam a operar geralmente por complicações como abcesso/coleção residual ou deiscência do coto — daí febre e massa persistentes."),
  Q("cir-cc-22","Apendicite","Plastrão apendicular (massa inflamatória bloqueada) sem sinais de peritonite difusa pode ser tratado inicialmente com:",["Apendicectomia imediata de urgência","Antibioterapia e tratamento conservador, com apendicectomia diferida","Apenas analgesia","Laparostomia"],1,"O plastrão/fleimão sem peritonite difusa pode ser manejado conservadoramente com antibióticos e eventual apendicectomia de intervalo."),

  // 7 - Peritonite
  Q("cir-cc-23","Peritonites","Doente com abdome em tábua, ausência de ruídos, taquicárdico e febril após perfuração de úlcera. O tratamento definitivo é:",["Apenas antibiótico","Laparotomia com lavagem e correção da perfuração","Sonda nasogástrica isolada","Repouso e observação"],1,"A peritonite secundária por perfuração exige cirurgia (controlo do foco + lavagem) além de antibióticos e ressuscitação."),
  Q("cir-cc-24","Peritonites","O conceito de 'controlo do foco' (source control) na peritonite significa:",["Apenas administrar analgesia","Eliminar a fonte de contaminação e drenar coleções","Transfundir hemácias","Iniciar nutrição parentérica"],1,"Source control é eliminar/derivar a fonte de contaminação e drenar coleções — pilar do tratamento da peritonite."),

  // 8 - Fístulas enterocutâneas
  Q("cir-cc-25","Fístulas Enterocutâneas","No manejo inicial de uma fístula enterocutânea de alto débito, a prioridade é:",["Cirurgia imediata de fecho","Reposição hidroeletrolítica, suporte nutricional e cuidados da pele","Iniciar dieta hiperproteica oral livre","Compressão da fístula"],1,"Inicialmente foca-se em SNAP: Sepse controlada, Nutrição, Anatomia e Proteção da pele; cirurgia é diferida."),
  Q("cir-cc-26","Fístulas Enterocutâneas","Fatores que dificultam o fecho espontâneo de fístula enterocutânea (mnemónica FRIENDS) incluem:",["Baixo débito e ausência de infeção","Corpo estranho, radiação, obstrução distal, sepse e epitelização do trajeto","Boa nutrição","Trajeto longo e estreito"],1,"FRIENDS: Foreign body, Radiation, Infection/IBD, Epithelialization, Neoplasia, Distal obstruction, Steroids/Sepsis dificultam o fecho."),

  // 9 - Hérnias
  Q("cir-cc-27","Hérnias","Homem com hérnia inguinal irredutível, dolorosa, com vómitos e sinais de obstrução há 10h. A conduta é:",["Tentar redução forçada e alta","Cirurgia de urgência por suspeita de estrangulamento","Ecografia eletiva em 1 semana","Faixa abdominal"],1,"Hérnia irredutível dolorosa com obstrução sugere encarceramento/estrangulamento — urgência cirúrgica."),
  Q("cir-cc-28","Hérnias","A hérnia femoral é mais frequente em mulheres e tem maior risco de:",["Redução espontânea","Estrangulamento","Ser assintomática para sempre","Resolução com faixa"],1,"A hérnia femoral, por anel estreito e rígido, tem alto risco de estrangulamento."),
  Q("cir-cc-29","Hérnias","O conteúdo de uma hérnia inguinal estrangulada com ansa inviável (necrosada) impõe:",["Apenas reposicionar a ansa","Ressecção do segmento inviável com anastomose","Fechar sem inspecionar","Observação"],1,"Ansa necrosada exige enterectomia do segmento inviável e anastomose, além da correção da hérnia."),

  // 10 - Traumas torácicos
  Q("cir-cc-30","Trauma Torácico","Vítima de acidente com respiração paradoxal de segmento da parede torácica e insuficiência respiratória. O diagnóstico é:",["Pneumotórax aberto","Tórax instável (volet costal)","Hemotórax simples","Contusão miocárdica"],1,"Múltiplas fraturas costais em dois pontos geram retalho com movimento paradoxal (tórax instável/volet), com contusão pulmonar subjacente."),
  Q("cir-cc-31","Trauma Torácico","Ferida torácica soprante (pneumotórax aberto) deve receber como medida inicial:",["Curativo de 3 pontas (valvular)","Curativo oclusivo total selado nos 4 lados","Toracotomia imediata","Apenas oxigénio"],0,"O curativo de três pontas funciona como válvula, deixando sair o ar e evitando pneumotórax hipertensivo; depois drenagem torácica."),
  Q("cir-cc-32","Trauma Torácico","Doente com trauma torácico, hipotensão, turgência jugular e bulhas abafadas. A causa e conduta são:",["Pneumotórax hipertensivo — descompressão","Tamponamento cardíaco — pericardiocentese/janela","Hemotórax — drenagem","Contusão — observação"],1,"Tríade de Beck indica tamponamento cardíaco — pericardiocentese ou janela pericárdica de urgência."),

  // 11 - Pleurostomia
  Q("cir-cc-33","Pleurostomia","Local de eleição para inserção de dreno torácico (pleurostomia) é:",["2.º EIC linha médio-clavicular","5.º EIC na linha axilar média/anterior (triângulo de segurança)","8.º EIC linha escapular","Região subxifoideana"],1,"O dreno é inserido no triângulo de segurança (5.º EIC, entre linhas axilares anterior e média), por cima da costela inferior."),
  Q("cir-cc-34","Pleurostomia","No sistema de drenagem torácica com selo de água, a oscilação da coluna líquida com a respiração indica:",["Obstrução do sistema","Sistema patente e funcionante","Necessidade de clampar o dreno","Infeção pleural"],1,"A oscilação (gangorra) demonstra que o dreno está pérvio e em comunicação com o espaço pleural."),
  Q("cir-cc-35","Pleurostomia","Borbulhar contínuo no frasco de selo d'água após pleurostomia sugere:",["Sistema normal","Fuga aérea persistente (fístula broncopleural ou conexão solta)","Pulmão totalmente expandido","Hemotórax"],1,"Borbulhar contínuo indica fuga aérea — verificar conexões e considerar fístula broncopleural."),

  // 12 - Infecção de partes moles / Fournier
  Q("cir-cc-36","Infecções de Partes Moles","Diabético com dor perineal intensa, edema, crepitação e necrose escrotal com toxemia. Diagnóstico e conduta:",["Erisipela — antibiótico oral","Gangrena de Fournier — desbridamento cirúrgico amplo e urgente + antibiótico de largo espectro","Celulite — calor local","Furúnculo — drenagem simples"],1,"A gangrena de Fournier (fasceíte necrotizante perineal) é emergência cirúrgica: desbridamento amplo precoce e antibioterapia de largo espectro."),
  Q("cir-cc-37","Infecções de Partes Moles","Fator de risco mais associado à gangrena de Fournier é:",["Atividade física","Diabetes mellitus / imunossupressão","Juventude","Hidratação adequada"],1,"Diabetes e imunossupressão são os principais fatores de risco da gangrena de Fournier."),

  // 13 - Encefalopatia hepatoamoniacal
  Q("cir-cc-38","Encefalopatia Hepática","Cirrótico confuso, com flapping (asterixis) e hálito hepático após hemorragia digestiva. O tratamento de base inclui:",["Aumentar proteína na dieta","Lactulose para reduzir absorção de amónia + tratar fator precipitante","Restrição hídrica severa","Corticoide EV"],1,"A encefalopatia hepática trata-se com lactulose (e/ou rifaximina) e correção dos precipitantes (hemorragia, infeção, obstipação)."),
  Q("cir-cc-39","Encefalopatia Hepática","O sinal neurológico clássico da encefalopatia hepática é:",["Babinski bilateral","Asterixis (flapping tremor)","Sinal de Kernig","Coreia"],1,"O asterixis (flapping) é típico das encefalopatias metabólicas, incluindo a hepatoamoniacal."),

  // 14 - Úlcera perfurada
  Q("cir-cc-40","Úlcera Perfurada","Homem com dor epigástrica súbita 'em punhalada', abdome em tábua e pneumoperitónio na radiografia. Diagnóstico:",["Pancreatite","Úlcera gastroduodenal perfurada","Colecistite","Apendicite"],1,"Dor súbita intensa epigástrica + abdome rígido + pneumoperitónio = úlcera perfurada."),
  Q("cir-cc-41","Úlcera Perfurada","A técnica cirúrgica clássica para úlcera duodenal perfurada com peritonite é:",["Gastrectomia total sempre","Rafia da perfuração com epiploplastia (patch de Graham) e lavagem","Apenas drenagem percutânea","Bypass gástrico"],1,"A correção mais comum é a sutura/rafia com retalho de epíploon (Graham patch) e lavagem da cavidade."),

  // 15 - Síndrome oclusivo / obstrução
  Q("cir-cc-42","Síndrome Oclusivo","Doente com distensão, dor em cólica, vómitos e parada de eliminação de gases/fezes, com níveis hidroaéreos na radiografia. Diagnóstico:",["Íleo paralítico","Obstrução intestinal mecânica","Peritonite primária","Cólica biliar"],1,"Cólica, distensão, vómitos, parada de trânsito e níveis hidroaéreos definem obstrução intestinal mecânica."),
  Q("cir-cc-43","Síndrome Oclusivo","Vómitos precoces e biliosos com pouca distensão sugerem obstrução:",["Cólica alta (delgado proximal)","Cólon distal","Recto","Nenhuma"],0,"Obstrução alta (delgado proximal) cursa com vómitos precoces e pouca distensão; a baixa, com grande distensão e vómitos tardios/fecaloides."),
  Q("cir-cc-44","Síndrome Oclusivo","Sinais de estrangulamento numa obstrução intestinal (que indicam cirurgia urgente) incluem:",["Melhora da dor e ruídos normais","Dor contínua intensa, febre, taquicardia, peritonismo e acidose","Apetite preservado","Ausência de dor"],1,"Dor contínua, febre, taquicardia, irritação peritoneal e acidose láctica sugerem sofrimento da ansa — cirurgia imediata."),

  // 16 - Politraumatizado
  Q("cir-cc-45","Politraumatizado","No politraumatizado hipotenso, após garantir via aérea e ventilação, a prioridade no 'C' é:",["TC de corpo inteiro imediata","Controlo de hemorragias e reposição volémica","Sutura de feridas faciais","Imobilização gessada"],1,"No ABCDE, após A e B, o C foca controlo de hemorragia externa e reposição volémica; imagem só após estabilização."),
  Q("cir-cc-46","Politraumatizado","O conceito de 'cirurgia de controlo de danos' (damage control) aplica-se a:",["Doente estável para cirurgia eletiva","Doente em tríade letal (hipotermia, acidose, coagulopatia) — controlar hemorragia/contaminação e reoperar depois","Feridas superficiais","Hérnia eletiva"],1,"Em doentes graves com tríade letal faz-se cirurgia abreviada (controlo de hemorragia/contaminação), estabiliza-se em UCI e reopera-se depois."),
  Q("cir-cc-47","Politraumatizado","No exame focado por ecografia no trauma (FAST), pesquisa-se principalmente:",["Fraturas ósseas","Líquido livre (sangue) em cavidades","Cálculos renais","Apendicite"],1,"O FAST procura líquido livre (hemoperitónio/hemopericárdio) no trauma, orientando a necessidade de laparotomia."),

  // 17 - Traumatismo abdominal
  Q("cir-cc-48","Trauma Abdominal","Vítima de trauma abdominal fechado, estável, com TC mostrando laceração esplénica grau II sem extravasamento ativo. Conduta:",["Esplenectomia imediata","Tratamento não operatório com monitorização (e angioembolização se indicado)","Laparotomia exploradora obrigatória","Alta imediata"],1,"Lesões esplénicas em doente estável podem ser tratadas de forma não operatória, com vigilância e embolização quando necessário."),
  Q("cir-cc-49","Trauma Abdominal","Trauma abdominal penetrante por arma branca com evisceração de epíploon impõe:",["Reintroduzir e dar alta","Laparotomia exploradora","Apenas curativo","Antibiótico oral"],1,"A evisceração após trauma penetrante é indicação formal de laparotomia exploradora."),

  // 18/24 - Vólvulos do cólon
  Q("cir-cc-50","Vólvulo do Cólon","Idoso acamado com distensão maciça, radiografia em 'grão de café' apontando para hipocôndrio. Diagnóstico:",["Vólvulo do sigmoide","Apendicite","Úlcera perfurada","Colecistite"],0,"O sinal do 'grão de café' é típico do vólvulo do sigmoide, mais comum em idosos/acamados."),
  Q("cir-cc-51","Vólvulo do Cólon","No vólvulo do sigmoide sem sinais de isquemia/peritonite, a conduta inicial é:",["Colectomia de urgência sempre","Descompressão endoscópica (retossigmoidoscopia) e desrotação","Apenas analgesia","Enema baritado terapêutico forçado"],1,"Sem sofrimento intestinal, a descompressão endoscópica é a primeira escolha, com cirurgia eletiva posterior por risco de recidiva."),
  Q("cir-cc-52","Vólvulo do Cólon","Presença de peritonite ou cólon inviável no vólvulo impõe:",["Descompressão endoscópica","Ressecção cirúrgica do segmento (ex.: Hartmann)","Observação","Laxante"],1,"Com necrose/peritonite procede-se à ressecção (frequentemente procedimento de Hartmann)."),

  // 19 - TCE
  Q("cir-cc-53","TCE","Vítima de TCE com perda de consciência, intervalo lúcido e depois deterioração com anisocoria. A lesão mais provável é:",["Hematoma subdural crónico","Hematoma epidural (extradural)","Concussão simples","Hidrocefalia"],1,"Intervalo lúcido seguido de deterioração e anisocoria é clássico de hematoma epidural (artéria meníngea média)."),
  Q("cir-cc-54","TCE","Numa herniação uncal por hipertensão intracraniana, o sinal pupilar típico é:",["Miose bilateral","Midríase fixa ipsilateral à lesão","Pupilas puntiformes","Sem alterações"],1,"A compressão do III par na herniação uncal causa midríase fixa do lado da lesão."),

  // 20 - Abcessos hepáticos
  Q("cir-cc-55","Abcesso Hepático","Doente com febre, dor no hipocôndrio direito e imagem de coleção hepática única. O tratamento usual de abcesso piogénico acessível é:",["Apenas observação","Drenagem percutânea guiada por imagem + antibioterapia","Hepatectomia de rotina","Corticoides"],1,"O abcesso hepático piogénico trata-se com antibióticos e drenagem percutânea guiada; cirurgia reservada para falha."),
  Q("cir-cc-56","Abcesso Hepático","Abcesso hepático amebiano (E. histolytica) responde tipicamente a:",["Drenagem cirúrgica sempre","Metronidazol (tratamento médico)","Apenas antibiótico beta-lactâmico","Antifúngico"],1,"O abcesso amebiano responde bem ao metronidazol; a drenagem só é necessária em abcessos grandes ou que não respondem."),

  // 21 - Pancreatite
  Q("cir-cc-57","Pancreatite","Etilista com dor epigástrica em faixa irradiada ao dorso, vómitos e amílase/lipase muito elevadas. Diagnóstico e conduta inicial:",["Pancreatite aguda — jejum, hidratação vigorosa e analgesia","Colecistite — colecistectomia imediata","Úlcera — IBP isolado","Apendicite — cirurgia"],0,"Pancreatite aguda: dor em faixa, enzimas elevadas; tratamento inicial é suporte (hidratação EV, analgesia, jejum)."),
  Q("cir-cc-58","Pancreatite","O critério/escore frequentemente usado para avaliar gravidade da pancreatite aguda é:",["Glasgow do trauma","Ranson / APACHE II","Hinchey","Gustilo-Anderson"],1,"A gravidade da pancreatite é estratificada por critérios de Ranson, APACHE II e Balthazar (TC)."),

  // 22 - Regulação hidromineral
  Q("cir-cc-59","Regulação Hidromineral","Doente com vómitos prolongados por obstrução pilórica desenvolve classicamente:",["Acidose metabólica hiperclorémica","Alcalose metabólica hipoclorémica e hipocalémica","Acidose respiratória","Alcalose respiratória"],1,"A perda de HCl gástrico causa alcalose metabólica hipoclorémica/hipocalémica — corrigir com soro fisiológico e potássio."),
  Q("cir-cc-60","Lesões por Queimaduras","Grande queimado com 40% SCQ, queimadura facial, rouquidão e expetoração carbonácea. A prioridade imediata é:",["Calcular Parkland e esperar","Garantir via aérea (intubação precoce) por risco de lesão inalatória","Curativo oclusivo das lesões","Antibiótico profilático sistémico"],1,"Sinais de lesão inalatória (rouquidão, fuligem, queimadura facial) exigem via aérea precoce antes do edema obstruir; depois ressuscitação volémica (Parkland)."),
];
