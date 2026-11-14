import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "العرض التقديمي",
  source: "GitHub",
  ember: "إكراميات EMBER2026: يظهر العنوان هنا بعد اتصال المحفظة.",
  preExistingDisclosure:
    "عمل سابق: جرى وضع النموذج الأولي لدلالات الأحكام في مشروع شخصي " +
    "أقدم، وهو كاشف مجمعات ميتة على BSC. أما تنفيذ BCH والواجهة وهذا " +
    "المستودع فجديدة، بُنيت من أجل BCH BLAZE داخل الفترة من 14 إلى " +
    "22 نوفمبر 2026.",
  copyAddress: "نسخ العنوان",
  openWalletApp: "فتح تطبيق المحفظة",
  copyConnectionLink: "نسخ رابط الاتصال",
  pairingScanHint: "المحفظة على جهاز آخر: امسح هذا الرمز بها.",
  pairingPasteHint:
    "المحفظة على هذا الهاتف: انسخ الرابط، ثم الصقه في صفحة الاتصال " +
    "أو المسح في المحفظة.",
  noWalletHeading: "لم يستجب أي تطبيق محفظة",
  noWalletBody:
    "انسخ رابط الاتصال والصقه داخل المحفظة، أو امسح الرمز من جهاز " +
    "آخر. إذا لم تكن لديك محفظة بعد، ثبّت واحدة من الأسفل. يعمل " +
    "Cashonize في المتصفح ولا يحتاج إلى تثبيت.",
  walletBalanceLoading: "جارٍ تحميل الرصيد...",
  walletBalanceUnavailable:
    "الرصيد غير متاح. تعذّر الوصول إلى مفهرس UTXO.",
  sendInProgress: "بانتظار توقيع المحفظة...",
  sendTampered:
    "المعاملة الموقّعة لا تطابق الإرسال الذي أكّدته. لم يتم بثّها.",
  sendBroadcastFailed:
    "فشل البث. يمكن بث المعاملة الموقّعة مرة أخرى. لا حاجة إلى " +
    "توقيعها من جديد.",
  sendMalformed:
    "أعادت المحفظة ردًا تعذّر التحقق منه. لم يتم بث أي شيء.",
  historyUnavailable:
    "تعذّرت قراءة السجل المحفوظ. تبدأ هذه القائمة فارغة.",
  historySaveFailed:
    "تعذّر حفظ السجل في هذا المتصفح. تبقى الإدخالات ظاهرة حتى إعادة تحميل الصفحة.",
  receivePlainLabel: "عنوان عادي",
  headline: "هل مجمع CashToken هذا حي فعلًا؟",
  lede:
    "يفحص PoolProof مجمع CashToken قبل أن تثق بأرقامه. يقرأ احتياطيات " +
    "المجمع على Cauldron ويحاكي عملية بيع. يأتي الحكم من الاحتياطيات " +
    "والبيع المحاكى، لا من رقم السيولة المعروض.",
  language: "اللغة",
  languageLoadFailed: "تعذّر تحميل تلك اللغة. ما زالت اللغة السابقة معروضة.",
  skipToMain: "تخطى إلى المحتوى الرئيسي",
  snapshotsLabel: "لقطات تجريبية",
  reportLabel: "تقرير العناية الواجبة",
  caveat:
    "هذا التقرير فحص في لحظة محددة. قد تتغير الاحتياطيات أو صلاحية " +
    "السك بعده. أعد تشغيل الفحص قبل أن تتصرف بناءً عليه.",
  summaryByVerdict: {
    ALIVE:
      "حي: الاحتياطيات حقيقية والبيع المحاكى يخرج قرب السعر الفوري " +
      "(نسبة الخروج {ratio}).",
    RISKY:
      "محفوف بالمخاطر: يحتفظ البيع المحاكى بجزء فقط من القيمة الفورية " +
      "(نسبة الخروج {ratio}). الخروج ممكن، لكن جزءًا من القيمة يضيع.",
    DEAD: "ميت: الاحتياطيات غبار. لا يمكن لمركز الخروج بقيمة ذات معنى.",
    NO_MARKET: "لا سوق: لا يملك هذا الرمز مجمعًا نشطًا على Cauldron.",
    LYING_DISPLAY: "عرض مضلل: السيولة المعروضة أعلى بكثير من الاحتياطيات الحقيقية.",
  },
  pools: "مجمعات Cauldron النشطة",
  bchReserve: "احتياطي BCH (كل المجمعات)",
  tokenReserve: "احتياطي {symbol} (كل المجمعات)",
  referenceSell: "بيع مرجعي",
  referenceSellCap: "(بحد أقصى 10% من الاحتياطي)",
  simulatedExit: "خروج محاكى",
  exitOfSpot: "{out} BCH من قيمة فورية قدرها {spot} BCH",
  exitNotSimulated: "لم تتم محاكاته: الاحتياطيات وحدها تحسم هذا الحكم",
  exitRouteFailed: "تعذر محاكاة المسار",
  exitRatio: "نسبة الخروج",
  exitModel: "نموذج الخروج",
  exitModelRouterQuote: "عرض سعر مباشر من موجّه Cauldron",
  exitModelRoutedCpmm: "محاكاة CPMM موجّهة (خاصة بنا)",
  exitModelAggregateCpmm: "محاكاة CPMM أحادية المنحنى (خاصة بنا)",
  routedCrossCheck: "المحاكاة الموجّهة (تحقق متقاطع)",
  gaugeReal: "الخروج الحقيقي",
  gaugeDisplayed: "بسعر السوق الفوري (كما هو معروض)",
  gaugeReserve: "احتياطي BCH",
  gaugeDustLine: "عتبة الغبار",
  gaugeTickDead: "خط الموت",
  gaugeTickAlive: "خط الحياة",
  gaugeReserveNote: "الاحتياطي مقابل عتبة الغبار. دون تلك العتبة يكون المجمع ميتًا.",
  poolShareTitle: "الاحتياطي حسب المجمع",
  poolShareMore: "و{count} مجمعات أخرى",
  poolShareRow: "المجمع {n}",
  stepPools: "قراءة المجمعات",
  stepSimulate: "محاكاة الخروج",
  stepIdentity: "تحديد الهوية",
  stepQuote: "المطابقة مع الموجه",
  stepSkipped: "تم التخطي",
  stepIdentityMissing: "لا يوجد إدراج",
  stepQuoteUnavailable: "لم يعد أي عرض سعر",
  identity: "الهوية (BCMR)",
  identityVerified: "تم التحقق من البصمة، وتم حلها من {source}",
  identityNone: "لا يوجد إدخال سجل موثّق",
  decimals: "المنازل العشرية",
  anchorTitle: "مرساة الإثبات",
  anchorBody:
    "بصمة هذا التقرير، جاهزة للحمل في معاملة على شبكة Bitcoin Cash " +
    "الرئيسية كمخرج OP_RETURN. يمكن لأي شخص التحقق من التقرير مقابل " +
    "البصمة في تلك المعاملة.",
  anchorAction: "ثبّت هذا التقرير",
  anchorNeedsWallet:
    "صِل محفظة لتثبيت هذا التقرير على شبكة BCH الرئيسية. يبقى " +
    "التقرير على هذه الصفحة أثناء الاتصال.",
  anchorNoFunds:
    "يحتاج التثبيت إلى UTXO عادي واحد من BCH بقيمة {sats} سات " +
    "على الأقل في هذه المحفظة، لتغطية الرسوم وترك باقٍ فوق حد " +
    "الغبار. لا يوجد أي واحد متاح بعد.",
  anchorDone: "تم التثبيت على شبكة BCH الرئيسية.",
  anchorTampered:
    "المعاملة الموقعة لم تطابق مرساة هذا التقرير. لم يتم بثها.",
  hashing: "جارٍ حساب البصمة...",
  anchorLoadFailed: "تعذّر تحميل مرساة الإثبات.",
  reportHash: "بصمة SHA-256 للتقرير",
  opReturnScript: "نص OP_RETURN",
  viewsLabel: "العرض",
  copyCategory: "نسخ معرف الفئة",
  copyHash: "نسخ بصمة التقرير",
  downloadJson: "تنزيل التقرير (JSON)",
  copyLink: "نسخ رابط المشاركة",
  copied: "تم النسخ",
  copyFailed: "فشل النسخ. انسخ القيمة يدويًا.",
  downloaded: "تم التنزيل",
  downloadFailed: "فشل التنزيل",
  retry: "إعادة المحاولة",
  connectWallet: "اتصال المحفظة",
  walletConnecting: "بانتظار المحفظة...",
  walletConnected: "متصل · {name}",
  walletLoading: "جارٍ تحميل المحفظة...",
  walletLoadFailed: "فشل تحميل المحفظة. أعد تحميل الصفحة للمحاولة مجددًا.",
  disconnectWallet: "قطع الاتصال",
  walletAddressMissing: "متصل، لكن المحفظة لم تشارك عنوانًا بعد.",
  viewReport: "عرض التقرير",
  viewScanner: "عرض الماسح",
  groupIdentity: "الهوية",
  groupSupply: "المعروض والسلطة",
  groupExit: "محاكاة الخروج",
  groupConcentration: "التركيز",
  statusPass: "ناجح",
  statusWarn: "تحذير",
  statusFail: "فاشل",
  statusUnknown: "غير معروف",
  totalSupply: "إجمالي المعروض",
  supplyStandInNote:
    "إجمالي المعروض قيمة بديلة (10 أضعاف احتياطي الرمز في المجمع) حتى " +
    "يصل المصدر الثاني. تُحسب عملية البيع المرجعية من حد الاحتياطي.",
  authorityUnknown:
    "لم يتم التحقق من سلطة السك بعد. تُعرض أرقام المعروض. " +
    "ولا يُدّعى شيء عن السلطة.",
  concentrationUnknown:
    "تركيز الحاملين ليس له مصدر بعد. يُعرض كغير معروف، وليس كناجح أبدًا.",
  walletBalance: "الرصيد",
  walletDisconnectedHint:
    "اربط محفظة لعرض رصيدك وممتلكاتك وسجلّك.",
  actionSend: "إرسال",
  actionReceive: "استلام",
  actionHistory: "السجل",
  actionAudit: "تدقيق",
  sendTitle: "اختر أصلًا",
  sendAmount: "المبلغ",
  sendMax: "الحد الأقصى",
  sendKeypadBackspace: "مسح",
  sendRecipient: "المستلم",
  sendRecipientPlaceholder: "الصق عنوان Bitcoin Cash",
  sendAddressToken: "عنوان يدعم الرموز",
  sendAddressPlain: "عنوان عادي، BCH فقط",
  sendNetwork: "الشبكة: الشبكة الرئيسية لـ Bitcoin Cash",
  confirmTitle: "تأكيد الإرسال",
  confirmAsset: "الأصل",
  confirmRecipient: "المستلم",
  confirmAmount: "المبلغ",
  confirmFee: "رسوم الشبكة",
  confirmBalanceAfter: "الرصيد بعد الإرسال",
  feeEstimateNote:
    "الرسوم تقديرية. تُحدَّد الرسوم النهائية عند توقيع المحفظة.",
  deliveryEstimate: "يُبث فورًا. أول تأكيد خلال نحو 10 دقائق (تقدير).",
  sendConfirm: "تأكيد والإرسال",
  sendCancel: "إلغاء",
  gateWrongNetwork: "هذا العنوان ليس على الشبكة الرئيسية لـ Bitcoin Cash.",
  gateInvalidAddress:
    "هذا ليس عنوان Bitcoin Cash صالحًا. تحقق منه وحاول مجددًا.",
  gateTokenToPlainAddress:
    "هذا العنوان لا يمكنه الاحتفاظ بالرموز. الرموز المرسلة إليه ستعلق. " +
    "استخدم عنوانًا يدعم الرموز.",
  gateAmountMissing: "أدخل مبلغًا.",
  gateAmountInvalid:
    "لا يمكن قراءة هذا المبلغ. تحقق من الرقم وحاول مجددًا.",
  gateAmountZero: "أدخل مبلغًا أكبر من الصفر.",
  gateAmountBelowDust:
    "الحد الأدنى للإرسال هو {dustSats} sats. المخرجات الأصغر غبار.",
  gateInsufficientBalance:
    "الرصيد لا يكفي لهذا المبلغ مضافًا إليه الرسوم.",
  gateInsufficientFeeBalance:
    "رصيد BCH لا يكفي لتغطية رسوم الشبكة.",
  receiptTitle: "الإيصال",
  receiptStatusBroadcast: "تم البث",
  receiptStatusConfirmed: "تم التأكيد",
  receiptStatusConfirmedCount: "تم التأكيد ({count})",
  receiptExplorer: "العرض في المستكشف",
  copyTxid: "نسخ معرّف المعاملة",
  copyRecipient: "نسخ المستلم",
  copyAmount: "نسخ المبلغ",
  historyTitle: "السجل",
  historyEmpty: "لم يُرسَل شيء من هذه المحفظة بعد.",
  historyShowAll: "عرض جميع الإدخالات ({count})",
  historySent: "تم الإرسال",
  historyAnchored: "تم التثبيت",
  receiveAddressLabel: "عنوانك",
  receiveTokenNote: "عنوان يدعم الرموز. آمن لـ BCH والرموز وNFT.",
  receivePlainNote:
    "عنوان عادي، BCH فقط. لا ترسل الرموز إلى هذا العنوان.",
  receiveQrCaption: "رمز QR للعنوان",
  holdingsTotal: "الرصيد الكلي",
  holdingsTokens: "الرموز",
  holdingsNfts: "NFT",
  holdingsCategory: "معرّف الفئة",
  holdingsCommitment: "الالتزام",
  holdingsEmpty: "لا يوجد BCH أو رموز أو NFT في هذه المحفظة بعد.",
  assetShowAll: "عرض جميع الأصول ({count})",
  concGini: "معامل جيني",
  concTierWellDistributed: "موزّع جيدًا",
  concTierGood: "جيد",
  concTierFair: "مقبول",
  concTierPoor: "ضعيف",
  concTierWhaleControlled: "تسيطر عليه الحيتان",
  concTopHolder: "أكبر حامل",
  concTop10: "أكبر 10 حاملين",
  concTopHolderSupply: "أكبر حامل (حصته من المعروض)",
  concHhi: "HHI",
  concBasisListed: "بناءً على أكبر {count} حامل مدرج",
  concBasisFull: "بناءً على جميع الحاملين وعددهم {count}",
  concUnavailable: "غير متاح",
  liveCategoryLabel: "معرّف الفئة",
  liveCategoryPlaceholder: "الصق معرّف فئة من 64 حرفًا",
  liveCategoryHint: "معرّف الفئة يحدّد هوية CashToken. انسخه من صفحة الرمز على TokenStork أو على مستكشف للكتل. لقطات العرض أدناه لا تحتاج إلى معرّف؛ إحداها هي PUSD.",
  liveAuditAction: "تدقيق مباشر",
  liveCategoryInvalid:
    "معرّف الفئة هذا غير صالح. معرّف الفئة مكوّن من 64 حرفًا سداسيًا عشريًا بالضبط.",
  liveFetching: "جارٍ جلب بيانات المجمع المباشرة...",
  liveFetchFailed:
    "فشلت القراءة المباشرة. لم يصدر أي حكم. تحقق من الاتصال وحاول مرة أخرى.",
  liveResultLabel: "نتيجة مباشرة، جُلبت في {time}",
  liveProvenance:
    "قراءة مباشرة من مفهرس Cauldron (indexer.riften.net) في {time}. " +
    "الاسم والرمز والمنازل العشرية لا مصدر لها بعد. المبالغ " +
    "بالوحدات الأساسية الخام.",
  liveProvenanceIdentity:
    "قراءة مباشرة من مفهرس Cauldron (indexer.riften.net) في {time}. " +
    "الاسم والرمز والمنازل العشرية من سجل TokenStork لهذه الفئة.",
  liveUnnamed: "رمز بلا اسم",
  notFoundTitle: "الفئة غير موجودة",
  notFoundBody:
    "لم يتم العثور على أي CashToken بمعرف الفئة هذا على الشبكة " +
    "الرئيسية لـ BCH. فحص PoolProof كلا من Cauldron Indexer " +
    "وTokenStork، ولا يملك أي من المصدرين سجلا لهذه الفئة.",
  notFoundHint:
    "معرفات الفئات لا تحمل مجموعا اختباريا، لذا فإن حرفا واحدا " +
    "خاطئا يشير إلى رمز مختلف، أو إلى رمز غير موجود أصلا. تحقق " +
    "من المعرف وحاول مرة أخرى.",
  notFoundAction: "تحقق من فئة أخرى",
  signPromptAnchor:
    "تثبيت بصمة تقرير PoolProof هذا على الشبكة الرئيسية لـ Bitcoin Cash؟",
  signPromptSend: "وقّع هذا الإرسال في محفظتك لبثّه.",
  signRejected: "رفضت المحفظة طلب التوقيع. لم يُرسَل شيء.",
  toastSent: "تم إرسال {amount} {asset}",
  toastConfirmed: "تم تأكيد {amount} {asset}",
  toastAnchorConfirmed: "تم تأكيد مرساة التقرير",
  toastReceived: "تم استلام {amount} BCH",
  toastDismiss: "إغلاق الإشعار",
};

