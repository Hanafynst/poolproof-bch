import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "演示文稿",
  source: "GitHub",
  ember: "EMBER2026 小费：钱包连接后，地址会显示在这里。",
  preExistingDisclosure:
    "已有工作：判定逻辑最初在一个更早的个人项目中做出原型，那是一个从未" +
    "发布的死亡池检测器。BCH 实现、界面和本仓库都是新的，为 BCH BLAZE 在 " +
    "2026 年 11 月 14 日至 22 日期间完成。",
  copyAddress: "复制地址",
  openWalletApp: "打开钱包应用",
  copyConnectionLink: "复制连接链接",
  pairingScanHint: "钱包在另一台设备上：用它扫描此二维码。",
  pairingPasteHint:
    "钱包就在这台手机上：复制链接，然后粘贴到钱包的连接或扫描页面。",
  pairingShotHint: "没有第二台设备？截取此代码的屏幕截图，然后在钱包的扫码页面中上传。",
  pairingReturnHint: "扫描或粘贴后，请立即回到此页面。钱包的回复会在几秒内失效，且只有在此页面位于前台时才能送达。",
  dialogClose: "关闭",
  noWalletHeading: "没有钱包应用响应",
  noWalletBody:
    "复制连接链接并粘贴到钱包中，或用另一台设备扫描此二维码。" +
    "如果还没有钱包，请在下方安装一个。Cashonize 在浏览器中运行，无需安装。",
  noWalletStaleHint: "如果您的钱包显示 PoolProof 已连接，但此页面没有，说明钱包里存着一条旧连接。请在钱包中删除旧的 PoolProof 条目，然后重新配对。在 Paytaca 中，该列表位于 Apps，然后 Wizard Connect。",
  walletBalanceLoading: "正在加载余额...",
  walletBalanceUnavailable: "余额不可用。无法连接 UTXO 索引器。",
  sendInProgress: "等待钱包签名...",
  sendTampered:
    "已签名的交易与你确认的发送内容不一致。该交易未被广播。",
  sendBroadcastFailed:
    "广播失败。已签名的交易可以再次广播，不需要重新签名。",
  sendMalformed: "钱包返回的响应无法验证。没有广播任何内容。",
  historyUnavailable: "无法读取已保存的历史记录。此列表从空开始。",
  historySaveFailed: "无法在此浏览器中保存历史记录。重新加载页面前，条目仍会显示。",
  receivePlainLabel: "普通地址",
  headline: "这个 CashToken 池真的还活跃吗？",
  lede:
    "PoolProof 在您信任池的数字之前先对其进行检查。它读取池在 Cauldron " +
    "上的储备并模拟一次卖出。判定来自储备和模拟卖出，而不是页面上显示的流动性数字。",
  language: "语言",
  languageLoadFailed: "该语言加载失败，仍显示上一种语言。",
  skipToMain: "跳到主要内容",
  snapshotsLabel: "演示快照",
  reportLabel: "尽职调查报告",
  caveat:
    "本报告是某一时刻的检查结果。报告之后，储备和铸造权限都可能发生变化。" +
    "根据报告采取行动前，请重新运行检查。",
  summaryByVerdict: {
    ALIVE: "活跃：储备真实，模拟卖出能以接近现货价的价格退出（退出比率 {ratio}）。",
    RISKY:
      "有风险：模拟卖出只能保留部分现货价值（退出比率 {ratio}）。可以退出，但会损失价值。",
    DEAD: "已死亡：储备只剩灰尘，仓位无法以有意义的价值退出。",
    NO_MARKET: "无市场：此代币在 Cauldron 上没有活跃池。",
    LYING_DISPLAY: "显示造假：显示的流动性远高于真实储备。",
  },
  pools: "活跃的 Cauldron 池",
  bchReserve: "BCH 储备（所有池）",
  tokenReserve: "{symbol} 储备（所有池）",
  referenceSell: "参考卖出",
  referenceSellCap: "（上限：池储备10%）",
  simulatedExit: "模拟退出",
  exitOfSpot: "{out} BCH，现货价值为 {spot} BCH",
  exitNotSimulated: "未模拟：仅凭储备即可判定此结论",
  exitRouteFailed: "无法模拟路线",
  exitRatio: "退出比率",
  exitModel: "退出模型",
  exitModelRouterQuote: "Cauldron 路由器实时报价",
  exitModelRoutedCpmm: "分池路由 CPMM 模拟（自研）",
  exitModelAggregateCpmm: "单曲线 CPMM 模拟（自研）",
  routedCrossCheck: "路由模拟（交叉核对）",
  gaugeReal: "真实退出",
  gaugeDisplayed: "按现货价格（展示价）",
  gaugeReserve: "BCH 储备",
  gaugeDustLine: "灰尘阈值",
  gaugeTickDead: "死亡线",
  gaugeTickAlive: "存活线",
  gaugeReserveNote: "储备与灰尘阈值的对比。低于该线，池即为死亡池。",
  poolShareTitle: "各池储备",
  poolShareMore: "以及另外 {count} 个池",
  poolShareRow: "池 {n}",
  stepPools: "读取池数据",
  stepSimulate: "模拟退出",
  stepIdentity: "解析代币身份",
  stepQuote: "路由器交叉核对",
  stepSkipped: "已跳过",
  stepIdentityMissing: "未找到收录",
  stepQuoteUnavailable: "未返回报价",
  identity: "身份（BCMR）",
  identityVerified: "哈希已验证，解析自 {source}",
  identityNone: "没有已验证的注册表条目",
  decimals: "小数位数",
  anchorTitle: "证明锚点",
  anchorBody:
    "本报告的哈希，可作为 OP_RETURN 输出写入一笔 Bitcoin Cash 主网交易。" +
    "任何人都可以将报告与该交易中的哈希进行核对。",
  anchorAction: "锚定此报告",
  anchorNeedsWallet:
    "连接钱包即可将此报告锚定到 BCH 主网。连接期间，报告会保留在此页面上。",
  anchorNoFunds:
    "锚定需要此钱包中至少有一个 {sats} 聪的普通 BCH UTXO，" +
    "用于支付手续费并留下高于粉尘的找零。目前尚无可用。",
  anchorDone: "已锚定到 BCH 主网。",
  anchorTampered:
    "已签名的交易与此报告的锚点不匹配，未进行广播。",
  hashing: "正在计算哈希...",
  anchorLoadFailed: "证明锚点加载失败。",
  reportHash: "报告 SHA-256",
  opReturnScript: "OP_RETURN 脚本",
  viewsLabel: "视图",
  copyCategory: "复制类别 ID",
  copyHash: "复制报告哈希",
  downloadJson: "下载报告 (JSON)",
  copyLink: "复制分享链接",
  copied: "已复制",
  copyFailed: "复制失败，请手动复制该值。",
  downloaded: "已下载",
  downloadFailed: "下载失败",
  retry: "重试",
  connectWallet: "连接钱包",
  walletConnecting: "等待钱包...",
  walletConnected: "已连接 · {name}",
  walletLoading: "正在加载钱包...",
  walletLoadFailed: "钱包加载失败。请刷新页面重试。",
  disconnectWallet: "断开",
  walletAddressMissing: "已连接，但钱包尚未共享地址。",
  viewReport: "报告视图",
  viewScanner: "扫描视图",
  groupIdentity: "身份",
  groupSupply: "供应与权限",
  groupExit: "退出模拟",
  groupConcentration: "集中度",
  statusPass: "通过",
  statusWarn: "警告",
  statusFail: "失败",
  statusUnknown: "未知",
  totalSupply: "总供应量",
  supplyStandInNote:
    "总供应量是替代值（池中代币储备的 10 倍），直到第二数据源接入。" +
    "参考卖出按储备上限计算。",
  authorityUnknown: "铸造权限尚未核查。这里只显示供应数据，不对权限作任何声称。",
  concentrationUnknown: "持有集中度尚无数据来源。它显示为未知，绝不显示为通过。",
  walletBalance: "余额",
  walletDisconnectedHint: "连接钱包以查看余额、持有资产和历史记录。",
  actionSend: "发送",
  actionReceive: "接收",
  actionHistory: "历史",
  actionAudit: "审计",
  sendTitle: "选择资产",
  sendAmount: "金额",
  sendMax: "最大",
  sendKeypadBackspace: "退格",
  sendRecipient: "收款方",
  sendRecipientPlaceholder: "粘贴 Bitcoin Cash 地址",
  sendAddressToken: "支持代币的地址",
  sendAddressPlain: "普通地址，仅限 BCH",
  sendNetwork: "网络：Bitcoin Cash 主网",
  confirmTitle: "确认发送",
  confirmAsset: "资产",
  confirmRecipient: "收款方",
  confirmAmount: "金额",
  confirmFee: "网络手续费",
  confirmBalanceAfter: "发送后余额",
  feeEstimateNote: "手续费是估算值。最终手续费在钱包签名时确定。",
  deliveryEstimate: "广播立即发出。首次确认约需 10 分钟（估算）。",
  sendConfirm: "确认并发送",
  sendCancel: "取消",
  gateWrongNetwork: "该地址不属于 Bitcoin Cash 主网。",
  gateInvalidAddress: "这不是有效的 Bitcoin Cash 地址。请检查后重试。",
  gateTokenToPlainAddress:
    "该地址无法持有代币。发送到该地址的代币将无法取回。请使用支持代币的地址。",
  gateAmountMissing: "请输入金额。",
  gateAmountInvalid: "该金额无法读取。请检查数字后重试。",
  gateAmountZero: "请输入大于零的金额。",
  gateAmountBelowDust: "最低发送金额为 {dustSats} sats。更小的输出属于粉尘。",
  gateInsufficientBalance: "余额不足以支付该金额加手续费。",
  gateInsufficientFeeBalance: "BCH 余额不足以支付网络手续费。",
  receiptTitle: "回执",
  receiptStatusBroadcast: "已广播",
  receiptStatusConfirmed: "已确认",
  receiptStatusConfirmedCount: "已确认 ({count})",
  receiptExplorer: "在区块浏览器中查看",
  copyTxid: "复制交易 ID",
  copyRecipient: "复制收款方",
  copyAmount: "复制金额",
  historyTitle: "历史记录",
  historyEmpty: "此钱包尚未发送过任何交易。",
  historyShowAll: "显示全部 {count} 条记录",
  historySent: "已发送",
  historyAnchored: "已锚定",
  receiveAddressLabel: "你的地址",
  receiveTokenNote: "支持代币的地址。可安全接收 BCH、代币和 NFT。",
  receivePlainNote: "普通地址，仅限 BCH。请勿向此地址发送代币。",
  receiveQrCaption: "地址二维码",
  holdingsTotal: "总余额",
  holdingsTokens: "代币",
  holdingsNfts: "NFT",
  holdingsCategory: "类别 ID",
  holdingsCommitment: "承诺值",
  holdingsEmpty: "此钱包中暂无 BCH、代币或 NFT。",
  portfolioTitle: "投资组合",
  portfolioTotalLabel: "总价值",
  portfolioOther: "其他",
  portfolioUnpricedNote: "份额和总计仅涵盖已定价资产。未定价资产列出但不计价值。",
  portfolioPricesUnavailable: "代币价格无法加载。数量已显示，但不带价值。",
  portfolioRateNote: "价值采用 Cauldron 池现货价格。BCH 按实时汇率 {rate} 计价（来源：{source}）。",
  portfolioRateUnavailable: "无法加载 BCH/USD 实时汇率。金额显示不带美元价值。",
  assetShowAll: "显示全部 {count} 项资产",
  concGini: "基尼系数",
  concTierWellDistributed: "分布均匀",
  concTierGood: "良好",
  concTierFair: "一般",
  concTierPoor: "较差",
  concTierWhaleControlled: "鲸鱼主导",
  concTopHolder: "最大持有者",
  concTop10: "前 10 名持有者",
  concTopHolderSupply: "最大持有者（占总供应量）",
  concHhi: "HHI",
  concBasisListed: "基于已列出的 {count} 名最大持有者",
  concBasisFull: "基于全部 {count} 名持有者",
  concUnavailable: "不可用",
  liveCategoryLabel: "类别 ID",
  liveCategoryPlaceholder: "粘贴 64 个字符的类别 ID",
  liveCategoryHint: "类别 ID 是 CashToken 的身份标识。可以从 TokenStork 或区块浏览器上的代币页面复制它。下面的演示快照不需要 ID；其中一个是 PUSD。",
  liveAuditAction: "实时审计",
  liveCategoryInvalid: "该类别 ID 无效。类别 ID 恰好是 64 个十六进制字符。",
  liveFetching: "正在获取实时池数据...",
  liveFetchFailed: "实时读取失败，未生成任何结论。请检查连接后重试。",
  liveResultLabel: "实时结果，获取于 {time}",
  liveProvenance:
    "于 {time} 从 Cauldron 索引器 (indexer.riften.net) 实时读取。" +
    "名称、符号和小数位数尚无数据来源。金额为原始基础单位。",
  liveProvenanceIdentity:
    "于 {time} 从 Cauldron 索引器 (indexer.riften.net) 实时读取。" +
    "名称、符号和小数位数来自 TokenStork 对此类别的记录。",
  liveUnnamed: "未命名代币",
  notFoundTitle: "未找到该类别",
  notFoundBody:
    "在 BCH 主网上没有找到使用此类别 ID 的 CashToken。PoolProof " +
    "检查了 Cauldron Indexer 和 TokenStork，两个来源都没有这个" +
    "类别的记录。",
  notFoundHint:
    "类别 ID 没有校验和，因此一个字符写错就会指向另一个代币，" +
    "或者指向一个根本不存在的代币。请检查 ID 后重试。",
  notFoundAction: "检查其他类别",
  signPromptAnchor: "将此 PoolProof 报告哈希锚定到 Bitcoin Cash 主网？",
  signPromptSend: "在钱包中签署此笔发送以广播它。",
  signRejected: "钱包拒绝了签名请求。没有发送任何内容。",
  toastSent: "已发送 {amount} {asset}",
  toastConfirmed: "{amount} {asset} 已确认",
  toastAnchorConfirmed: "报告锚点已确认",
  toastReceived: "已收到 {amount} BCH",
  toastDismiss: "关闭通知",
  aboutTitle: "关于 PoolProof",
  aboutWhat:
    "PoolProof 检查一个 CashToken 池是否真的能向你兑付。" +
    "它读取池的真实储备并模拟卖出，因此结论取决于退出" +
    "实际能得到多少，而不是展示中的流动性数字。",
  aboutHowTitle: "结论如何得出",
  aboutHow:
    "审计先把代币的身份和供应量锁定到确切的类别 ID 上，" +
    "相似的代币无法冒充。随后实时读取 Cauldron 储备，" +
    "并把一笔参考卖出（供应量的 1% 与池储备的 10% 中" +
    "较小者）逐个池地模拟。如果交易场所自己的 Router " +
    "返回的报价不高于这些池实际持有的储备，该报价就会" +
    "对模拟结果做交叉核对。结论取决于退出比率，即卖出" +
    "保留的现货价值比例：低于 0.010，退出已死；在 " +
    "0.800 或以上，退出成立。若存在多个数字，先由 " +
    "Router 报价决定，其次是路由模拟，最后是单曲线模拟。",
  aboutVerdictsTitle: "五种结论",
  aboutAnchor:
    "报告可以封存在链上。PoolProof 按你下载的原样对" +
    "报告文件做哈希，你连接的钱包把该哈希以 OP_RETURN " +
    "输出写入比特币现金主网。任何持有该文件的人都可以" +
    "对它做哈希，并与交易中的哈希比对，因此被改动的" +
    "报告无法冒充原件。",
  aboutSourcesTitle: "数据来源",
  aboutSources:
    "池数据来自 Riften 运行的 Cauldron 索引器。代币" +
    "身份来自 BCMR 元数据，并与 TokenStork 交叉核对。" +
    "钱包余额从公共 Electrum 服务器读取。报告中的每个" +
    "数字都在审计运行时读取，不会沿用之前访问的数据。",
  aboutLimitsTitle: "局限",
  aboutLimits:
    "报告是某一时刻的检查结果。报告之后，储备和铸造" +
    "权限都可能发生变化。根据报告采取行动前，请重新" +
    "运行检查。模拟退出是根据当时储备计算的。它是" +
    "估算，不是保证的成交价格。PoolProof 从不保管" +
    "密钥、资金或账户。签名始终在你自己的钱包中完成，" +
    "没有签名，任何资产都不会移动。",
  aboutBuilt: "PoolProof 是为 BCH BLAZE 2026 独立完成的作品。",
  aboutDisclaimer:
    "报告中的任何内容都不构成财务建议。PoolProof 只" +
    "说明一次模拟发现了什么，不推荐买入、卖出或持有" +
    "任何代币。请把每个数字都当作需要你亲自核实后才" +
    "能采信的信息。",
  aboutFaqTitle: "常见问题",
  faqNoPriceQ: "为什么我的投资组合里某个代币没有价格？",
  faqNoPriceA:
    "投资组合的价格来自该代币的 Cauldron 池。当一个" +
    "代币没有对 BCH 的池，或者池中 BCH 一侧低于" +
    "100,000 聪的灰尘线时，就不存在 PoolProof 能" +
    "担保的价格。该代币仍会显示数量但不带价值，从不" +
    "使用猜测的数字。",
  faqStaleQ: "我的钱包显示 PoolProof 已连接，但这个页面没有。我该怎么办？",
  faqStaleA:
    "钱包保留着一个本页面已经丢弃的会话，所以两边对" +
    "连接状态的判断不一致。在钱包里删除所有 PoolProof " +
    "条目（在 Paytaca 里，打开 Apps，再打开 Wizard " +
    "Connect），然后从本页面重新配对，并立即回到本" +
    "页面。钱包的应答只能在本页面处于前台时送达。",
  faqKeysQ: "PoolProof 会保管我的密钥或资金吗？",
  faqKeysA:
    "不会。PoolProof 不保管密钥、资金或账户，也无法" +
    "自行发起交易。签名在你自己的钱包中完成，你在那" +
    "里批准之前，任何资产都不会移动。",
  faqAnchorQ: "锚定报告有什么作用？",
  faqAnchorA:
    "锚定把报告文件的哈希写入一笔比特币现金主网交" +
    "易，放在由你的钱包签名并广播的 OP_RETURN 输出" +
    "中。日后任何持有该文件的人都可以对它做哈希，并" +
    "与链上记录的哈希比对。文件改动哪怕一个字符，哈" +
    "希也会对不上。",
  aboutValuesLine: "以美元计价 · 比特币现金主网",
  navCheck: "检查",
  navWallet: "钱包",
  navAbout: "关于",
};

export const flags: Record<FlagCode, string> = {
  TOKEN_UNREADABLE: "代币身份和供应读取失败",
  NO_POOL: "Cauldron 上没有与 BCH 配对的池：没有可卖出的市场",
  DUST_RESERVE: "报价储备为 {reserveSats} sats（灰尘阈值 {dustSats}）",
  DISPLAYED_LIQUIDITY_LIES:
    "显示流动性为 ${displayedUsd}，但真实储备意味着约 ${realUsd}（不到宣称值的 1%）",
  EXIT_WORTHLESS: "卖出模拟仅返回现货价值的 {ratio}：退出毫无价值",
  EXIT_LEAKS_VALUE: "卖出模拟仅保留现货价值的 {ratio}（费用和/或价格冲击）",
  ROUTE_UNSIMULATED: "储备存在，但无法模拟卖出路线",
  ROUTE_QUOTE_IMPLAUSIBLE:
    "场馆路由器给出的 {quoteSats} 聪报价，对于总储备仅 {reserveSats} 聪的池子不可能兑付，" +
    "因此结论采用模拟退出结果",
};

export default strings;
