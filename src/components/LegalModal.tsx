import { useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = { trigger: ReactNode; defaultTab?: "termos" | "privacidade" };

export const LegalModal = ({ trigger, defaultTab = "termos" }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Documentos Legais</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="termos">Termos de Uso</TabsTrigger>
            <TabsTrigger value="privacidade">Política de Privacidade</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[60vh] mt-4 pr-4">
            <TabsContent value="termos" className="space-y-4 text-sm leading-relaxed text-foreground/90">
              <Section title="1. Identificação do Responsável">
                <p>
                  A plataforma <strong>Passei</strong> (doravante "Plataforma") é de propriedade e operada pela
                  <strong> NANODIGITALONE — CONSULTORIA E PRESTAÇÃO DE SERVIÇOS</strong>, doravante denominada
                  "NanoDigitalOne", responsável legal por todo o conteúdo, tecnologia, gestão e operação da Plataforma.
                </p>
                <p>Contacto: nanodigitalone@gmail.com</p>
              </Section>

              <Section title="2. Objecto">
                <p>
                  A Plataforma tem como <strong>único e exclusivo objectivo</strong> auxiliar candidatos na
                  <strong> preparação para concursos públicos</strong>, através de simulados, questões comentadas,
                  trilhas de estudo, estatísticas de desempenho e materiais didácticos.
                </p>
              </Section>

              <Section title="3. Ausência de Vínculo Institucional">
                <p>
                  A NanoDigitalOne e a Plataforma Passei <strong>NÃO possuem qualquer vínculo, parceria, afiliação,
                  patrocínio, endosso ou relação oficial</strong> com o Ministério da Saúde (MINSA), com qualquer
                  outro órgão público, ministério, instituição governamental, comissão organizadora de concursos
                  ou banca examinadora.
                </p>
                <p>
                  Todas as referências a concursos, instituições ou cargos têm finalidade meramente informativa
                  e educacional. As questões disponibilizadas são <strong>elaboradas internamente</strong> com base
                  em programas oficiais públicos e <strong>não representam questões oficiais</strong> de qualquer
                  concurso. Marcas, nomes e siglas de instituições públicas pertencem aos seus respectivos titulares.
                </p>
              </Section>

              <Section title="4. Sem Garantia de Aprovação">
                <p>
                  O uso da Plataforma <strong>não garante aprovação</strong> em qualquer concurso público. Os resultados
                  dependem exclusivamente do esforço, dedicação e capacidade individual do utilizador. A NanoDigitalOne
                  não se responsabiliza por reprovações, classificações obtidas ou expectativas não alcançadas.
                </p>
              </Section>

              <Section title="5. Cadastro e Conta de Utilizador">
                <p>
                  O acesso requer autenticação através de conta Google. O utilizador compromete-se a fornecer
                  informações verdadeiras e a manter a confidencialidade da sua conta. É proibido partilhar a
                  conta, criar perfis falsos ou utilizar a Plataforma em nome de terceiros sem autorização.
                </p>
              </Section>

              <Section title="6. Códigos de Activação">
                <p>
                  Determinadas funcionalidades podem exigir códigos de activação distribuídos pela NanoDigitalOne.
                  Estes códigos são <strong>pessoais, intransmissíveis e de uso único</strong>. A revenda, partilha
                  ou utilização indevida implica bloqueio imediato da conta sem direito a reembolso.
                </p>
              </Section>

              <Section title="7. Conduta do Utilizador">
                <p>É expressamente proibido:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Copiar, reproduzir, distribuir ou comercializar qualquer conteúdo da Plataforma;</li>
                  <li>Utilizar robôs, scripts ou meios automatizados para extrair dados;</li>
                  <li>Tentar aceder a áreas restritas, contornar mecanismos de segurança ou explorar vulnerabilidades;</li>
                  <li>Publicar conteúdo ofensivo, ilegal, difamatório ou que viole direitos de terceiros;</li>
                  <li>Utilizar a Plataforma para qualquer finalidade ilícita.</li>
                </ul>
              </Section>

              <Section title="8. Propriedade Intelectual">
                <p>
                  Todo o conteúdo da Plataforma — incluindo textos, questões, comentários, design, código, marca,
                  logótipo e materiais didácticos — é propriedade exclusiva da <strong>NanoDigitalOne</strong> e
                  encontra-se protegido pela legislação aplicável de direitos de autor e propriedade industrial.
                  É vedada qualquer utilização sem autorização prévia e expressa.
                </p>
              </Section>

              <Section title="9. Pagamentos e Reembolsos">
                <p>
                  Eventuais pagamentos pela aquisição de códigos ou planos são processados conforme as condições
                  vigentes no acto da compra. Por se tratar de produto digital de acesso imediato,
                  <strong> não são concedidos reembolsos</strong> após a activação do código, salvo nos casos
                  expressamente previstos em lei.
                </p>
              </Section>

              <Section title="10. Suspensão e Bloqueio">
                <p>
                  A NanoDigitalOne reserva-se o direito de <strong>suspender, bloquear ou eliminar</strong> qualquer
                  conta que viole estes Termos, sem aviso prévio e sem direito a indemnização ou reembolso.
                </p>
              </Section>

              <Section title="11. Limitação de Responsabilidade">
                <p>
                  A Plataforma é disponibilizada "tal como está". A NanoDigitalOne envida esforços para manter o
                  serviço disponível e o conteúdo actualizado, mas <strong>não garante</strong> ausência de erros,
                  interrupções ou falhas técnicas. Em nenhuma hipótese a NanoDigitalOne será responsável por danos
                  indirectos, lucros cessantes, perda de dados ou consequências decorrentes do uso da Plataforma.
                </p>
              </Section>

              <Section title="12. Alterações dos Termos">
                <p>
                  Estes Termos podem ser alterados a qualquer momento. As alterações entram em vigor a partir da
                  sua publicação na Plataforma. O uso continuado representa aceitação tácita da versão actualizada.
                </p>
              </Section>

              <Section title="13. Lei Aplicável e Foro">
                <p>
                  Estes Termos são regidos pelas leis da <strong>República de Angola</strong>. Fica eleito o foro da
                  comarca de Luanda para dirimir quaisquer litígios decorrentes da utilização da Plataforma, com
                  renúncia expressa a qualquer outro.
                </p>
              </Section>

              <p className="text-xs text-muted-foreground pt-2">
                Última actualização: Maio de 2026 · © NANODIGITALONE — Consultoria e Prestação de Serviços.
              </p>
            </TabsContent>

            <TabsContent value="privacidade" className="space-y-4 text-sm leading-relaxed text-foreground/90">
              <Section title="1. Responsável pelo Tratamento dos Dados">
                <p>
                  O responsável pelo tratamento dos dados pessoais recolhidos através da Plataforma é a
                  <strong> NANODIGITALONE — CONSULTORIA E PRESTAÇÃO DE SERVIÇOS</strong>.
                  Contacto para questões de privacidade: <strong>nanodigitalone@gmail.com</strong>.
                </p>
              </Section>

              <Section title="2. Dados Recolhidos">
                <p>Recolhemos os seguintes dados, conforme necessário para a prestação do serviço:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Dados de conta Google:</strong> nome, endereço de e-mail e fotografia de perfil;</li>
                  <li><strong>Dados de utilização:</strong> categoria escolhida, simulados realizados, pontuações, respostas, estatísticas de desempenho e progresso;</li>
                  <li><strong>Dados técnicos:</strong> endereço IP, tipo de dispositivo, navegador, sistema operativo e logs de acesso;</li>
                  <li><strong>Códigos de activação:</strong> registo da utilização de códigos para fins de auditoria.</li>
                </ul>
              </Section>

              <Section title="3. Finalidades do Tratamento">
                <ul className="list-disc pl-6 space-y-1">
                  <li>Autenticar e gerir a conta do utilizador;</li>
                  <li>Prestar e personalizar os serviços da Plataforma;</li>
                  <li>Gerar estatísticas, rankings e relatórios de desempenho;</li>
                  <li>Enviar notificações operacionais e comunicações relativas ao serviço;</li>
                  <li>Prevenir fraudes, abusos e violações destes Termos;</li>
                  <li>Cumprir obrigações legais e regulatórias.</li>
                </ul>
              </Section>

              <Section title="4. Base Legal">
                <p>
                  O tratamento de dados fundamenta-se em (i) execução do contrato de prestação de serviço,
                  (ii) consentimento do utilizador no momento do registo, (iii) cumprimento de obrigações
                  legais e (iv) legítimo interesse da NanoDigitalOne na melhoria e segurança da Plataforma.
                </p>
              </Section>

              <Section title="5. Partilha de Dados">
                <p>
                  A NanoDigitalOne <strong>não vende</strong> dados pessoais. Os dados podem ser partilhados, no
                  limite estritamente necessário, com:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Prestadores de infraestrutura tecnológica (alojamento, autenticação, base de dados);</li>
                  <li>Google, para fins de autenticação (OAuth);</li>
                  <li>Autoridades públicas, quando exigido por lei ou decisão judicial.</li>
                </ul>
              </Section>

              <Section title="6. Cookies e Tecnologias Semelhantes">
                <p>
                  Utilizamos cookies e armazenamento local essenciais ao funcionamento da Plataforma, manutenção
                  de sessão e memorização de preferências. O utilizador pode configurar o seu navegador para
                  bloquear cookies, ciente de que algumas funcionalidades poderão ficar indisponíveis.
                </p>
              </Section>

              <Section title="7. Conservação dos Dados">
                <p>
                  Os dados são conservados enquanto a conta estiver activa e pelo período adicional necessário
                  ao cumprimento de obrigações legais, defesa em processos judiciais ou auditorias. Após este
                  período, os dados são eliminados ou anonimizados.
                </p>
              </Section>

              <Section title="8. Direitos do Titular dos Dados">
                <p>O utilizador tem direito a:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Aceder aos seus dados pessoais;</li>
                  <li>Solicitar correcção de dados incompletos ou desactualizados;</li>
                  <li>Solicitar a eliminação da conta e dos dados associados;</li>
                  <li>Retirar o consentimento previamente concedido;</li>
                  <li>Opor-se ao tratamento, nos limites da lei;</li>
                  <li>Solicitar portabilidade dos dados.</li>
                </ul>
                <p>
                  Para exercer estes direitos, contacte <strong>nanodigitalone@gmail.com</strong>.
                </p>
              </Section>

              <Section title="9. Segurança">
                <p>
                  Adoptamos medidas técnicas e organizativas adequadas para proteger os dados contra acesso não
                  autorizado, perda, alteração ou divulgação. Ainda assim, nenhum sistema é totalmente imune; o
                  utilizador deve igualmente proteger as suas credenciais de acesso.
                </p>
              </Section>

              <Section title="10. Menores">
                <p>
                  A Plataforma destina-se a candidatos maiores de 18 anos. Não recolhemos intencionalmente dados
                  de menores sem consentimento dos representantes legais.
                </p>
              </Section>

              <Section title="11. Transferências Internacionais">
                <p>
                  Alguns prestadores tecnológicos podem alojar dados fora de Angola. Nesses casos,
                  garantimos que os dados são tratados com nível adequado de protecção.
                </p>
              </Section>

              <Section title="12. Alterações desta Política">
                <p>
                  Esta Política pode ser actualizada periodicamente. Recomenda-se a sua revisão regular. O uso
                  continuado da Plataforma após alterações implica aceitação da nova versão.
                </p>
              </Section>

              <Section title="13. Contacto">
                <p>
                  Dúvidas, pedidos ou reclamações relativas ao tratamento dos seus dados podem ser dirigidas a:
                  <br />
                  <strong>NANODIGITALONE — Consultoria e Prestação de Serviços</strong>
                  <br />
                  E-mail: <strong>nanodigitalone@gmail.com</strong>
                </p>
              </Section>

              <p className="text-xs text-muted-foreground pt-2">
                Última actualização: Maio de 2026 · © NANODIGITALONE — Consultoria e Prestação de Serviços.
              </p>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="space-y-1.5">
    <h3 className="font-display font-semibold text-base text-foreground">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);
