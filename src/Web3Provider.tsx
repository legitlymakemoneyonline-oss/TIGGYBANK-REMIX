import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, WagmiProvider, createConfig } from "wagmi";
import { mainnet, sepolia, polygon } from "wagmi/chains";
import { metaMask, walletConnect, injected } from "wagmi/connectors";
import React, { useMemo } from 'react';
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import { WalletModalProvider } from '@tronweb3/tronwallet-adapter-react-ui';
import { TronLinkAdapter, WalletConnectAdapter } from '@tronweb3/tronwallet-adapters';
import '@tronweb3/tronwallet-adapter-react-ui/style.css';

// WalletConnect Project ID (using a configurable environment variable)
const projectId = process.env.VITE_WALLETCONNECT_PROJECT_ID || '3fcc6b44f8497a4d79c351020471d469'; 

const config = createConfig({
  ssr: false, // Disable SSR for better iframe stability
  chains: [mainnet, sepolia, polygon],
  connectors: [
    injected(),
    metaMask({
      dappMetadata: {
        name: "TiggyBank",
        url: typeof window !== 'undefined' ? window.location.origin : '',
      },
      checkInstallationImmediately: true,
    }),
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: "TiggyBank",
        description: "TiggyBank - Your Premium Web3 Savings Vault",
        url: window.location.origin,
        icons: ["https://picsum.photos/seed/tiggy/200/200"]
      }
    })
  ],
  transports: {
    [mainnet.id]: http("https://eth.llamarpc.com"),
    [sepolia.id]: http("https://rpc.sepolia.org"),
    [polygon.id]: http("https://polygon-mainnet.public.blastapi.io"), // More reliable fallback
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const adapters = useMemo(() => [
    new TronLinkAdapter(),
    new WalletConnectAdapter({
      network: 'Mainnet',
      options: {
        projectId,
        metadata: {
          name: "TiggyBank",
          description: "TiggyBank - Your Premium Web3 Savings Vault",
          url: window.location.origin,
          icons: ["https://picsum.photos/seed/tiggy/200/200"]
        }
      }
    })
  ], []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider adapters={adapters} autoConnect={true}>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
