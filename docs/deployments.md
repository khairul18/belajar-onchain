# Deployments

## Base Sepolia (testnet) — 19 Oktober 2026

| | |
|---|---|
| Kontrak `BelajarBadge` | [`0x8A67CF07d95d49f019FC3572A198A61De1818895`](https://sepolia.basescan.org/address/0x8a67cf07d95d49f019fc3572a198a61de1818895) (terverifikasi Basescan + Sourcify) |
| Owner (deployer) | `0xC0da95A27e460F79a57Cfe2ECBE462b8B86F41B6` |
| Signer server | `0x3bc8F361C906A9E390432bB4255AF02760ff4681` |
| Tx deploy | [`0x573ea932…`](https://sepolia.basescan.org/tx/0x573ea93204b1022fc99a426f6c5c91247be8e7161f510af3f5a4e1647f92f207) |
| Uji claim badge #1 | [`0xdb1d6ad5…`](https://sepolia.basescan.org/tx/0xdb1d6ad5b50ebf161e1dbde0778b701b9c8d514bd1d9c03a8b89c85afd55accb) |
| Biaya total | ~0.0000133 ETH (testnet) |

Badge: 1 = Pemula Onchain, 2 = 7 Hari Beruntun, 3 = 30 Hari Beruntun.
Metadata sementara di GitHub raw (`app/public/badges/`), bisa dipindah ke domain Vercel lewat `setBadge`.

## Web app (Vercel)

| | |
|---|---|
| URL produksi | https://belajar-onchain.vercel.app |
| Project Vercel | `exssis/belajar-onchain` (root directory `app`, auto-deploy dari GitHub `main`) |
| Database | Upstash Redis `belajar-onchain-redis` (via Vercel Marketplace) |
| Jaringan | Base Sepolia |

## Base Mainnet

Belum. Menunggu konfirmasi pemilik ("lanjut mainnet").
