import { createConfig, http } from "wagmi";
import { baseAccount, injected } from "wagmi/connectors";
import { base, baseSepolia } from "wagmi/chains";
import { chain } from "./config";

export const wagmiConfig = createConfig({
  chains: [chain],
  connectors: [baseAccount({ appName: "BelajarOnchain" }), injected()],
  transports: { [base.id]: http(), [baseSepolia.id]: http() },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
