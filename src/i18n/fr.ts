import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "Présentation",
  source: "GitHub",
  ember: "Pourboires EMBER2026 : l'adresse apparaît ici une fois un portefeuille connecté.",
  preExistingDisclosure:
    "Travail préexistant : la sémantique des verdicts a d'abord été " +
    "prototypée dans un projet personnel antérieur, un détecteur de " +
    "pools morts sur BSC. L'implémentation BCH, l'interface et ce " +
    "dépôt sont nouveaux, créés pour BCH BLAZE entre le 14 et le " +
    "22 novembre 2026.",
  copyAddress: "Copier l'adresse",
  openWalletApp: "Ouvrir l'application du portefeuille",
  copyConnectionLink: "Copier le lien de connexion",
  pairingScanHint: "Portefeuille sur un autre appareil : scannez ce code avec lui.",
  pairingPasteHint:
    "Portefeuille sur ce téléphone : copiez le lien, puis collez-le " +
    "dans la page de connexion ou de scan du portefeuille.",
  pairingShotHint: "Aucun autre appareil ? Faites une capture d'écran de ce code, puis importez-la dans le scanner du portefeuille.",
  pairingReturnHint: "Revenez sur cette page aussitôt après avoir scanné ou collé. La réponse du portefeuille expire en quelques secondes et n'arrive que lorsque cette page est au premier plan.",
  dialogClose: "Fermer",
  noWalletHeading: "Aucune application de portefeuille n'a répondu",
  noWalletBody:
    "Copiez le lien de connexion et collez-le dans le portefeuille, " +
    "ou scannez le code depuis un autre appareil. Si vous n'avez " +
    "pas encore de portefeuille, installez-en un ci-dessous. " +
    "Cashonize fonctionne dans le navigateur et ne nécessite aucune " +
    "installation.",
  noWalletStaleHint: "Si votre portefeuille affiche PoolProof comme connecté alors que cette page ne l'affiche pas, il garde une ancienne connexion. Supprimez les anciennes entrées PoolProof dans le portefeuille, puis refaites la liaison. Dans Paytaca, la liste se trouve dans Apps, puis Wizard Connect.",
  walletBalanceLoading: "Chargement du solde...",
  walletBalanceUnavailable:
    "Solde indisponible. L'indexeur UTXO n'a pas pu être joint.",
  sendInProgress: "En attente de la signature du portefeuille...",
  sendTampered:
    "La transaction signée ne correspond pas à l'envoi que vous avez " +
    "confirmé. Elle n'a pas été diffusée.",
  sendBroadcastFailed:
    "La diffusion a échoué. La transaction signée peut être diffusée " +
    "à nouveau. Il n'est pas nécessaire de la signer une seconde fois.",
  sendMalformed:
    "Le portefeuille a renvoyé une réponse qui n'a pas pu être " +
    "vérifiée. Rien n'a été diffusé.",
  historyUnavailable:
    "L'historique enregistré n'a pas pu être lu. Cette liste commence vide.",
  historySaveFailed:
    "L'historique n'a pas pu être enregistré dans ce navigateur. Les entrées restent visibles jusqu'au rechargement de la page.",
  receivePlainLabel: "Adresse simple",
  headline: "Ce pool CashToken est-il vraiment actif ?",
  lede:
    "PoolProof vérifie un pool CashToken avant que vous fassiez " +
    "confiance à ses chiffres. Il lit les réserves du pool sur " +
    "Cauldron et simule une vente. Le verdict vient des réserves et " +
    "de la vente simulée, pas du montant de liquidité affiché.",
  language: "Langue",
  languageLoadFailed: "Cette langue n'a pas chargé. La précédente reste affichée.",
  skipToMain: "Aller au contenu principal",
  snapshotsLabel: "Instantanés de démonstration",
  reportLabel: "Rapport de diligence",
  caveat:
    "Ce rapport est un contrôle à un instant donné. Les réserves et " +
    "l'autorité d'émission peuvent changer ensuite. Relancez le " +
    "contrôle avant d'agir sur la base du rapport.",
  summaryByVerdict: {
    ALIVE:
      "Actif : les réserves sont réelles et la vente simulée sort près du prix spot " +
      "(ratio de sortie {ratio}).",
    RISKY:
      "Risqué : la vente simulée ne conserve qu'une partie de la valeur spot " +
      "(ratio de sortie {ratio}). La sortie est possible, mais de la valeur est perdue.",
    DEAD:
      "Mort : les réserves sont de la poussière. Une position ne peut pas sortir pour " +
      "une valeur significative.",
    NO_MARKET: "Aucun marché : ce jeton n'a aucun pool actif sur Cauldron.",
    LYING_DISPLAY:
      "Affichage trompeur : la liquidité affichée dépasse largement les réserves réelles.",
  },
  pools: "Pools Cauldron actifs",
  bchReserve: "Réserve BCH (tous les pools)",
  tokenReserve: "Réserve de {symbol} (tous les pools)",
  referenceSell: "Vente de référence",
  referenceSellCap: "(max. 10 % de la réserve du pool)",
  simulatedExit: "Sortie simulée",
  exitOfSpot: "{out} BCH pour une valeur spot de {spot} BCH",
  exitNotSimulated: "non simulé : les réserves décident déjà de ce verdict",
  exitRouteFailed: "impossible de simuler l'itinéraire",
  exitRatio: "Ratio de sortie",
  exitModel: "Modèle de sortie",
  exitModelRouterQuote: "Cotation en direct du routeur Cauldron",
  exitModelRoutedCpmm: "Simulation CPMM routée (maison)",
  exitModelAggregateCpmm: "Simulation CPMM à courbe unique (maison)",
  routedCrossCheck: "Simulation routée (contre-vérification)",
  gaugeReal: "Sortie réelle",
  gaugeDisplayed: "Au prix spot (celui affiché)",
  gaugeReserve: "Réserve de BCH",
  gaugeDustLine: "Seuil de poussière",
  gaugeTickDead: "Ligne de mort",
  gaugeTickAlive: "Ligne de vie",
  gaugeReserveNote:
    "La réserve face au seuil de poussière. En dessous de cette ligne, un pool est mort.",
  poolShareTitle: "Réserve par pool",
  poolShareMore: "et {count} pools de plus",
  poolShareRow: "Pool {n}",
  stepPools: "Lecture des pools",
  stepSimulate: "Simulation de la sortie",
  stepIdentity: "Résolution de l'identité",
  stepQuote: "Recoupement du Router",
  stepSkipped: "Ignoré",
  stepIdentityMissing: "Aucun référencement trouvé",
  stepQuoteUnavailable: "Aucun cours renvoyé",
  identity: "Identité (BCMR)",
  identityVerified: "hash vérifié, résolu depuis {source}",
  identityNone: "aucune entrée de registre vérifiée",
  decimals: "Décimales",
  anchorTitle: "Ancre de preuve",
  anchorBody:
    "Le hash de ce rapport, prêt à être inclus dans une transaction " +
    "du réseau principal Bitcoin Cash comme sortie OP_RETURN. " +
    "N'importe qui peut vérifier le rapport par rapport au hash de " +
    "cette transaction.",
  anchorAction: "Ancrer ce rapport",
  anchorNeedsWallet:
    "Connectez un portefeuille pour ancrer ce rapport sur le " +
    "réseau principal BCH. Le rapport reste sur cette page " +
    "pendant la connexion.",
  anchorNoFunds:
    "L'ancrage nécessite un UTXO BCH simple d'au moins {sats} " +
    "sats dans ce portefeuille, pour couvrir les frais et " +
    "laisser un reste au-dessus de la poussière. Aucun n'est " +
    "encore disponible.",
  anchorDone: "Ancré sur le réseau principal BCH.",
  anchorTampered:
    "La transaction signée ne correspondait pas à l'ancre de ce " +
    "rapport. Elle n'a pas été diffusée.",
  hashing: "calcul du hash...",
  anchorLoadFailed: "L'ancre de preuve n'a pas chargé.",
  reportHash: "SHA-256 du rapport",
  opReturnScript: "Script OP_RETURN",
  viewsLabel: "Vue",
  copyCategory: "Copier l'ID de catégorie",
  copyHash: "Copier le hash du rapport",
  downloadJson: "Télécharger le rapport (JSON)",
  copyLink: "Copier le lien de partage",
  copied: "Copié",
  copyFailed: "Échec de la copie. Copiez la valeur à la main.",
  downloaded: "Téléchargé",
  downloadFailed: "Échec du téléchargement",
  retry: "Réessayer",
  connectWallet: "Connecter le wallet",
  walletConnecting: "En attente du wallet...",
  walletConnected: "Connecté · {name}",
  walletLoading: "Chargement du wallet...",
  walletLoadFailed: "Le wallet n'a pas chargé. Rechargez la page pour réessayer.",
  disconnectWallet: "Déconnecter",
  walletAddressMissing: "Connecté, mais le wallet n'a pas encore partagé d'adresse.",
  viewReport: "Vue rapport",
  viewScanner: "Vue scanner",
  groupIdentity: "Identité",
  groupSupply: "Offre et autorité",
  groupExit: "Simulation de sortie",
  groupConcentration: "Concentration",
  statusPass: "CONFORME",
  statusWarn: "ALERTE",
  statusFail: "ÉCHEC",
  statusUnknown: "INCONNU",
  totalSupply: "Offre totale",
  supplyStandInNote:
    "L'offre totale est une valeur de substitution (10x la réserve de " +
    "jetons du pool) en attendant la seconde source. La vente de " +
    "référence est calculée depuis le plafond de réserve.",
  authorityUnknown:
    "L'autorité d'émission n'a pas encore été vérifiée. Les chiffres " +
    "d'offre sont affichés. Rien n'est affirmé sur l'autorité.",
  concentrationUnknown:
    "La concentration des détenteurs n'a pas encore de source. Elle " +
    "est affichée comme inconnue, jamais comme conforme.",
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
  sendKeypadBackspace: "Effacer",
  sendRecipient: "Destinataire",
  sendRecipientPlaceholder: "Collez une adresse Bitcoin Cash",
  sendAddressToken: "Adresse compatible avec les jetons",
  sendAddressPlain: "Adresse simple, BCH uniquement",
  sendNetwork: "Réseau : réseau principal Bitcoin Cash",
  confirmTitle: "Confirmer l'envoi",
  confirmAsset: "Actif",
  confirmRecipient: "Destinataire",
  confirmAmount: "Montant",
  confirmFee: "Frais de réseau",
  confirmBalanceAfter: "Solde après",
  feeEstimateNote:
    "Les frais sont une estimation. Les frais finaux sont fixés à la " +
    "signature du portefeuille.",
  deliveryEstimate:
    "Diffusion immédiate. Première confirmation dans environ 10 minutes (estimation).",
  sendConfirm: "Confirmer et envoyer",
  sendCancel: "Annuler",
  gateWrongNetwork:
    "Cette adresse n'est pas sur le réseau principal Bitcoin Cash.",
  gateInvalidAddress:
    "Ce n'est pas une adresse Bitcoin Cash valide. Vérifiez-la et réessayez.",
  gateTokenToPlainAddress:
    "Cette adresse ne peut pas détenir de jetons. Les jetons qui y " +
    "seraient envoyés y resteraient bloqués. Utilisez une adresse " +
    "compatible avec les jetons.",
  gateAmountMissing: "Saisissez un montant.",
  gateAmountInvalid:
    "Ce montant est illisible. Vérifiez le nombre et réessayez.",
  gateAmountZero: "Saisissez un montant supérieur à zéro.",
  gateAmountBelowDust:
    "L'envoi minimum est de {dustSats} sats. Les sorties plus petites " +
    "sont de la poussière.",
  gateInsufficientBalance:
    "Le solde ne suffit pas pour ce montant plus les frais.",
  gateInsufficientFeeBalance:
    "Le solde BCH ne suffit pas pour couvrir les frais de réseau.",
  receiptTitle: "Reçu",
  receiptStatusBroadcast: "Diffusée",
  receiptStatusConfirmed: "Confirmée",
  receiptStatusConfirmedCount: "Confirmée ({count})",
  receiptExplorer: "Voir dans l'explorateur",
  copyTxid: "Copier l'ID de transaction",
  copyRecipient: "Copier le destinataire",
  copyAmount: "Copier le montant",
  historyTitle: "Historique",
  historyEmpty: "Rien n'a encore été envoyé depuis ce portefeuille.",
  historyShowAll: "Afficher toutes les {count} entrées",
  historySent: "Envoyé",
  historyAnchored: "Ancré",
  receiveAddressLabel: "Votre adresse",
  receiveTokenNote:
    "Adresse compatible avec les jetons. Sûre pour BCH, jetons et NFT.",
  receivePlainNote:
    "Adresse simple, BCH uniquement. N'envoyez pas de jetons à cette adresse.",
  receiveQrCaption: "QR code de l'adresse",
  holdingsTotal: "Solde total",
  holdingsTokens: "Jetons",
  holdingsNfts: "NFT",
  holdingsCategory: "ID de catégorie",
  holdingsCommitment: "Engagement",
  holdingsEmpty: "Aucun BCH, jeton ou NFT dans ce portefeuille pour l'instant.",
  assetShowAll: "Afficher tous les {count} actifs",
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
  liveCategoryHint:
    "Un ID de catégorie identifie un CashToken. Copiez-le depuis la " +
    "page du jeton sur TokenStork ou sur un explorateur de blocs. Les " +
    "instantanés de démonstration ci-dessous n'ont pas besoin d'ID ; " +
    "l'un d'eux est PUSD.",
  liveAuditAction: "Auditer en direct",
  liveCategoryInvalid:
    "Cet ID de catégorie n'est pas valide. Une catégorie compte " +
    "exactement 64 caractères hexadécimaux.",
  liveFetching: "Récupération des données du pool en direct...",
  liveFetchFailed:
    "La lecture en direct a échoué. Aucun verdict n'a été produit. " +
    "Vérifiez la connexion et réessayez.",
  liveResultLabel: "Résultat en direct, récupéré {time}",
  liveProvenance:
    "Lecture en direct de l'indexeur Cauldron (indexer.riften.net), " +
    "{time}. Le nom, le symbole et les décimales n'ont pas encore " +
    "de source. Les montants sont en unités de base brutes.",
  liveProvenanceIdentity:
    "Lecture en direct de l'indexeur Cauldron (indexer.riften.net), " +
    "{time}. Le nom, le symbole et les décimales proviennent de " +
    "l'enregistrement TokenStork pour cette catégorie.",
  liveUnnamed: "Jeton sans nom",
  notFoundTitle: "Catégorie introuvable",
  notFoundBody:
    "Aucun CashToken portant cet identifiant de catégorie n'a " +
    "été trouvé sur le réseau principal BCH. PoolProof a " +
    "consulté Cauldron Indexer et TokenStork, et aucune des " +
    "deux sources n'a d'enregistrement de cette catégorie.",
  notFoundHint:
    "Les identifiants de catégorie n'ont pas de somme de " +
    "contrôle : un seul caractère erroné pointe vers un autre " +
    "jeton, ou vers aucun jeton. Vérifiez l'identifiant et " +
    "réessayez.",
  notFoundAction: "Vérifier une autre catégorie",
  signPromptAnchor:
    "Ancrer le hash de ce rapport PoolProof sur le réseau principal " +
    "Bitcoin Cash ?",
  signPromptSend: "Signez cet envoi dans votre portefeuille pour le diffuser.",
  signRejected:
    "Le portefeuille a rejeté la demande de signature. Rien n'a été envoyé.",
  toastSent: "Envoyé : {amount} {asset}",
  toastConfirmed: "{amount} {asset} confirmé",
  toastAnchorConfirmed: "Ancrage du rapport confirmé",
  toastReceived: "Reçu : {amount} BCH",
  toastDismiss: "Fermer la notification",
  aboutTitle: "À propos de PoolProof",
  aboutWhat:
    "PoolProof vérifie si un pool CashToken peut " +
    "réellement vous payer. Il lit les réserves réelles " +
    "du pool et simule la vente, donc le verdict repose " +
    "sur ce que la sortie rapporte, et non sur le " +
    "chiffre de liquidité affiché.",
  aboutHowTitle: "Comment le verdict est obtenu",
  aboutHow:
    "L'audit fixe d'abord l'identité et l'offre du jeton " +
    "à l'identifiant de catégorie exact, pour qu'un " +
    "jeton ressemblant ne puisse pas prendre sa place. " +
    "Les réserves Cauldron sont lues en direct, et une " +
    "vente de référence (la plus petite entre 1% de " +
    "l'offre et 10% de la réserve du pool) est simulée " +
    "en passant par chacun des pools du jeton. Si le " +
    "Router de la plateforme elle-même renvoie une " +
    "cotation qui ne dépasse pas les réserves que ces " +
    "pools détiennent réellement, cette cotation recoupe " +
    "la simulation. Le verdict suit le ratio de sortie, " +
    "la part de la valeur au comptant que la vente " +
    "conserve : sous 0,010, la sortie est morte ; à " +
    "0,800 ou au-dessus, elle tient. S'il existe " +
    "plusieurs chiffres, la cotation du Router décide " +
    "d'abord, puis la simulation routée, puis la " +
    "simulation à courbe unique.",
  aboutVerdictsTitle: "Les cinq verdicts",
  aboutAnchor:
    "Un rapport peut être scellé sur la chaîne. " +
    "PoolProof calcule le hachage du fichier du rapport " +
    "exactement tel que vous le téléchargez, et le " +
    "portefeuille que vous connectez porte ce hachage " +
    "sur le réseau principal Bitcoin Cash dans une " +
    "sortie OP_RETURN. Quiconque détient le fichier " +
    "peut calculer son hachage et le comparer à celui " +
    "de la transaction, donc un rapport modifié ne peut " +
    "pas passer pour l'original.",
  aboutSourcesTitle: "D'où viennent les données",
  aboutSources:
    "Les données des pools viennent de l'indexeur " +
    "Cauldron exploité par Riften. L'identité du jeton " +
    "vient des métadonnées BCMR, recoupées avec " +
    "TokenStork. Les soldes du portefeuille sont lus " +
    "depuis des serveurs Electrum publics. Chaque " +
    "chiffre d'un rapport est lu au moment où l'audit " +
    "tourne, et non repris d'une visite précédente.",
  aboutLimitsTitle: "Les limites",
  aboutLimits:
    "Un rapport est un contrôle à un instant donné. " +
    "Les réserves et l'autorité d'émission peuvent " +
    "changer ensuite. Relancez le contrôle avant d'agir " +
    "sur la base du rapport. Une sortie simulée est " +
    "calculée à partir des réserves de ce moment-là. " +
    "C'est une estimation, pas un prix d'exécution " +
    "garanti. PoolProof ne détient jamais de clés, de " +
    "fonds ni de comptes. La signature a toujours lieu " +
    "dans votre propre portefeuille, et rien ne bouge " +
    "sans elle.",
  aboutBuilt: "PoolProof est un projet solo, réalisé pour BCH BLAZE 2026.",
  navCheck: "Vérifier",
  navWallet: "Portefeuille",
  navAbout: "À propos",
};

export const flags: Record<FlagCode, string> = {
  TOKEN_UNREADABLE: "échec des lectures d'identité et d'offre du jeton",
  NO_POOL: "aucun pool Cauldron contre BCH : aucun marché où vendre",
  DUST_RESERVE:
    "réserve de cotation de {reserveSats} sats (seuil de poussière {dustSats})",
  DISPLAYED_LIQUIDITY_LIES:
    "liquidité affichée de ${displayedUsd}, mais les réserves réelles " +
    "impliquent environ ${realUsd} (moins de 1 % de l'affirmation)",
  EXIT_WORTHLESS:
    "la simulation de vente renvoie {ratio} de la valeur spot : la sortie est sans valeur",
  EXIT_LEAKS_VALUE:
    "la simulation de vente ne conserve que {ratio} de la valeur spot " +
    "(frais et/ou impact sur le prix)",
  ROUTE_UNSIMULATED: "les réserves existent, mais l'itinéraire de vente n'a pas pu être simulé",
  ROUTE_QUOTE_IMPLAUSIBLE:
    "la cotation du routeur de la plateforme de {quoteSats} sats est impossible " +
    "pour des pools totalisant {reserveSats} sats, donc le verdict utilise la sortie simulée",
};

export default strings;
