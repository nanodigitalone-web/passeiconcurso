import type { Topico } from "./topicos";
import type { Question } from "./concursos";

// Programa de Pediatria e Neonatologia — abordagem clínica adaptada ao perfil
// epidemiológico de Angola (puericultura, imunizações, RN, sepse neonatal,
// desnutrição e síndromes pediátricas).
export const topicosPediatria: Topico[] = [
  { titulo: "Semiologia e Exame Neurológico Pediátrico", itens: [
    "Exame neurológico do RN e do lactente; reflexos primitivos",
    "Perímetro cefálico: micro, macro e formas cranianas (trigono, braqui, dolicocefalia)",
    "Avaliação de tónus, postura e marcos do desenvolvimento",
    "Raciocínio clínico em Pediatria; elaboração da HDA",
  ]},
  { titulo: "Consulta de Puericultura", itens: [
    "Vigilância do crescimento e desenvolvimento; curvas de percentil",
    "Sinais de perigo e infecção bacteriana grave",
    "Prevenção da Síndrome de Morte Súbita do Lactente (SMSL)",
    "Triagem neonatal (teste do pezinho) e prevenção de acidentes",
  ]},
  { titulo: "Imunizações", itens: [
    "Vacinas vivas (BCG, VOP, sarampo, febre amarela, rotavírus, VASPR, HPV)",
    "Vacinas mortas/toxóides (HepB, pentavalente, pneumocócica, influenza, anti-tetânica)",
    "Verdadeiras vs falsas contraindicações vacinais",
    "Calendário do PAV e suplementação (vitamina A, albendazol)",
  ]},
  { titulo: "Alimentação no Primeiro Ano de Vida", itens: [
    "Aleitamento materno exclusivo; vantagens e contraindicações",
    "Introdução alimentar e diversificação",
    "Riscos do leite de vaca e do desmame precoce",
    "Problemas digestivos comuns: cólica, regurgitação, refluxo, obstipação",
  ]},
  { titulo: "Desnutrição Energético-Protéica (DEP/DAS)", itens: [
    "Marasmo, Kwashiorkor e formas mistas",
    "Causas sociais e ambientais da desnutrição",
    "Tratamento dietético (F75, F100, ReSoMal) e complicações",
    "Hipoglicemia, hipotermia, anemia e diarreia de renutrição",
  ]},
  { titulo: "Recém-Nascido Normal", itens: [
    "Classificação (termo, pré-termo, pós-termo; PIG, AIG, GIG)",
    "Lesões benignas da pele e tocotraumatismos",
    "Icterícia fisiológica vs patológica",
    "Cuidados imediatos e profilaxias do RN",
  ]},
  { titulo: "Recém-Nascido Pré-Termo", itens: [
    "Classificação por idade gestacional e peso ao nascer",
    "Complicações: HPIV, LPV, ECN, PCA, ROP, apneia",
    "Termorregulação, nutrição e suporte ventilatório",
  ]},
  { titulo: "Sepse Neonatal", itens: [
    "Sepse precoce (<72h) vs tardia (>72h); etiologia (SGB, E. coli, Listeria, Staph)",
    "SIRS, fatores de risco (RPM, corioamnionite, líquido fétido)",
    "Manifestações clínicas, diagnóstico e complicações (meningite, CID, choque)",
    "Antibioterapia empírica e de 2.ª linha",
  ]},
  { titulo: "Classificação do RN: termo, pré-termo e PIG/AIG/GIG", itens: [
    "Classificação por idade gestacional (Ballard/Capurro): pré-termo <37s, termo 37-41s, pós-termo ≥42s",
    "Classificação por peso/IG: PIG (<P10), AIG (P10-P90), GIG (>P90); baixo peso <2500g",
    "PIG simétrico vs assimétrico; restrição de crescimento intrauterino (RCIU)",
    "Critérios de diagnóstico e riscos: hipoglicemia, hipotermia, policitemia, asfixia",
    "Conduta no contexto angolano: cuidados ao RN de baixo peso, método canguru, prevenção de hipotermia e amamentação precoce",
  ]},
  { titulo: "Síndromes e Diagnóstico Diferencial", itens: [
    "Síndrome febril, circulatório, de condensação pulmonar e disentérico",
    "Síndrome de aspiração meconial e SIRS",
    "Diagnóstico diferencial da sepse neonatal",
  ]},
];

const Q = (id: string, disciplina: string, enunciado: string, opcoes: string[], correta: number, comentario: string): Question =>
  ({ id, disciplina, enunciado, opcoes, correta, comentario });

