# MASTER PLAN — "BelajarOnchain"
### Base Mini App edukasi kripto berbahasa Indonesia + Grant Radar Agent

> **Untuk Claude CLI:** Baca seluruh dokumen ini dulu. Kerjakan fase demi fase, jangan loncat.
> Pemilik project ini **pemula, belum bisa coding**. Jelaskan setiap langkah dengan bahasa Indonesia yang sederhana,
> minta konfirmasi sebelum hal yang memakan uang/permanen, dan **selalu cek dokumentasi terbaru**
> (https://docs.base.org) sebelum menulis kode, karena tools Base cepat berubah.

---

## 0. Kenapa project ini (ringkasan untuk pemilik)

**Idenya:** aplikasi kecil di jaringan Base (milik Coinbase). Isinya kuis kripto harian 5 soal berbahasa Indonesia.
Pengguna yang menyelesaikan kuis mendapat **badge digital (NFT) gratis**, dan biaya gas ditanggung aplikasi.

**Kenapa ini yang paling worth it:**
1. **Base membayar builder.** Ada Builder Rewards (hingga 2 ETH/minggu untuk builder teratas) dan Base Builder Grants
   (~1–5 ETH, retroaktif, tanpa proposal). Yang dinilai adalah **app yang benar-benar jalan dan dipakai**.
2. **Tidak memegang uang orang lain.** Tidak ada deposit dan tidak ada pembayaran, jadi risiko hukum di Indonesia kecil.
   (Di Indonesia, kripto bukan alat pembayaran yang sah. Karena itu app ini sengaja tidak menyentuh pembayaran.)
3. **Aktivitasnya nyata dan sah.** Pengguna sungguhan belajar lalu claim badge. Ini aman dari deteksi sybil.
4. **Biaya awal kecil:** sekitar $20–60 untuk 3 bulan pertama (lihat bagian 8).
5. **Bisa dipakai ulang untuk grant lain** (BNB Chain, Optimism Retro Funding, dan lain-lain) setelah app terbukti jalan.

**Jujur soal hasil:** tidak ada jaminan dapat uang. Skenario realistis:
- Buruk: $0, tapi Anda punya portofolio dan pengalaman.
- Sedang: 1 grant kecil (~1–2 ETH) dalam 3–6 bulan.
- Bagus: grant + builder rewards rutin + peluang grant ekosistem lain.

---

## 1. Aturan keamanan (WAJIB, Claude CLI harus patuh)

1. **Private key tidak boleh ditulis di kode, tidak boleh di-commit ke GitHub, dan tidak boleh dikirim ke chat.**
   Simpan hanya di file `.env`, dan file itu harus ada di `.gitignore` sejak commit pertama.
2. Pakai **wallet khusus deployer** yang terpisah dari wallet pribadi. Isi saldonya secukupnya saja (maks ~$30 ETH di Base).
3. Kerjakan semuanya di **Base Sepolia (testnet)** dulu. Pindah ke mainnet hanya setelah pemilik bilang "lanjut mainnet".
4. Smart contract harus sederhana: tanpa fungsi withdraw dana user dan tanpa upgradeable proxy. Pakai OpenZeppelin.
5. Pemilik sendiri yang melakukan: KYC, submit grant final, transfer dana, dan pencairan ke rupiah.
6. **Dilarang** membuat wallet palsu atau transaksi palsu untuk "meramaikan" app. Itu sybil, yang bisa membatalkan reward.

---

## 2. Tech stack

| Bagian | Pilihan | Catatan |
|---|---|---|
| Smart contract | Solidity + **Foundry** + OpenZeppelin | ERC-1155 soulbound badge (tidak bisa dipindahtangankan) |
| Jaringan | Base Sepolia → Base Mainnet | |
| Frontend | **Next.js + OnchainKit / MiniKit** (cek nama & versi terbaru di docs.base.org) | Dibuat sebagai Base Mini App |
| Gas gratis untuk user | Paymaster (Coinbase Developer Platform) | Cek kuota gratis terbaru |
| Hosting | Vercel (gratis) | |
| Konten kuis | Script Python/Node yang memanggil Claude API | Draf soal dibuat AI, lalu direview pemilik |
| Database ringan | File JSON di repo / Vercel KV | Simpan soal per tanggal |
| Repo | GitHub publik, lisensi MIT | Aktivitas GitHub ikut dinilai di program builder |
| Grant Radar | Script terjadwal + ringkasan ke Telegram/email | Fase 6 |

---

## 3. FASE 1 — Persiapan (Hari 1–3)

**Yang dikerjakan pemilik (Claude CLI memandu langkah demi langkah):**
- [ ] Buat akun GitHub.
- [ ] Install: Node.js LTS, Git, Foundry, VS Code.
- [ ] Buat wallet baru (Coinbase Wallet / Rabby) khusus untuk project ini. Catat seed phrase **di kertas**, bukan di komputer.
- [ ] Ambil ETH testnet Base Sepolia dari faucet (Claude CLI carikan faucet yang masih aktif).
- [ ] Buat akun Coinbase Developer Platform (untuk API key & paymaster).
- [ ] Buat akun Vercel (login pakai GitHub).
- [ ] Buat API key Claude (console.anthropic.com), isi saldo kecil ($5–10).

**Claude CLI:**
- [ ] Buat struktur folder:
```
belajar-onchain/
├── contracts/        # Foundry project
├── app/              # Next.js mini app
├── content/          # soal kuis JSON per tanggal
├── scripts/          # generator kuis + grant radar
├── docs/             # catatan, metrik, draf proposal grant
├── .env.example
├── .gitignore
└── README.md         # bilingual ID/EN
```
- [ ] Inisialisasi git, `.gitignore` (wajib berisi `.env`, `node_modules`, `out`, `cache`, `broadcast`).

**Selesai bila:** repo sudah ada di GitHub, `.env` tidak ikut ter-push, dan wallet testnet sudah punya saldo.

---

## 4. FASE 2 — Smart Contract Badge (Hari 4–7)

**Spesifikasi `BelajarBadge.sol`:**
- ERC-1155, **soulbound**: override fungsi transfer sehingga transfer antar alamat ditolak (mint tetap boleh).
- `tokenId` = nomor badge/level, misalnya 1 = "Pemula Onchain", 2 = "7 Hari Beruntun", 3 = "30 Hari Beruntun".
- Fungsi `claim(tokenId, signature)`: mint hanya bisa terjadi bila ada **tanda tangan dari server** (signer wallet terpisah).
  Tanda tangan itu membuktikan user sudah lulus kuis, sehingga orang tidak bisa mint langsung tanpa mengerjakan kuis.
- Satu alamat hanya bisa claim tokenId yang sama satu kali.
- `owner` bisa: menambah badge baru (URI metadata) dan mengganti alamat signer. **Tidak ada** fungsi yang menyentuh dana user.
- Metadata & gambar badge: sederhana, buatan sendiri (SVG di IPFS atau di-host di Vercel).

**Tes (Foundry):** claim valid berhasil, claim tanpa/dengan signature palsu gagal, claim dobel gagal, transfer gagal.

**Deploy:** ke Base Sepolia, lalu verifikasi kontrak di Basescan.

**Selesai bila:** semua tes lulus, kontrak terverifikasi di Sepolia, dan pemilik bisa claim badge uji dari terminal.

---

## 5. FASE 3 — Mini App (Hari 8–18)

**Halaman/fitur:**
1. **Beranda:** kuis hari ini (5 soal pilihan ganda), streak harian, tombol "Hubungkan wallet".
2. **Kuis:** jawab soal, tampilkan penjelasan singkat setelah tiap jawaban.
3. **Lulus (≥4/5 benar):** server memverifikasi jawaban, membuat signature, user menekan "Claim Badge", lalu transaksi
   dikirim **gas-free lewat paymaster**.
4. **Profil:** badge yang dimiliki dan streak.
5. **Leaderboard mingguan** (opsional di versi 1).

**Aturan teknis:**
- Kunci jawaban **tidak boleh** dikirim ke browser. Verifikasi dilakukan di API route server.
- Signer private key disimpan hanya di environment variable Vercel.
- Batasi claim per alamat per hari (rate limit) agar paymaster tidak dikuras bot.
- Bahasa utama Indonesia, dengan toggle English.
- Tampil baik di HP, karena mayoritas pengguna membuka dari HP.

**Selesai bila:** app jalan di Vercel memakai Sepolia, dan 3–5 teman bisa mencoba kuis lalu claim badge tanpa membayar gas.

---

## 6. FASE 4 — Mesin Konten AI (Hari 15–20)

Script `scripts/generate_quiz.(py|ts)`:
- Memanggil Claude API untuk membuat 5 soal/hari tentang dasar kripto & keamanan: wallet, seed phrase, cara mengenali scam,
  apa itu gas, apa itu L2, regulasi OJK secara umum, dan sejenisnya.
- **Larangan konten:** tidak ada rekomendasi beli koin, prediksi harga, atau "shill" proyek tertentu.
- Output: `content/YYYY-MM-DD.json` berisi soal, opsi, jawaban, dan penjelasan.
- Script membuat 7 hari sekaligus sebagai **draf**. Pemilik me-review di file, lalu commit.
  (Review manusia penting, karena AI bisa salah fakta.)
- Opsional: GitHub Action mingguan yang otomatis membuka Pull Request berisi draf soal minggu depan,
  sehingga pemilik tinggal review & merge.

**Selesai bila:** stok soal untuk 14 hari ke depan sudah siap dan direview.

---

## 7. FASE 5 — Mainnet, Peluncuran & Pertumbuhan (Minggu 4–12)

**Mainnet:**
- [ ] Pemilik konfirmasi "lanjut mainnet".
- [ ] Deploy kontrak ke Base Mainnet, verifikasi di Basescan, lalu atur paymaster mainnet dengan **batas biaya harian**.
- [ ] Daftarkan/publikasikan sebagai Base Mini App (ikuti panduan terbaru di docs.base.org).

**Cari pengguna nyata (gratis):**
- Bagikan di komunitas kripto Indonesia (Telegram, X, Discord), grup kampus, dan komunitas Web3 lokal.
- Posting harian di X: "Soal hari ini: …" + link app. Claude bisa membuat draf postingannya.
- Ajak komunitas/kampus memakai kuis untuk kelas pengenalan kripto.

**Catat metrik setiap minggu di `docs/metrics.md`:**
pengguna unik, jumlah claim badge, user yang kembali (streak), dan jumlah transaksi onchain.
Angka-angka ini adalah **bahan utama untuk grant**.

**Jaga aktivitas builder:** commit rutin ke GitHub (fitur kecil, perbaikan, dan konten), karena keaktifan builder ikut dinilai.

---

## 8. FASE 6 — Grant Radar Agent & Pengajuan Dana (mulai Minggu 6)

**Script `scripts/grant_radar`** (jalan otomatis seminggu sekali):
- Mengumpulkan info terbaru dari: halaman funding Base (docs.base.org), Optimism Retro Funding, BNB Chain builder programs,
  Gitcoin, dan daftar grant Web3 lainnya.
- Menyaring program yang cocok untuk: app edukasi / consumer app / public goods / Asia-Pasifik.
- Mengirim ringkasan (nama program, deadline, nominal, syarat, link) ke Telegram atau email pemilik.

**Pengajuan (draf oleh Claude, submit oleh pemilik):**
1. **Base Builder Grants & Builder Rewards:** pastikan profil builder dan app terdaftar sesuai panduan terbaru Base.
2. **Optimism Retro Funding:** cek ronde yang sedang buka. Kategori edukasi / onboarding user baru biasanya relevan.
3. **Grant ekosistem lain** (BNB Chain, dll.) bila program mengizinkan app multi-chain. Cukup deploy ulang kontrak yang sama.

Template draf proposal (`docs/grant_template.md`): masalah (literasi kripto rendah & banyak penipuan di Indonesia),
solusi, metrik nyata, roadmap 3 bulan, kebutuhan dana, dan link repo/app/kontrak.

---

## 9. Estimasi biaya (3 bulan pertama)

| Item | Perkiraan |
|---|---|
| Domain (opsional) | $0–12 |
| Vercel, GitHub, Foundry | $0 |
| Gas deploy mainnet Base | ~$1–5 |
| Paymaster (gas user) | $0–20 (sebagian sering tercover kredit gratis, cek terbaru) |
| Claude API untuk generate soal | ~$5–15 |
| **Total** | **~$10–50** |

---

## 10. Pencairan dana

1. Grant/reward biasanya diterima dalam ETH/USDC di Base, ke wallet project.
2. Pemilik memindahkannya **sendiri** ke exchange kripto yang **terdaftar & diawasi OJK** (cek daftar resminya).
3. Jual ke rupiah, lalu tarik ke rekening bank atas nama sendiri.
4. Catat setiap pemasukan (tanggal, jumlah, kurs) di `docs/keuangan.md` untuk pajak.
   Konfirmasi aturan pajak terbaru ke DJP/konsultan.
5. Sisihkan sebagian untuk biaya operasional app bulan berikutnya.

---

## 11. Checklist kapan harus berhenti / ganti arah

- Minggu 8: < 50 pengguna unik → ubah strategi promosi atau topik konten, jangan tambah fitur dulu.
- Minggu 12: belum ada grant sama sekali → minta Claude menganalisis feedback grant dan ekosistem alternatif.
- Biaya paymaster melonjak tidak wajar → kemungkinan diserang bot. Matikan sementara dan perketat rate limit.

---

## 12. Prompt pembuka untuk Claude CLI

Tempel ini di sesi pertama:

```
Saya pemula dan belum bisa coding. Baca MASTER_PLAN.md di folder ini.
Pandu saya mengerjakan FASE 1 langkah demi langkah dalam bahasa Indonesia.
Sebelum menulis kode apa pun, cek dokumentasi terbaru Base (docs.base.org).
Ikuti semua aturan di bagian "Aturan keamanan". Jangan pernah meminta saya
menempelkan private key atau seed phrase ke chat.
Setelah tiap fase selesai, beri ringkasan singkat dan tanya apakah lanjut.
```
