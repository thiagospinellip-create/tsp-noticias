// ============================================================
//  TSP.MMIII — Configuração do automatizador de notícias
//  Edite este arquivo para ajustar temas, palavras-chave,
//  fontes e frequência de atualização.
// ============================================================

export const settings = {
  // Idade máxima da notícia (em horas) para entrar no feed.
  maxAgeHours: 48,

  // Atualidade: a pontuação de relevância cai pela metade a cada N horas,
  // para que notícias novas substituam as antigas a cada atualização.
  recencyHalfLifeHours: 18,

  // Quantas notícias por tema (seção) e no "destaques".
  maxPerTopic: 6,
  maxHighlights: 8,

  // Limite total de itens no feed (segurança).
  maxTotal: 40,

  // Tempo máximo de espera por cada feed (ms) e nº de downloads simultâneos.
  requestTimeoutMs: 15000,
  concurrency: 6,

  // Identificação enviada nas requisições (alguns feeds exigem User-Agent).
  userAgent: 'TSP-MMIII-NewsBot/1.0 (+https://tspmmiii.com)',
};

// ------------------------------------------------------------
// Temas abordados pelo site. `keywords` são usadas para
// pontuar a relevância (frases contam mais que palavras soltas).
// `queries` são buscas no Google Notícias (uma por query).
// ------------------------------------------------------------
export const topics = [
  {
    id: 'historia',
    label: 'História',
    keywords: [
      'história', 'historiador', 'arqueologia', 'arqueólog', 'escavação',
      'sítio arqueológico', 'artefato', 'ruína', 'império', 'medieval',
      'antiguidade', 'civilização', 'colonial', 'independência', 'monarquia',
      'ditadura', 'revolução', 'guerra mundial', 'guerra fria', 'holocausto',
      'nazismo', 'escravidão', 'museu', 'patrimônio histórico', 'tombamento',
      'achado histórico', 'manuscrito', 'pergaminho', 'fóssil', 'dinossauro',
      'herança cultural', 'império romano', 'renascimento',
    ],
    queries: ['história', 'arqueologia', 'patrimônio histórico', 'descoberta arqueológica'],
  },
  {
    id: 'geopolitica',
    label: 'Geopolítica',
    keywords: [
      'geopolítica', 'geopolítico', 'política internacional', 'relações internacionais',
      'diplomacia', 'diplomata', 'embaixad', 'sanções', 'sanção', 'acordo',
      'tratado', 'cúpula', 'otan', 'nato', 'onu', 'conselho de segurança',
      'guerra', 'conflito', 'exército', 'militares', 'defesa', 'armas',
      'nuclear', 'míssil', 'fronteira', 'ocupação', 'anexação', 'petróleo',
      'energia', 'estratégia', 'rússia', 'ucrania', 'china', 'estados unidos',
      'eua', 'oriente médio', 'iran', 'israel', 'palestina', 'coreia',
      'taiwan', 'hormuz', 'gaza', 'hezbollah', 'hamas', 'casa branca',
    ],
    queries: ['geopolítica', 'política internacional', 'diplomacia conflito', 'otan rússia ucrania'],
  },
  {
    id: 'negocios',
    label: 'Negócios & Economia',
    keywords: [
      'economia', 'econômico', 'inflação', 'juros', 'selic', 'banco central',
      'copom', 'câmbio', 'dólar', 'mercado', 'bolsa', 'ibovespa', 'ações',
      'investimento', 'investidor', 'empresa', 'negócios', 'startup',
      'tecnologia', 'inteligência artificial', 'ia', 'algoritmo', 'emprego',
      'desemprego', 'pib', 'recessão', 'crescimento', 'comércio', 'exportação',
      'importação', 'commodities', 'cripto', 'bitcoin', 'banco', 'fintech',
      'fusão', 'aquisição', 'lucro', 'receita', 'varejo', 'indústria',
      'agronegócio', 'agro', 'impostos', 'tarifas', 'fed', 'wall street',
    ],
    queries: ['economia', 'negócios tecnologia', 'mercado financeiro', 'inteligência artificial empresas'],
  },
  {
    id: 'filosofia',
    label: 'Filosofia',
    keywords: [
      'filosofia', 'filósofo', 'filosófico', 'ética', 'moral', 'pensamento',
      'pensador', 'existência', 'existencial', 'consciência', 'liberdade',
      'justiça', 'razão', 'dialética', 'metafísica', 'epistemologia',
      'sócrates', 'platão', 'aristóteles', 'nietzsche', 'kant', 'hegel',
      'estoicismo', 'estoico', 'realismo', 'verdade', 'virtude',
    ],
    queries: ['filosofia', 'ética pensamento'],
  },
  {
    id: 'cinema',
    label: 'Cinema',
    keywords: [
      'cinema', 'filme', 'filmes', 'diretor', 'roteiro', 'roteirista',
      'ator', 'atriz', 'hollywood', 'oscar', 'festival de cinema', 'cannes',
      'venezia', 'berlinale', 'streaming', 'netflix', 'série',
      'cinematográfico', 'bilheteria', 'estreia', 'premiere', 'curta-metragem',
      'documentário', 'animação', 'trilha sonora',
    ],
    queries: ['cinema', 'filme estreia', 'oscar', 'streaming séries'],
  },
  {
    id: 'medicina',
    label: 'Medicina',
    keywords: [
      'medicina', 'médico', 'médica', 'saúde', 'pesquisa médica', 'estudo clínico',
      'doença', 'tratamento', 'cura', 'vacina', 'vacinação', 'cérebro',
      'coração', 'câncer', 'cancro', 'neurologia', 'neurociência',
      'psiquiatria', 'farmacologia', 'remédio', 'medicamento', 'cirurgia',
      'diagnóstico', 'sintoma', 'epidemia', 'pandemia', 'sus', 'hospital',
      'anatomia', 'fisiologia', 'células-tronco', 'gene', 'genética',
      'alzheimer', 'parkinson', 'diabetes', 'obesidade',
      'infecção', 'bactéria', 'vírus', 'surto', 'peste', 'paciente', 'célula',
    ],
    queries: ['medicina', 'pesquisa médica', 'descoberta médica', 'neurociência saúde'],
  },
];

// ------------------------------------------------------------
// Fontes RSS fixas (além das buscas automáticas no Google Notícias).
// `topics` dá um "viés" inicial para itens vindos dessa fonte.
// ------------------------------------------------------------
export const extraFeeds = [
  { url: 'https://feeds.bbci.co.uk/portuguese/rss.xml', source: 'BBC Brasil' },
  { url: 'https://g1.globo.com/rss/g1/', source: 'G1' },
  { url: 'https://g1.globo.com/rss/g1/economia/', source: 'G1 Economia', topics: ['negocios'] },
  { url: 'https://g1.globo.com/rss/g1/mundo/', source: 'G1 Mundo', topics: ['geopolitica'] },
  { url: 'https://g1.globo.com/rss/g1/ciencia-e-saude/', source: 'G1 Ciência e Saúde', topics: ['medicina'] },
  { url: 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml', source: 'Folha de S.Paulo' },
  { url: 'https://www.poder360.com.br/feed/', source: 'Poder360', topics: ['geopolitica'] },
  { url: 'https://www.cnnbrasil.com.br/feed/', source: 'CNN Brasil' },
  { url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml', source: 'Agência Brasil' },
];
