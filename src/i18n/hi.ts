import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "प्रस्तुति",
  source: "GitHub",
  ember: "EMBER2026 टिप: वॉलेट कनेक्ट होने पर पता यहाँ दिखाई देगा।",
  preExistingDisclosure:
    "पहले का काम: निर्णयों का अर्थ पहले एक पुराने निजी प्रोजेक्ट में " +
    "प्रोटोटाइप किया गया था, जो BSC का डेड पूल डिटेक्टर था। BCH " +
    "कार्यान्वयन, इंटरफ़ेस और यह रिपॉज़िटरी नए हैं, BCH BLAZE के लिए " +
    "14 से 22 नवंबर 2026 की अवधि में बनाए गए।",
  copyAddress: "पता कॉपी करें",
  openWalletApp: "वॉलेट ऐप खोलें",
  copyConnectionLink: "कनेक्शन लिंक कॉपी करें",
  pairingScanHint: "या किसी दूसरे डिवाइस पर वॉलेट से यह कोड स्कैन करें।",
  noWalletHeading: "किसी वॉलेट ऐप ने जवाब नहीं दिया",
  noWalletBody:
    "एक समर्थित वॉलेट इंस्टॉल करें, फिर वापस आकर वॉलेट ऐप खोलें फिर से " +
    "टैप करें. Cashonize ब्राउज़र में चलता है और इसे इंस्टॉल करने की " +
    "ज़रूरत नहीं है.",
  walletBalanceLoading: "शेष राशि लोड हो रही है...",
  walletBalanceUnavailable:
    "शेष राशि उपलब्ध नहीं है। UTXO इंडेक्सर से संपर्क नहीं हो सका।",
  sendInProgress: "वॉलेट के हस्ताक्षर की प्रतीक्षा हो रही है...",
  sendTampered:
    "हस्ताक्षरित लेनदेन आपकी पुष्टि की गई भेजी राशि से मेल नहीं खाता। " +
    "इसे प्रसारित नहीं किया गया।",
  sendBroadcastFailed:
    "प्रसारण विफल रहा। हस्ताक्षरित लेनदेन को फिर से प्रसारित किया जा " +
    "सकता है। इसे दोबारा हस्ताक्षर करने की ज़रूरत नहीं है।",
  sendMalformed:
    "वॉलेट ने ऐसा जवाब दिया जिसका सत्यापन नहीं हो सका। कुछ भी " +
    "प्रसारित नहीं हुआ।",
  historyUnavailable:
    "सहेजा गया इतिहास पढ़ा नहीं जा सका। यह सूची खाली से शुरू होती है।",
  receivePlainLabel: "साधारण पता",
  headline: "क्या यह CashToken पूल वास्तव में सक्रिय है?",
  lede:
    "PoolProof किसी पूल के आंकड़ों पर भरोसा करने से पहले उसकी जाँच " +
    "करता है। यह Cauldron पर पूल के भंडार पढ़ता है और बिक्री का " +
    "अनुकरण करता है। निर्णय भंडार और अनुकरणीय बिक्री से आता है, " +
    "दिखाए गए तरलता आंकड़े से नहीं।",
  language: "भाषा",
  languageLoadFailed: "वह भाषा लोड नहीं हुई। पिछली भाषा अभी भी दिख रही है।",
  snapshotsLabel: "डेमो स्नैपशॉट",
  reportLabel: "उचित परिश्रम रिपोर्ट",
  caveat:
    "यह रिपोर्ट एक समय-बिंदु की जाँच है। इसके बाद भंडार या मिंट " +
    "अधिकार बदल सकते हैं। रिपोर्ट पर कार्रवाई करने से पहले जाँच " +
    "फिर से चलाएं।",
  summaryByVerdict: {
    ALIVE:
      "सक्रिय: भंडार वास्तविक हैं और अनुकरणीय बिक्री स्पॉट कीमत के करीब निकलती है " +
      "(निकास अनुपात {ratio})।",
    RISKY:
      "जोखिमपूर्ण: अनुकरणीय बिक्री स्पॉट मूल्य का केवल कुछ हिस्सा बनाए रखती है " +
      "(निकास अनुपात {ratio})। निकास संभव है, लेकिन मूल्य घटेगा।",
    DEAD: "मृत: भंडार नाममात्र है। कोई स्थिति सार्थक मूल्य पर नहीं निकल सकती।",
    NO_MARKET: "कोई बाज़ार नहीं: इस टोकन का Cauldron पर कोई सक्रिय पूल नहीं है।",
    LYING_DISPLAY: "भ्रामक प्रदर्शन: दिखाई गई तरलता वास्तविक भंडार से कहीं अधिक है।",
  },
  pools: "सक्रिय Cauldron पूल",
  bchReserve: "BCH भंडार (सभी पूल)",
  tokenReserve: "{symbol} भंडार (सभी पूल)",
  referenceSell: "संदर्भ बिक्री",
  referenceSellCap: "(पूल भंडार का अधिकतम 10%)",
  simulatedExit: "अनुकरणीय निकास",
  exitOfSpot: "{spot} BCH स्पॉट मूल्य में से {out} BCH",
  exitNotSimulated: "अनुकरण नहीं किया गया: भंडार ही यह निर्णय तय करते हैं",
  exitRouteFailed: "रूट का अनुकरण नहीं किया जा सका",
  exitRatio: "निकास अनुपात",
  exitModel: "निकास मॉडल",
  exitModelRouterQuote: "Cauldron Router का लाइव भाव",
  exitModelRoutedCpmm: "रूटेड CPMM सिमुलेशन (हमारा अपना)",
  exitModelAggregateCpmm: "एकल-वक्र CPMM सिमुलेशन (हमारा अपना)",
  routedCrossCheck: "रूटेड सिमुलेशन (क्रॉस-चेक)",
  gaugeReal: "वास्तविक निकास",
  gaugeDisplayed: "स्पॉट मूल्य पर (जैसा दिखाया गया)",
  gaugeReserve: "BCH भंडार",
  gaugeDustLine: "डस्ट सीमा",
  gaugeTickDead: "मृत रेखा",
  gaugeTickAlive: "जीवित रेखा",
  gaugeReserveNote: "भंडार बनाम डस्ट सीमा। उस रेखा से नीचे, पूल मृत होता है।",
  poolShareTitle: "पूल अनुसार भंडार",
  poolShareMore: "और {count} पूल और",
  poolShareRow: "पूल {n}",
  stepPools: "पूल पढ़े जा रहे हैं",
  stepSimulate: "निकास का अनुकरण",
  stepIdentity: "पहचान का समाधान",
  stepQuote: "राउटर क्रॉस-चेक",
  stepSkipped: "छोड़ा गया",
  stepIdentityMissing: "कोई सूची नहीं मिली",
  stepQuoteUnavailable: "कोई कोट वापस नहीं आया",
  identity: "पहचान (BCMR)",
  identityVerified: "हैश सत्यापित, {source} से प्राप्त",
  identityNone: "कोई सत्यापित रजिस्ट्री प्रविष्टि नहीं",
  decimals: "दशमलव",
  anchorTitle: "प्रमाण एंकर",
  anchorBody:
    "इस रिपोर्ट का हैश, Bitcoin Cash मेननेट लेनदेन में OP_RETURN आउटपुट " +
    "के रूप में ले जाने के लिए तैयार। कोई भी व्यक्ति रिपोर्ट की जाँच " +
    "उस लेनदेन के हैश से कर सकता है।",
  anchorAction: "इस रिपोर्ट को एंकर करें",
  anchorNeedsWallet:
    "इस रिपोर्ट को BCH मेननेट पर एंकर करने के लिए वॉलेट कनेक्ट " +
    "करें। कनेक्ट करते समय रिपोर्ट इसी पेज पर बनी रहती है।",
  anchorNoFunds:
    "एंकर करने के लिए इस वॉलेट में कम से कम {sats} sats का एक " +
    "सादा BCH UTXO चाहिए, ताकि शुल्क चुकाया जा सके और डस्ट से " +
    "ऊपर का बदलाव बचे। अभी कोई उपलब्ध नहीं है।",
  anchorDone: "BCH मेननेट पर एंकर हो गया।",
  anchorTampered:
    "हस्ताक्षरित लेनदेन इस रिपोर्ट के एंकर से मेल नहीं खाता " +
    "था। इसे प्रसारित नहीं किया गया।",
  hashing: "हैश किया जा रहा है...",
  anchorLoadFailed: "प्रूफ़ एंकर लोड नहीं हुआ।",
  reportHash: "रिपोर्ट SHA-256",
  opReturnScript: "OP_RETURN स्क्रिप्ट",
  viewsLabel: "दृश्य",
  copyCategory: "श्रेणी ID कॉपी करें",
  copyHash: "रिपोर्ट हैश कॉपी करें",
  downloadJson: "रिपोर्ट डाउनलोड करें (JSON)",
  copyLink: "शेयर लिंक कॉपी करें",
  copied: "कॉपी हुआ",
  copyFailed: "कॉपी विफल। मान को हाथ से कॉपी करें।",
  downloaded: "डाउनलोड हुआ",
  downloadFailed: "डाउनलोड विफल",
  retry: "फिर से प्रयास करें",
  connectWallet: "वॉलेट जोड़ें",
  walletConnecting: "वॉलेट की प्रतीक्षा...",
  walletConnected: "जुड़ा हुआ · {name}",
  walletLoading: "वॉलेट लोड हो रहा है...",
  walletLoadFailed: "वॉलेट लोड नहीं हुआ। फिर से प्रयास करने के लिए पेज रीलोड करें।",
  disconnectWallet: "डिस्कनेक्ट करें",
  walletAddressMissing: "कनेक्ट हो गया, लेकिन वॉलेट ने अभी तक कोई पता साझा नहीं किया।",
  viewReport: "रिपोर्ट दृश्य",
  viewScanner: "स्कैनर दृश्य",
  groupIdentity: "पहचान",
  groupSupply: "आपूर्ति और अधिकार",
  groupExit: "निकास अनुकरण",
  groupConcentration: "संकेंद्रण",
  statusPass: "उत्तीर्ण",
  statusWarn: "चेतावनी",
  statusFail: "विफल",
  statusUnknown: "अज्ञात",
  totalSupply: "कुल आपूर्ति",
  supplyStandInNote:
    "कुल आपूर्ति एक स्थानापन्न मान है (पूल के टोकन भंडार का 10 गुना) जब तक " +
    "दूसरा स्रोत न आए। संदर्भ बिक्री भंडार सीमा से ही तय होती है।",
  authorityUnknown:
    "मिंट अधिकार की जाँच अभी नहीं हुई है। आपूर्ति के आंकड़े दिखाए गए हैं। " +
    "अधिकार का दावा नहीं किया गया है।",
  concentrationUnknown:
    "होल्डर संकेंद्रण का स्रोत अभी नहीं है। इसे अज्ञात दिखाया गया है, " +
    "कभी उत्तीर्ण नहीं।",
  walletBalance: "शेष राशि",
  walletDisconnectedHint:
    "अपनी शेष राशि, होल्डिंग्स और इतिहास देखने के लिए वॉलेट जोड़ें।",
  actionSend: "भेजें",
  actionReceive: "प्राप्त करें",
  actionHistory: "इतिहास",
  actionAudit: "ऑडिट",
  sendTitle: "एसेट चुनें",
  sendAmount: "राशि",
  sendMax: "अधिकतम",
  sendKeypadBackspace: "बैकस्पेस",
  sendRecipient: "प्राप्तकर्ता",
  sendRecipientPlaceholder: "Bitcoin Cash पता चिपकाएँ",
  sendAddressToken: "टोकन-सक्षम पता",
  sendAddressPlain: "साधारण पता, केवल BCH",
  sendNetwork: "नेटवर्क: Bitcoin Cash मेननेट",
  confirmTitle: "भेजने की पुष्टि करें",
  confirmAsset: "एसेट",
  confirmRecipient: "प्राप्तकर्ता",
  confirmAmount: "राशि",
  confirmFee: "नेटवर्क शुल्क",
  confirmBalanceAfter: "बाद की शेष राशि",
  feeEstimateNote:
    "शुल्क एक अनुमान है। अंतिम शुल्क वॉलेट के हस्ताक्षर करते समय तय होता है।",
  deliveryEstimate: "प्रसारण तुरंत होता है। पहला पुष्टिकरण लगभग 10 मिनट में (अनुमान)।",
  sendConfirm: "पुष्टि करें और भेजें",
  sendCancel: "रद्द करें",
  gateWrongNetwork: "यह पता Bitcoin Cash मेननेट पर नहीं है।",
  gateInvalidAddress:
    "यह मान्य Bitcoin Cash पता नहीं है। जाँचकर फिर कोशिश करें।",
  gateTokenToPlainAddress:
    "वह पता टोकन नहीं रख सकता। वहाँ भेजे गए टोकन फँस जाएँगे। टोकन-सक्षम पता इस्तेमाल करें।",
  gateAmountMissing: "राशि डालें।",
  gateAmountInvalid:
    "यह राशि पढ़ी नहीं जा सकी। संख्या जाँचकर फिर कोशिश करें।",
  gateAmountZero: "शून्य से अधिक राशि डालें।",
  gateAmountBelowDust:
    "न्यूनतम भेजी जाने वाली राशि {dustSats} sats है। इससे छोटे आउटपुट धूल हैं।",
  gateInsufficientBalance:
    "इस राशि और शुल्क के लिए शेष राशि पर्याप्त नहीं है।",
  gateInsufficientFeeBalance:
    "नेटवर्क शुल्क के लिए BCH शेष पर्याप्त नहीं है।",
  receiptTitle: "रसीद",
  receiptStatusBroadcast: "प्रसारित",
  receiptStatusConfirmed: "पुष्ट",
  receiptStatusConfirmedCount: "पुष्ट ({count})",
  receiptExplorer: "एक्सप्लोरर पर देखें",
  copyTxid: "लेनदेन ID कॉपी करें",
  copyRecipient: "प्राप्तकर्ता कॉपी करें",
  copyAmount: "राशि कॉपी करें",
  historyTitle: "इतिहास",
  historyEmpty: "इस वॉलेट से अभी तक कुछ नहीं भेजा गया।",
  historySent: "भेजा गया",
  historyAnchored: "एंकर किया गया",
  receiveAddressLabel: "आपका पता",
  receiveTokenNote: "टोकन-सक्षम पता। BCH, टोकन और NFT के लिए सुरक्षित।",
  receivePlainNote: "साधारण पता, केवल BCH। इस पते पर टोकन न भेजें।",
  receiveQrCaption: "पते का QR कोड",
  holdingsTotal: "कुल शेष",
  holdingsTokens: "टोकन",
  holdingsNfts: "NFT",
  holdingsCategory: "श्रेणी ID",
  holdingsCommitment: "कमिटमेंट",
  holdingsEmpty: "इस वॉलेट में अभी कोई BCH, टोकन या NFT नहीं है।",
  concGini: "गिनी गुणांक",
  concTierWellDistributed: "समान वितरण",
  concTierGood: "अच्छा",
  concTierFair: "मध्यम",
  concTierPoor: "खराब",
  concTierWhaleControlled: "व्हेल-नियंत्रित",
  concTopHolder: "सबसे बड़ा होल्डर",
  concTop10: "शीर्ष 10 होल्डर",
  concTopHolderSupply: "सबसे बड़ा होल्डर (आपूर्ति में हिस्सा)",
  concHhi: "HHI",
  concBasisListed: "सूचीबद्ध {count} सबसे बड़े होल्डरों पर आधारित",
  concBasisFull: "सभी {count} होल्डरों पर आधारित",
  concUnavailable: "उपलब्ध नहीं",
  liveCategoryLabel: "श्रेणी ID",
  liveCategoryPlaceholder: "64-वर्णों वाली श्रेणी ID चिपकाएँ",
  liveAuditAction: "लाइव ऑडिट करें",
  liveCategoryInvalid:
    "यह श्रेणी ID मान्य नहीं है। श्रेणी ID ठीक 64 हेक्साडेसिमल वर्णों की होती है।",
  liveFetching: "लाइव पूल डेटा लाया जा रहा है...",
  liveFetchFailed:
    "लाइव पठन विफल रहा। कोई निर्णय नहीं बना। कनेक्शन जाँचकर फिर से प्रयास करें।",
  liveResultLabel: "लाइव परिणाम, {time} पर लिया गया",
  liveProvenance:
    "Cauldron इंडेक्सर (indexer.riften.net) से {time} पर लाइव पठन। " +
    "नाम, प्रतीक और दशमलव का स्रोत अभी नहीं है। राशियाँ कच्ची " +
    "आधार इकाइयों में हैं।",
  liveProvenanceIdentity:
    "Cauldron इंडेक्सर (indexer.riften.net) से {time} पर लाइव पठन। " +
    "नाम, प्रतीक और दशमलव इस श्रेणी के TokenStork रिकॉर्ड से हैं।",
  liveUnnamed: "अनाम टोकन",
  notFoundTitle: "श्रेणी नहीं मिली",
  notFoundBody:
    "BCH मेननेट पर इस श्रेणी ID वाला कोई CashToken नहीं मिला। " +
    "PoolProof ने Cauldron Indexer और TokenStork की जाँच की, और " +
    "किसी भी स्रोत के पास इस श्रेणी का कोई रिकॉर्ड नहीं है।",
  notFoundHint:
    "श्रेणी ID में कोई चेकसम नहीं होता, इसलिए एक गलत अक्षर किसी " +
    "दूसरे टोकन की ओर इशारा करता है, या किसी ऐसे टोकन की ओर जो " +
    "है ही नहीं। ID जांचकर फिर से प्रयास करें।",
  notFoundAction: "दूसरी श्रेणी जांचें",
  signPromptAnchor:
    "इस PoolProof रिपोर्ट हैश को Bitcoin Cash मेननेट पर एंकर करें?",
  signPromptSend:
    "इसे प्रसारित करने के लिए अपने वॉलेट में इस भेजे जाने पर हस्ताक्षर करें।",
  signRejected: "वॉलेट ने हस्ताक्षर अनुरोध ठुकरा दिया। कुछ नहीं भेजा गया।",
  toastSent: "{amount} {asset} भेजा गया",
  toastConfirmed: "{amount} {asset} की पुष्टि हो गई",
  toastAnchorConfirmed: "रिपोर्ट एंकर की पुष्टि हो गई",
  toastReceived: "{amount} BCH प्राप्त हुआ",
  toastDismiss: "सूचना बंद करें",
};

export const flags: Record<FlagCode, string> = {
  TOKEN_UNREADABLE: "टोकन पहचान और आपूर्ति पढ़ना विफल",
  NO_POOL: "BCH के सामने कोई Cauldron पूल नहीं है: बेचने के लिए कोई बाज़ार नहीं",
  DUST_RESERVE: "कोट भंडार {reserveSats} sats है (धूल सीमा {dustSats})",
  DISPLAYED_LIQUIDITY_LIES:
    "प्रदर्शित तरलता ${displayedUsd} है, लेकिन वास्तविक भंडार लगभग " +
    "${realUsd} दर्शाते हैं (दावे का 1% से कम)",
  EXIT_WORTHLESS: "बिक्री अनुकरण स्पॉट मूल्य का {ratio} लौटाता है: निकास बेकार है",
  EXIT_LEAKS_VALUE:
    "बिक्री अनुकरण स्पॉट मूल्य का केवल {ratio} बनाए रखता है (शुल्क और/या मूल्य प्रभाव)",
  ROUTE_UNSIMULATED: "भंडार मौजूद हैं, लेकिन बिक्री रूट का अनुकरण नहीं किया जा सका",
};

export default strings;
