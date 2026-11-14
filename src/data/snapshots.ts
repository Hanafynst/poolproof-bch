import type { ConcentrationHolder } from "../core/concentration";
import type { PoolFacts } from "../core/poolproof-core";
import type { Lang } from "../i18n";
import { OLANDO_HOLDERS, PUSD_HOLDERS } from "./holders";

/**
 * Demo snapshots for the practice app.
 *
 * PUSD is a REAL live capture (Riften Indexer, 2026-11-13 ~19:20 WIB):
 * 61 active Cauldron pools aggregated; /valuelocked and the metadata
 * endpoint agreed to the satoshi. Its totalSupplyRaw is set to 10x the
 * pool's token reserve on purpose: the real supply is not yet sourced
 * (second-source work), and 10x makes the reference sell land on the
 * 10%-of-reserve cap, the worst case for the exit simulation.
 *
 * The GHOST entry is a PATTERN fixture (labelled as such in the UI):
 * it encodes the documented dead-pool shape, dust BCH reserve against
 * a large token reserve, not a real token. The 0LANDO entry (R15) is
 * the real thing: a live category whose only pool holds 753 sats.
 *
 * Every user-visible string here is keyed by language: a snapshot is
 * part of the report surface, so it localizes with the rest of the UI
 * instead of silently staying in the source language.
 */
/**
 * Holder data for the concentration group, captured from the
 * TokenStork holders endpoint (R26 fixtures, transcribed in
 * ./holders). The report is computed from this at render time by
 * src/core/concentration.ts. Absent = no holder data was captured
 * for the snapshot, and the group renders its unknown note.
 */
export interface SnapshotConcentration {
  holders: ConcentrationHolder[];
  // Holders known to exist beyond the list, per the source.
  totalHolderCount: number;
  // The source's reported supply in base units. For PUSD this is
  // the int64 genesis sentinel, NOT a count: supplyIsSentinel
  // carries that fact and the module refuses to divide by it.
  supplyRaw: bigint;
  supplyIsSentinel: boolean;
}

export interface TokenSnapshot {
  id: string;
  switchLabel: Record<Lang, string>;
  provenance: Record<Lang, string>;
  name: string;
  symbol: string;
  category: string;
  decimals: number;
  bcmrHashVerified: boolean;
  bcmrSource: string;
  poolCount: number | null;
  // True when totalSupplyRaw is the documented 10x-reserve stand-in
  // rather than a sourced figure. Any surface that prints the supply
  // must disclose it (the scanner's supply group does).
  supplyIsStandIn?: boolean;
  // Fiat reference rates captured WITH the snapshot, for orientation
  // only. Every verdict is computed in BCH. Absent = no fiat figures
  // are shown for this snapshot (never invent a rate).
  fiat?: { bchUsd: number; usdIdr: number; note: Record<Lang, string> };
  concentration?: SnapshotConcentration;
  facts: PoolFacts;
}