export const flags: Record<FlagCode, string> = {
  TOKEN_UNREADABLE: "فشلت قراءات هوية الرمز وإمداده",
  NO_POOL: "لا يوجد مجمع Cauldron مقابل BCH: لا توجد سوق للبيع فيها",
  DUST_RESERVE: "احتياطي التسعير {reserveSats} sats (حد الغبار {dustSats})",
  DISPLAYED_LIQUIDITY_LIES:
    "السيولة المعروضة ${displayedUsd}، لكن الاحتياطيات الحقيقية تعني نحو " +
    "${realUsd} (أقل من 1% من الادعاء)",
  EXIT_WORTHLESS: "يعيد بيع المحاكاة {ratio} من القيمة الفورية: الخروج عديم القيمة",
  EXIT_LEAKS_VALUE:
    "يحتفظ بيع المحاكاة بـ{ratio} فقط من القيمة الفورية (الرسوم و/أو أثر السعر)",
  ROUTE_UNSIMULATED: "توجد احتياطيات، لكن تعذر محاكاة مسار البيع",
  ROUTE_QUOTE_IMPLAUSIBLE:
    "عرض سعر موجّه المكان البالغ {quoteSats} ساتوشي مستحيل لمجمعات تحتوي على " +
    "{reserveSats} ساتوشي إجمالاً، لذا يعتمد الحكم على محاكاة الخروج",
};

export default strings;
