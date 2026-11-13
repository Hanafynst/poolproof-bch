import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "Presentación",
  source: "GitHub",
  ember: "Propinas EMBER2026: la dirección aparece aquí cuando se conecta una billetera.",
  preExistingDisclosure:
    "Trabajo previo: la semántica de los veredictos se prototipó primero " +
    "en un proyecto personal anterior, un detector de pools muertos de " +
    "BSC. La implementación en BCH, la interfaz y este repositorio son " +
    "nuevos, creados para BCH BLAZE dentro del periodo del 14 al 22 de " +
    "noviembre de 2026.",
  copyAddress: "Copiar dirección",
  openWalletApp: "Abrir la app de la billetera",
  copyConnectionLink: "Copiar enlace de conexión",
  pairingScanHint: "O escanea este código con una billetera en otro dispositivo.",
  noWalletHeading: "Ninguna aplicación de billetera respondió",
  noWalletBody:
    "Instala una billetera compatible, luego vuelve y toca Abrir " +
    "aplicación de billetera otra vez. Cashonize funciona en el " +
    "navegador y no necesita instalación.",
  walletBalanceLoading: "Cargando saldo...",
  walletBalanceUnavailable:
    "Saldo no disponible. No se pudo contactar el indexador de UTXO.",
  sendInProgress: "Esperando a que la billetera firme...",
  sendTampered:
    "La transacción firmada no coincide con el envío que confirmaste. " +
    "No se transmitió.",
  sendBroadcastFailed:
    "La transmisión falló. La transacción firmada se puede transmitir " +
    "de nuevo. No hace falta firmarla otra vez.",
  sendMalformed:
    "La billetera devolvió una respuesta que no se pudo verificar. " +
    "No se transmitió nada.",
  historyUnavailable:
    "El historial guardado no se pudo leer. Esta lista empieza vacía.",
  receivePlainLabel: "Dirección simple",
  headline: "¿Este pool de CashToken está realmente vivo?",
  lede:
    "PoolProof revisa un pool de CashToken antes de que confíes en sus " +
    "cifras. Lee las reservas del pool en Cauldron y simula una venta. " +
    "El veredicto sale de las reservas y de la venta simulada, no de la " +
    "cifra de liquidez que se muestra.",
  language: "Idioma",
  currency: "Moneda",
  languageLoadFailed: "Ese idioma no cargó. Se sigue mostrando el anterior.",
  snapshotsLabel: "Instantáneas de demostración",
  reportLabel: "Informe de diligencia debida",
  caveat:
    "Este informe es una comprobación en un momento concreto. Las " +
    "reservas y la autoridad de emisión pueden cambiar después. " +
    "Repite la comprobación antes de actuar según el informe.",
  summaryByVerdict: {
    ALIVE:
      "Activo: las reservas son reales y la venta simulada sale cerca del precio spot " +
      "(ratio de salida {ratio}).",
    RISKY:
      "Riesgoso: la venta simulada conserva solo parte del valor spot " +
      "(ratio de salida {ratio}). Se puede salir, pero se pierde valor.",
    DEAD: "Muerto: las reservas son polvo. Una posición no puede salir por un valor significativo.",
    NO_MARKET: "Sin mercado: este token no tiene un pool activo en Cauldron.",
    LYING_DISPLAY:
      "Visualización engañosa: la liquidez mostrada está muy por encima de las reservas reales.",
  },
  pools: "Pools activos de Cauldron",
  bchReserve: "Reserva de BCH (todos los pools)",
  tokenReserve: "Reserva de {symbol} (todos los pools)",
  referenceSell: "Venta de referencia",
  referenceSellCap: "(máx. 10 % de la reserva del pool)",
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
    "El hash de este informe, listo para incluirse en una transacción " +
    "de la red principal de Bitcoin Cash como una salida OP_RETURN. " +
    "Cualquiera puede comprobar el informe contra el hash de esa " +
    "transacción.",
  hashing: "calculando hash...",
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
  copyFailed: "La copia falló. Copia el valor a mano.",
  downloaded: "Descargado",
  downloadFailed: "La descarga falló",
  retry: "Reintentar",
  connectWallet: "Conectar wallet",
  walletConnecting: "Esperando la wallet...",
  walletConnected: "Conectado · {name}",
  walletLoading: "Cargando wallet...",
  walletLoadFailed: "La wallet no cargó. Recarga la página para reintentar.",
  disconnectWallet: "Desconectar",
  walletAddressMissing: "Conectado, pero la wallet aún no compartió una dirección.",
  viewScanner: "Vista de escáner",
  groupIdentity: "Identidad",
  groupSupply: "Suministro y autoridad",
  groupExit: "Simulación de salida",
  groupConcentration: "Concentración",
  statusPass: "SUPERA",
  statusWarn: "ALERTA",
  statusFail: "FALLA",
  statusUnknown: "DESCONOCIDO",
  totalSupply: "Suministro total",
  supplyStandInNote:
    "El suministro total es un valor sustituto (10x la reserva de " +
    "tokens del pool) hasta que llegue la segunda fuente. La venta " +
    "de referencia se calcula desde el límite de reserva.",
  authorityUnknown:
    "La autoridad de emisión aún no se ha verificado. Se muestran las " +
    "cifras de suministro. No se afirma nada sobre la autoridad.",
  concentrationUnknown:
    "La concentración de holders aún no tiene fuente. Se muestra como " +
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
  sendAddressPlain: "Dirección simple, solo BCH",
  sendNetwork: "Red: red principal de Bitcoin Cash",
  confirmTitle: "Confirmar envío",
  confirmAsset: "Activo",
  confirmRecipient: "Destinatario",
  confirmAmount: "Cantidad",
  confirmFee: "Comisión de red",
  confirmBalanceAfter: "Saldo después",
  feeEstimateNote:
    "La comisión es una estimación. La comisión final se fija cuando " +
    "la billetera firma.",
  deliveryEstimate:
    "La transmisión es inmediata. Primera confirmación en unos 10 minutos (estimación).",
  sendConfirm: "Confirmar y enviar",
  sendCancel: "Cancelar",
  gateWrongNetwork: "Esta dirección no está en la red principal de Bitcoin Cash.",
  gateInvalidAddress:
    "No es una dirección de Bitcoin Cash válida. Revísala e inténtalo de nuevo.",
  gateTokenToPlainAddress:
    "Esa dirección no puede guardar tokens. Los tokens enviados allí " +
    "quedarían varados. Usa una dirección compatible con tokens.",
  gateAmountMissing: "Introduce una cantidad.",
  gateAmountInvalid:
    "Esa cantidad no se puede leer. Revisa el número e inténtalo de nuevo.",
  gateAmountZero: "Introduce una cantidad mayor que cero.",
  gateAmountBelowDust:
    "El envío mínimo es de {dustSats} sats. Las salidas menores son polvo.",
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
    "Dirección compatible con tokens. Segura para BCH, tokens y NFT.",
  receivePlainNote:
    "Dirección simple, solo BCH. No envíes tokens a esta dirección.",
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
    "Ese ID de categoría no es válido. Una categoría tiene exactamente " +
    "64 caracteres hexadecimales.",
  liveFetching: "Obteniendo datos del pool en vivo...",
  liveFetchFailed:
    "La lectura en vivo falló. No se produjo ningún veredicto. " +
    "Revisa la conexión e inténtalo de nuevo.",
  liveResultLabel: "Resultado en vivo, obtenido {time}",
  liveProvenance:
    "Lectura en vivo del indexador de Cauldron (indexer.riften.net), " +
    "{time}. El nombre, el símbolo y los decimales aún no tienen " +
    "fuente. Las cantidades son unidades base sin procesar.",
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
    "La billetera rechazó la solicitud de firma. No se envió nada.",
};

export const flags: Record<FlagCode, string> = {
  TOKEN_UNREADABLE: "fallaron las lecturas de identidad y suministro del token",
  NO_POOL: "no hay pool de Cauldron contra BCH: no hay mercado donde vender",
  DUST_RESERVE:
    "reserva de cotización de {reserveSats} sats (umbral de polvo {dustSats})",
  DISPLAYED_LIQUIDITY_LIES:
    "liquidez mostrada de ${displayedUsd}, pero las reservas reales implican " +
    "unos ${realUsd} (menos del 1 % de lo afirmado)",
  EXIT_WORTHLESS:
    "la simulación de venta devuelve {ratio} del valor spot: la salida no vale nada",
  EXIT_LEAKS_VALUE:
    "la simulación de venta conserva solo {ratio} del valor spot " +
    "(comisiones y/o impacto en el precio)",
  ROUTE_UNSIMULATED: "hay reservas, pero la ruta de venta no pudo simularse",
};

export default strings;
