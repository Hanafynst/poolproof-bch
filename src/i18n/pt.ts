import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "Apresentação",
  source: "Código-fonte",
  ember: "Gorjetas EMBER2026: o endereço aparece com a carteira conectada",
  headline: "Este pool de CashToken está realmente ativo?",
  lede:
    "O PoolProof lê as reservas reais de um pool no Cauldron e simula uma venda antes " +
    "de acreditar em qualquer número. Um valor de liquidez exibido é um rumor; reservas " +
    "mais uma saída simulada são a verdade.",
  language: "Idioma",
  currency: "Moeda",
  languageLoadFailed: "Esse idioma não carregou — o anterior continua exibido.",
  snapshotsLabel: "Instantâneos de demonstração",
  reportLabel: "Relatório de diligência",
  caveat:
    "Verificação pontual — as reservas ou a autoridade de emissão podem mudar depois " +
    "deste relatório. Execute a verificação novamente antes de agir.",
  summaryByVerdict: {
    ALIVE:
      "Ativo: as reservas são reais e a venda simulada sai perto do preço spot " +
      "(taxa de saída {ratio}).",
    RISKY:
      "Arriscado: a venda simulada mantém apenas parte do valor spot " +
      "(taxa de saída {ratio}); a saída é possível, mas perde valor.",
    DEAD: "Morto: as reservas são poeira — uma posição não pode sair por um valor significativo.",
    NO_MARKET: "Sem mercado: este token não tem pool ativo no Cauldron.",
    LYING_DISPLAY:
      "Exibição enganosa: a liquidez exibida supera em muito as reservas reais.",
  },
  pools: "Pools ativos do Cauldron",
  bchReserve: "Reserva de BCH (todos os pools)",
  tokenReserve: "Reserva de {symbol} (todos os pools)",
  referenceSell: "Venda de referência",
  referenceSellCap: "(limitada a 10% da reserva do pool)",
  simulatedExit: "Saída simulada",
  exitOfSpot: "{out} BCH de um valor spot de {spot} BCH",
  exitNotSimulated: "não simulado — as reservas já decidem este veredito",
  exitRouteFailed: "a rota não pôde ser simulada",
  exitRatio: "Taxa de saída",
  identity: "Identidade (BCMR)",
  identityVerified: "hash verificado, resolvido de {source}",
  identityNone: "nenhuma entrada de registro verificada",
  decimals: "Decimais",
  anchorTitle: "Âncora de prova",
  anchorBody:
    "O hash deste relatório, pronto para ser incluído em uma transação da rede " +
    "principal do Bitcoin Cash como uma saída OP_RETURN — verificável por qualquer " +
    "pessoa, para sempre.",
  hashing: "calculando hash…",
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
  copyFailed: "A cópia falhou — copie o valor à mão",
  downloaded: "Baixado",
  downloadFailed: "O download falhou",
  retry: "Tentar de novo",
  connectWallet: "Conectar wallet",
  walletConnecting: "Aguardando a wallet…",
  walletConnected: "Conectado · {name}",
  walletLoading: "Carregando wallet…",
  walletLoadFailed: "A wallet não carregou — recarregue a página para tentar de novo",
  disconnectWallet: "Desconectar",
  walletAddressMissing: "Conectado, mas a wallet ainda não compartilhou um endereço.",
  viewScanner: "Vista de scanner",
  groupIdentity: "Identidade",
  groupSupply: "Suprimento e autoridade",
  groupExit: "Verdade da saída",
  groupConcentration: "Concentração",
  statusPass: "APROVADO",
  statusWarn: "ALERTA",
  statusFail: "REPROVADO",
  statusUnknown: "DESCONHECIDO",
  totalSupply: "Suprimento total",
  supplyStandInNote:
    "O suprimento total é um valor substituto (10x a reserva de tokens do " +
    "pool) até a segunda fonte chegar—a venda de referência é calculada " +
    "pelo limite de reserva.",
  authorityUnknown:
    "A autoridade de emissão ainda não foi verificada: os números de " +
    "suprimento são mostrados, nada se afirma sobre a autoridade.",
  concentrationUnknown:
    "A concentração de holders ainda não tem fonte: mostrada como " +
    "desconhecida, nunca como aprovada.",
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
  sendRecipient: "Destinatário",
  sendRecipientPlaceholder: "Cole um endereço de Bitcoin Cash",
  sendAddressToken: "Endereço compatível com tokens",
  sendAddressPlain: "Endereço simples — só BCH",
  sendNetwork: "Rede: rede principal do Bitcoin Cash",
  confirmTitle: "Confirmar envio",
  confirmAsset: "Ativo",
  confirmRecipient: "Destinatário",
  confirmAmount: "Valor",
  confirmFee: "Taxa da rede",
  confirmBalanceAfter: "Saldo depois",
  feeEstimateNote:
    "A taxa é uma estimativa — a taxa final é definida quando a carteira assina.",
  deliveryEstimate:
    "Envio imediato · primeira confirmação em ~10 minutos (estimativa)",
  sendConfirm: "Confirmar e enviar",
  sendCancel: "Cancelar",
  gateWrongNetwork: "Este endereço não está na rede principal do Bitcoin Cash.",
  gateInvalidAddress:
    "Isso não é um endereço de Bitcoin Cash válido — confira e tente de novo.",
  gateTokenToPlainAddress:
    "Esse endereço não pode guardar tokens — os tokens ficariam presos. " +
    "Use um endereço compatível com tokens.",
  gateAmountMissing: "Digite um valor.",
  gateAmountInvalid:
    "Esse valor não pôde ser lido — confira o número e tente de novo.",
  gateAmountZero: "Digite um valor acima de zero.",
  gateAmountBelowDust:
    "O envio mínimo é de {dustSats} sats — saídas menores são poeira.",
  gateInsufficientBalance:
    "O saldo não basta para este valor mais a taxa.",
  gateInsufficientFeeBalance:
    "O saldo de BCH não basta para cobrir a taxa da rede.",
  receiptTitle: "Recibo",
  receiptStatusBroadcast: "Transmitida",
  receiptStatusConfirmed: "Confirmada",
  receiptExplorer: "Ver no explorador",
  copyTxid: "Copiar ID da transação",
  copyRecipient: "Copiar destinatário",
  copyAmount: "Copiar valor",
  historyTitle: "Histórico",
  historyEmpty: "Nada foi enviado desta carteira ainda.",
  historySent: "Enviado",
  receiveAddressLabel: "Seu endereço",
  receiveTokenNote:
    "Endereço compatível com tokens — seguro para BCH, tokens e NFTs.",
  receivePlainNote:
    "Endereço simples — só BCH. Não envie tokens para este endereço.",
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
  concTopHolderSupply: "Maior detentor (parte do fornecimento)",
  concHhi: "HHI",
  concBasisListed: "Com base nos {count} maiores detentores listados",
  concBasisFull: "Com base em todos os {count} detentores",
  concUnavailable: "Indisponível",
  liveCategoryLabel: "ID da categoria",
  liveCategoryPlaceholder: "Cole um ID de categoria de 64 caracteres",
  liveAuditAction: "Auditar ao vivo",
  liveCategoryInvalid:
    "Esse ID de categoria não é válido: uma categoria tem " +
    "exatamente 64 caracteres hexadecimais.",
  liveFetching: "Buscando dados do pool ao vivo…",
  liveFetchFailed:
    "A leitura ao vivo falhou — nenhum veredito foi produzido. " +
    "Verifique a conexão e tente de novo.",
  liveResultLabel: "Resultado ao vivo — obtido {time}",
  liveProvenance:
    "Leitura ao vivo do indexador da Cauldron (indexer.riften.net), " +
    "{time}. Nome, símbolo e decimais ainda não têm fonte — os " +
    "valores são unidades base brutas.",
  liveProvenanceIdentity:
    "Leitura ao vivo do indexador da Cauldron (indexer.riften.net), " +
    "{time}. Nome, símbolo e decimais do registro da TokenStork " +
    "para esta categoria.",
  liveUnnamed: "Token sem nome",
  signPromptAnchor:
    "Ancorar o hash deste relatório do PoolProof na rede principal " +
    "do Bitcoin Cash?",
  signPromptSend: "Assine este envio na sua carteira para transmiti-lo.",
  signRejected:
    "A carteira rejeitou o pedido de assinatura — nada foi enviado.",
};

export const flags: Record<FlagCode, string> = {    TOKEN_UNREADABLE: "as leituras de identidade/fornecimento do token falharam",
    NO_POOL: "nenhum pool do Cauldron contra BCH — nenhum mercado para vender",
    DUST_RESERVE: "reserva de cotação de {reserveSats} sats (limite de poeira {dustSats})",
    DISPLAYED_LIQUIDITY_LIES:
      "liquidez exibida de ${displayedUsd}, mas as reservas reais implicam " +
      "~${realUsd} (<1% do alegado)",
    EXIT_WORTHLESS:
      "a simulação de venda retorna {ratio} do valor spot — a saída não vale nada",
    EXIT_LEAKS_VALUE:
      "a simulação de venda mantém apenas {ratio} do valor spot " +
      "(taxas e/ou impacto no preço)",
    ROUTE_UNSIMULATED: "há reservas, mas a rota de venda não pôde ser simulada",};

export default strings;
