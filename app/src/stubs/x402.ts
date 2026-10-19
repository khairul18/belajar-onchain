// Pengganti modul opsional x402 (pembayaran) yang ikut terbawa @base-org/account → @coinbase/cdp-sdk.
// App ini tidak memakai x402; bila sampai terpanggil, lempar error yang jelas.
const unsupported = (): never => {
  throw new Error("x402 tidak didukung di BelajarOnchain");
};
export const x402Client = unsupported;
export const registerExactEvmScheme = unsupported;
export const registerExactSvmScheme = unsupported;
export const toClientEvmSigner = unsupported;
export class UptoEvmScheme { constructor() { unsupported(); } }
export class ExactEvmScheme { constructor() { unsupported(); } }
export class ExactSvmScheme { constructor() { unsupported(); } }
