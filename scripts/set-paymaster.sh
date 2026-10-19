#!/usr/bin/env bash
# Simpan CDP Paymaster Endpoint URL ke Vercel + app/.env.local tanpa menampilkannya.
set -euo pipefail
cd "$(dirname "$0")/.."

printf 'Tempel Paymaster Endpoint URL lalu tekan Enter: '
read -rs P
echo

if [[ "$P" != https://*coinbase.com/* ]]; then
  echo "Format URL tidak dikenali (harus https://...coinbase.com/...). Jalankan ulang."
  exit 1
fi

for e in production preview; do
  printf '%s' "$P" | vercel env add PAYMASTER_URL "$e" --sensitive --force >/dev/null 2>&1 \
    && echo "Tersimpan di Vercel ($e)" || echo "GAGAL menyimpan ke Vercel ($e)"
done

if grep -q '^PAYMASTER_URL=' app/.env.local; then
  sed -i "s|^PAYMASTER_URL=.*|PAYMASTER_URL=$P|" app/.env.local
else
  echo "PAYMASTER_URL=$P" >> app/.env.local
fi
echo "Tersimpan di .env.local"
unset P