export const questoesPediatria: Question[] = [
  // ===================== EXAME NEUROLÓGICO E SEMIOLOGIA =====================
  Q("ped-neuro-1","Exame Neurológico","Lactente de 3 meses com perímetro cefálico acima do P97, fontanela anterior tensa e abaulada, olhar 'em sol poente' e veias do couro cabeludo proeminentes. A hipótese mais provável é:",["Microcefalia","Hidrocefalia","Craniossinostose isolada","Variante normal do crescimento"],1,"Macrocrânia progressiva, fontanela tensa e sinal do sol poente traduzem hipertensão intracraniana por hidrocefalia."),
  Q("ped-neuro-2","Exame Neurológico","RN com fechamento precoce da sutura metópica, originando fronte estreita e triangular. Esta deformidade craniana designa-se:",["Braquicefalia","Dolicocefalia","Trigonocefalia","Plagiocefalia posicional"],2,"O encerramento precoce da sutura metópica produz uma fronte triangular — trigonocefalia."),
  Q("ped-neuro-3","Exame Neurológico","RN de parto distócico, apresentação pélvica, com membro superior em adução, rotação interna e antebraço em pronação ('posição de gorjeta de empregado'), com reflexo de Moro assimétrico. O diagnóstico é:",["Fratura da clavícula isolada","Paralisia de Erb (C5-C6)","Paralisia cerebral espástica","Pé torto congénito"],1,"A lesão do plexo braquial superior (C5-C6) — paralisia de Erb — dá o braço em adução/rotação interna e Moro assimétrico."),
  Q("ped-neuro-4","Exame Neurológico","Pré-termo que desenvolve, aos meses, hipertonia, espasticidade dos membros inferiores e atraso motor. A lesão associada na neuroimagem mais provável é:",["Hemorragia conjuntival","Leucomalácia periventricular","Cefalohematoma","Bossa serossanguínea"],1,"A leucomalácia periventricular do pré-termo é a principal causa de paralisia cerebral espástica (diplegia)."),
  Q("ped-neuro-5","Exame Neurológico","A diferença semiológica que distingue a bossa serossanguínea do cefalohematoma é que o cefalohematoma:",["Ultrapassa as linhas de sutura","É respeita os limites de sutura por ser subperiósteo","Está presente já à nascença e desaparece em horas","É sempre patológico e exige cirurgia"],1,"O cefalohematoma é subperiósteo e NÃO ultrapassa suturas; a bossa serossanguínea é edema que cruza suturas e regride rápido."),

  // ===================== PUERICULTURA =====================
  Q("ped-puer-1","Puericultura","Na consulta de puericultura, a principal orientação para prevenção da Síndrome de Morte Súbita do Lactente (SMSL) é:",["Colocar o bebé a dormir em decúbito ventral","Colocar o bebé a dormir em decúbito dorsal, em superfície firme e sem objetos","Aquecer muito o quarto e cobrir bem o rosto","Partilhar a cama com travesseiros macios"],1,"A posição supina (decúbito dorsal), superfície firme e ambiente sem objetos macios reduzem o risco de SMSL."),
  Q("ped-puer-2","Puericultura","Lactente de 2 meses trazido por recusa alimentar, gemido, hipoatividade e temperatura de 35.5 °C. Estes constituem:",["Sinais de baixo risco, reavaliar em 7 dias","Sinais de perigo / possível infecção bacteriana grave","Cólica do lactente","Comportamento normal do sono"],1,"Recusa alimentar, gemido, hipoatividade e hipotermia são sinais de perigo que sugerem infecção bacteriana grave."),
  Q("ped-puer-3","Puericultura","O teste de triagem neonatal ('teste do pezinho') permite detetar precocemente, entre outras:",["Apenas malária congénita","Hipotireoidismo congénito, fenilcetonúria e drepanocitose","Apenas cárie dentária","Luxação congénita da anca"],1,"A triagem neonatal rastreia hipotireoidismo congénito, fenilcetonúria, drepanocitose e deficiência de biotinidase."),
  Q("ped-puer-4","Puericultura","Ao avaliar a anca de um RN com manobra de Ortolani positiva (ressalto à abdução), o diagnóstico a investigar é:",["Pé torto equinovaro","Luxação congénita da anca / displasia do quadril","Fratura do fémur","Paralisia de Erb"],1,"O ressalto de Ortolani indica redução de uma anca luxada — sinal de displasia do desenvolvimento do quadril."),
  Q("ped-puer-5","Puericultura","Lactente com lacrimejamento persistente, fotofobia e aumento do diâmetro corneano. A suspeita prioritária é:",["Conjuntivite química benigna","Glaucoma congénito","Estrabismo transitório","Catarata sem repercussão"],1,"Lacrimejamento, fotofobia e buftalmo (córnea aumentada) sugerem glaucoma congénito — emergência oftalmológica."),

  // ===================== RACIOCÍNIO CLÍNICO / SÍNDROMES =====================
  Q("ped-sind-1","Síndrome Febril","Criança de 4 anos, zona endémica, com febre alta intermitente, palidez, esplenomegalia e prostração. A primeira hipótese e exame são:",["Pneumonia — radiografia de tórax","Malária — gota espessa/teste rápido","Disenteria — coprocultura","Leptospirose — serologia"],1,"Febre, palidez, esplenomegalia em zona endémica = malária; confirma-se com gota espessa ou teste rápido."),
  Q("ped-sind-2","Síndrome de Condensação Pulmonar","Criança com febre, tosse, taquipneia, tiragem subcostal e macicez com crepitações localizadas. A síndrome e conduta são:",["Síndrome disentérico — reidratação","Síndrome de condensação pulmonar (pneumonia) — antibioterapia","Síndrome circulatório — diuréticos","Asma — só broncodilatador"],1,"Taquipneia, tiragem e macicez com crepitações definem condensação pulmonar (pneumonia), que exige antibiótico."),
  Q("ped-sind-3","Síndrome Disentérico","Criança com diarreia com sangue e muco, dor abdominal e tenesmo, febre. A síndrome e a abordagem antibiótica são:",["Síndrome de aspiração meconial — surfactante","Síndrome disentérico — antibiótico além da reidratação","Síndrome de Arlequim — observação","Síndrome de Poland — cirurgia"],1,"Diarreia com sangue/muco e tenesmo = síndrome disentérico, que justifica antibiótico além da reidratação."),
  Q("ped-sind-4","Síndrome Circulatório","Lactente com taquicardia, hepatomegalia, edema, sudorese às mamadas e taquipneia. A síndrome subjacente é:",["Insuficiência cardíaca congestiva","Síndrome disentérico","Glaucoma congénito","Síndrome de Arlequim"],0,"Cansaço às mamadas, hepatomegalia e edema traduzem insuficiência cardíaca congestiva no lactente."),
  Q("ped-sind-5","Síndromes do RN","A 'Síndrome de Arlequim' do recém-nascido caracteriza-se por:",["Sepse fulminante com choque","Coloração metade vermelha / metade pálida transitória, lesão benigna","Cardiopatia cianótica grave","Malformação da parede torácica"],1,"A síndrome de Arlequim é uma alteração vasomotora benigna e transitória da pele do RN."),
  Q("ped-sind-6","Síndromes do RN","A Síndrome de Poland está classicamente associada a:",["Sindactilia e ausência do peitoral maior","Hidrocefalia","Sepse neonatal precoce","Icterícia fisiológica"],0,"A síndrome de Poland associa agenesia do peitoral maior a anomalias da mão, como a sindactilia."),

  // ===================== IMUNIZAÇÕES =====================
  Q("ped-imun-1","Imunizações","Assinale a opção que contém APENAS vacinas vivas atenuadas:",["Hepatite B, pentavalente, pneumocócica","BCG, VOP, sarampo, febre amarela e rotavírus","Anti-tetânica, influenza, difteria","HepB, DTP, Hib"],1,"BCG, pólio oral, sarampo, febre amarela e rotavírus são vacinas vivas atenuadas."),
  Q("ped-imun-2","Imunizações","A vacina pentavalente confere proteção contra:",["Sarampo, papeira e rubéola","Difteria, tétano, tosse convulsa, Hib e Hepatite B","Febre amarela e rotavírus","Pólio e BCG"],1,"A pentavalente combina DTP + Hib + Hepatite B."),
  Q("ped-imun-3","Imunizações","Constitui uma VERDADEIRA contraindicação à administração de vacinas vivas:",["Resfriado comum sem febre","Imunodeficiência grave / imunossupressão","Doença neurológica estável","História familiar de alergia"],1,"Imunodeficiência grave contraindica vacinas vivas; resfriado leve e doença neurológica estável são falsas contraindicações."),
  Q("ped-imun-4","Imunizações","Criança que vai iniciar quimioterapia por neoplasia maligna. Em relação às vacinas vivas:",["Devem ser administradas todas no mesmo dia","Estão contraindicadas durante a imunossupressão","Devem ser duplicadas em dose","Não há qualquer restrição"],1,"Neoplasias malignas em tratamento e imunossupressão contraindicam vacinas vivas."),
  Q("ped-imun-5","Imunizações","São FALSAS contraindicações vacinais (não impedem a vacinação):",["Anafilaxia a dose anterior","Imunodeficiência grave","Alergias ligeiras, resfriado leve e doença neurológica estável","Uso de imunossupressores em altas doses"],2,"Alergias ligeiras, infeções leves e doença neurológica estável NÃO contraindicam a vacinação."),
  Q("ped-imun-6","Imunizações","A vacina BCG, administrada à nascença, protege principalmente contra:",["Hepatite B","Formas graves de tuberculose (miliar e meníngea)","Poliomielite","Rotavírus"],1,"A BCG protege sobretudo contra formas graves de TB na infância (miliar e meníngea)."),

  // ===================== ALIMENTAÇÃO NO 1.º ANO =====================
  Q("ped-alim-1","Alimentação","Segundo a recomendação atual, o aleitamento materno exclusivo deve ser mantido até:",["3 meses","6 meses","12 meses","2 meses"],1,"O aleitamento materno exclusivo é recomendado até aos 6 meses de idade."),
  Q("ped-alim-2","Alimentação","A introdução de leite de vaca não modificado antes de 1 ano associa-se a maior risco de:",["Anemia ferropénica e alergias","Imunidade reforçada","Crescimento acelerado saudável","Prevenção de obesidade"],0,"O leite de vaca precoce associa-se a anemia ferropénica, microsangramento intestinal, alergias e risco de obesidade."),
  Q("ped-alim-3","Alimentação","Lactente saudável de 1 mês com regurgitações frequentes, sem perda de peso nem irritabilidade. A conduta é:",["Iniciar antibiótico","Orientar medidas posturais e tranquilizar — refluxo fisiológico","Suspender o aleitamento materno","Cirurgia anti-refluxo"],1,"A regurgitação fisiológica do lactente resolve com medidas posturais e fracionamento; não exige fármacos."),
  Q("ped-alim-4","Alimentação","O desmame precoce é considerado, no contexto angolano, um importante fator de risco para:",["Glaucoma congénito","Desnutrição energético-protéica e diarreia","Trigonocefalia","Paralisia de Erb"],1,"O desmame precoce predispõe à desnutrição e a episódios diarreicos por perda da proteção do leite materno."),

  // ===================== DESNUTRIÇÃO =====================
  Q("ped-dep-1","Desnutrição","Criança de 18 meses com emagrecimento extremo, ausência de tecido adiposo, 'face de velho' e SEM edema. O diagnóstico é:",["Kwashiorkor","Marasmo","Obesidade","Anemia ferropénica isolada"],1,"A DEP grave sem edema, com perda intensa de massa e 'face senil', corresponde a marasmo."),
  Q("ped-dep-2","Desnutrição","Criança com edema bilateral dos membros, hepatomegalia, alterações da pele e cabelo e apatia. O diagnóstico é:",["Marasmo","Kwashiorkor","Síndrome nefrótico congénito","Cardiopatia congénita"],1,"O Kwashiorkor é DEP com edema, lesões cutâneas, alterações do cabelo e hepatomegalia (esteatose)."),
  Q("ped-dep-3","Desnutrição","No tratamento dietético da desnutrição aguda grave, a fase de estabilização inicial utiliza:",["Leite F100 hipercalórico","Leite terapêutico F75","Leite de vaca integral","Apenas soro glicosado"],1,"A fase de estabilização usa F75 (menos proteína/sódio); o F100 é reservado à fase de reabilitação/ganho ponderal."),
  Q("ped-dep-4","Desnutrição","Na criança gravemente desnutrida, a complicação metabólica frequente e potencialmente fatal a prevenir nas primeiras horas é:",["Hipertensão arterial","Hipoglicemia e hipotermia","Hiperglicemia isolada","Glaucoma"],1,"A criança desnutrida tem reservas reduzidas — hipoglicemia e hipotermia são frequentes e potencialmente fatais."),
  Q("ped-dep-5","Desnutrição","A solução de reidratação preferida na desnutrição aguda grave com desidratação é:",["SRO padrão da OMS","ReSoMal (menos sódio, mais potássio)","Ringer lactato rápido em bólus","Água açucarada apenas"],1,"O ReSoMal tem menos sódio e mais potássio, adequado ao desnutrido grave; a SRO padrão pode causar sobrecarga de sódio."),
  Q("ped-dep-6","Desnutrição","Durante a renutrição, o reaparecimento de diarreia osmótica transitória designa-se:",["Diarreia disentérica","Diarreia de renutrição","Cólera","Enterocolite necrotizante"],1,"A diarreia de renutrição é osmótica e transitória, surgindo com a reintrodução alimentar do desnutrido."),
  Q("ped-dep-7","Desnutrição","Entre os determinantes sociais da desnutrição em Angola NÃO se inclui:",["Pobreza e subemprego","Educação precária e desmame precoce","Exclusão do sistema de saúde","Excesso de aleitamento materno exclusivo"],3,"O aleitamento materno exclusivo é protetor; pobreza, baixa escolaridade e desmame precoce são causas de desnutrição."),

  // ===================== RECÉM-NASCIDO NORMAL =====================
  Q("ped-rn-1","RN Normal","RN de termo classifica-se quando a idade gestacional ao nascer está entre:",["28 e 33 semanas","34 e 36 semanas","37 e 41 semanas","≥42 semanas"],2,"RN de termo: 37 a 41 semanas; pré-termo <37; pós-termo ≥42."),
  Q("ped-rn-2","RN Normal","RN com peso de nascimento abaixo do percentil 10 para a idade gestacional classifica-se como:",["GIG","AIG","PIG","Macrossómico"],2,"Peso <P10 = pequeno para a idade gestacional (PIG); P10-P90 AIG; >P90 GIG."),
  Q("ped-rn-3","RN Normal","Icterícia que surge após as 24 horas de vida, com bilirrubina em níveis baixos e bom estado geral, é tipicamente:",["Patológica, exigindo exsanguinotransfusão","Fisiológica","Sinal de sepse precoce","Atresia das vias biliares"],1,"A icterícia fisiológica surge após 24h, é leve e autolimitada; icterícia nas primeiras 24h é sempre patológica."),
  Q("ped-rn-4","RN Normal","Lesão cutânea benigna do RN, em pápulas brancas no nariz por retenção sebácea, designa-se:",["Eritema tóxico","Milium sebáceo","Mancha mongólica","Hemangioma capilar"],1,"O milium sebáceo são pequenas pápulas brancas (retenção de sebo) benignas e transitórias."),
  Q("ped-rn-5","RN Normal","Mancha azulada na região lombossagrada do RN, benigna e que regride espontaneamente, é a:",["Petéquia","Mancha mongólica","Máscara equimótica","Eritrose"],1,"A mancha mongólica é uma melanocitose dérmica benigna lombossagrada que regride com a idade."),
  Q("ped-rn-6","RN Normal","Em recém-nascido masculino, a incapacidade de retração do prepúcio nos primeiros meses é:",["Sempre patológica, indicando cirurgia imediata","Fimose fisiológica","Hipospádia","Criptorquidia"],1,"A fimose fisiológica é normal no RN/lactente, resolvendo-se espontaneamente na maioria."),
  Q("ped-rn-7","RN Normal","Profilaxia de rotina realizada nos olhos do RN para prevenir a oftalmia neonatal é:",["Instilação de soro fisiológico apenas","Aplicação de antibiótico/antissético ocular","Colírio de dilatação pupilar","Oclusão ocular por 24h"],1,"A profilaxia da oftalmia neonatal faz-se com antibiótico/antissético ocular logo após o nascimento."),

  // ===================== RECÉM-NASCIDO PRÉ-TERMO =====================
  Q("ped-pt-1","RN Pré-Termo","Recém-nascido com idade gestacional inferior a 37 semanas e peso de 1200 g classifica-se como:",["Termo, peso adequado","Pré-termo, muito baixo peso (1000-1499 g)","Pós-termo, macrossómico","Pré-termo, extremo baixo peso (<1000 g)"],1,"Peso entre 1000-1499 g = muito baixo peso; <1000 g extremo baixo peso; <2500 g baixo peso."),
  Q("ped-pt-2","RN Pré-Termo","Hemorragia cerebral típica do pré-termo, originada na matriz germinativa, é a:",["Hemorragia subdural","Hemorragia peri-intraventricular (HPIV)","Hemorragia conjuntival","Cefalohematoma"],1,"A HPIV origina-se na matriz germinativa imatura e é caraterística do pré-termo."),
  Q("ped-pt-3","RN Pré-Termo","Pré-termo em nutrição enteral que desenvolve distensão abdominal, sangue nas fezes e pneumatose intestinal. O diagnóstico é:",["Refluxo gastroesofágico","Enterocolite necrotizante","Cólica do lactente","Obstipação funcional"],1,"Distensão, sangue nas fezes e pneumatose intestinal definem enterocolite necrotizante, grave no pré-termo."),
  Q("ped-pt-4","RN Pré-Termo","A persistência do canal arterial (PCA) no pré-termo pode ser tratada farmacologicamente com:",["Furosemida","Indometacina (ou ibuprofeno)","Surfactante","Adrenalina"],1,"A indometacina/ibuprofeno promove o encerramento farmacológico do canal arterial no pré-termo."),
  Q("ped-pt-5","RN Pré-Termo","A triagem oftalmológica do pré-termo destina-se a detetar precocemente:",["Catarata congénita","Retinopatia da prematuridade (ROP)","Glaucoma","Estrabismo transitório"],1,"A ROP é a principal indicação de triagem oftalmológica no pré-termo, podendo levar à cegueira."),
  Q("ped-pt-6","RN Pré-Termo","Pausa respiratória superior a 20 segundos, frequente no pré-termo por imaturidade do centro respiratório, designa-se:",["Taquipneia transitória","Apneia da prematuridade","Síndrome de aspiração meconial","Asfixia perinatal"],1,"A apneia da prematuridade resulta da imaturidade do controlo central da respiração."),

  // ===================== SEPSE NEONATAL =====================
  Q("ped-sep-1","Sepse Neonatal","Sepse neonatal que se manifesta nas primeiras 72 horas de vida classifica-se como:",["Sepse tardia","Sepse precoce","Sepse nosocomial fúngica","Meningite crónica"],1,"Sepse precoce: <72h de vida (transmissão materno-fetal); tardia: >72h."),
  Q("ped-sep-2","Sepse Neonatal","O agente etiológico classicamente mais associado à sepse neonatal precoce é:",["Staphylococcus aureus","Streptococcus agalactiae (SGB/GBS)","Cândida albicans","Staphylococcus coagulase negativo"],1,"O Streptococcus do grupo B (S. agalactiae) é a principal causa de sepse neonatal precoce; E. coli e Listeria também."),
  Q("ped-sep-3","Sepse Neonatal","Constitui fator de risco maior para sepse neonatal precoce:",["Aleitamento materno exclusivo","Rotura prematura de membranas >18-24h e corioamnionite","Vacinação BCG à nascença","Parto eutócico de termo"],1,"RPM prolongada, corioamnionite e líquido amniótico fétido aumentam o risco de sepse precoce."),
  Q("ped-sep-4","Sepse Neonatal","O esquema de antibioterapia empírica clássico na sepse neonatal precoce é:",["Vancomicina + meropenem","Ampicilina + gentamicina","Metronidazol isolado","Fluconazol oral"],1,"Ampicilina + aminoglicosídeo (gentamicina) cobre SGB, Listeria e Gram-negativos da sepse precoce."),
  Q("ped-sep-5","Sepse Neonatal","Na sepse neonatal tardia hospitalar, com suspeita de Staphylococcus resistente, o antibiótico de eleição é:",["Penicilina G","Vancomicina","Nistatina","Amoxicilina oral"],1,"A sepse tardia por Staphylococcus (incl. coagulase negativo/resistentes) trata-se com vancomicina."),
  Q("ped-sep-6","Sepse Neonatal","Complicação grave da sepse neonatal que cursa com fontanela abaulada, convulsões e rigidez é:",["Icterícia fisiológica","Meningite neonatal","Eritema tóxico","Mancha mongólica"],1,"A meningite é complicação frequente da sepse neonatal — convulsões e fontanela abaulada são sinais de alerta."),
  Q("ped-sep-7","Sepse Neonatal","No hemograma do RN séptico, achados que apoiam o diagnóstico incluem:",["Trombocitose e leucocitose isoladas fisiológicas","Trombocitopenia, neutropenia/neutrofilia e relação I/T elevada","Hemoglobina e plaquetas normais sempre","Eosinofilia isolada"],1,"Trombocitopenia, neutropenia ou neutrofilia e índice I/T aumentado apoiam a sepse neonatal."),
  Q("ped-sep-8","Sepse Neonatal","A definição de SIRS no neonato baseia-se em alterações de:",["Apenas tensão arterial","Temperatura, frequência cardíaca, frequência respiratória e leucócitos","Apenas glicemia","Peso e estatura"],1,"A SIRS define-se por alterações de temperatura, FC, FR e contagem leucocitária."),
  Q("ped-sep-9","Sepse Neonatal","RN com líquido amniótico meconial que desenvolve dificuldade respiratória grave logo após o parto. O diagnóstico diferencial principal da sepse é:",["Síndrome de aspiração meconial","Cólica do lactente","Obstipação","Hidrocele"],0,"A síndrome de aspiração meconial entra no diagnóstico diferencial de sepse neonatal com dificuldade respiratória."),
  Q("ped-sep-10","Sepse Neonatal","Em sepse neonatal com choque séptico, após antibioterapia, a medida hemodinâmica inicial é:",["Restrição hídrica absoluta","Expansão volémica com cristaloide e suporte com aminas se refratário","Diurético em bólus","Apenas oxigénio"],1,"O choque séptico neonatal trata-se com expansão volémica e aminas (ex.: noradrenalina/dopamina) se refratário."),

  // ===================== DOENÇAS INFECCIOSAS / VACINÁVEIS =====================
  Q("ped-inf-1","Doenças Infecciosas","Criança não vacinada com febre, conjuntivite, coriza, tosse e exantema maculopapular com manchas de Koplik. O diagnóstico é:",["Varicela","Sarampo","Rubéola","Rotavírus"],1,"Febre, conjuntivite, coriza, tosse e manchas de Koplik que precedem o exantema são típicos de sarampo."),
  Q("ped-inf-2","Doenças Infecciosas","Conjunto de infeções congénitas designado pelo acrónimo TORCH inclui, entre outras:",["Tuberculose e otite","Toxoplasmose, rubéola, citomegalovírus, herpes e outras (sífilis, VIH)","Tétano e raiva","Cólera e disenteria"],1,"TORCH = Toxoplasmose, Outras (sífilis, VIH, HepB), Rubéola, Citomegalovírus, Herpes."),
  Q("ped-inf-3","Doenças Infecciosas","Na prevenção da transmissão vertical do VIH, é fundamental:",["Suspender todo o seguimento pré-natal","Profilaxia antirretroviral materna e ao RN e aconselhamento da amamentação","Vacinar com BCG e ignorar o estado materno","Não testar a grávida"],1,"A profilaxia ARV à mãe e ao RN reduz drasticamente a transmissão vertical do VIH."),
  Q("ped-inf-4","Doenças Infecciosas","Criança com broncopneumonia bacteriana adquirida na comunidade. Antibiótico oral apropriado de 1.ª linha é frequentemente:",["Apenas paracetamol","Amoxicilina (ou amoxicilina + ácido clavulânico)","Nistatina","Fluconazol"],1,"A amoxicilina (±clavulânico) é antibiótico de 1.ª linha na pneumonia/broncopneumonia comunitária pediátrica."),

  // ===================== DERMATOLOGIA / HEMATOLOGIA NEONATAL =====================
  Q("ped-derm-1","Dermatologia Neonatal","Erupção benigna e autolimitada do RN, com máculas eritematosas e pápulas/pústulas estéreis nos primeiros dias, é:",["Melanose pustulosa","Eritema tóxico neonatal","Sepse cutânea","Hemangioma capilar"],1,"O eritema tóxico neonatal é uma erupção benigna, autolimitada e sem repercussão sistémica."),
  Q("ped-derm-2","Hematologia","Criança com antecedentes familiares de drepanocitose, palidez, icterícia e crises dolorosas. O tratamento de suporte de base inclui:",["Suspensão de líquidos","Hidratação, analgesia e ácido fólico","Apenas corticoide","Vacinas vivas em surto"],1,"Na drepanocitose, hidratação, analgesia, ácido fólico e profilaxia infecciosa são pilares; transfusão em crises graves."),
  Q("ped-derm-3","Hematologia","Anemia severa sintomática numa criança gravemente anémica trata-se, quando indicado, com:",["Soro glicosado isolado","Concentrado de hemácias","Apenas ferro oral em emergência","Diurético"],1,"A anemia severa sintomática exige transfusão de concentrado de hemácias."),

  // ===================== GASTRO / DIGESTIVO =====================
  Q("ped-gastro-1","Gastrointestinal","RN que não elimina mecónio nas primeiras 24-48h, com ausência de orifício anal visível. O diagnóstico é:",["Refluxo gastroesofágico","Imperfuração anal","Cólica intestinal","Obstipação funcional"],1,"A ausência de eliminação de mecónio com ânus não perfurado indica imperfuração anal."),
  Q("ped-gastro-2","Gastrointestinal","RN com salivação excessiva, engasgo e impossibilidade de progressão da sonda gástrica sugere:",["Atresia do esófago","Estenose hipertrófica do piloro","Refluxo fisiológico","Cólica do lactente"],0,"A atresia do esófago manifesta-se por sialorreia e impossibilidade de passar a sonda ao estômago."),
  Q("ped-gastro-3","Gastrointestinal","Criança com diarreia aguda e desidratação leve a moderada. A medida central é:",["Antibiótico de rotina sempre","Reidratação oral com SRO","Antidiarreico potente","Jejum prolongado"],1,"A reidratação oral com SRO é a base do tratamento da diarreia aguda; antibiótico só em indicações específicas."),

  // ===================== ORTOPEDIA / GENITURINÁRIO / OUTROS =====================
  Q("ped-orto-1","Ortopedia","RN com pé em flexão plantar e desvio em varo, redutível parcialmente. O diagnóstico é:",["Luxação da anca","Pé torto equinovaro","Polidactilia","Sindactilia"],1,"O pé equinovaro (pé torto) apresenta equino + varo; pode ser redutível (postural) ou estruturado."),
  Q("ped-orto-2","Ortopedia","Dedos supranumerários no RN designam-se:",["Sindactilia","Polidactilia","Braquidactilia","Aracnodactilia"],1,"Polidactilia = dedos extranumerários; sindactilia = fusão; braquidactilia = dedos curtos."),
  Q("ped-gu-1","Geniturinário","RN masculino com bolsa escrotal aumentada, transiluminação positiva e sem dor. O diagnóstico provável é:",["Hérnia inguinal encarcerada","Hidrocele","Criptorquidia","Torção testicular"],1,"A transiluminação positiva e ausência de dor sugerem hidrocele; a maioria resolve no 1.º ano."),
  Q("ped-gu-2","Geniturinário","Ausência de testículo na bolsa escrotal, não palpável no canal inguinal, define:",["Hidrocele","Criptorquidia","Hipospádia","Fimose"],1,"A criptorquidia é a ausência do testículo na bolsa por falha de descida."),
  Q("ped-gu-3","Geniturinário","Abertura uretral na face ventral do pénis caracteriza:",["Epispádia","Hipospádia","Fimose","Fístula pré-auricular"],1,"Hipospádia = meato na face ventral; epispádia = na face dorsal."),

  // ===================== CONDIÇÕES PERINATAIS / OFTALMO / ORL / DENTÁRIA =====================
  Q("ped-peri-1","Condições Perinatais","RN com idade gestacional ≥42 semanas, pele descamativa e unhas longas, classifica-se como:",["Pré-termo","Termo","Pós-termo","Muito pré-termo"],2,"≥42 semanas = pós-termo, frequentemente com pele descamativa e sinais de dismaturidade."),
  Q("ped-peri-2","Condições Perinatais","Peso ao nascer superior a 4000 g define:",["Baixo peso","Macrossomia","Muito baixo peso","Extremo baixo peso"],1,"Macrossomia = peso ao nascer >4000 g, frequente em diabetes gestacional."),
  Q("ped-oft-1","Oftalmologia","Estrabismo intermitente nas primeiras semanas de vida, sem outros sinais, é habitualmente:",["Sempre patológico, exige cirurgia imediata","Transitório/fisiológico nesta fase","Sinal de glaucoma","Catarata congénita"],1,"Estrabismo intermitente é frequentemente transitório nas primeiras semanas; persistência exige avaliação."),
  Q("ped-orl-1","Otorrinolaringologia","RN com cianose que melhora ao chorar e piora em repouso/alimentação, com dificuldade à passagem de sonda nasal. Suspeita-se de:",["Fístula pré-auricular","Atresia das coanas","Otite média","Sinusite"],1,"A atresia das coanas dá cianose cíclica (melhora ao chorar) e impede a passagem da sonda nasal."),
  Q("ped-dent-1","Estomatologia","Lactente com placas brancas aderentes na mucosa oral que não se removem facilmente, em contexto de uso de antibiótico. O diagnóstico e tratamento são:",["Pérolas de Epstein — observação","Candidíase oral (monilíase/sapinho) — nistatina","Dente natal — extração","Cárie — selante"],1,"A monilíase oral (Candida) trata-se com nistatina; pérolas de Epstein e dente natal são entidades distintas."),
  Q("ped-dent-2","Estomatologia","Pequenos quistos esbranquiçados no palato do RN, benignos e transitórios, são:",["Cáries","Pérolas de Epstein","Sapinho","Dentes natais"],1,"As pérolas de Epstein são quistos benignos do palato do RN que regridem espontaneamente."),

  // ===================== COMPLEMENTAR — NEONATOLOGIA E PUERICULTURA AVANÇADA =====================
  Q("ped-comp-1","RN Pré-Termo","Distúrbio respiratório do pré-termo por deficiência de surfactante, com gemido, tiragem e infiltrado reticulogranular ('vidro despolido'). O tratamento específico é:",["Antibiótico isolado","Surfactante exógeno e suporte ventilatório","Indometacina","Furosemida"],1,"A doença das membranas hialinas (deficiência de surfactante) trata-se com surfactante exógeno e suporte ventilatório."),
  Q("ped-comp-2","RN Normal","Hipoglicemia neonatal é mais provável e deve ser rastreada de forma activa no RN:",["De termo, AIG, com aleitamento adequado","Filho de mãe diabética, macrossómico ou PIG","Sem qualquer fator de risco","Com icterícia fisiológica isolada"],1,"Filhos de mãe diabética, macrossómicos, PIG e pré-termo têm risco aumentado de hipoglicemia neonatal."),
  Q("ped-comp-3","Sepse Neonatal","Na sepse com suspeita de meningite neonatal, o exame fundamental para confirmação e orientação terapêutica é:",["Radiografia de tórax","Punção lombar com análise do LCR","Ecografia abdominal","Apenas hemograma"],1,"A punção lombar com estudo do LCR confirma a meningite e orienta a antibioterapia/duração."),
  Q("ped-comp-4","Imunizações","A vacina contra o rotavírus, por ser viva atenuada e de administração oral, tem como precaução importante:",["Idade limite de início e antecedente de invaginação intestinal","Aplicação intramuscular","Uso ilimitado em imunodeprimidos graves","Dose única aos 5 anos"],0,"A vacina do rotavírus deve respeitar a janela etária de início e é contraindicada com história de invaginação."),
  Q("ped-comp-5","Imunizações","Recém-nascido de mãe com Hepatite B (AgHBs positivo). A conduta correta inclui:",["Apenas vacinar aos 2 meses","Vacina da Hepatite B e imunoglobulina específica nas primeiras horas","Não vacinar até 1 ano","Apenas aleitamento sem profilaxia"],1,"Filho de mãe AgHBs+ deve receber vacina HepB + imunoglobulina (HBIG) idealmente nas primeiras 12-24h."),
  Q("ped-comp-6","Desnutrição","Sinal clínico que distingue o Kwashiorkor do marasmo é:",["Emagrecimento extremo sem edema","Presença de edema e alterações de cabelo/pele","Face de velho","Ausência total de tecido adiposo"],1,"O edema (com lesões de pele e cabelo) caracteriza o Kwashiorkor; o marasmo cursa sem edema."),
  Q("ped-comp-7","Desnutrição","Na desnutrição grave, a anemia deve ser corrigida com cuidado porque a transfusão precoce pode:",["Curar a desnutrição","Precipitar insuficiência cardíaca por sobrecarga","Aumentar o apetite","Prevenir hipoglicemia"],1,"A transfusão na desnutrição grave deve ser cautelosa pelo risco de sobrecarga e insuficiência cardíaca."),
  Q("ped-comp-8","Síndrome Febril","Criança com febre, cefaleia, rigidez da nuca, vómitos e Kernig positivo. A conduta prioritária é:",["Alta com antitérmico","Suspeita de meningite — punção lombar e antibiótico empírico precoce","Apenas reidratação oral","Broncodilatador"],1,"Febre, rigidez da nuca e sinais meníngeos = meningite; impõe-se PL e antibioticoterapia empírica imediata."),
  Q("ped-comp-9","Doenças Respiratórias","RN de termo, cesariana eletiva, com taquipneia transitória que melhora em 24-72h e RX com tramas peri-hilares. O diagnóstico é:",["Síndrome de aspiração meconial","Taquipneia transitória do RN","Sepse precoce","Doença das membranas hialinas"],1,"A taquipneia transitória do RN, por reabsorção lenta do líquido pulmonar, é comum na cesariana eletiva e autolimitada."),
  Q("ped-comp-10","Cardiovascular","Lactente com cianose central que não melhora com oxigénio, sopro e dessaturação. A categoria diagnóstica é:",["Cardiopatia congénita cianótica","Taquipneia transitória","Cólica do lactente","Refluxo gastroesofágico"],0,"Cianose que não responde ao oxigénio (teste de hiperóxia) sugere cardiopatia congénita cianótica."),
  Q("ped-comp-11","Convulsões","RN com convulsões nas primeiras horas, na ausência de sepse, com antecedente de sofrimento fetal/asfixia. A causa provável é:",["Encefalopatia hipóxico-isquémica","Eritema tóxico","Mancha mongólica","Milium"],0,"A encefalopatia hipóxico-isquémica por asfixia perinatal é causa importante de convulsões neonatais precoces."),
  Q("ped-comp-12","Convulsões","Anticonvulsivante clássico de 1.ª linha nas convulsões neonatais é:",["Paracetamol","Fenobarbital","Furosemida","Nistatina"],1,"O fenobarbital é o anticonvulsivante de 1.ª linha tradicional nas convulsões neonatais."),
  Q("ped-comp-13","Icterícia","Icterícia que surge nas primeiras 24 horas de vida deve ser sempre considerada:",["Fisiológica","Patológica, exigindo investigação (incl. incompatibilidade)","Benigna sem seguimento","Causada por leite materno apenas"],1,"Icterícia <24h é sempre patológica — investigar incompatibilidade ABO/Rh, hemólise e infeção."),
  Q("ped-comp-14","Tocotraumatismo","Tumefacção do couro cabeludo presente ao nascimento, que cruza suturas e regride em poucos dias, é:",["Cefalohematoma","Bossa serossanguínea","Hemorragia intracraniana","Caput por craniossinostose"],1,"A bossa serossanguínea é edema do couro cabeludo que cruza suturas e regride rapidamente."),
  Q("ped-comp-15","Tocotraumatismo","RN de parto laborioso com crepitação e dor à mobilização do ombro e Moro assimétrico. A lesão mais provável é:",["Luxação da anca","Fratura da clavícula","Pé torto","Sindactilia"],1,"A fratura da clavícula é o tocotraumatismo ósseo mais frequente, com crepitação e Moro assimétrico."),
  Q("ped-comp-16","Puericultura","A suplementação de vitamina A em campanhas pediátricas tem como objetivo principal:",["Tratar a malária","Reduzir mortalidade e cegueira por défice de vitamina A","Substituir vacinas","Tratar a sepse"],1,"A vitamina A reduz mortalidade infantil e previne a cegueira nutricional em zonas de carência."),
  Q("ped-comp-17","Puericultura","A desparasitação periódica com albendazol em crianças visa controlar:",["Infeções por helmintas (geo-helmintíases)","Malária","Tuberculose","Sepse neonatal"],0,"O albendazol é anti-helmíntico usado na desparasitação periódica contra geo-helmintos."),
  Q("ped-comp-18","Doenças Infecciosas","Profilaxia intraparto com penicilina G à grávida colonizada destina-se a prevenir a sepse neonatal por:",["E. coli","Streptococcus do grupo B (SGB)","Cândida","Listeria"],1,"A profilaxia intraparto com penicilina G reduz a sepse precoce por Streptococcus do grupo B."),
  Q("ped-comp-19","Sepse Neonatal","RN com sepse refratária à ampicilina+gentamicina e suspeita de infeção fúngica invasiva. O fármaco indicado é:",["Vancomicina","Anfotericina B (ou fluconazol)","Metronidazol","Eritromicina"],1,"A infeção fúngica invasiva neonatal trata-se com anfotericina B ou fluconazol."),
  Q("ped-comp-20","Hematologia","RN séptico com sangramento difuso, prolongamento do TP/TTPa, plaquetas baixas e D-dímeros elevados. O quadro é:",["Anemia ferropénica","Coagulação intravascular disseminada (CID)","Policitemia","Trombocitose benigna"],1,"Consumo de fatores e plaquetas com sangramento difuso na sepse define CID."),
  Q("ped-comp-21","Gastrointestinal","Lactente com obstipação, atraso de eliminação de mecónio e distensão, com suspeita de aganglionose colónica. A doença é:",["Doença de Hirschsprung","Refluxo gastroesofágico","Cólera","Enterocolite necrotizante"],0,"O atraso na eliminação de mecónio com distensão e obstipação sugere doença de Hirschsprung (aganglionose)."),
  Q("ped-comp-22","Endócrino","Triagem neonatal alterada para TSH elevado e T4 baixo. O diagnóstico, cujo tratamento precoce previne défice intelectual, é:",["Fenilcetonúria","Hipotireoidismo congénito","Diabetes neonatal","Hiperplasia adrenal"],1,"TSH alta com T4 baixa = hipotireoidismo congénito; o tratamento precoce com levotiroxina previne o défice cognitivo."),
  Q("ped-comp-23","Dermatologia Neonatal","Lesão vascular vermelha, saliente, que pode crescer nos primeiros meses e depois involuir espontaneamente, é o:",["Hemangioma capilar (infantil)","Mancha mongólica","Eritema tóxico","Milium"],0,"O hemangioma infantil prolifera nos primeiros meses e involui espontaneamente na maioria dos casos."),
  Q("ped-comp-24","Recém-Nascido","Circular do cordão apertada pode originar no RN uma coloração arroxeada da face designada:",["Mancha mongólica","Máscara equimótica (cianótica)","Eritrose","Plethora"],1,"A máscara equimótica resulta de estase venosa cefálica por circular de cordão; é tipicamente benigna."),
  Q("ped-comp-25","Síndromes do RN","Diagnóstico diferencial entre sepse neonatal e cardiopatia congénita cianótica apoia-se sobretudo em:",["Teste de hiperóxia e ecocardiograma","Coprocultura","Manobra de Ortolani","Teste do pezinho"],0,"O teste de hiperóxia e o ecocardiograma ajudam a distinguir causa cardíaca de causa infecciosa/pulmonar da cianose."),
];
