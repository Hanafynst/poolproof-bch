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
  pairingScanHint: "أو امسح هذا الرمز بمحفظة على جهاز آخر.",
  noWalletHeading: "لم يستجب أي تطبيق محفظة",
  noWalletBody:
    "ثبّت محفظة مدعومة، ثم عد وانقر على فتح تطبيق المحفظة مرة أخرى. " +
    "يعمل Cashonize في المتصفح ولا يحتاج إلى تثبيت.",
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
  receivePlainLabel: "عنوان عادي",
  headline: "هل مجمع CashToken هذا حي فعلًا؟",
  lede:
    "يفحص PoolProof مجمع CashToken قبل أن تثق بأرقامه. يقرأ احتياطيات " +
    "المجمع على Cauldron ويحاكي عملية بيع. يأتي الحكم من الاحتياطيات " +
    "والبيع المحاكى، لا من رقم السيولة المعروض.",
  language: "اللغة",
  currency: "العملة",
  languageLoadFailed: "تعذّر تحميل تلك اللغة. ما زالت اللغة السابقة معروضة.",
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
  identity: "الهوية (BCMR)",
  identityVerified: "تم التحقق من البصمة، وتم حلها من {source}",
  identityNone: "لا يوجد إدخال سجل موثّق",
  decimals: "المنازل العشرية",
  anchorTitle: "مرساة الإثبات",
  anchorBody:
    "بصمة هذا التقرير، جاهزة للحمل في معاملة على شبكة Bitcoin Cash " +
    "الرئيسية كمخرج OP_RETURN. يمكن لأي شخص التحقق من التقرير مقابل " +
    "البصمة في تلك المعاملة.",
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
  historySent: "تم الإرسال",
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
  liveAuditAction: "تدقيق مباشر",
  liveCategoryInvalid:
    "معرّف الفئة هذا غير صالح. تتكون الفئة من 64 حرفًا سداسيًا عشريًا بالضبط.",
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
  signPromptAnchor:
    "تثبيت بصمة تقرير PoolProof هذا على الشبكة الرئيسية لـ Bitcoin Cash؟",
  signPromptSend: "وقّع هذا الإرسال في محفظتك لبثّه.",
  signRejected: "رفضت المحفظة طلب التوقيع. لم يُرسَل شيء.",
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
};

export default strings;
