/* =========================================================================
   STRATUX — fonte única de verdade.
   Nenhum texto institucional deve ser escrito direto no markup.
   ========================================================================= */

export type ProfileId = 'pf' | 'mei' | 'empresa';

export const brand = {
  name: 'Stratux',
  full: 'Stratux Consultoria Empresarial',
  legalName: 'STRATUX CONSULTORIA EMPRESARIAL LTDA',
  tagline: 'Consultoria Empresarial',
  motto: ['Estratégia', 'Gestão', 'Resultados'],
  headline: 'Contabilidade moderna para pessoas e empresas que querem evoluir.',
  intro:
    'A Stratux oferece serviços contábeis, fiscais e societários completos para pessoas físicas e jurídicas, com foco em organização, segurança e crescimento financeiro. Atuamos de forma estratégica para simplificar sua rotina e apoiar decisões mais inteligentes.',
  cnpj: '66.583.409/0001-96',
  domain: 'www.stratuxconsultoria.com.br',
} as const;

export const contact = {
  phoneLabel: '(11) 98415-8253',
  phoneE164: '+5511984158253',
  whatsappNumber: '5511984158253',
  /** TODO cliente: confirmar e-mail comercial. */
  email: null as string | null,
  responseTime: 'Respondemos em até 1 dia útil.',
} as const;

