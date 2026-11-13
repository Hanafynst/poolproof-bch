import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "Presentasi",
  source: "Sumber",
  ember: "Tip EMBER2026: alamat muncul bersama dompet yang terhubung",
  headline: "Apakah pool CashToken ini benar-benar hidup?",
  lede:
    "PoolProof membaca cadangan asli pool di Cauldron dan mensimulasikan penjualan " +
    "sebelum memercayai angka apa pun. Angka likuiditas yang ditampilkan itu rumor; " +
    "cadangan plus simulasi keluar adalah kebenarannya.",
  language: "Bahasa",
  currency: "Mata uang",
  languageLoadFailed: "Bahasa itu gagal dimuat — masih menampilkan bahasa sebelumnya.",
  snapshotsLabel: "Snapshot demo",
  reportLabel: "Laporan uji tuntas",
  caveat:
    "Pemeriksaan pada satu waktu — cadangan atau otoritas mint bisa berubah sesudah " +
    "laporan ini. Jalankan ulang pemeriksaan sebelum bertindak.",
  summaryByVerdict: {
    ALIVE:
      "Hidup: cadangannya nyata dan simulasi jual keluar mendekati harga spot " +
      "(rasio keluar {ratio}).",
    RISKY:
      "Berisiko: simulasi jual hanya mempertahankan sebagian nilai spot " +
      "(rasio keluar {ratio}) — keluar bisa, tapi sebagian nilai hilang.",
    DEAD: "Mati: cadangannya debu — posisi praktis tidak bisa keluar dengan nilai berarti.",
    NO_MARKET: "Tidak ada pasar: token ini tidak punya pool aktif di Cauldron.",
    LYING_DISPLAY:
      "Tampilan berbohong: likuiditas yang ditampilkan jauh melampaui cadangan aslinya.",
  },
  pools: "Pool Cauldron aktif",
  bchReserve: "Cadangan BCH (semua pool)",
  tokenReserve: "Cadangan {symbol} (semua pool)",
  referenceSell: "Jual referensi",
  referenceSellCap: "(dibatasi 10% dari cadangan pool)",
  simulatedExit: "Simulasi keluar",
  exitOfSpot: "{out} BCH dari nilai spot {spot} BCH",
  exitNotSimulated: "tidak disimulasikan — cadangan saja sudah menentukan vonis ini",
  exitRouteFailed: "rute tidak bisa disimulasikan",
  exitRatio: "Rasio keluar",
  identity: "Identitas (BCMR)",
  identityVerified: "hash terverifikasi, dibaca dari {source}",
  identityNone: "tidak ada entri registry terverifikasi",
  decimals: "Desimal",
  anchorTitle: "Jangkar bukti",
  anchorBody:
    "Hash laporan ini, siap dibawa dalam transaksi mainnet Bitcoin Cash sebagai output " +
    "OP_RETURN — bisa diverifikasi siapa pun, selamanya.",
  hashing: "menghitung hash…",
  anchorLoadFailed: "Jangkar bukti gagal dimuat.",
  reportHash: "SHA-256 laporan",
  opReturnScript: "Skrip OP_RETURN",
  viewsLabel: "Tampilan",
  copyCategory: "Salin ID kategori",
  copyHash: "Salin hash laporan",
  downloadJson: "Unduh laporan (JSON)",
  copyLink: "Salin tautan bagikan",
  copied: "Tersalin",
  copyFailed: "Gagal menyalin — salin nilainya secara manual",
  downloaded: "Terunduh",
  downloadFailed: "Gagal mengunduh",
  retry: "Coba lagi",
  connectWallet: "Hubungkan wallet",
  walletConnecting: "Menunggu wallet…",
  walletConnected: "Terhubung · {name}",
  walletLoading: "Memuat wallet…",
  walletLoadFailed: "Wallet gagal dimuat — muat ulang halaman untuk mencoba lagi",
  disconnectWallet: "Putuskan",
  walletAddressMissing: "Terhubung, tetapi wallet belum membagikan alamat.",
  viewReport: "Tampilan laporan",
  viewScanner: "Tampilan pemindai",
  groupIdentity: "Identitas",
  groupSupply: "Pasokan & wewenang",
  groupExit: "Kebenaran exit",
  groupConcentration: "Konsentrasi",
  statusPass: "LULUS",
  statusWarn: "WASPADA",
  statusFail: "GAGAL",
  statusUnknown: "TAK DIKETAHUI",
  totalSupply: "Total pasokan",
  supplyStandInNote:
    "Total pasokan adalah nilai pengganti (10x cadangan token pool) sampai " +
    "sumber kedua tiba — jual referensi tetap dihitung dari batas cadangan.",
  authorityUnknown:
    "Wewenang mint belum diperiksa — angka pasokan ditampilkan, " +
    "wewenang tidak diklaim.",
  concentrationUnknown:
    "Konsentrasi holder belum ada sumbernya — ditampilkan sebagai " +
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
  sendRecipient: "Penerima",
  sendRecipientPlaceholder: "Tempel alamat Bitcoin Cash",
  sendAddressToken: "Alamat pendukung token",
  sendAddressPlain: "Alamat biasa — hanya BCH",
  sendNetwork: "Jaringan: mainnet Bitcoin Cash",
  confirmTitle: "Konfirmasi pengiriman",
  confirmAsset: "Aset",
  confirmRecipient: "Penerima",
  confirmAmount: "Jumlah",
  confirmFee: "Biaya jaringan",
  confirmBalanceAfter: "Saldo sesudahnya",
  feeEstimateNote:
    "Biaya adalah perkiraan — biaya final ditetapkan saat wallet menandatangani.",
  deliveryEstimate:
    "Terkirim seketika · konfirmasi pertama ±10 menit (perkiraan)",
  sendConfirm: "Konfirmasi dan kirim",
  sendCancel: "Batal",
  gateWrongNetwork: "Alamat ini bukan di mainnet Bitcoin Cash.",
  gateInvalidAddress:
    "Itu bukan alamat Bitcoin Cash yang valid — periksa lagi, lalu coba lagi.",
  gateTokenToPlainAddress:
    "Alamat itu tidak bisa menampung token — tokennya akan terlantar. " +
    "Pakai alamat pendukung token.",
  gateAmountMissing: "Masukkan jumlah.",
  gateAmountInvalid:
    "Jumlah itu tidak bisa dibaca — periksa angkanya, lalu coba lagi.",
  gateAmountZero: "Masukkan jumlah di atas nol.",
  gateAmountBelowDust:
    "Pengiriman minimum {dustSats} sats — output yang lebih kecil adalah debu.",
  gateInsufficientBalance:
    "Saldo tidak cukup untuk jumlah ini ditambah biayanya.",
  gateInsufficientFeeBalance:
    "Saldo BCH tidak cukup untuk menutup biaya jaringan.",
  receiptTitle: "Kuitansi",
  receiptStatusBroadcast: "Disiarkan",
  receiptStatusConfirmed: "Terkonfirmasi",
  receiptExplorer: "Lihat di explorer",
  copyTxid: "Salin ID transaksi",
  copyRecipient: "Salin penerima",
  copyAmount: "Salin jumlah",
  historyTitle: "Riwayat",
  historyEmpty: "Belum ada yang dikirim dari wallet ini.",
  historySent: "Terkirim",
  receiveAddressLabel: "Alamat kamu",
  receiveTokenNote:
    "Alamat pendukung token — aman untuk BCH, token, dan NFT.",
  receivePlainNote:
    "Alamat biasa — hanya BCH. Jangan kirim token ke alamat ini.",
  receiveQrCaption: "Kode QR alamat",
  holdingsTotal: "Total saldo",
  holdingsTokens: "Token",
  holdingsNfts: "NFT",
  holdingsCategory: "ID kategori",
  holdingsCommitment: "Komitmen",
  holdingsEmpty: "Belum ada BCH, token, atau NFT di wallet ini.",
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
  liveAuditAction: "Audit langsung",
  liveCategoryInvalid:
    "ID kategori itu tidak valid — kategori tepat 64 karakter " +
    "heksadesimal.",
  liveFetching: "Mengambil data pool langsung…",
  liveFetchFailed:
    "Pembacaan langsung gagal — tidak ada vonis yang dihasilkan. " +
    "Periksa koneksi lalu coba lagi.",
  liveResultLabel: "Hasil langsung — diambil {time}",
  liveProvenance:
    "Pembacaan langsung dari indexer Cauldron (indexer.riften.net) " +
    "pada {time}. Nama, simbol, dan desimal belum ada sumbernya — " +
    "jumlah adalah unit dasar mentah.",
  liveProvenanceIdentity:
    "Pembacaan langsung dari indexer Cauldron (indexer.riften.net) " +
    "pada {time}. Nama, simbol, dan desimal dari catatan TokenStork " +
    "untuk kategori ini.",
  liveUnnamed: "Token tanpa nama",
  signPromptAnchor:
    "Jangkar hash laporan PoolProof ini di mainnet Bitcoin Cash?",
  signPromptSend:
    "Tandatangani pengiriman ini di wallet kamu untuk menyiarkannya.",
  signRejected:
    "Wallet menolak permintaan tanda tangan — tidak ada yang terkirim.",
};

export const flags: Record<FlagCode, string> = {    TOKEN_UNREADABLE: "pembacaan identitas/pasokan token gagal",
    NO_POOL: "tidak ada pool Cauldron lawan BCH — tidak ada pasar untuk menjual",
    DUST_RESERVE: "cadangan quote hanya {reserveSats} sats (ambang debu {dustSats})",
    DISPLAYED_LIQUIDITY_LIES:
      "likuiditas tampil ${displayedUsd}, tapi cadangan asli mengimplikasikan " +
      "~${realUsd} (<1% dari klaim)",
    EXIT_WORTHLESS:
      "simulasi jual hanya mengembalikan {ratio} dari nilai spot — keluar tidak bernilai",
    EXIT_LEAKS_VALUE:
      "simulasi jual hanya mempertahankan {ratio} dari nilai spot " +
      "(biaya dan/atau dampak harga)",
    ROUTE_UNSIMULATED: "cadangan ada, tapi rute jual tidak bisa disimulasikan",};

export default strings;
