# Catatan Cek Dokumentasi Base

## 19 Oktober 2026 (Fase 1)

Hasil cek docs.base.org. Ada beberapa perbedaan dengan MASTER_PLAN.

### Program pendanaan (https://docs.base.org/get-started/builders)
- **Grant Program:** hingga **$5.000** + dukungan GTM/produk, lewat **formulir pendaftaran per cohort**
  (bukan otomatis/retroaktif seperti tertulis di rencana). Fokus yang disebut antara lain
  "consumer apps focused on transaction growth". App edukasi kita masuk ke kategori ini.
- **Builder Codes** disebut sebagai *langkah pertama agar memenuhi syarat grant*.
  → Wajib dipasang di app pada Fase 3. https://docs.base.org/specifications/builder-codes/overview
- **Builder Quests:** tantangan berkala dengan hadiah (pantau @buildonbase di X).
- **Regional Amplification:** formulir agar launch kita dibagikan akun regional Base.
- **Circuit Accelerator:** akselerator Asia Tenggara (pihak ketiga).
- "Builder Rewards 2 ETH/minggu" **tidak disebut lagi** di halaman ini. Anggap belum pasti ada.

### Mini App
- MiniKit dan OnchainKit masih didokumentasikan, tapi halamannya berpindah-pindah
  (sebagian di bawah "Base App"). Cek ulang tepat sebelum Fase 3.

### Faucet testnet
- Docs Base merujuk ke halaman faucet + Circle faucet (USDC): https://faucet.circle.com
- Untuk ETH testnet: faucet Coinbase Developer Platform (perlu akun CDP, yang memang kita buat di Fase 1).

## 19 Oktober 2026 (awal Fase 3) — PERUBAHAN BESAR

- **Mini App sudah bukan jalur yang didukung.** Sejak 9 April 2026, Base App memperlakukan semua app
  sebagai *web app biasa* (manifest Farcaster diabaikan). Pada 10 September 2026 "Base App" kembali
  bernama **Coinbase Wallet** dan fokus ke trading.
  → App kita dibuat sebagai **web app biasa + koneksi wallet**, mobile-first. Tetap bisa dibuka dari
  browser di dalam Coinbase Wallet/Rabby/MetaMask.
- **OnchainKit deprecated** (repo diarsip 22 Sep 2026). → Pakai **wagmi + viem** langsung.
- **Base Account SDK** pindah ke CDP dengan nama **Coinbase Wallet SDK**
  (https://docs.cdp.coinbase.com/coinbase-wallet/overview).
- **CDP Paymaster masih ada**, mendukung Base Mainnet & Sepolia, tapi **hanya untuk smart account**
  (atau EOA yang di-upgrade EIP-7702). Biaya: gas yang disponsori + 7%. Bisa daftar kredit gas
  (hingga $15K, "Base Gasless Campaign"). Ada allowlist kontrak, limit per user, dan batas belanja global.
  Dipakai lewat `wallet_sendCalls` (EIP-5792) dengan capability `paymasterService`.
- **Native sponsorship Base (Base Transactions)** belum aktif. Menunggu upgrade "Everest", tanggal belum ada.
- **Builder Codes:** `ox/erc8021` → `Attribution.toDataSuffix({ codes: [...] })`. Di wagmi dipasang per call
  (`dataSuffix`), atau di capability `useSendCalls`. viem ≥ 2.45.0. Kode didapat di Base Dashboard.

Sumber: docs.base.org/mini-apps/troubleshooting/base-app-compatibility, github.com/coinbase/onchainkit,
docs.cdp.coinbase.com/paymaster, docs.base.org/specifications/base-transactions,
docs.base.org/specifications/builder-codes/for-app-developers

## 19 Oktober 2026 — temuan saat uji claim
- **Base Account / Coinbase Smart Wallet (keys.coinbase.com) menolak Base Sepolia**: "This chain is not supported".
  Gas-free via paymaster hanya bisa diuji di Base Mainnet. Di testnet, opsi Base Account disembunyikan.
- **Coinbase Wallet (Blockaid) menandai `belajar-onchain.vercel.app` sebagai berbahaya** (false positive).
  Perlu lapor ke https://report.blockaid.io/mistake. Sumber: docs.base.org/base-chain/security/avoid-malicious-flags