/** Monta o link do WhatsApp já com contexto na mensagem. */
export function wa(message: string): string {
  return `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const waDefault = wa(
  'Olá! Vim pelo site da Stratux e gostaria de falar sobre serviços contábeis.',
);

export const legal = {
  address: {
    street: 'Rua Padre Adelino, 424',
    complement: 'Apto 167',
    city: 'São Paulo',
    state: 'SP',
    zip: '03303-000',
    country: 'BR',
  },
  /** TODO cliente: responsável técnico e registro no CRC-SP. */
  crc: null as string | null,
  technicalLead: null as string | null,
} as const;

export const regions = [
  {
    id: 'sp',
    city: 'São Paulo',
    role: 'Matriz',
    covers: 'Capital e Zona Leste',
    detail: 'Rua Padre Adelino, 424 — Belenzinho, São Paulo/SP',
    /** Endereço completo e verificável — vira o pino exato no mapa. */
    mapQuery: 'Rua Padre Adelino, 424, Belenzinho, São Paulo - SP, 03303-000',
    hasAddress: true,
  },
  {
    id: 'osasco',
    city: 'Osasco',
    role: 'Atendimento',
    covers: 'Grande SP / Capital',
    detail: 'Região metropolitana e Oeste da capital',
    /** TODO cliente: endereço completo desta praça. Por ora, pino da cidade. */
    mapQuery: 'Osasco, SP',
    hasAddress: false,
  },
  {
    id: 'jundiai',
    city: 'Jundiaí',
    role: 'Atendimento',
    covers: 'Interior',
    detail: 'Eixo empresarial Anhanguera–Bandeirantes',
    /** TODO cliente: endereço completo desta praça. Por ora, pino da cidade. */
    mapQuery: 'Jundiaí, SP',
    hasAddress: false,
  },
  {
    id: 'santos',
    city: 'Santos',
    role: 'Atendimento',
    covers: 'Litoral',
    detail: 'Baixada Santista e porto',
    /** TODO cliente: endereço completo desta praça. Por ora, pino da cidade. */
    mapQuery: 'Santos, SP',
    hasAddress: false,
  },
] as const;

export const nav = [
  { label: 'Serviços', href: '#servicos' },
  { label: 'Calculadora', href: '#calculadora' },
  { label: 'Obrigações', href: '#obrigacoes' },
  { label: 'Como trabalhamos', href: '#processo' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Contato', href: '#contato' },
] as const;

export const profiles: {
  id: ProfileId;
  label: string;
  short: string;
  question: string;
  blurb: string;
  icon: string;
}[] = [
  {
    id: 'pf',
    label: 'Sou pessoa física',
    short: 'Pessoa física',
    question: 'Imposto de renda, investimentos, patrimônio e regularização.',
    blurb:
      'Declaração, ganho de capital, carnê-leão, investimentos e pendências com a Receita — resolvidos com quem entende o seu caso.',
    icon: 'user',
  },
  {
    id: 'mei',
    label: 'Sou MEI',
    short: 'MEI',
    question: 'Abertura, DAS, notas fiscais, funcionário e migração.',
    blurb:
      'Do CNPJ ao desenquadramento: mantemos o MEI em dia e avisamos quando crescer deixa de valer a pena.',
    icon: 'sprout',
  },
  {
    id: 'empresa',
    label: 'Tenho empresa',
    short: 'Empresa',
    question: 'Contabilidade, fiscal, folha e societário completos.',
    blurb:
      'Escrituração, apuração de tributos, folha de pagamento e obrigações acessórias, com relatórios que servem para decidir.',
    icon: 'building',
  },
];

export type ServiceItem = { label: string; blurb: string };
export type ServiceArea = {
  id: string;
  title: string;
  shortTitle: string;
  summary: string;
  icon: string;
  profiles: ProfileId[];
  items: ServiceItem[];
};

export const serviceAreas: ServiceArea[] = [
  {
    id: 'pessoa-fisica',
    title: 'Contábil e fiscal para pessoa física',
    shortTitle: 'Pessoa física',
    summary:
      'Imposto de renda, patrimônio e investimentos tratados com a mesma seriedade que damos a uma empresa.',
    icon: 'user',
    profiles: ['pf'],
    items: [
      {
        label: 'Imposto de Renda Pessoa Física (IRPF)',
        blurb: 'Declaração anual completa ou simplificada, com revisão de deduções e acompanhamento da restituição.',
      },
      {
        label: 'Planejamento tributário para pessoa física',
        blurb: 'Estudo do que você paga hoje e do que poderia pagar legalmente, antes do fim do ano-calendário.',
      },
      {
        label: 'Carnê-leão e rendimentos autônomos',
        blurb: 'Recolhimento mensal obrigatório de quem recebe de outra pessoa física ou do exterior.',
      },
      {
        label: 'Ganhos de capital e patrimônio',
        blurb: 'Apuração do imposto na venda de imóvel, veículo ou participação, com as isenções a que você tem direito.',
      },
      {
        label: 'Investimentos e renda variável',
        blurb: 'DARF mensal de ações, FIIs e cripto, apuração de prejuízo acumulado e informe para a declaração.',
      },
      {
        label: 'Regularização fiscal',
        blurb: 'Saída da malha fina, retificação de declarações, parcelamentos e baixa de pendências no CPF.',
      },
      {
        label: 'Brasileiros no exterior',
        blurb: 'Comunicação de saída definitiva, tributação de rendimentos fora do país e declaração de bens.',
      },
      {
        label: 'Profissionais autônomos e liberais',
        blurb: 'Médicos, advogados, engenheiros e consultores: livro-caixa, despesas dedutíveis e comparativo PF × PJ.',
      },
      {
        label: 'Serviços complementares',
        blurb: 'Certidões, procurações eletrônicas, acesso ao e-CAC e apoio em notificações da Receita.',
      },
    ],
  },
  {
    id: 'mei',
    title: 'Microempreendedor individual (MEI)',
    shortTitle: 'MEI',
    summary:
      'O regime mais simples do país ainda tem prazos, limites e armadilhas. Cuidamos de todos eles.',
    icon: 'sprout',
    profiles: ['mei'],
    items: [
      {
        label: 'Abertura, alteração e baixa do MEI',
        blurb: 'CNPJ, escolha correta das ocupações permitidas, mudança de endereço ou atividade e encerramento.',
      },
      {
        label: 'Obrigações mensais',
        blurb: 'Emissão e controle do DAS-SIMEI, que vence todo dia 20 e garante seu INSS.',
      },
      {
        label: 'Obrigações anuais',
        blurb: 'DASN-SIMEI, a declaração anual de faturamento entregue até 31 de maio.',
      },
      {
        label: 'Notas fiscais',
        blurb: 'Emissão de NFS-e nacional, configuração do certificado e organização do que precisa ser guardado.',
      },
      {
        label: 'Gestão de funcionário',
        blurb: 'O MEI pode ter um empregado: admissão, folha, FGTS, eSocial e rescisão.',
      },
      {
        label: 'Regularização e pendências',
        blurb: 'DAS em atraso, parcelamento, reativação de CNPJ e resposta a notificações.',
      },
      {
        label: 'Crescimento e migração',
        blurb: 'Passou do limite anual? Conduzimos o desenquadramento para ME sem interromper a operação.',
      },
      {
        label: 'Consultoria e suporte',
        blurb: 'Quando o MEI ainda compensa, quando deixa de compensar e qual é o passo seguinte.',
      },
    ],
  },
  {
    id: 'societaria',
    title: 'Societária e paralegal',
    shortTitle: 'Societária',
    summary: 'Do primeiro CNPJ à alteração de quadro societário, com a Junta e as prefeituras.',
    icon: 'stamp',
    profiles: ['empresa', 'mei', 'pf'],
    items: [
      {
        label: 'Abertura de empresas',
        blurb: 'Viabilidade, contrato social, CNPJ, inscrições estadual e municipal e escolha do regime.',
      },
      {
        label: 'Alterações contratuais',
        blurb: 'Entrada e saída de sócios, capital social, endereço, objeto social e nome empresarial.',
      },
      {
        label: 'Regularização de empresas',
        blurb: 'CNPJ inapto ou suspenso, cadastros desatualizados e pendências em órgãos públicos.',
      },
      {
        label: 'Baixa de empresas',
        blurb: 'Encerramento completo, com distrato, baixa nas três esferas e certidões negativas.',
      },
      {
        label: 'Processos específicos',
        blurb: 'Transformação de tipo societário, cisão, incorporação, filial e transferência de UF.',
      },
      {
        label: 'Licenças e alvarás',
        blurb: 'Alvará de funcionamento, licença sanitária, AVCB e demais exigências da atividade.',
      },
      {
        label: 'Consultoria e suporte',
        blurb: 'Qual tipo societário, qual regime e qual CNAE fazem sentido para o que você vai operar.',
      },
      {
        label: 'Serviços complementares',
        blurb: 'Certificado digital, procurações, certidões e acompanhamento de exigências da Junta.',
      },
    ],
  },
  {
    id: 'contabil',
    title: 'Contábil',
    shortTitle: 'Contábil',
    summary:
      'A escrituração que o fisco exige e os relatórios que a sua diretoria realmente lê.',
    icon: 'ledger',
    profiles: ['empresa'],
    items: [
      {
        label: 'Escrituração contábil',
        blurb: 'Lançamentos, conciliação bancária e livros diário e razão dentro das normas brasileiras.',
      },
      {
        label: 'Demonstrações contábeis',
        blurb: 'Balanço patrimonial, DRE, DMPL e notas explicativas assinadas por contador habilitado.',
      },
      {
        label: 'Apuração de resultados',
        blurb: 'Fechamento mensal com margem por linha, resultado antes e depois dos impostos.',
      },
      {
        label: 'Obrigações acessórias contábeis',
        blurb: 'ECD e ECF entregues no prazo, com os livros digitais autenticados.',
      },
      {
        label: 'Controle patrimonial',
        blurb: 'Cadastro de bens, depreciação e baixa de ativos com efeito fiscal correto.',
      },
      {
        label: 'Relatórios e análises gerenciais',
        blurb: 'Fluxo de caixa, indicadores e comparativos mensais — o que serve para decidir, não só para arquivar.',
      },
      {
        label: 'Regularização e conformidade',
        blurb: 'Recuperação de escrituração atrasada e correção de períodos anteriores.',
      },
      {
        label: 'Serviços complementares',
        blurb: 'Balanço para banco ou licitação, laudos e apoio em auditorias e due diligence.',
      },
    ],
  },
  {
    id: 'fiscal',
    title: 'Fiscal e tributária',
    shortTitle: 'Fiscal',
    summary: 'Apuração no prazo, nota conferida e nenhuma surpresa no fim do mês.',
    icon: 'receipt',
    profiles: ['empresa'],
    items: [
      {
        label: 'Rotinas fiscais operacionais',
        blurb: 'Escrituração de entradas e saídas, CFOP, CST e classificação fiscal dos produtos.',
      },
      {
        label: 'Apuração de tributos',
        blurb: 'Simples Nacional, IRPJ, CSLL, PIS, COFINS, ICMS, IPI e ISS conforme o seu regime.',
      },
      {
        label: 'Obrigações acessórias',
        blurb: 'SPED Fiscal, EFD-Contribuições, EFD-Reinf, DCTF e declarações municipais.',
      },
      {
        label: 'Notas fiscais',
        blurb: 'Emissão, cancelamento, carta de correção, NFS-e nacional e guarda dos XML.',
      },
      {
        label: 'Controle e conferência',
        blurb: 'Cruzamento entre o que foi emitido, o que foi escriturado e o que caiu no caixa.',
      },
      {
        label: 'Regularização fiscal',
        blurb: 'Parcelamentos, denúncia espontânea, certidões negativas e resposta a autos de infração.',
      },
      {
        label: 'Serviços complementares',
        blurb: 'Revisão tributária, recuperação de créditos e simulação de troca de regime.',
      },
    ],
  },
  {
    id: 'trabalhista',
    title: 'Trabalhista e previdenciária',
    shortTitle: 'Trabalhista',
    summary: 'Folha fechada no dia certo, eSocial em ordem e rescisão sem passivo.',
    icon: 'people',
    profiles: ['empresa', 'mei'],
    items: [
      {
        label: 'Admissão de funcionários',
        blurb: 'Contrato, registro em carteira, exames admissionais e eventos do eSocial.',
      },
      {
        label: 'Folha de pagamento',
        blurb: 'Cálculo mensal, holerites, INSS, IRRF, vale-transporte e benefícios.',
      },
      {
        label: 'Obrigações acessórias trabalhistas',
        blurb: 'eSocial, FGTS Digital, DCTFWeb e CAGED dentro dos prazos legais.',
      },
      { label: 'Férias', blurb: 'Programação, cálculo do terço constitucional e pagamento até dois dias antes do início.' },
      { label: '13º salário', blurb: 'Primeira parcela até 30 de novembro, segunda até 20 de dezembro, com os encargos.' },
      {
        label: 'Rescisão de contrato',
        blurb: 'Cálculo do acerto, aviso prévio, guias do FGTS e comunicação no eSocial.',
      },
      {
        label: 'Controle de ponto e jornada',
        blurb: 'Banco de horas, adicional noturno, horas extras e adequação ao registro eletrônico.',
      },
      {
        label: 'Regularização e suporte trabalhista',
        blurb: 'Passivos, acordos, homologações e apoio em fiscalizações do trabalho.',
      },
      {
        label: 'Serviços complementares',
        blurb: 'Pró-labore, contribuição sindical, estagiários e contratos de aprendizagem.',
      },
    ],
  },
];

/* ---------- Como trabalhamos ---------- */
export const processSteps = [
  {
    n: '01',
    title: 'Diagnóstico',
    text: 'Levantamos regime, obrigações em aberto, folha e histórico. Você recebe um retrato honesto da situação antes de qualquer proposta.',
    icon: 'search',
  },
  {
    n: '02',
    title: 'Abertura ou migração',
    text: 'Abrimos a empresa ou trazemos a contabilidade do escritório anterior, sem interromper a operação nem perder prazo.',
    icon: 'transfer',
  },
  {
    n: '03',
    title: 'Rotina mensal',
    text: 'Escrituração, apuração, folha e obrigações acessórias com calendário próprio e aviso antes de cada vencimento.',
    icon: 'calendar',
  },
  {
    n: '04',
    title: 'Relatórios e decisão',
    text: 'Fechamento comentado: o que mudou, o que preocupa e o que dá para fazer. Contabilidade que vira informação de gestão.',
    icon: 'chart',
  },
] as const;

/* ---------- Missão, visão, valores ---------- */
export const mission =
  'Oferecer soluções contábeis, fiscais e financeiras com excelência, auxiliando empresas na tomada de decisões estratégicas, garantindo conformidade legal e promovendo crescimento sustentável com segurança e transparência.';

export const vision =
  'Ser reconhecida como um escritório contábil de referência no Brasil, destacando-se pela inovação, qualidade no atendimento e impacto positivo nos resultados dos clientes.';

export const values = [
  { title: 'Ética e transparência', text: 'Atuamos com integridade em todas as relações, prezando pela confiança e pela responsabilidade.', icon: 'shield' },
  { title: 'Compromisso com o cliente', text: 'Entregamos soluções personalizadas, com foco nas necessidades e nos resultados de cada cliente.', icon: 'handshake' },
  { title: 'Excelência técnica', text: 'Buscamos constante atualização e precisão em nossos serviços.', icon: 'award' },
  { title: 'Inovação e tecnologia', text: 'Utilizamos ferramentas modernas para otimizar processos e gerar mais valor.', icon: 'spark' },
  { title: 'Agilidade e eficiência', text: 'Respondemos com rapidez e organização, sem perder a qualidade.', icon: 'bolt' },
  { title: 'Confidencialidade', text: 'Respeitamos o sigilo das informações com máxima segurança.', icon: 'lock' },
  { title: 'Valorização das pessoas', text: 'Investimos no desenvolvimento da equipe e no relacionamento humano.', icon: 'people' },
] as const;

/* =========================================================================
   Calendário de obrigações
   Datas de referência. Vencimento em fim de semana ou feriado antecipa ou
   posterga conforme a regra de cada tributo; ISS e ICMS variam por município
   e por estado. Sempre confirme com a Stratux.
   ========================================================================= */
export type Obligation = {
  name: string;
  day: number;
  who: string;
  profiles: ProfileId[];
  note: string;
  /** mês 1-12; ausente = mensal */
  month?: number;
};

export const monthlyObligations: Obligation[] = [
  { name: 'Salários', day: 5, who: '5º dia útil', profiles: ['empresa', 'mei'], note: 'Pagamento da folha do mês anterior.' },
  { name: 'EFD-Contribuições', day: 10, who: 'Lucro Real e Presumido', profiles: ['empresa'], note: 'Até o 10º dia útil do 2º mês seguinte.' },
  { name: 'ISS', day: 10, who: 'Prestadores de serviço', profiles: ['empresa'], note: 'Em São Paulo capital, dia 10. Varia por município.' },
  { name: 'eSocial e DCTFWeb', day: 15, who: 'Quem tem folha', profiles: ['empresa', 'mei'], note: 'Fechamento da folha e confissão dos débitos previdenciários.' },
  { name: 'DAS — Simples Nacional', day: 20, who: 'Optantes do Simples', profiles: ['empresa'], note: 'Guia única do faturamento do mês anterior.' },
  { name: 'DAS-SIMEI', day: 20, who: 'MEI', profiles: ['mei'], note: 'Valor fixo mensal. É ele que garante o seu INSS.' },
  { name: 'FGTS Digital', day: 20, who: 'Quem tem funcionário', profiles: ['empresa', 'mei'], note: 'Depósito do mês anterior via FGTS Digital.' },
  { name: 'IRRF e INSS', day: 20, who: 'Retenções da folha', profiles: ['empresa'], note: 'Recolhimento das retenções do mês anterior.' },
  { name: 'Carnê-leão', day: 30, who: 'Pessoa física', profiles: ['pf'], note: 'Último dia útil do mês seguinte ao recebimento.' },
  { name: 'DARF de renda variável', day: 30, who: 'Investidores', profiles: ['pf'], note: 'Último dia útil do mês seguinte à apuração do ganho.' },
  { name: 'SPED Fiscal (EFD ICMS/IPI)', day: 20, who: 'Contribuintes de ICMS', profiles: ['empresa'], note: 'Em São Paulo, dia 20 do mês seguinte.' },
];

export const annualObligations: Obligation[] = [
  { name: 'DEFIS', day: 31, month: 3, who: 'Empresas do Simples', profiles: ['empresa'], note: 'Declaração de informações socioeconômicas e fiscais do ano anterior.' },
  { name: 'IRPF', day: 30, month: 5, who: 'Pessoa física', profiles: ['pf'], note: 'Prazo costuma ir de março ao fim de maio. Confirme a data do ano.' },
  { name: 'DASN-SIMEI', day: 31, month: 5, who: 'MEI', profiles: ['mei'], note: 'Declaração anual do faturamento do MEI.' },
  { name: 'ECD', day: 31, month: 5, who: 'Lucro Real e Presumido', profiles: ['empresa'], note: 'Escrituração contábil digital, último dia útil de maio.' },
  { name: 'ECF', day: 31, month: 7, who: 'Todas as PJ', profiles: ['empresa'], note: 'Escrituração contábil fiscal, último dia útil de julho.' },
  { name: '13º — 1ª parcela', day: 30, month: 11, who: 'Quem tem funcionário', profiles: ['empresa', 'mei'], note: 'Adiantamento de metade do 13º salário.' },
  { name: '13º — 2ª parcela', day: 20, month: 12, who: 'Quem tem funcionário', profiles: ['empresa', 'mei'], note: 'Saldo do 13º com os descontos de INSS e IRRF.' },
];

/* =========================================================================
   Parâmetros tributários — valores de referência.
   ATUALIZAR A CADA ANO-CALENDÁRIO.
   ========================================================================= */
export const taxRef = {
  /** Ano-calendário a que os parâmetros abaixo se referem. */
  year: 2026,
  /**
   * Salário mínimo usado no cálculo do DAS-SIMEI.
   * ATENÇÃO: valor de 2025. Nenhum componente renderiza este número hoje —
   * confirme o valor vigente antes de usá-lo em qualquer lugar visível.
   */
  minimumWage: 1518,
  /** Teto de faturamento do MEI no ano. */
  meiLimit: 81000,
  /** Teto do Simples Nacional no ano. */
  simplesLimit: 4800000,
} as const;

export type SimplesBand = { upTo: number; rate: number; deduct: number };

/** LC 123/2006 — anexos vigentes. */
export const simplesTables: Record<'I' | 'II' | 'III' | 'V', SimplesBand[]> = {
  // Comércio
  I: [
    { upTo: 180000, rate: 0.04, deduct: 0 },
    { upTo: 360000, rate: 0.073, deduct: 5940 },
    { upTo: 720000, rate: 0.095, deduct: 13860 },
    { upTo: 1800000, rate: 0.107, deduct: 22500 },
    { upTo: 3600000, rate: 0.143, deduct: 87300 },
    { upTo: 4800000, rate: 0.19, deduct: 378000 },
  ],
  // Indústria
  II: [
    { upTo: 180000, rate: 0.045, deduct: 0 },
    { upTo: 360000, rate: 0.078, deduct: 5940 },
    { upTo: 720000, rate: 0.1, deduct: 13860 },
    { upTo: 1800000, rate: 0.112, deduct: 22500 },
    { upTo: 3600000, rate: 0.147, deduct: 85500 },
    { upTo: 4800000, rate: 0.3, deduct: 720000 },
  ],
  // Serviços com fator R >= 28%
  III: [
    { upTo: 180000, rate: 0.06, deduct: 0 },
    { upTo: 360000, rate: 0.112, deduct: 9360 },
    { upTo: 720000, rate: 0.135, deduct: 17640 },
    { upTo: 1800000, rate: 0.16, deduct: 35640 },
    { upTo: 3600000, rate: 0.21, deduct: 125640 },
    { upTo: 4800000, rate: 0.33, deduct: 648000 },
  ],
  // Serviços com fator R < 28%
  V: [
    { upTo: 180000, rate: 0.155, deduct: 0 },
    { upTo: 360000, rate: 0.18, deduct: 4500 },
    { upTo: 720000, rate: 0.195, deduct: 9900 },
    { upTo: 1800000, rate: 0.205, deduct: 17100 },
    { upTo: 3600000, rate: 0.23, deduct: 62100 },
    { upTo: 4800000, rate: 0.305, deduct: 540000 },
  ],
};

/** Lucro Presumido — percentuais de presunção e alíquotas. */
export const presumido = {
  presuncao: { servicos: { irpj: 0.32, csll: 0.32 }, comercio: { irpj: 0.08, csll: 0.12 } },
  irpj: 0.15,
  irpjAdicional: 0.1,
  /** Adicional de 10% sobre o que exceder R$ 20.000 de lucro presumido por mês. */
  irpjAdicionalLimiteMensal: 20000,
  csll: 0.09,
  pis: 0.0065,
  cofins: 0.03,
  /** INSS patronal 20% + RAT médio 2% + terceiros 5,8% sobre a folha. */
  cppFolha: 0.278,
} as const;

/* ---------- Diagnóstico ---------- */
export const diagnostic = {
  steps: [
    {
      id: 'situacao',
      question: 'Qual é a sua situação hoje?',
      options: [
        { id: 'abrir', label: 'Quero abrir uma empresa', icon: 'stamp' },
        { id: 'trocar', label: 'Já tenho contador e quero trocar', icon: 'transfer' },
        { id: 'regularizar', label: 'Tenho pendências para regularizar', icon: 'alert' },
        { id: 'irpf', label: 'Preciso declarar imposto de renda', icon: 'user' },
      ],
    },
    {
      id: 'porte',
      question: 'Qual é o porte da operação?',
      options: [
        { id: 'pf', label: 'Pessoa física', icon: 'user' },
        { id: 'mei', label: 'MEI ou faturamento até R$ 81 mil/ano', icon: 'sprout' },
        { id: 'pequena', label: 'Até R$ 4,8 milhões/ano', icon: 'building' },
        { id: 'media', label: 'Acima de R$ 4,8 milhões/ano', icon: 'chart' },
      ],
    },
    {
      id: 'folha',
      question: 'Você tem funcionários registrados?',
      options: [
        { id: 'nenhum', label: 'Nenhum', icon: 'user' },
        { id: 'ate5', label: 'De 1 a 5', icon: 'people' },
        { id: 'mais5', label: 'Mais de 5', icon: 'people' },
        { id: 'contratar', label: 'Ainda não, mas vou contratar', icon: 'spark' },
      ],
    },
    {
      id: 'urgencia',
      question: 'Qual é o prazo?',
      options: [
        { id: 'agora', label: 'É urgente, tem prazo correndo', icon: 'bolt' },
        { id: 'mes', label: 'Neste mês', icon: 'calendar' },
        { id: 'planejando', label: 'Estou planejando', icon: 'search' },
      ],
    },
  ],
} as const;

/* ---------- FAQ ---------- */
export const faq = [
  {
    q: 'Trocar de contador dá trabalho ou para a empresa?',
    a: 'Não para. Solicitamos os arquivos e acessos ao escritório anterior, conferimos o que está pendente e assumimos a rotina no mês seguinte. Você só assina a procuração eletrônica e o distrato do contrato antigo.',
  },
  {
    q: 'Vocês atendem fora de São Paulo?',
    a: 'Sim. A matriz fica na capital e temos atendimento em Osasco, Jundiaí e Santos. Todo o trabalho é digital, então atendemos clientes em qualquer cidade do país.',
  },
  {
    q: 'Quanto custa a contabilidade da minha empresa?',
    a: 'Depende do regime, do volume de notas e do tamanho da folha. Fazemos o diagnóstico sem custo e apresentamos o valor fechado antes de qualquer contratação — sem taxa escondida por obrigação avulsa.',
  },
  {
    q: 'Ainda vale a pena ser MEI?',
    a: 'Vale enquanto o faturamento fica dentro do limite anual e a atividade é permitida. Acompanhamos o seu acumulado e avisamos com antecedência quando a migração para ME passa a ser mais vantajosa — ou obrigatória.',
  },
  {
    q: 'Já estou com débitos e pendências. Vocês assumem assim mesmo?',
    a: 'Sim. Boa parte dos clientes chega exatamente assim. Levantamos o passivo, buscamos parcelamento ou denúncia espontânea e recolocamos a empresa em situação regular.',
  },
  {
    q: 'A calculadora do site substitui uma análise?',
    a: 'Não. Ela dá uma ordem de grandeza com base nas tabelas vigentes e nos números que você informa. O enquadramento real depende de CNAE, fator R, estado, município e da composição das suas despesas — por isso a conclusão precisa de um contador.',
  },
] as const;

export const disclaimerText =
  'Estimativa gerada a partir dos anexos da LC 123/2006, das alíquotas vigentes do Lucro Presumido e dos valores informados por você. Não considera particularidades de CNAE, benefícios fiscais, substituição tributária, ICMS interestadual, créditos, nem a transição da reforma tributária. Não substitui a análise de um contador.';

export const seo = {
  title: 'Stratux Consultoria Empresarial — Contabilidade em São Paulo',
  description:
    'Contabilidade para pessoa física, MEI e empresas em São Paulo, Osasco, Jundiaí e Santos. Abertura de empresa, imposto de renda, folha de pagamento e planejamento tributário.',
  locale: 'pt_BR',
} as const;
