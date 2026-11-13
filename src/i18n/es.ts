import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "Presentación",
  source: "Código fuente",
  ember: "Propinas EMBER2026: la dirección aparece con la billetera conectada",
  headline: "¿Este pool de CashToken está realmente vivo?",
  lede:
    "PoolProof lee las reservas reales de un pool en Cauldron y simula una venta antes " +
    "de creer cualquier cifra. Una cifra de liquidez mostrada es un rumor; las reservas " +
    "más una salida simulada son la verdad.",
  language: "Idioma",
  currency: "Moneda",
  languageLoadFailed: "Ese idioma no cargó: se sigue mostrando el anterior.",
  snapshotsLabel: "Instantáneas de demostración",
  reportLabel: "Informe de diligencia debida",
  caveat:
    "Comprobación en un momento concreto: las reservas o la autoridad de emisión " +
    "pueden cambiar después de este informe. Repite la comprobación antes de actuar.",
  summaryByVerdict: {
    ALIVE:
      "Activo: las reservas son reales y la venta simulada sale cerca del precio spot " +
      "(ratio de salida {ratio}).",
    RISKY:
      "Riesgoso: la venta simulada conserva solo parte del valor spot " +
      "(ratio de salida {ratio}); se puede salir, pero se pierde valor.",
    DEAD: "Muerto: las reservas son polvo; una posición no puede salir por un valor significativo.",
    NO_MARKET: "Sin mercado: este token no tiene un pool activo en Cauldron.",
    LYING_DISPLAY:
      "Visualización engañosa: la liquidez mostrada supera ampliamente las reservas reales.",
  },
  pools: "Pools activos de Cauldron",
  bchReserve: "Reserva de BCH (todos los pools)",
  tokenReserve: "Reserva de {symbol} (todos los pools)",
  referenceSell: "Venta de referencia",
  referenceSellCap: "(limitada al 10 % de la reserva del pool)",
  simulatedExit: "Salida simulada",
  exitOfSpot: "{out} BCH de un valor spot de {spot} BCH",
  exitNotSimulated: "sin simular: las reservas ya deciden este veredicto",
  exitRouteFailed: "la ruta no pudo simularse",
  exitRatio: "Ratio de salida",
  identity: "Identidad (BCMR)",
  identityVerified: "hash verificado, resuelto desde {source}",
  identityNone: "sin entrada verificada en el registro",
  decimals: "Decimales",
  anchorTitle: "Ancla de prueba",
  anchorBody:
    "El hash de este informe, listo para incluirse en una transacción de la red " +
    "principal de Bitcoin Cash como una salida OP_RETURN: verificable por cualquiera, " +
    "para siempre.",
  hashing: "calculando hash…",
  anchorLoadFailed: "El ancla de prueba no cargó.",
  reportHash: "SHA-256 del informe",
  opReturnScript: "Script OP_RETURN",
  viewsLabel: "Vista",
  viewReport: "Vista de informe",
  copyCategory: "Copiar ID de categoría",
  copyHash: "Copiar hash del informe",
  downloadJson: "Descargar informe (JSON)",
  copyLink: "Copiar enlace para compartir",
  copied: "Copiado",
  copyFailed: "La copia falló: copia el valor a mano",
  downloaded: "Descargado",
  downloadFailed: "La descarga falló",
  retry: "Reintentar",
  connectWallet: "Conectar wallet",
  walletConnecting: "Esperando la wallet…",
  walletConnected: "Conectado · {name}",
  walletLoading: "Cargando wallet…",
  walletLoadFailed: "La wallet no cargó: recarga la página para reintentar",
  disconnectWallet: "Desconectar",
  walletAddressMissing: "Conectado, pero la wallet aún no compartió una dirección.",
  viewScanner: "Vista de escáner",
  groupIdentity: "Identidad",
  groupSupply: "Suministro y autoridad",
  groupExit: "Verdad de la salida",
  groupConcentration: "Concentración",
  statusPass: "SUPERA",
  statusWarn: "ALERTA",
  statusFail: "FALLA",
  statusUnknown: "DESCONOCIDO",
  totalSupply: "Suministro total",
  supplyStandInNote:
    "El suministro total es un valor sustituto (10x la reserva de tokens " +
    "del pool) hasta que llegue la segunda fuente: la venta de referencia " +
    "se calcula desde el límite de reserva.",
  authorityUnknown:
    "La autoridad de emisión aún no se ha verificado: se muestran las " +
    "cifras de suministro, no se afirma nada sobre la autoridad.",
  concentrationUnknown:
    "La concentración de holders aún no tiene fuente: se muestra como " +
    "desconocida, nunca como superada.",
  walletBalance: "Saldo",
  walletDisconnectedHint:
    "Conecta una billetera para ver tu saldo, tus activos y tu historial.",
  actionSend: "Enviar",
  actionReceive: "Recibir",
  actionHistory: "Historial",
  actionAudit: "Auditoría",
  sendTitle: "Elige un activo",
  sendAmount: "Cantidad",
  sendMax: "MÁX.",
  sendRecipient: "Destinatario",
  sendRecipientPlaceholder: "Pega una dirección de Bitcoin Cash",
  sendAddressToken: "Dirección compatible con tokens",
  sendAddressPlain: "Dirección simple: solo BCH",
  sendNetwork: "Red: red principal de Bitcoin Cash",
  confirmTitle: "Confirmar envío",
  confirmAsset: "Activo",
  confirmRecipient: "Destinatario",
  confirmAmount: "Cantidad",
  confirmFee: "Comisión de red",
  confirmBalanceAfter: "Saldo después",
  feeEstimateNote:
    "La comisión es una estimación: la comisión final se fija cuando la " +
    "billetera firma.",
  deliveryEstimate:
    "Envío inmediato · primera confirmación en ~10 minutos (estimación)",
  sendConfirm: "Confirmar y enviar",
  sendCancel: "Cancelar",
  gateWrongNetwork: "Esta dirección no está en la red principal de Bitcoin Cash.",
  gateInvalidAddress:
    "No es una dirección de Bitcoin Cash válida: revísala e inténtalo de nuevo.",
  gateTokenToPlainAddress:
    "Esa dirección no puede guardar tokens: los tokens quedarían varados. " +
    "Usa una dirección compatible con tokens.",
  gateAmountMissing: "Introduce una cantidad.",
  gateAmountInvalid:
    "Esa cantidad no se puede leer: revisa el número e inténtalo de nuevo.",
  gateAmountZero: "Introduce una cantidad mayor que cero.",
  gateAmountBelowDust:
    "El envío mínimo es de {dustSats} sats: las salidas menores son polvo.",
  gateInsufficientBalance:
    "El saldo no alcanza para esta cantidad más la comisión.",
  gateInsufficientFeeBalance:
    "El saldo de BCH no alcanza para cubrir la comisión de red.",
  receiptTitle: "Recibo",
  receiptStatusBroadcast: "Transmitida",
  receiptStatusConfirmed: "Confirmada",
  receiptExplorer: "Ver en el explorador",
  copyTxid: "Copiar ID de transacción",
  copyRecipient: "Copiar destinatario",
  copyAmount: "Copiar cantidad",
  historyTitle: "Historial",
  historyEmpty: "Aún no se ha enviado nada desde esta billetera.",
  historySent: "Enviado",
  receiveAddressLabel: "Tu dirección",
  receiveTokenNote:
    "Dirección compatible con tokens: segura para BCH, tokens y NFT.",
  receivePlainNote:
    "Dirección simple: solo BCH. No envíes tokens a esta dirección.",
  receiveQrCaption: "Código QR de la dirección",
  holdingsTotal: "Saldo total",
  holdingsTokens: "Tokens",
  holdingsNfts: "NFT",
  holdingsCategory: "ID de categoría",
  holdingsCommitment: "Compromiso",
  holdingsEmpty: "Aún no hay BCH, tokens ni NFT en esta billetera.",
  concGini: "Coeficiente de Gini",
  concTierWellDistributed: "Bien distribuido",
  concTierGood: "Bueno",
  concTierFair: "Regular",
  concTierPoor: "Deficiente",
  concTierWhaleControlled: "Controlado por ballenas",
  concTopHolder: "Mayor tenedor",
  concTop10: "Los 10 mayores tenedores",
  concTopHolderSupply: "Mayor tenedor (parte del suministro)",
  concHhi: "HHI",
  concBasisListed: "Basado en los {count} mayores tenedores listados",
  concBasisFull: "Basado en todos los {count} tenedores",
  concUnavailable: "No disponible",
  liveCategoryLabel: "ID de categoría",
  liveCategoryPlaceholder: "Pega un ID de categoría de 64 caracteres",
  liveAuditAction: "Auditar en vivo",
  liveCategoryInvalid:
    "Ese ID de categoría no es válido: una categoría tiene " +
    "exactamente 64 caracteres hexadecimales.",
  liveFetching: "Obteniendo datos del pool en vivo…",
  liveFetchFailed:
    "La lectura en vivo falló: no se produjo ningún veredicto. " +
    "Revisa la conexión e inténtalo de nuevo.",
  liveResultLabel: "Resultado en vivo — obtenido {time}",
  liveProvenance:
    "Lectura en vivo del indexador de Cauldron (indexer.riften.net), " +
    "{time}. El nombre, el símbolo y los decimales aún no tienen " +
    "fuente: las cantidades son unidades base sin procesar.",
  liveProvenanceIdentity:
    "Lectura en vivo del indexador de Cauldron (indexer.riften.net), " +
    "{time}. El nombre, el símbolo y los decimales provienen del " +
    "registro de TokenStork para esta categoría.",
  liveUnnamed: "Token sin nombre",
  signPromptAnchor:
    "¿Anclar el hash de este informe de PoolProof en la red principal " +
    "de Bitcoin Cash?",
  signPromptSend: "Firma este envío en tu billetera para transmitirlo.",
  signRejected:
    "La billetera rechazó la solicitud de firma: no se envió nada.",
};

export const flags: Record<FlagCode, string> = {    TOKEN_UNREADABLE: "fallaron las lecturas de identidad/suministro del token",
    NO_POOL: "no hay pool de Cauldron contra BCH: no hay mercado donde vender",
    DUST_RESERVE:
      "reserva de cotización de {reserveSats} sats (umbral de polvo {dustSats})",
    DISPLAYED_LIQUIDITY_LIES:
      "liquidez mostrada de ${displayedUsd}, pero las reservas reales implican " +
      "~${realUsd} (<1 % de lo afirmado)",
    EXIT_WORTHLESS:
      "la simulación de venta devuelve {ratio} del valor spot: la salida no vale nada",
    EXIT_LEAKS_VALUE:
      "la simulación de venta conserva solo {ratio} del valor spot " +
      "(comisiones y/o impacto en el precio)",
    ROUTE_UNSIMULATED: "hay reservas, pero la ruta de venta no pudo simularse",};

export default strings;
