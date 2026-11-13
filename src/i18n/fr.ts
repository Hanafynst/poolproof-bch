import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "Présentation",
  source: "Code source",
  ember: "Pourboires EMBER2026 : l'adresse apparaît avec le portefeuille connecté",
  headline: "Ce pool CashToken est-il vraiment actif ?",
  lede:
    "PoolProof lit les réserves réelles d'un pool sur Cauldron et simule une vente " +
    "avant de croire le moindre chiffre. Un montant de liquidité affiché n'est qu'une " +
    "rumeur ; les réserves et une sortie simulée sont la vérité.",
  language: "Langue",
  currency: "Devise",
  languageLoadFailed: "Cette langue n'a pas chargé — la précédente reste affichée.",
  snapshotsLabel: "Instantanés de démonstration",
  reportLabel: "Rapport de diligence",
  caveat:
    "Contrôle ponctuel — les réserves ou l'autorité d'émission peuvent changer après " +
    "ce rapport. Relancez le contrôle avant d'agir.",
  summaryByVerdict: {
    ALIVE:
      "Actif : les réserves sont réelles et la vente simulée sort près du prix spot " +
      "(ratio de sortie {ratio}).",
    RISKY:
      "Risqué : la vente simulée ne conserve qu'une partie de la valeur spot " +
      "(ratio de sortie {ratio}) ; la sortie est possible, mais de la valeur est perdue.",
    DEAD:
      "Mort : les réserves sont de la poussière — une position ne peut pas sortir pour " +
      "une valeur significative.",
    NO_MARKET: "Aucun marché : ce jeton n'a aucun pool actif sur Cauldron.",
    LYING_DISPLAY:
      "Affichage trompeur : la liquidité affichée dépasse largement les réserves réelles.",
  },
  pools: "Pools Cauldron actifs",
  bchReserve: "Réserve BCH (tous les pools)",
  tokenReserve: "Réserve de {symbol} (tous les pools)",
  referenceSell: "Vente de référence",
  referenceSellCap: "(plafonnée à 10 % de la réserve du pool)",
  simulatedExit: "Sortie simulée",
  exitOfSpot: "{out} BCH pour une valeur spot de {spot} BCH",
  exitNotSimulated: "non simulé — les réserves décident déjà de ce verdict",
  exitRouteFailed: "impossible de simuler l'itinéraire",
  exitRatio: "Ratio de sortie",
  identity: "Identité (BCMR)",
  identityVerified: "hash vérifié, résolu depuis {source}",
  identityNone: "aucune entrée de registre vérifiée",
  decimals: "Décimales",
  anchorTitle: "Ancre de preuve",
  anchorBody:
    "Le hash de ce rapport, prêt à être inclus dans une transaction du réseau " +
    "principal Bitcoin Cash comme sortie OP_RETURN — vérifiable par tous, pour toujours.",
  hashing: "calcul du hash…",
  anchorLoadFailed: "L'ancre de preuve n'a pas chargé.",
  reportHash: "SHA-256 du rapport",
  opReturnScript: "Script OP_RETURN",
  viewsLabel: "Vue",
  copyCategory: "Copier l'ID de catégorie",
  copyHash: "Copier le hash du rapport",
  downloadJson: "Télécharger le rapport (JSON)",
  copyLink: "Copier le lien de partage",
  copied: "Copié",
  copyFailed: "Échec de la copie — copiez la valeur à la main",
  downloaded: "Téléchargé",
  downloadFailed: "Échec du téléchargement",
  retry: "Réessayer",
  connectWallet: "Connecter le wallet",
  walletConnecting: "En attente du wallet…",
  walletConnected: "Connecté · {name}",
  walletLoading: "Chargement du wallet…",
  walletLoadFailed: "Le wallet n'a pas chargé — rechargez la page pour réessayer",
  disconnectWallet: "Déconnecter",
  walletAddressMissing: "Connecté, mais le wallet n'a pas encore partagé d'adresse.",
  viewReport: "Vue rapport",
  viewScanner: "Vue scanner",
  groupIdentity: "Identité",
  groupSupply: "Offre et autorité",
  groupExit: "Vérité de la sortie",
  groupConcentration: "Concentration",
  statusPass: "CONFORME",
  statusWarn: "ALERTE",
  statusFail: "ÉCHEC",
  statusUnknown: "INCONNU",
  totalSupply: "Offre totale",
  supplyStandInNote:
    "L'offre totale est une valeur de substitution (10x la réserve de " +
    "jetons du pool) en attendant la seconde source : la vente de " +
    "référence est calculée depuis le plafond de réserve.",
  authorityUnknown:
    "L'autorité d'émission n'a pas encore été vérifiée : les chiffres " +
    "d'offre sont affichés, rien n'est affirmé sur l'autorité.",
  concentrationUnknown:
    "La concentration des détenteurs n'a pas encore de source : " +
    "affichée comme inconnue, jamais comme conforme.",
  walletBalance: "Solde",
  walletDisconnectedHint:
    "Connectez un portefeuille pour voir votre solde, vos avoirs et " +
    "votre historique.",
  actionSend: "Envoyer",
  actionReceive: "Recevoir",
  actionHistory: "Historique",
  actionAudit: "Audit",
  sendTitle: "Choisir un actif",
  sendAmount: "Montant",
  sendMax: "MAX",
  sendRecipient: "Destinataire",
  sendRecipientPlaceholder: "Collez une adresse Bitcoin Cash",
  sendAddressToken: "Adresse compatible avec les jetons",
  sendAddressPlain: "Adresse simple — BCH uniquement",
  sendNetwork: "Réseau : réseau principal Bitcoin Cash",
  confirmTitle: "Confirmer l’envoi",
  confirmAsset: "Actif",
  confirmRecipient: "Destinataire",
  confirmAmount: "Montant",
  confirmFee: "Frais de réseau",
  confirmBalanceAfter: "Solde après",
  feeEstimateNote:
    "Les frais sont une estimation — les frais finaux sont fixés à la " +
    "signature du portefeuille.",
  deliveryEstimate:
    "Envoi immédiat · première confirmation dans ~10 minutes (estimation)",
  sendConfirm: "Confirmer et envoyer",
  sendCancel: "Annuler",
  gateWrongNetwork:
    "Cette adresse n’est pas sur le réseau principal Bitcoin Cash.",
  gateInvalidAddress:
    "Ce n’est pas une adresse Bitcoin Cash valide — vérifiez-la et réessayez.",
  gateTokenToPlainAddress:
    "Cette adresse ne peut pas détenir de jetons — les jetons y " +
    "resteraient bloqués. Utilisez une adresse compatible avec les jetons.",
  gateAmountMissing: "Saisissez un montant.",
  gateAmountInvalid:
    "Ce montant est illisible — vérifiez le nombre et réessayez.",
  gateAmountZero: "Saisissez un montant supérieur à zéro.",
  gateAmountBelowDust:
    "L’envoi minimum est de {dustSats} sats — les sorties plus petites " +
    "sont de la poussière.",
  gateInsufficientBalance:
    "Le solde ne suffit pas pour ce montant plus les frais.",
  gateInsufficientFeeBalance:
    "Le solde BCH ne suffit pas pour couvrir les frais de réseau.",
  receiptTitle: "Reçu",
  receiptStatusBroadcast: "Diffusée",
  receiptStatusConfirmed: "Confirmée",
  receiptExplorer: "Voir dans l’explorateur",
  copyTxid: "Copier l’ID de transaction",
  copyRecipient: "Copier le destinataire",
  copyAmount: "Copier le montant",
  historyTitle: "Historique",
  historyEmpty: "Rien n’a encore été envoyé depuis ce portefeuille.",
  historySent: "Envoyé",
  receiveAddressLabel: "Votre adresse",
  receiveTokenNote:
    "Adresse compatible avec les jetons — sûre pour BCH, jetons et NFT.",
  receivePlainNote:
    "Adresse simple — BCH uniquement. N’envoyez pas de jetons à cette adresse.",
  receiveQrCaption: "QR code de l’adresse",
  holdingsTotal: "Solde total",
  holdingsTokens: "Jetons",
  holdingsNfts: "NFT",
  holdingsCategory: "ID de catégorie",
  holdingsCommitment: "Engagement",
  holdingsEmpty: "Aucun BCH, jeton ou NFT dans ce portefeuille pour l’instant.",
  concGini: "Coefficient de Gini",
  concTierWellDistributed: "Bien réparti",
  concTierGood: "Bon",
  concTierFair: "Moyen",
  concTierPoor: "Mauvais",
  concTierWhaleControlled: "Contrôlé par les baleines",
  concTopHolder: "Plus gros détenteur",
  concTop10: "10 plus gros détenteurs",
  concTopHolderSupply: "Plus gros détenteur (part de l'offre)",
  concHhi: "HHI",
  concBasisListed: "Basé sur les {count} plus gros détenteurs répertoriés",
  concBasisFull: "Basé sur l'ensemble des {count} détenteurs",
  concUnavailable: "Indisponible",
  liveCategoryLabel: "ID de catégorie",
  liveCategoryPlaceholder: "Collez un ID de catégorie de 64 caractères",
  liveAuditAction: "Auditer en direct",
  liveCategoryInvalid:
    "Cet ID de catégorie n'est pas valide : une catégorie compte " +
    "exactement 64 caractères hexadécimaux.",
  liveFetching: "Récupération des données du pool en direct…",
  liveFetchFailed:
    "La lecture en direct a échoué — aucun verdict n'a été produit. " +
    "Vérifiez la connexion et réessayez.",
  liveResultLabel: "Résultat en direct — récupéré {time}",
  liveProvenance:
    "Lecture en direct de l'indexeur Cauldron (indexer.riften.net), " +
    "{time}. Le nom, le symbole et les décimales n'ont pas encore " +
    "de source — les montants sont en unités de base brutes.",
  liveProvenanceIdentity:
    "Lecture en direct de l'indexeur Cauldron (indexer.riften.net), " +
    "{time}. Le nom, le symbole et les décimales proviennent de " +
    "l'enregistrement TokenStork pour cette catégorie.",
  liveUnnamed: "Jeton sans nom",
  signPromptAnchor:
    "Ancrer le hash de ce rapport PoolProof sur le réseau principal " +
    "Bitcoin Cash ?",
  signPromptSend: "Signez cet envoi dans votre portefeuille pour le diffuser.",
  signRejected:
    "Le portefeuille a rejeté la demande de signature — rien n’a été envoyé.",
};

export const flags: Record<FlagCode, string> = {    TOKEN_UNREADABLE: "échec des lectures d'identité/d'offre du jeton",
    NO_POOL: "aucun pool Cauldron contre BCH — aucun marché où vendre",
    DUST_RESERVE:
      "réserve de cotation de {reserveSats} sats (seuil de poussière {dustSats})",
    DISPLAYED_LIQUIDITY_LIES:
      "liquidité affichée de ${displayedUsd}, mais les réserves réelles " +
      "impliquent ~${realUsd} (<1 % de l'affirmation)",
    EXIT_WORTHLESS:
      "la simulation de vente renvoie {ratio} de la valeur spot — la sortie est sans valeur",
    EXIT_LEAKS_VALUE:
      "la simulation de vente ne conserve que {ratio} de la valeur spot " +
      "(frais et/ou impact sur le prix)",
    ROUTE_UNSIMULATED: "les réserves existent, mais l'itinéraire de vente n'a pas pu être simulé",};

export default strings;
