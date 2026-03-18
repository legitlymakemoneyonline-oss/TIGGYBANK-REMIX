export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  balance: number;
  lockedSavings: number;
  level: number;
  isPremium: boolean;
  walletAddress?: string;
  savingsVaultAddress?: string;
  prepaidCardId?: string;
  isCardActive?: boolean;
  cardDetails?: {
    last4: string;
    expiry: string;
    activatedAt: string;
  };
  createdAt: string;
}

export interface Transaction {
  id?: string;
  uid: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'game_loss' | 'game_win' | 'fee' | 'prepaid_withdrawal' | 'prepaid_deposit';
  status: 'pending' | 'completed' | 'failed' | 'awaiting_fulfillment' | 'approved';
  timestamp: string;
  txHash?: string;
}

export interface WithdrawalRequest {
  id?: string;
  uid: string;
  amountCAD: number;
  amountCrypto: number;
  cryptoType: 'MATIC' | 'USDC';
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'awaiting_fulfillment';
  payoutAddress: string;
  savingsVaultAddress: string;
  fee: number;
  timestamp: string;
}

export type BadgeType = 
  | 'Bronze' 
  | 'Gold' 
  | 'Platinum' 
  | 'Sapphire' 
  | 'Ruby' 
  | 'Amethyst' 
  | 'Emerald' 
  | 'Obsidian' 
  | 'Phoenix' 
  | 'Cosmic';

export interface TreasuryAsset {
  id: string;
  asset: string;
  network: string;
  available_balance: number;
  reserved_balance: number;
  min_threshold: number;
  target_balance: number;
  updated_at: string;
  hot_balance: number;
  cold_balance: number;
  min_hot: number;
  max_hot: number;
  last_rebalance_at: string | null;
  usdValue?: number;
  rate?: number;
}

export interface Treasury {
  walletAddress: string;
  totalHoldingsUSD: number;
  totalEarnedUSD: number;
  totalWithdrawnUSD: number;
  holdings: {
    [asset: string]: {
      balance: number;
      usdValue: number;
      rate: number;
      networks?: TreasuryAsset[];
    };
  };
  lastUpdated: string;
  assets?: TreasuryAsset[];
  votesUp?: number;
  votesDown?: number;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  interface ImportMetaEnv {
    readonly VITE_TREASURY_ADDRESS: string;
    readonly VITE_ALCHEMY_API_KEY: string;
  }
}
