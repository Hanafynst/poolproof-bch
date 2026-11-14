import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "Apresentação",
  source: "GitHub",
  ember: "Gorjetas EMBER2026: o endereço aparece aqui quando uma carteira é conectada.",
  preExistingDisclosure:
    "Trabalho anterior: a semântica dos vereditos foi prototipada " +
    "primeiro em um projeto pessoal anterior, um detector de pools " +
    "mortos que nunca foi lançado. A implementação em BCH, a " +
    "interface e este repositório são novos, criados para o BCH " +
    "BLAZE dentro do período de 14 a 22 de novembro de 2026.",
  copyAddress: "Copiar endereço",
  openWalletApp: "Abrir o app da carteira",
  copyConnectionLink: "Copiar link de conexão",
  pairingScanHint: "Carteira em outro dispositivo: escaneie este código com ela.",
  pairingPasteHint:
    "Carteira neste telefone: copie o link e cole na página de " +
    "conexão ou leitura da carteira.",
  pairingShotHint: "Sem outro dispositivo? Tire uma captura de tela deste código e envie a imagem no leitor da carteira.",
  pairingReturnHint: "Volte a esta página logo depois de escanear ou colar. A resposta da carteira expira em segundos e só chega enquanto esta página está em primeiro plano.",
  dialogClose: "Fechar",
  noWalletHeading: "Nenhum aplicativo de carteira respondeu",
  noWalletBody:
    "Copie o link de conexão e cole dentro da carteira, ou " +
    "escaneie o código de outro dispositivo. Se você ainda não tem " +
    "uma carteira, instale uma abaixo. O Cashonize funciona no " +
    "navegador e não precisa de instalação.",
  noWalletStaleHint: "Se a sua carteira mostra o PoolProof como conectado, mas esta página não, ela guarda uma conexão antiga. Remova as entradas antigas do PoolProof na carteira e vincule de novo. No Paytaca, a lista fica em Apps e depois em Wizard Connect.",
  walletBalanceLoading: "Carregando saldo...",
  walletBalanceUnavailable:
    "Saldo indisponível. O indexador de UTXO não pôde ser contatado.",
  sendInProgress: "Aguardando a assinatura da carteira...",
  sendTampered:
    "A transação assinada não corresponde ao envio que você confirmou. " +
    "Ela não foi transmitida.",
  sendBroadcastFailed:
    "A transmissão falhou. A transação assinada pode ser transmitida " +
    "de novo. Não é preciso assiná-la outra vez.",
  sendMalformed:
    "A carteira devolveu uma resposta que não pôde ser verificada. " +
    "Nada foi transmitido.",
  historyUnavailable:
    "O histórico salvo não pôde ser lido. Esta lista começa vazia.",
  historySaveFailed:
    "O histórico não pôde ser salvo neste navegador. As entradas continuam visíveis até você recarregar a página.",
  receivePlainLabel: "Endereço simples",
  headline: "Este pool de CashToken está realmente ativo?",
  lede:
    "O PoolProof verifica um pool de CashToken antes de você confiar " +
    "nos números dele. Ele lê as reservas do pool no Cauldron e simula " +
    "uma venda. O veredito vem das reservas e da venda simulada, não " +
    "do valor de liquidez exibido.",
  language: "Idioma",
  languageLoadFailed: "Esse idioma não carregou. O anterior continua exibido.",
  skipToMain: "Pular para o conteúdo principal",
  snapshotsLabel: "Instantâneos de demonstração",
  reportLabel: "Relatório de diligência",
  caveat:
    "Este relatório é uma verificação em um momento específico. As " +
    "reservas e a autoridade de emissão podem mudar depois dele. " +
    "Execute a verificação de novo antes de agir com base no relatório.",
  summaryByVerdict: {
    ALIVE:
      "Ativo: as reservas são reais e a venda simulada sai perto do preço spot " +
      "(taxa de saída {ratio}).",
    RISKY:
      "Arriscado: a venda simulada mantém apenas parte do valor spot " +
      "(taxa de saída {ratio}). A saída é possível, mas perde valor.",
    DEAD: "Morto: as reservas são poeira. Uma posição não pode sair por um valor significativo.",
    NO_MARKET: "Sem mercado: este token não tem pool ativo no Cauldron.",
    LYING_DISPLAY:
      "Exibição enganosa: a liquidez exibida está muito acima das reservas reais.",
  },
  pools: "Pools ativos do Cauldron",
  bchReserve: "Reserva de BCH (todos os pools)",
  tokenReserve: "Reserva de {symbol} (todos os pools)",
  referenceSell: "Venda de referência",
  referenceSellCap: "(máx. 10% da reserva do pool)",
  simulatedExit: "Saída simulada",
  exitOfSpot: "{out} BCH de um valor spot de {spot} BCH",
  exitNotSimulated: "não simulado: as reservas já decidem este veredito",
  exitRouteFailed: "a rota não pôde ser simulada",
  exitRatio: "Taxa de saída",
  exitModel: "Modelo de saída",
  exitModelRouterQuote: "Cotação ao vivo do Router da Cauldron",
  exitModelRoutedCpmm: "Simulação CPMM roteada (própria)",
  exitModelAggregateCpmm: "Simulação CPMM de curva única (própria)",
  routedCrossCheck: "Simulação roteada (verificação cruzada)",
  gaugeReal: "Saída real",
  gaugeDisplayed: "Ao preço spot (o exibido)",
  gaugeReserve: "Reserva de BCH",
  gaugeDustLine: "Limiar de poeira",
  gaugeTickDead: "Linha de morte",
  gaugeTickAlive: "Linha de vida",
  gaugeReserveNote:
    "A reserva face ao limiar de poeira. Abaixo dessa linha, um pool está morto.",
  poolShareTitle: "Reserva por pool",
  poolShareMore: "e mais {count} pools",
  poolShareRow: "Pool {n}",
  stepPools: "A ler os pools",
  stepSimulate: "A simular a saída",
  stepIdentity: "A resolver a identidade",
  stepQuote: "Verificação cruzada do Router",
  stepSkipped: "Ignorado",
  stepIdentityMissing: "Sem registo encontrado",
  stepQuoteUnavailable: "Sem cotação devolvida",
  identity: "Identidade (BCMR)",
  identityVerified: "hash verificado, resolvido de {source}",
  identityNone: "nenhuma entrada de registro verificada",
  decimals: "Decimais",
  anchorTitle: "Âncora de prova",
  anchorBody:
    "O hash deste relatório, pronto para ser incluído em uma transação " +
    "da rede principal do Bitcoin Cash como uma saída OP_RETURN. " +
    "Qualquer pessoa pode conferir o relatório contra o hash dessa " +
    "transação.",
  anchorAction: "Ancorar este relatório",
  anchorNeedsWallet:
    "Conecte uma carteira para ancorar este relatório na rede " +
    "principal do BCH. O relatório permanece nesta página " +
    "enquanto você se conecta.",
  anchorNoFunds:
    "A ancoragem precisa de um UTXO de BCH simples de pelo " +
    "menos {sats} sats nesta carteira, para cobrir a taxa e " +
    "deixar troco acima da poeira. Nenhum está disponível ainda.",
  anchorDone: "Ancorado na rede principal do BCH.",
  anchorTampered:
    "A transação assinada não correspondia à âncora deste " +
    "relatório. Ela não foi transmitida.",
  hashing: "calculando hash...",
  anchorLoadFailed: "A âncora de prova não carregou.",
  reportHash: "SHA-256 do relatório",
  opReturnScript: "Script OP_RETURN",
  viewsLabel: "Vista",
  viewReport: "Vista de relatório",
  copyCategory: "Copiar ID da categoria",
  copyHash: "Copiar hash do relatório",
  downloadJson: "Baixar relatório (JSON)",
  copyLink: "Copiar link de compartilhamento",
  copied: "Copiado",
  copyFailed: "A cópia falhou. Copie o valor à mão.",
  downloaded: "Baixado",
  downloadFailed: "O download falhou",
  retry: "Tentar de novo",
  connectWallet: "Conectar wallet",
  walletConnecting: "Aguardando a wallet...",
  walletConnected: "Conectado · {name}",
  walletLoading: "Carregando wallet...",
  walletLoadFailed: "A wallet não carregou. Recarregue a página para tentar de novo.",
  disconnectWallet: "Desconectar",
  walletAddressMissing: "Conectado, mas a wallet ainda não compartilhou um endereço.",
  viewScanner: "Vista de scanner",
  groupIdentity: "Identidade",
  groupSupply: "Suprimento e autoridade",
  groupExit: "Simulação de saída",
  groupConcentration: "Concentração",
  statusPass: "APROVADO",
  statusWarn: "ALERTA",
  statusFail: "REPROVADO",
  statusUnknown: "DESCONHECIDO",
  totalSupply: "Suprimento total",
  supplyStandInNote:
    "O suprimento total é um valor substituto (10x a reserva de tokens " +
    "do pool) até a segunda fonte chegar. A venda de referência é " +
    "calculada pelo limite de reserva.",
  authorityUnknown:
    "A autoridade de emissão ainda não foi verificada. Os números de " +
    "suprimento são mostrados. Nada se afirma sobre a autoridade.",
  concentrationUnknown:
    "A concentração de holders ainda não tem fonte. Ela é mostrada " +
    "como desconhecida, nunca como aprovada.",
  walletBalance: "Saldo",
  walletDisconnectedHint:
    "Conecte uma carteira para ver seu saldo, seus ativos e seu histórico.",
  actionSend: "Enviar",
  actionReceive: "Receber",
  actionHistory: "Histórico",
  actionAudit: "Auditoria",
  sendTitle: "Escolha um ativo",
  sendAmount: "Valor",
  sendMax: "MÁX.",
  sendKeypadBackspace: "Apagar",
  sendRecipient: "Destinatário",
  sendRecipientPlaceholder: "Cole um endereço de Bitcoin Cash",
  sendAddressToken: "Endereço compatível com tokens",
  sendAddressPlain: "Endereço simples, só BCH",
  sendNetwork: "Rede: rede principal do Bitcoin Cash",
  confirmTitle: "Confirmar envio",
  confirmAsset: "Ativo",
  confirmRecipient: "Destinatário",
  confirmAmount: "Valor",
  confirmFee: "Taxa da rede",
  confirmBalanceAfter: "Saldo depois",
  feeEstimateNote:
    "A taxa é uma estimativa. A taxa final é definida quando a carteira assina.",
  deliveryEstimate:
    "A transmissão é imediata. Primeira confirmação em cerca de 10 minutos (estimativa).",
  sendConfirm: "Confirmar e enviar",
  sendCancel: "Cancelar",
  gateWrongNetwork: "Este endereço não está na rede principal do Bitcoin Cash.",
  gateInvalidAddress:
    "Isso não é um endereço de Bitcoin Cash válido. Confira e tente de novo.",
  gateTokenToPlainAddress:
    "Esse endereço não pode guardar tokens. Tokens enviados para ele " +
    "ficariam presos. Use um endereço compatível com tokens.",
  gateAmountMissing: "Digite um valor.",
  gateAmountInvalid:
    "Esse valor não pôde ser lido. Confira o número e tente de novo.",
  gateAmountZero: "Digite um valor acima de zero.",
  gateAmountBelowDust:
    "O envio mínimo é de {dustSats} sats. Saídas menores são poeira.",
  gateInsufficientBalance:
    "O saldo não basta para este valor mais a taxa.",
  gateInsufficientFeeBalance:
    "O saldo de BCH não basta para cobrir a taxa da rede.",
  receiptTitle: "Recibo",
  receiptStatusBroadcast: "Transmitida",
  receiptStatusConfirmed: "Confirmada",
  receiptStatusConfirmedCount: "Confirmada ({count})",
  receiptExplorer: "Ver no explorador",
  copyTxid: "Copiar ID da transação",
  copyRecipient: "Copiar destinatário",
  copyAmount: "Copiar valor",
  historyTitle: "Histórico",
  historyEmpty: "Nada foi enviado desta carteira ainda.",
  historyShowAll: "Mostrar todas as {count} entradas",
  historySent: "Enviado",
  historyAnchored: "Ancorado",
  receiveAddressLabel: "Seu endereço",
  receiveTokenNote:
    "Endereço compatível com tokens. Seguro para BCH, tokens e NFTs.",
  receivePlainNote:
    "Endereço simples, só BCH. Não envie tokens para este endereço.",
  receiveQrCaption: "QR Code do endereço",
  holdingsTotal: "Saldo total",
  holdingsTokens: "Tokens",
  holdingsNfts: "NFTs",
  holdingsCategory: "ID da categoria",
  holdingsCommitment: "Compromisso",
  holdingsEmpty: "Ainda não há BCH, tokens ou NFTs nesta carteira.",
  portfolioTitle: "Portfólio",
  portfolioTotalLabel: "Valor total",
  portfolioOther: "Outros",
  portfolioUnpricedNote: "As participações e o total cobrem apenas os ativos com preço. Os ativos sem preço são listados sem valor.",
  portfolioPricesUnavailable: "Os preços dos tokens não puderam ser carregados. As quantidades são mostradas sem valores.",
  portfolioRateNote: "Os valores usam os preços à vista dos pools da Cauldron. O BCH é avaliado à taxa ao vivo de {rate} da {source}.",
  portfolioRateUnavailable: "A taxa ao vivo de BCH/USD não pôde ser carregada. Os valores são mostrados sem valores em dólares.",
  assetShowAll: "Mostrar todos os {count} ativos",
  concGini: "Coeficiente de Gini",
  concTierWellDistributed: "Bem distribuído",
  concTierGood: "Bom",
  concTierFair: "Regular",
  concTierPoor: "Ruim",
  concTierWhaleControlled: "Controlado por baleias",
  concTopHolder: "Maior detentor",
  concTop10: "10 maiores detentores",
  concTopHolderSupply: "Maior detentor (parte do suprimento)",
  concHhi: "HHI",
  concBasisListed: "Com base nos {count} maiores detentores listados",
  concBasisFull: "Com base em todos os {count} detentores",
  concUnavailable: "Indisponível",
  liveCategoryLabel: "ID da categoria",
  liveCategoryPlaceholder: "Cole um ID de categoria de 64 caracteres",
  liveCategoryHint:
    "Um ID de categoria identifica um CashToken. Copie-o da página do " +
    "token no TokenStork ou num explorador de blocos. Os instantâneos " +
    "de demonstração abaixo não precisam de ID; um deles é o PUSD.",
  liveAuditAction: "Auditar ao vivo",
  liveCategoryInvalid:
    "Esse ID de categoria não é válido. Uma categoria tem exatamente " +
    "64 caracteres hexadecimais.",
  liveFetching: "Buscando dados do pool ao vivo...",
  liveFetchFailed:
    "A leitura ao vivo falhou. Nenhum veredito foi produzido. " +
    "Verifique a conexão e tente de novo.",
  liveResultLabel: "Resultado ao vivo, obtido {time}",
  liveProvenance:
    "Leitura ao vivo do indexador da Cauldron (indexer.riften.net), " +
    "{time}. Nome, símbolo e decimais ainda não têm fonte. Os " +
    "valores são unidades base brutas.",
  liveProvenanceIdentity:
    "Leitura ao vivo do indexador da Cauldron (indexer.riften.net), " +
    "{time}. Nome, símbolo e decimais do registro da TokenStork " +
    "para esta categoria.",
  liveUnnamed: "Token sem nome",
  notFoundTitle: "Categoria não encontrada",
  notFoundBody:
    "Nenhum CashToken com este ID de categoria foi encontrado na " +
    "rede principal da BCH. O PoolProof consultou o Cauldron " +
    "Indexer e o TokenStork, e nenhuma das fontes tem registro " +
    "desta categoria.",
  notFoundHint:
    "Os IDs de categoria não têm soma de verificação, então um " +
    "único caractere errado aponta para outro token, ou para " +
    "nenhum. Confira o ID e tente novamente.",
  notFoundAction: "Verificar outra categoria",
  signPromptAnchor:
    "Ancorar o hash deste relatório do PoolProof na rede principal " +
    "do Bitcoin Cash?",
  signPromptSend: "Assine este envio na sua carteira para transmiti-lo.",
  signRejected:
    "A carteira rejeitou o pedido de assinatura. Nada foi enviado.",
  toastSent: "Enviado: {amount} {asset}",
  toastConfirmed: "{amount} {asset} confirmado",
  toastAnchorConfirmed: "Âncora do relatório confirmada",
  toastReceived: "Recebido: {amount} BCH",
  toastDismiss: "Dispensar notificação",
  aboutTitle: "Sobre o PoolProof",
  aboutWhat:
    "O PoolProof verifica se um pool de CashToken " +
    "consegue mesmo pagar você. Ele lê as reservas reais " +
    "do pool e simula a venda, então o veredito se apoia " +
    "no que a saída devolve, não no número de liquidez " +
    "exibido.",
  aboutHowTitle: "Como o veredito é alcançado",
  aboutHow:
    "A auditoria fixa primeiro a identidade e a oferta " +
    "do token ao ID de categoria exato, para que um token " +
    "parecido não possa ocupar o lugar dele. As reservas " +
    "da Cauldron são lidas ao vivo, e uma venda de " +
    "referência (a menor entre 1% da oferta e 10% da " +
    "reserva do pool) é simulada passando por cada pool " +
    "do token. Se o Router do próprio local devolver uma " +
    "cotação não maior do que as reservas que esses " +
    "pools realmente mantêm, essa cotação confere a " +
    "simulação. O veredito segue a razão de saída, a " +
    "parte do valor à vista que a venda preserva: abaixo " +
    "de 0,010 a saída está morta; em 0,800 ou acima, ela " +
    "se sustenta. Se houver mais de um número, decide " +
    "primeiro a cotação do Router, depois a simulação " +
    "roteada e depois a simulação de curva única.",
  aboutVerdictsTitle: "Os cinco vereditos",
  aboutAnchor:
    "Um relatório pode ser selado na cadeia. O PoolProof " +
    "calcula o hash do arquivo do relatório exatamente " +
    "como você o baixa, e a carteira que você conecta " +
    "leva esse hash à rede principal do Bitcoin Cash em " +
    "uma saída OP_RETURN. Quem tiver o arquivo pode " +
    "calcular o hash dele e comparar com o hash na " +
    "transação, então um relatório alterado não passa " +
    "por original.",
  aboutSourcesTitle: "De onde vêm os dados",
  aboutSources:
    "Os dados dos pools vêm do indexador da Cauldron " +
    "operado pela Riften. A identidade do token vem da " +
    "TokenStork, fixada no ID de categoria exato. Os " +
    "saldos da carteira são lidos de servidores Electrum " +
    "públicos. Cada número de um relatório é lido quando " +
    "a auditoria roda, não trazido de uma visita " +
    "anterior.",
  aboutLimitsTitle: "Os limites",
  aboutLimits:
    "Um relatório é uma verificação em um momento " +
    "específico. As reservas e a autoridade de emissão " +
    "podem mudar depois dele. Execute a verificação de " +
    "novo antes de agir com base no relatório. Uma saída " +
    "simulada é calculada a partir das reservas daquele " +
    "momento. É uma estimativa, não um preço de " +
    "execução garantido. O PoolProof nunca guarda " +
    "chaves, fundos ou contas. A assinatura acontece " +
    "sempre na sua própria carteira, e nada se move sem " +
    "ela.",
  aboutBuilt: "O PoolProof é um projeto solo, feito para o BCH BLAZE 2026.",
  aboutDisclaimer:
    "Nada em um relatório é aconselhamento financeiro. " +
    "O PoolProof descreve o que uma simulação encontrou; " +
    "não recomenda comprar, vender ou manter nenhum " +
    "token. Trate cada número como informação para você " +
    "verificar por conta própria antes de confiar nela.",
  aboutFaqTitle: "Perguntas que aparecem",
  faqNoPriceQ: "Por que um token da minha carteira não mostra preço?",
  faqNoPriceA:
    "O preço da carteira vem do pool de Cauldron do " +
    "token. Quando um token não tem pool contra BCH, ou " +
    "o lado em BCH do pool guarda menos que a linha de " +
    "poeira de 100.000 satoshis, não existe um preço que " +
    "o PoolProof possa garantir. O token continua " +
    "aparecendo com a quantidade dele e sem valor, nunca " +
    "com um número chutado.",
  faqStaleQ:
    "Minha carteira diz que o PoolProof está conectado, " +
    "mas esta página não. O que eu faço?",
  faqStaleA:
    "A carteira guarda uma sessão que esta página já " +
    "descartou, então os dois lados discordam sobre a " +
    "conexão. Na carteira, remova todas as entradas do " +
    "PoolProof (no Paytaca, abra Apps e depois Wizard " +
    "Connect), pareie de novo a partir desta página e " +
    "volte a ela na hora. A resposta da carteira só " +
    "consegue chegar enquanto esta página está na frente.",
  faqKeysQ: "O PoolProof guarda minhas chaves ou meus fundos?",
  faqKeysA:
    "Não. O PoolProof não guarda chaves, fundos ou " +
    "contas, e não consegue iniciar uma transação " +
    "sozinho. A assinatura acontece dentro da sua " +
    "carteira, e nada se move até você aprovar lá.",
  faqAnchorQ: "O que a ancoragem de um relatório faz?",
  faqAnchorA:
    "Ancorar escreve o hash do arquivo do relatório em " +
    "uma transação da rede principal do Bitcoin Cash, " +
    "dentro de uma saída OP_RETURN que sua carteira " +
    "assina e transmite. Quem tiver o arquivo depois " +
    "pode calcular o hash dele e comparar com o hash " +
    "registrado na cadeia. Mude um único caractere do " +
    "arquivo e os hashes deixam de bater.",
  aboutValuesLine: "Valores em USD · Rede principal do Bitcoin Cash",
  navCheck: "Verificar",
  navWallet: "Carteira",
  navAbout: "Sobre",
};

export const flags: Record<FlagCode, string> = {
  TOKEN_UNREADABLE: "as leituras de identidade e fornecimento do token falharam",
  NO_POOL: "nenhum pool do Cauldron contra BCH: nenhum mercado para vender",
  DUST_RESERVE: "reserva de cotação de {reserveSats} sats (limite de poeira {dustSats})",
  DISPLAYED_LIQUIDITY_LIES:
    "liquidez exibida de ${displayedUsd}, mas as reservas reais implicam " +
    "cerca de ${realUsd} (menos de 1% do alegado)",
  EXIT_WORTHLESS:
    "a simulação de venda retorna {ratio} do valor spot: a saída não vale nada",
  EXIT_LEAKS_VALUE:
    "a simulação de venda mantém apenas {ratio} do valor spot " +
    "(taxas e/ou impacto no preço)",
  ROUTE_UNSIMULATED: "há reservas, mas a rota de venda não pôde ser simulada",
  ROUTE_QUOTE_IMPLAUSIBLE:
    "a cotação do roteador do venue de {quoteSats} sats é impossível para pools " +
    "que somam {reserveSats} sats no total, então o veredito usa a saída simulada",
};

export default strings;
