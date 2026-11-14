import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "प्रस्तुति",
  source: "GitHub",
  ember: "EMBER2026 टिप: वॉलेट कनेक्ट होने पर पता यहाँ दिखाई देगा।",
  preExistingDisclosure:
    "पहले का काम: निर्णयों का अर्थ पहले एक पुराने निजी प्रोजेक्ट में " +
    "प्रोटोटाइप किया गया था, जो एक डेड पूल डिटेक्टर था जिसे कभी जारी " +
    "नहीं किया गया। BCH कार्यान्वयन, इंटरफ़ेस और यह रिपॉज़िटरी नए हैं, " +
    "BCH BLAZE के लिए 14 से 22 नवंबर 2026 की अवधि में बनाए गए।",
  copyAddress: "पता कॉपी करें",
  openWalletApp: "वॉलेट ऐप खोलें",
  copyConnectionLink: "कनेक्शन लिंक कॉपी करें",
  pairingScanHint: "वॉलेट दूसरे डिवाइस पर: उससे यह कोड स्कैन करें।",
  pairingPasteHint:
    "वॉलेट इसी फोन पर: लिंक कॉपी करें, फिर उसे वॉलेट के कनेक्ट या " +
    "स्कैन पेज पर पेस्ट करें।",
  pairingShotHint: "कोई दूसरा डिवाइस नहीं? इस कोड का स्क्रीनशॉट लें और उसे वॉलेट के स्कैनर में अपलोड करें।",
  pairingReturnHint: "स्कैन या पेस्ट करने के तुरंत बाद इस पेज पर लौट आएं। वॉलेट का जवाब कुछ ही सेकंड में पुराना हो जाता है, और वह केवल तभी पहुंचता है जब यह पेज सामने हो।",
  dialogClose: "बंद करें",
  noWalletHeading: "किसी वॉलेट ऐप ने जवाब नहीं दिया",
  noWalletBody:
    "कनेक्शन लिंक कॉपी करके वॉलेट के अंदर पेस्ट करें, या दूसरे " +
    "डिवाइस से कोड स्कैन करें। अगर आपके पास अभी वॉलेट नहीं है, तो " +
    "नीचे से एक इंस्टॉल करें। Cashonize ब्राउज़र में चलता है और इसे " +
    "इंस्टॉल करने की ज़रूरत नहीं है।",
  noWalletStaleHint: "यदि आपका वॉलेट PoolProof को कनेक्टेड दिखाता है लेकिन यह पेज नहीं, तो उसमें एक पुराना कनेक्शन सहेजा है। वॉलेट में पुरानी PoolProof प्रविष्टियां हटाएं, फिर फिर से जोड़ें। Paytaca में यह सूची Apps, फिर Wizard Connect के अंतर्गत है।",
  walletBalanceLoading: "शेष राशि लोड हो रही है...",
  walletBalanceUnavailable:
    "शेष राशि उपलब्ध नहीं है। UTXO इंडेक्सर से संपर्क नहीं हो सका।",
  sendInProgress: "वॉलेट के हस्ताक्षर की प्रतीक्षा हो रही है...",
  sendTampered:
    "हस्ताक्षरित लेनदेन आपके द्वारा पुष्टि किए गए प्रेषण से मेल नहीं खाता। " +
    "इसे प्रसारित नहीं किया गया।",
  sendBroadcastFailed:
    "प्रसारण विफल रहा। हस्ताक्षरित लेनदेन को फिर से प्रसारित किया जा " +
    "सकता है। इसे दोबारा हस्ताक्षर करने की ज़रूरत नहीं है।",
  sendMalformed:
    "वॉलेट ने ऐसा जवाब दिया जिसका सत्यापन नहीं हो सका। कुछ भी " +
    "प्रसारित नहीं हुआ।",
  historyUnavailable:
    "सहेजा गया इतिहास पढ़ा नहीं जा सका। यह सूची खाली से शुरू होती है।",
  historySaveFailed:
    "इतिहास इस ब्राउज़र में सहेजा नहीं जा सका। पेज फिर से लोड करने तक प्रविष्टियाँ दिखती रहेंगी।",
  receivePlainLabel: "साधारण पता",
  headline: "क्या यह CashToken पूल वास्तव में सक्रिय है?",
  lede:
    "PoolProof किसी पूल के आंकड़ों पर भरोसा करने से पहले उसकी जाँच " +
    "करता है। यह Cauldron पर पूल के भंडार पढ़ता है और बिक्री का " +
    "अनुकरण करता है। निर्णय भंडार और अनुकरणीय बिक्री से आता है, " +
    "दिखाए गए तरलता आंकड़े से नहीं।",
  language: "भाषा",
  languageLoadFailed: "वह भाषा लोड नहीं हुई। पिछली भाषा अभी भी दिख रही है।",
  skipToMain: "मुख्य सामग्री पर जाएं",
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
    "सादा BCH UTXO चाहिए, ताकि शुल्क चुकाया जा सके और शेष राशि " +
    "डस्ट से ऊपर रहे। अभी कोई उपलब्ध नहीं है।",
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
  historyShowAll: "सभी {count} प्रविष्टियाँ दिखाएँ",
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
  portfolioTitle: "पोर्टफोलियो",
  portfolioOther: "अन्य",
  portfolioUnpricedNote: "हिस्सेदारी और कुल केवल मूल्य वाले एसेट को कवर करते हैं। बिना मूल्य वाले एसेट बिना मूल्य के सूचीबद्ध हैं।",
  portfolioPricesUnavailable: "टोकन की कीमतें लोड नहीं हो सकीं। मात्राएँ बिना मूल्य के दिखाई गई हैं।",
  portfolioRateNote: "मूल्य Cauldron पूल स्पॉट कीमतों पर आधारित हैं। BCH का मूल्यांकन संदर्भ दर $221.85 पर किया गया है (Selene मार्केट पेज, 13 नव. 2026)।",
  assetShowAll: "सभी {count} एसेट दिखाएँ",
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
  liveCategoryHint: "श्रेणी ID किसी CashToken की पहचान होती है। इसे TokenStork या ब्लॉक एक्सप्लोरर पर टोकन के पेज से कॉपी करें। नीचे के डेमो स्नैपशॉट के लिए ID की ज़रूरत नहीं है; उनमें से एक PUSD है।",
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
  aboutTitle: "PoolProof के बारे में",
  aboutWhat:
    "PoolProof जाँचता है कि कोई CashToken पूल सचमुच आपको " +
    "भुगतान कर सकता है या नहीं। यह पूल के असली भंडार पढ़ता " +
    "है और बिक्री का अनुकरण करता है, इसलिए फ़ैसला इस पर " +
    "टिका होता है कि निकासी क्या लौटाती है, न कि दिखाए गए " +
    "तरलता आंकड़े पर।",
  aboutHowTitle: "फ़ैसला कैसे बनता है",
  aboutHow:
    "ऑडिट पहले टोकन की पहचान और आपूर्ति को ठीक उसी श्रेणी " +
    "ID से बाँध देता है, ताकि कोई मिलता-जुलता टोकन उसकी " +
    "जगह न ले सके। फिर Cauldron भंडार लाइव पढ़े जाते हैं " +
    "और एक संदर्भ बिक्री (आपूर्ति के 1% या पूल भंडार के " +
    "10% में से जो छोटा हो) टोकन के हर पूल से होकर " +
    "अनुकरित की जाती है। यदि वेन्यू का अपना Router ऐसा " +
    "उद्धरण लौटाए जो उन पूलों के वास्तविक भंडार से बड़ा न " +
    "हो, तो वह उद्धरण अनुकरण की पड़ताल करता है। फ़ैसला " +
    "निकासी अनुपात पर चलता है, यानी बिक्री स्पॉट मूल्य का " +
    "कितना हिस्सा बचाती है: 0.010 से नीचे निकासी मर चुकी " +
    "है, 0.800 या उससे ऊपर वह टिकती है। यदि एक से अधिक " +
    "आंकड़े हों, तो पहले Router उद्धरण तय करता है, फिर " +
    "रूट किया अनुकरण, फिर एकल-वक्र अनुकरण।",
  aboutVerdictsTitle: "पाँच फ़ैसले",
  aboutAnchor:
    "रिपोर्ट को शृंखला पर सील किया जा सकता है। PoolProof " +
    "रिपोर्ट फ़ाइल का हैश ठीक उसी रूप में बनाता है जैसा " +
    "आप उसे डाउनलोड करते हैं, और आपका जोड़ा वॉलेट उस " +
    "हैश को OP_RETURN आउटपुट में Bitcoin Cash मेननेट पर " +
    "ले जाता है। जिसके पास भी फ़ाइल हो, वह उसका हैश " +
    "बनाकर लेनदेन के हैश से तुलना कर सकता है, इसलिए " +
    "बदली हुई रिपोर्ट असली बनकर नहीं निकल सकती।",
  aboutSourcesTitle: "डेटा कहाँ से आता है",
  aboutSources:
    "पूल डेटा Riften द्वारा चलाए Cauldron इंडेक्सर से " +
    "आता है। टोकन पहचान BCMR मेटाडेटा से आती है, जिसकी " +
    "पड़ताल TokenStork से होती है। वॉलेट शेष सार्वजनिक " +
    "Electrum सर्वरों से पढ़े जाते हैं। रिपोर्ट का हर " +
    "आंकड़ा ऑडिट चलते समय पढ़ा जाता है, पिछली किसी " +
    "विज़िट से नहीं लाया जाता।",
  aboutLimitsTitle: "सीमाएँ",
  aboutLimits:
    "रिपोर्ट एक समय-बिंदु की जाँच है। इसके बाद भंडार या " +
    "मिंट अधिकार बदल सकते हैं। रिपोर्ट पर कार्रवाई करने " +
    "से पहले जाँच फिर से चलाएं। अनुकरित निकासी उस समय " +
    "के भंडार से निकाली जाती है। यह एक अनुमान है, " +
    "गारंटीशुदा निष्पादन मूल्य नहीं। PoolProof कभी " +
    "कुंजियाँ, धन या खाते अपने पास नहीं रखता। हस्ताक्षर " +
    "हमेशा आपके अपने वॉलेट में होता है, और उसके बिना " +
    "कुछ नहीं हिलता।",
  aboutBuilt: "PoolProof एक एकल निर्माण है, BCH BLAZE 2026 के लिए बनाया गया।",
  navCheck: "जांचें",
  navWallet: "वॉलेट",
  navAbout: "परिचय",
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
  ROUTE_QUOTE_IMPLAUSIBLE:
    "वेन्यू के राउटर का {quoteSats} sats का कोट उन पूलों के लिए असंभव है जिनमें कुल " +
    "{reserveSats} sats हैं, इसलिए निर्णय सिमुलेटेड एग्ज़िट पर आधारित है",
};

export default strings;