export const SNAPSHOTS: TokenSnapshot[] = [
  {
    id: "pusd-live",
    switchLabel: {
      en: "PUSD (live snapshot)",
      id: "PUSD (snapshot langsung)",
      zh: "PUSD（实时快照）",
      es: "PUSD (instantánea en vivo)",
      hi: "PUSD (लाइव स्नैपशॉट)",
      ar: "PUSD (لقطة حية)",
      pt: "PUSD (instantâneo ao vivo)",
      fr: "PUSD (instantané en direct)",
    },
    provenance: {
      en:
        "Live capture from indexer.riften.net, 13 Nov 2026: 61 active pools " +
        "aggregated; valuelocked and metadata endpoints agree to the satoshi.",
      id:
        "Tangkapan langsung dari indexer.riften.net, 13 Nov 2026: 61 pool aktif " +
        "digabungkan; endpoint valuelocked dan metadata sepakat sampai ke satoshi.",
      zh:
        "来自 indexer.riften.net 的实时捕获，2026 年 11 月 13 日：汇总 61 个活跃池；" +
        "valuelocked 与元数据端点的结果精确一致到 satoshi。",
      es:
        "Captura en vivo de indexer.riften.net, 13 de nov. de 2026: 61 pools " +
        "activos agregados; los endpoints valuelocked y de metadatos coinciden " +
        "hasta el satoshi.",
      hi:
        "indexer.riften.net से लाइव कैप्चर, 13 नवंबर 2026: 61 सक्रिय पूल एकत्रित; " +
        "valuelocked और मेटाडेटा एंडपॉइंट satoshi तक सहमत हैं।",
      ar:
        "التقاط حي من indexer.riften.net، 13 نوفمبر 2026: تم تجميع 61 مجمعًا " +
        "نشطًا؛ تتفق نقطتا valuelocked والبيانات الوصفية حتى آخر satoshi.",
      pt:
        "Captura ao vivo de indexer.riften.net, 13 de nov. de 2026: 61 pools " +
        "ativos agregados; os endpoints valuelocked e de metadados concordam " +
        "até o satoshi.",
      fr:
        "Capture en direct de indexer.riften.net, 13 nov. 2026 : 61 pools " +
        "actifs agrégés ; les endpoints valuelocked et de métadonnées " +
        "concordent au satoshi près.",
    },
    name: "ParyonUSD",
    symbol: "PUSD",
    category: "2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544",
    decimals: 2,
    bcmrHashVerified: true,
    bcmrSource: "onchain",
    poolCount: 61,
    supplyIsStandIn: true,
    fiat: {
      bchUsd: 221.85,
      usdIdr: 18_220.5,
      note: {
        en:
          "Fiat figures use reference rates captured with this snapshot: BCH $221.85 " +
          "(Selene market page, 13 Nov 2026) and USD/IDR 18,220.5 (Finnhub, 13 Nov 2026). " +
          "Fiat figures are for orientation only. Every verdict is computed in BCH.",
        id:
          "Angka fiat memakai kurs referensi yang ditangkap bersama snapshot ini: " +
          "BCH $221.85 (halaman pasar Selene, 13 Nov 2026) dan USD/IDR 18,220.5 " +
          "(Finnhub, 13 Nov 2026). Angka fiat hanya untuk orientasi. Setiap vonis dihitung dalam BCH.",
        zh:
          "法定货币数字使用与此快照一同捕获的参考汇率：BCH $221.85（Selene 市场页面，" +
          "2026 年 11 月 13 日）和 USD/IDR 18,220.5（Finnhub，2026 年 11 月 13 日）。" +
          "法币数字仅供参考。每个结论都以 BCH 计算。",
        es:
          "Las cifras en fiat usan tipos de referencia capturados con esta " +
          "instantánea: BCH $221.85 (página de mercado de Selene, 13 de nov. de " +
          "2026) y USD/IDR 18,220.5 (Finnhub, 13 de nov. de 2026). Las cifras " +
          "en fiat son solo orientativas. Cada veredicto se calcula en BCH.",
        hi:
          "फ़िएट आंकड़े इस स्नैपशॉट के साथ लिए गए संदर्भ दरों का उपयोग करते हैं: " +
          "BCH $221.85 (Selene बाज़ार पृष्ठ, 13 नवंबर 2026) और USD/IDR 18,220.5 " +
          "(Finnhub, 13 नवंबर 2026)। फ़िएट आंकड़े केवल दिशा-निर्देश के लिए हैं। " +
          "हर निर्णय BCH में गणना किया जाता है।",
        ar:
          "تستخدم أرقام العملات الورقية أسعارًا مرجعية التُقطت مع هذه اللقطة: " +
          "BCH بقيمة $221.85 (صفحة سوق Selene، 13 نوفمبر 2026) وUSD/IDR بقيمة " +
          "18,220.5 (Finnhub، 13 نوفمبر 2026). أرقام العملات الورقية للإرشاد فقط. كل حكم يُحسب بـBCH.",
        pt:
          "Os valores em fiat usam taxas de referência capturadas com este " +
          "instantâneo: BCH $221.85 (página de mercado da Selene, 13 de nov. de " +
          "2026) e USD/IDR 18,220.5 (Finnhub, 13 de nov. de 2026). Os valores " +
          "em fiat servem apenas como orientação. Cada veredito é calculado em BCH.",
        fr:
          "Les montants en fiat utilisent les taux de référence capturés avec " +
          "cet instantané : BCH $221.85 (page de marché Selene, 13 nov. 2026) " +
          "et USD/IDR 18,220.5 (Finnhub, 13 nov. 2026). Les montants en fiat " +
          "sont donnés à titre indicatif. Chaque verdict est calculé en BCH.",
      },
    },
    // TokenStork capture (R26): the source caps the list at the
    // top 100 of 153 holders, and its reported supply is the
    // int64 sentinel: concentration renders on the listed basis
    // and share-of-supply stays null by construction.
    concentration: {
      holders: PUSD_HOLDERS,
      totalHolderCount: 153,
      supplyRaw: 9_223_372_036_854_773_316n,
      supplyIsSentinel: true,
    },
    facts: {
      tokenReadable: true,
      hasPool: true,
      reserveTokenRaw: 11_151_300n,
      reserveQuoteSats: 49_973_609_463n,
      totalSupplyRaw: 111_513_000n,
    },
  },
  {
    id: "dead-pattern",
    switchLabel: {
      en: "Dead pool (pattern fixture)",
      id: "Pool mati (fixture pola)",
      zh: "死亡池（模式样本）",
      es: "Pool muerto (ejemplo de patrón)",
      hi: "मृत पूल (पैटर्न फ़िक्स्चर)",
      ar: "مجمع ميت (نموذج نمطي)",
      pt: "Pool morto (exemplo de padrão)",
      fr: "Pool mort (modèle type)",
    },
    provenance: {
      en:
        "Pattern fixture, not a real token. It pairs a dust BCH reserve " +
        "with a large token reserve, the shape a dead pool takes on Cauldron.",
      id:
        "Fixture pola, bukan token asli. Cadangan BCH debu melawan cadangan " +
        "token besar. Itulah bentuk pool mati di Cauldron.",
      zh:
        "模式样本，并非真实代币：极少的 BCH 储备对着庞大的代币储备。" +
        "这是 Cauldron 上死亡池的形态。",
      es:
        "Ejemplo de patrón, no un token real: una reserva de BCH ínfima frente " +
        "a una gran reserva del token. Es la forma que adopta un pool muerto en Cauldron.",
      hi:
        "पैटर्न फ़िक्स्चर, असली टोकन नहीं: बड़े टोकन भंडार के सामने नाममात्र " +
        "BCH भंडार है। Cauldron पर मृत पूल का आकार यही होता है।",
      ar:
        "نموذج نمطي، وليس رمزًا حقيقيًا: احتياطي BCH ضئيل مقابل احتياطي رمز " +
        "كبير. هذا هو شكل المجمع الميت على Cauldron.",
      pt:
        "Exemplo de padrão, não um token real: reserva de BCH ínfima contra " +
        "uma grande reserva do token. É a forma de um pool morto no Cauldron.",
      fr:
        "Modèle type, pas un vrai jeton : une réserve BCH dérisoire face à " +
        "une grande réserve du jeton. C'est la forme d'un pool mort sur Cauldron.",
    },
    name: "Ghost Pool (pattern)",
    symbol: "GHOST",
    category: "0000000000000000000000000000000000000000000000000000000000000000",
    decimals: 8,
    bcmrHashVerified: false,
    bcmrSource: "none",
    poolCount: 1,
    facts: {
      tokenReadable: true,
      hasPool: true,
      reserveTokenRaw: 5_000_000_000n,
      reserveQuoteSats: 42_000n,
      totalSupplyRaw: 1_000_000_000_000n,
    },
  },
  {
    // REAL dead token, captured live 2026-11-13 (R15): the category's
    // only Cauldron pool holds 753 sats, real dust, not a pattern.
    // Supply is TokenStork's figure for this category, so this
    // snapshot carries no stand-in at all.
    id: "olando-real-dead",
    switchLabel: {
      en: "0LANDO (real dead pool)",
      id: "0LANDO (pool mati asli)",
      zh: "0LANDO（真实死亡池）",
      es: "0LANDO (pool muerto real)",
      hi: "0LANDO (असली मृत पूल)",
      ar: "0LANDO (مجمع ميت حقيقي)",
      pt: "0LANDO (pool morto real)",
      fr: "0LANDO (pool mort réel)",
    },
    provenance: {
      en:
        "Live capture from indexer.riften.net, 13 Nov 2026: this category's only " +
        "Cauldron pool holds 753 sats against 2,292,721 token base units. " +
        "Total supply from TokenStork's record for the category.",
      id:
        "Tangkapan langsung dari indexer.riften.net, 13 Nov 2026: satu-satunya pool " +
        "Cauldron kategori ini memegang 753 sats melawan 2.292.721 unit dasar token. " +
        "Total pasokan dari catatan TokenStork untuk kategori ini.",
      zh:
        "来自 indexer.riften.net 的实时捕获，2026 年 11 月 13 日：该类别唯一的 " +
        "Cauldron 池仅持有 753 sats，对应 2,292,721 个代币基础单位。" +
        "总供应量来自 TokenStork 对该类别的记录。",
      es:
        "Captura en vivo de indexer.riften.net, 13 de nov. de 2026: el único pool " +
        "de Cauldron de esta categoría guarda 753 sats frente a 2.292.721 unidades " +
        "base del token. Suministro total según el registro de TokenStork.",
      hi:
        "indexer.riften.net से लाइव कैप्चर, 13 नवंबर 2026: इस श्रेणी का एकमात्र " +
        "Cauldron पूल 2,292,721 टोकन आधार इकाइयों के सामने केवल 753 sats रखता है। " +
        "कुल आपूर्ति TokenStork के रिकॉर्ड से।",
      ar:
        "التقاط حي من indexer.riften.net، 13 نوفمبر 2026: المجمع الوحيد لهذه الفئة " +
        "على Cauldron يحمل 753 sats مقابل 2,292,721 وحدة أساسية من الرمز. " +
        "إجمالي المعروض من سجل TokenStork لهذه الفئة.",
      pt:
        "Captura ao vivo de indexer.riften.net, 13 de nov. de 2026: o único pool " +
        "desta categoria no Cauldron guarda 753 sats contra 2.292.721 unidades " +
        "base do token. Fornecimento total do registro da TokenStork.",
      fr:
        "Capture en direct de indexer.riften.net, 13 nov. 2026 : l'unique pool " +
        "Cauldron de cette catégorie détient 753 sats face à 2 292 721 unités " +
        "de base du jeton. Offre totale selon l'enregistrement TokenStork.",
    },
    name: "0land0 v1.1",
    symbol: "0LANDO",
    category: "10d85ee2d23f7fbc7573379de5544d669bc086e0745b34ff277c40641dadd56f",
    decimals: 2,
    bcmrHashVerified: false,
    bcmrSource: "none",
    poolCount: 1,
    // TokenStork capture (R26): the full holder list, 48 of 48,
    // against the real supply below, the same figure our R15
    // Cauldron read produced independently.
    concentration: {
      holders: OLANDO_HOLDERS,
      totalHolderCount: 48,
      supplyRaw: 888_888_888_888_888_800n,
      supplyIsSentinel: false,
    },
    facts: {
      tokenReadable: true,
      hasPool: true,
      reserveTokenRaw: 2_292_721n,
      reserveQuoteSats: 753n,
      totalSupplyRaw: 888_888_888_888_888_800n,
    },
  },
];
