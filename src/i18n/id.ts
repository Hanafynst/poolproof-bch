import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "Presentasi",
  source: "GitHub",
  ember: "Tip EMBER2026: alamat muncul di sini setelah wallet terhubung.",
  preExistingDisclosure:
    "Pekerjaan sebelumnya: semantik vonis pertama kali dibuat prototipenya " +
    "di proyek pribadi terdahulu (detektor dead pool BSC). Implementasi BCH, " +
    "UI, dan repositori ini baru, dibuat untuk BCH BLAZE di dalam jendela " +
    "14 sampai 22 Nov 2026.",
  copyAddress: "Salin alamat",
  openWalletApp: "Buka aplikasi wallet",
  copyConnectionLink: "Salin tautan koneksi",
  pairingScanHint: "Wallet di perangkat lain: pindai kode ini dengan wallet itu.",
  pairingPasteHint:
    "Wallet di HP ini: salin tautannya, lalu tempel di halaman " +
    "koneksi atau pindai wallet.",
  pairingShotHint: "Tidak ada perangkat lain? Ambil tangkapan layar kode ini, lalu unggah gambarnya di pemindai wallet.",
  pairingReturnHint: "Kembali ke halaman ini segera setelah memindai atau menempel. Jawaban wallet kedaluwarsa dalam hitungan detik, dan hanya bisa masuk saat halaman ini di depan.",
  dialogClose: "Tutup",
  noWalletHeading: "Tidak ada aplikasi wallet yang merespons",
  noWalletBody:
    "Salin tautan koneksi dan tempel di dalam wallet, atau pindai " +
    "kode dari perangkat lain. Kalau belum punya wallet, pasang " +
    "salah satu di bawah ini. Cashonize berjalan di browser dan " +
    "tidak perlu dipasang.",
  noWalletStaleHint: "Jika wallet menunjukkan PoolProof sudah terhubung tetapi halaman ini tidak, wallet menyimpan koneksi lama. Hapus entri PoolProof lama di wallet, lalu pasangkan lagi. Di Paytaca, daftarnya ada di Apps, lalu Wizard Connect.",
  walletBalanceLoading: "Memuat saldo...",
  walletBalanceUnavailable:
    "Saldo tidak tersedia. Indexer UTXO tidak bisa dihubungi.",
  sendInProgress: "Menunggu wallet menandatangani...",
  sendTampered:
    "Transaksi yang ditandatangani tidak cocok dengan pengiriman yang " +
    "kamu konfirmasi. Transaksi itu tidak disiarkan.",
  sendBroadcastFailed:
    "Penyiaran gagal. Transaksi yang sudah ditandatangani bisa " +
    "disiarkan lagi. Tidak perlu ditandatangani ulang.",
  sendMalformed:
    "Wallet mengembalikan respons yang tidak bisa diverifikasi. " +
    "Tidak ada yang disiarkan.",
  historyUnavailable:
    "Riwayat tersimpan tidak bisa dibaca. Daftar ini mulai dari kosong.",
  historySaveFailed:
    "Riwayat tidak bisa disimpan di browser ini. Entri tetap terlihat sampai halaman dimuat ulang.",
  receivePlainLabel: "Alamat biasa",
  headline: "Apakah pool CashToken ini benar-benar hidup?",
  lede:
    "PoolProof memeriksa pool CashToken sebelum kamu memercayai angkanya. " +
    "Aplikasi ini membaca cadangan pool di Cauldron dan mensimulasikan " +
    "penjualan. Vonis berasal dari cadangan dan simulasi penjualan itu, " +
    "bukan dari angka likuiditas yang ditampilkan.",
  language: "Bahasa",
  languageLoadFailed:
    "Bahasa itu gagal dimuat. Bahasa sebelumnya masih ditampilkan.",
  skipToMain: "Lewati ke konten utama",
  snapshotsLabel: "Snapshot demo",
  reportLabel: "Laporan uji tuntas",
  caveat:
    "Laporan ini adalah pemeriksaan pada satu titik waktu. Cadangan dan " +
    "otoritas mint bisa berubah sesudahnya. Jalankan pemeriksaan lagi " +
    "sebelum kamu bertindak berdasarkan laporan ini.",
  summaryByVerdict: {
    ALIVE:
      "Hidup: cadangannya nyata dan simulasi jual keluar mendekati harga spot " +
      "(rasio keluar {ratio}).",
    RISKY:
      "Berisiko: simulasi jual hanya mempertahankan sebagian nilai spot " +
      "(rasio keluar {ratio}). Keluar bisa, tapi sebagian nilai hilang.",
    DEAD: "Mati: cadangannya debu. Posisi tidak bisa keluar dengan nilai yang berarti.",
    NO_MARKET: "Tidak ada pasar: token ini tidak punya pool aktif di Cauldron.",
    LYING_DISPLAY:
      "Tampilan berbohong: likuiditas yang ditampilkan jauh di atas cadangan aslinya.",
  },
  pools: "Pool Cauldron aktif",
  bchReserve: "Cadangan BCH (semua pool)",
  tokenReserve: "Cadangan {symbol} (semua pool)",
  referenceSell: "Jual referensi",
  referenceSellCap: "(maks 10% dari cadangan pool)",
  simulatedExit: "Simulasi keluar",
  exitOfSpot: "{out} BCH dari nilai spot {spot} BCH",
  exitNotSimulated: "tidak disimulasikan: cadangan saja sudah menentukan vonis ini",
  exitRouteFailed: "rute tidak bisa disimulasikan",
  exitRatio: "Rasio keluar",
  exitModel: "Model keluar",
  exitModelRouterQuote: "Kutipan langsung dari Router Cauldron",
  exitModelRoutedCpmm: "Simulasi CPMM terarah (milik sendiri)",
  exitModelAggregateCpmm: "Simulasi CPMM kurva tunggal (milik sendiri)",
  routedCrossCheck: "Simulasi terarah (cek silang)",
  gaugeReal: "Exit sebenarnya",
  gaugeDisplayed: "Pada harga spot (seperti ditampilkan)",
  gaugeReserve: "Cadangan BCH",
  gaugeDustLine: "Ambang debu",
  gaugeTickDead: "Garis mati",
  gaugeTickAlive: "Garis hidup",
  gaugeReserveNote:
    "Cadangan dibandingkan ambang debu. Di bawah garis itu, pool mati.",
  poolShareTitle: "Cadangan per pool",
  poolShareMore: "dan {count} pool lainnya",
  poolShareRow: "Pool {n}",
  stepPools: "Membaca pool",
  stepSimulate: "Menyimulasikan exit",
  stepIdentity: "Memastikan identitas",
  stepQuote: "Cek silang Router",
  stepSkipped: "Dilewati",
  stepIdentityMissing: "Tidak ada di daftar",
  stepQuoteUnavailable: "Tidak ada quote yang kembali",
  identity: "Identitas (BCMR)",
  identityVerified: "hash terverifikasi, dibaca dari {source}",
  identityNone: "tidak ada entri registry terverifikasi",
  decimals: "Desimal",
  anchorTitle: "Jangkar bukti",
  anchorBody:
    "Hash laporan ini, siap dibawa dalam transaksi mainnet Bitcoin Cash " +
    "sebagai output OP_RETURN. Siapa pun bisa memeriksa laporan terhadap " +
    "hash di transaksi itu.",
  anchorAction: "Jangkarkan laporan ini",
  anchorNeedsWallet:
    "Hubungkan wallet untuk menjangkarkan laporan ini di mainnet " +
    "BCH. Laporan tetap tampil di halaman ini selama kamu " +
    "menghubungkan wallet.",
  anchorNoFunds:
    "Penjangkaran butuh satu UTXO BCH polos senilai minimal " +
    "{sats} sats di wallet ini, untuk biaya dan kembalian di " +
    "atas debu. Belum ada yang tersedia.",
  anchorDone: "Sudah dijangkarkan di mainnet BCH.",
  anchorTampered:
    "Transaksi yang ditandatangani tidak cocok dengan jangkar " +
    "laporan ini. Transaksi tidak disiarkan.",
  hashing: "menghitung hash...",
  anchorLoadFailed: "Jangkar bukti gagal dimuat.",
  reportHash: "SHA-256 laporan",
  opReturnScript: "Skrip OP_RETURN",
  viewsLabel: "Tampilan",
  copyCategory: "Salin ID kategori",
  copyHash: "Salin hash laporan",
  downloadJson: "Unduh laporan (JSON)",
  copyLink: "Salin tautan bagikan",
  copied: "Tersalin",
  copyFailed: "Gagal menyalin. Salin nilainya secara manual.",
  downloaded: "Terunduh",
  downloadFailed: "Gagal mengunduh",
  retry: "Coba lagi",
  connectWallet: "Hubungkan wallet",
  walletConnecting: "Menunggu wallet...",
  walletConnected: "Terhubung · {name}",
  walletLoading: "Memuat wallet...",
  walletLoadFailed: "Wallet gagal dimuat. Muat ulang halaman untuk mencoba lagi.",
  disconnectWallet: "Putuskan",
  walletAddressMissing: "Terhubung, tetapi wallet belum membagikan alamat.",
  viewReport: "Tampilan laporan",
  viewScanner: "Tampilan pemindai",
  groupIdentity: "Identitas",
  groupSupply: "Pasokan & wewenang",
  groupExit: "Simulasi keluar",
  groupConcentration: "Konsentrasi",
  statusPass: "LULUS",
  statusWarn: "WASPADA",
  statusFail: "GAGAL",
  statusUnknown: "TAK DIKETAHUI",
  totalSupply: "Total pasokan",
  supplyStandInNote:
    "Total pasokan adalah nilai pengganti (10x cadangan token pool) sampai " +
    "sumber kedua tiba. Jual referensi tetap dihitung dari batas cadangan.",
  authorityUnknown:
    "Wewenang mint belum diperiksa. Angka pasokan ditampilkan. " +
    "Wewenang tidak diklaim.",
  concentrationUnknown:
    "Konsentrasi holder belum ada sumbernya. Ditampilkan sebagai " +
    "tidak diketahui, tidak pernah sebagai lulus.",
  walletBalance: "Saldo",
  walletDisconnectedHint:
    "Hubungkan wallet untuk melihat saldo, kepemilikan, dan riwayatmu.",
  actionSend: "Kirim",
  actionReceive: "Terima",
  actionHistory: "Riwayat",
  actionAudit: "Audit",
  sendTitle: "Pilih aset",
  sendAmount: "Jumlah",
  sendMax: "MAKS",
  sendKeypadBackspace: "Hapus",
  sendRecipient: "Penerima",
  sendRecipientPlaceholder: "Tempel alamat Bitcoin Cash",
  sendAddressToken: "Alamat pendukung token",
  sendAddressPlain: "Alamat biasa, hanya BCH",
  sendNetwork: "Jaringan: mainnet Bitcoin Cash",
  confirmTitle: "Konfirmasi pengiriman",
  confirmAsset: "Aset",
  confirmRecipient: "Penerima",
  confirmAmount: "Jumlah",
  confirmFee: "Biaya jaringan",
  confirmBalanceAfter: "Saldo sesudahnya",
  feeEstimateNote:
    "Biaya adalah perkiraan. Biaya final ditetapkan saat wallet menandatangani.",
  deliveryEstimate:
    "Siaran langsung seketika. Konfirmasi pertama sekitar 10 menit (perkiraan).",
  sendConfirm: "Konfirmasi dan kirim",
  sendCancel: "Batal",
  gateWrongNetwork: "Alamat ini bukan di mainnet Bitcoin Cash.",
  gateInvalidAddress:
    "Itu bukan alamat Bitcoin Cash yang valid. Periksa lagi, lalu coba lagi.",
  gateTokenToPlainAddress:
    "Alamat itu tidak bisa menampung token. Token yang dikirim ke sana " +
    "akan terlantar. Pakai alamat pendukung token.",
  gateAmountMissing: "Masukkan jumlah.",
  gateAmountInvalid:
    "Jumlah itu tidak bisa dibaca. Periksa angkanya, lalu coba lagi.",
  gateAmountZero: "Masukkan jumlah di atas nol.",
  gateAmountBelowDust:
    "Pengiriman minimum {dustSats} sats. Output yang lebih kecil adalah debu.",
  gateInsufficientBalance:
    "Saldo tidak cukup untuk jumlah ini ditambah biayanya.",
  gateInsufficientFeeBalance:
    "Saldo BCH tidak cukup untuk menutup biaya jaringan.",
  receiptTitle: "Kuitansi",
  receiptStatusBroadcast: "Disiarkan",
  receiptStatusConfirmed: "Terkonfirmasi",
  receiptStatusConfirmedCount: "Terkonfirmasi ({count})",
  receiptExplorer: "Lihat di explorer",
  copyTxid: "Salin ID transaksi",
  copyRecipient: "Salin penerima",
  copyAmount: "Salin jumlah",
  historyTitle: "Riwayat",
  historyEmpty: "Belum ada yang dikirim dari wallet ini.",
  historyShowAll: "Tampilkan semua {count} entri",
  historySent: "Terkirim",
  historyAnchored: "Dijangkarkan",
  receiveAddressLabel: "Alamat kamu",
  receiveTokenNote:
    "Alamat pendukung token. Aman untuk BCH, token, dan NFT.",
  receivePlainNote:
    "Alamat biasa, hanya BCH. Jangan kirim token ke alamat ini.",
  receiveQrCaption: "Kode QR alamat",
  holdingsTotal: "Total saldo",
  holdingsTokens: "Token",
  holdingsNfts: "NFT",
  holdingsCategory: "ID kategori",
  holdingsCommitment: "Komitmen",
  holdingsEmpty: "Belum ada BCH, token, atau NFT di wallet ini.",
  assetShowAll: "Tampilkan semua {count} aset",
  concGini: "Koefisien Gini",
  concTierWellDistributed: "Terdistribusi merata",
  concTierGood: "Baik",
  concTierFair: "Cukup",
  concTierPoor: "Buruk",
  concTierWhaleControlled: "Dikuasai whale",
  concTopHolder: "Holder terbesar",
  concTop10: "10 holder terbesar",
  concTopHolderSupply: "Holder terbesar (bagian dari pasokan)",
  concHhi: "HHI",
  concBasisListed: "Berdasarkan {count} holder terdaftar terbesar",
  concBasisFull: "Berdasarkan semua {count} holder",
  concUnavailable: "Tidak tersedia",
  liveCategoryLabel: "ID kategori",
  liveCategoryPlaceholder: "Tempel ID kategori 64 karakter",
  liveCategoryHint:
    "ID kategori adalah identitas sebuah CashToken. Salin dari halaman " +
    "tokennya di TokenStork atau block explorer. Snapshot demo di bawah " +
    "tidak butuh ID; salah satunya adalah PUSD.",
  liveAuditAction: "Audit langsung",
  liveCategoryInvalid:
    "ID kategori itu tidak valid. ID kategori tepat 64 karakter heksadesimal.",
  liveFetching: "Mengambil data pool langsung...",
  liveFetchFailed:
    "Pembacaan langsung gagal. Tidak ada vonis yang dihasilkan. " +
    "Periksa koneksi lalu coba lagi.",
  liveResultLabel: "Hasil langsung, diambil {time}",
  liveProvenance:
    "Pembacaan langsung dari indexer Cauldron (indexer.riften.net) " +
    "pada {time}. Nama, simbol, dan desimal belum ada sumbernya. " +
    "Jumlah adalah unit dasar mentah.",
  liveProvenanceIdentity:
    "Pembacaan langsung dari indexer Cauldron (indexer.riften.net) " +
    "pada {time}. Nama, simbol, dan desimal dari catatan TokenStork " +
    "untuk kategori ini.",
  liveUnnamed: "Token tanpa nama",
  notFoundTitle: "Kategori tidak ditemukan",
  notFoundBody:
    "Tidak ada CashToken dengan ID kategori ini yang ditemukan di " +
    "mainnet BCH. PoolProof sudah memeriksa Cauldron Indexer dan " +
    "TokenStork, dan kedua sumber itu tidak punya catatan tentang " +
    "kategori ini.",
  notFoundHint:
    "ID kategori tidak punya checksum, jadi satu karakter yang " +
    "salah menunjuk ke token yang berbeda, atau ke token yang " +
    "tidak ada sama sekali. Periksa lagi ID-nya lalu coba lagi.",
  notFoundAction: "Periksa kategori lain",
  signPromptAnchor:
    "Jangkar hash laporan PoolProof ini di mainnet Bitcoin Cash?",
  signPromptSend:
    "Tandatangani pengiriman ini di wallet kamu untuk menyiarkannya.",
  signRejected:
    "Wallet menolak permintaan tanda tangan. Tidak ada yang terkirim.",
  toastSent: "Terkirim {amount} {asset}",
  toastConfirmed: "{amount} {asset} terkonfirmasi",
  toastAnchorConfirmed: "Jangkar laporan terkonfirmasi",
  toastReceived: "Diterima {amount} BCH",
  toastDismiss: "Tutup notifikasi",
  aboutTitle: "Tentang PoolProof",
  aboutWhat:
    "PoolProof memeriksa apakah pool CashToken benar-benar bisa " +
    "membayarkanmu. Ia membaca cadangan asli pool dan " +
    "mensimulasikan penjualannya, jadi vonisnya bertumpu pada " +
    "hasil keluar yang sebenarnya, bukan pada angka likuiditas " +
    "yang ditampilkan.",
  aboutHowTitle: "Bagaimana vonis dicapai",
  aboutHow:
    "Audit ini mengunci identitas dan pasokan token ke ID " +
    "kategori yang persis lebih dulu, supaya token yang mirip " +
    "tidak bisa menggantikannya. Cadangan Cauldron dibaca " +
    "langsung, dan penjualan referensi (yang lebih kecil antara " +
    "1% pasokan atau 10% cadangan pool) disimulasikan melewati " +
    "tiap pool token itu satu per satu. Jika Router milik venue " +
    "mengembalikan kutipan yang tidak lebih besar dari cadangan " +
    "yang benar-benar dipegang pool-pool itu, kutipan tersebut " +
    "memeriksa silang hasil simulasi. Vonis mengikuti rasio " +
    "keluar, yaitu porsi nilai spot yang dipertahankan " +
    "penjualan: di bawah 0,010 jalan keluarnya mati, di 0,800 " +
    "atau di atasnya jalan keluar itu bertahan. Jika ada lebih " +
    "dari satu angka, kutipan Router yang memutuskan lebih " +
    "dulu, lalu simulasi ter-routing, lalu simulasi kurva " +
    "tunggal.",
  aboutVerdictsTitle: "Lima vonis",
  aboutAnchor:
    "Laporan bisa disegel di rantai. PoolProof meng-hash berkas " +
    "laporan persis seperti yang kamu unduh, dan wallet yang " +
    "kamu hubungkan membawa hash itu ke mainnet Bitcoin Cash " +
    "dalam output OP_RETURN. Siapa pun yang memegang berkasnya " +
    "bisa meng-hash dan membandingkan hasilnya dengan hash di " +
    "transaksi, jadi laporan yang diubah tidak bisa lolos " +
    "sebagai aslinya.",
  aboutSourcesTitle: "Dari mana datanya berasal",
  aboutSources:
    "Data pool berasal dari indexer Cauldron yang dijalankan " +
    "Riften. Identitas token berasal dari metadata BCMR, " +
    "diperiksa silang dengan TokenStork. Saldo wallet dibaca " +
    "dari server Electrum publik. Setiap angka dalam laporan " +
    "dibaca saat audit berjalan, tidak dibawa dari kunjungan " +
    "sebelumnya.",
  aboutLimitsTitle: "Batasnya",
  aboutLimits:
    "Laporan adalah pemeriksaan pada satu titik waktu. " +
    "Cadangan dan otoritas mint bisa berubah sesudahnya. " +
    "Jalankan pemeriksaan lagi sebelum kamu bertindak " +
    "berdasarkan laporan ini. Keluar hasil simulasi dihitung " +
    "dari cadangan pada saat itu. Itu perkiraan, bukan harga " +
    "eksekusi yang dijamin. PoolProof tidak pernah memegang " +
    "kunci, dana, atau akun. Penandatanganan selalu terjadi di " +
    "wallet milikmu sendiri, dan tidak ada yang bergerak tanpa " +
    "tanda tangan itu.",
  aboutBuilt: "PoolProof adalah karya solo, dibuat untuk BCH BLAZE 2026.",
  navCheck: "Periksa",
  navWallet: "Dompet",
  navAbout: "Tentang",
};

export const flags: Record<FlagCode, string> = {
  TOKEN_UNREADABLE: "pembacaan identitas dan pasokan token gagal",
  NO_POOL: "tidak ada pool Cauldron lawan BCH: tidak ada pasar untuk menjual",
  DUST_RESERVE: "cadangan quote hanya {reserveSats} sats (ambang debu {dustSats})",
  DISPLAYED_LIQUIDITY_LIES:
    "likuiditas tampil ${displayedUsd}, tapi cadangan asli mengimplikasikan " +
    "sekitar ${realUsd} (di bawah 1% dari klaim)",
  EXIT_WORTHLESS:
    "simulasi jual mengembalikan {ratio} dari nilai spot: keluar tidak bernilai",
  EXIT_LEAKS_VALUE:
    "simulasi jual hanya mempertahankan {ratio} dari nilai spot " +
    "(biaya dan/atau dampak harga)",
  ROUTE_UNSIMULATED: "cadangan ada, tapi rute jual tidak bisa disimulasikan",
  ROUTE_QUOTE_IMPLAUSIBLE:
    "kutipan router dari venue sebesar {quoteSats} sats mustahil untuk pool " +
    "yang total cadangannya {reserveSats} sats, jadi vonis memakai simulasi exit",
};

export default strings;
