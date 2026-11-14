import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "Apresentação",
  source: "GitHub",
  ember: "Gorjetas EMBER2026: o endereço aparece aqui quando uma carteira é conectada.",
  preExistingDisclosure:
    "Trabalho anterior: a semântica dos vereditos foi prototipada " +
    "primeiro em um projeto pessoal anterior, um detector de pools " +
    "mortos da BSC. A implementação em BCH, a interface e este " +
    "repositório são novos, criados para o BCH BLAZE dentro do " +
    "período de 14 a 22 de novembro de 2026.",
  copyAddress: "Copiar endereço",
  openWalletApp: "Abrir o app da carteira",
  copyConnectionLink: "Copiar link de conexão",
  pairingScanHint: "Ou escaneie este código com uma carteira em outro dispositivo.",
  noWalletHeading: "Nenhum aplicativo de carteira respondeu",
  noWalletBody:
    "Instale uma carteira compatível, depois volte e toque em Abrir " +
    "aplicativo de carteira novamente. O Cashonize funciona no " +
    "navegador e não precisa de instalação.",
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
  receivePlainLabel: "Endereço simples",
  headline: "Este pool de CashToken está realmente ativo?",
  lede:
    "O PoolProof verifica um pool de CashToken antes de você confiar " +
    "nos números dele. Ele lê as reservas do pool no Cauldron e simula " +
    "uma venda. O veredito vem das reservas e da venda simulada, não " +
    "do valor de liquidez exibido.",
  language: "Idioma",
  languageLoadFailed: "Esse idioma não carregou. O anterior continua exibido.",
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
