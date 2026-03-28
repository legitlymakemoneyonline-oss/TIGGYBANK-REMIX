import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, getDocFromServer, getDoc, query, where, getDocs, increment, writeBatch } from 'firebase/firestore';
import { UserProfile, Transaction, Treasury, TreasuryAsset } from '../types';
import { LEVEL_THRESHOLDS, CAD_USD_RATE, MATIC_USD_RATE } from '../constants';
import { parseEther, formatUnits, parseUnits } from 'viem';
import { polygon } from 'viem/chains';
import { useAccount, useDisconnect, useBalance, useSendTransaction, useConnect, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { TIGGY_BANK_ADDRESS, TIGGY_BANK_ABI, ERC20_ABI } from '../constants/contracts';
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import { useWalletModal } from '@tronweb3/tronwallet-adapter-react-ui';
import TronWeb from 'tronweb';
import treasuryData from '../data/treasury_balances.json';

const MOCK_RATES: { [key: string]: number } = {
  BTC: 95000,
  ETH: 3200,
  SOL: 180,
  TIGGY: 0.001,
  USDC: 1,
  USDT: 1,
  XLM: 0.12,
  MATIC: 0.4,
  TRX: 0.25
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useTiggyState() {
  const { address: wagmiAddress, isConnected, connector } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { connectAsync, connectors } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { chain } = useAccount();
  const { sendTransactionAsync: wagmiSendTransaction } = useSendTransaction();
  const { data: balanceData } = useBalance({
    address: wagmiAddress,
  });

  const { writeContractAsync: wagmiWriteContract } = useWriteContract();

  const { data: onChainVaultBalanceRaw } = useReadContract({
    address: TIGGY_BANK_ADDRESS as `0x${string}`,
    abi: TIGGY_BANK_ABI,
    functionName: 'vaultBalance',
    args: wagmiAddress ? [wagmiAddress] : undefined,
    query: {
      enabled: !!wagmiAddress,
      refetchInterval: 5000,
    }
  });

  const { data: globalPoolBalanceRaw } = useReadContract({
    address: TIGGY_BANK_ADDRESS as `0x${string}`,
    abi: TIGGY_BANK_ABI,
    functionName: 'poolBalance',
    query: {
      refetchInterval: 10000,
    }
  });

  const { data: tokenAddress } = useReadContract({
    address: TIGGY_BANK_ADDRESS as `0x${string}`,
    abi: TIGGY_BANK_ABI,
    functionName: 'token',
  });

  const { address: tronAddress, connected: isTronConnected, signTransaction } = useWallet();
  const { setVisible: setTronModalVisible } = useWalletModal();
  const [tronBalance, setTronBalance] = useState<string>('0');

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [treasury, setTreasury] = useState<Treasury | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const isAdmin = user?.email === 'morenojuffy@gmail.com';
  const isGodMode = isAdmin && profile?.isCardActive;

  const totalUnroutedLosses = transactions
    .filter(tx => tx.type === 'game_loss' && !tx.isRouted)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Fetch Tron Balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (isTronConnected && tronAddress) {
        try {
          const tronWeb = new (TronWeb as any)({
            fullHost: 'https://api.trongrid.io',
          });
          const balance = await tronWeb.trx.getBalance(tronAddress);
          setTronBalance((balance / 1_000_000).toFixed(2));
        } catch (err) {
          console.error('Failed to fetch Tron balance:', err);
        }
      }
    };
    fetchBalance();
  }, [isTronConnected, tronAddress]);

  useEffect(() => {
    if (isConnected && wagmiAddress) {
      setWalletAddress(wagmiAddress);
      if (balanceData) {
        setWalletBalance(formatUnits(balanceData.value, balanceData.decimals));
      }
    } else if (!isConnected) {
      setWalletAddress(null);
      setWalletBalance('0');
    }
  }, [isConnected, wagmiAddress, balanceData]);

  const connect = async (isSimulated: boolean = false) => {
    console.log('Tiggy: Starting wallet connection...', isSimulated ? '(Simulated)' : '');
    try {
      if (isSimulated) {
        const mockAddr = '0xSIM_' + Math.random().toString(36).substring(2, 10).toUpperCase();
        setWalletAddress(mockAddr);
        setWalletBalance('100.0');
        return mockAddr;
      }

      // Find the best connector (prefer MetaMask)
      const connector = connectors.find(c => c.id === 'io.metamask' || c.id === 'metaMask' || c.name.toLowerCase().includes('metamask')) || 
                        connectors.find(c => c.id === 'injected') || 
                        connectors[0];

      if (!connector) {
        throw new Error('No wallet connector found. Please install MetaMask or use a mobile wallet.');
      }
      
      console.log('Tiggy: Using connector:', connector.id, connector.name);
      const result = await connectAsync({ connector });
      const addr = result.accounts[0] || '';
      setWalletAddress(addr);
      return addr;
    } catch (error: any) {
      console.error('Tiggy: Wallet connection failed:', error);
      const msg = error.message || 'Failed to connect wallet';
      setError(msg);
      throw new Error(msg);
    }
  };

  const disconnect = async () => {
    if (walletAddress?.startsWith('0xSIM_')) {
      setWalletAddress(null);
      setWalletBalance('0');
      return;
    }
    wagmiDisconnect();
  };

  const connectTron = async () => {
    setTronModalVisible(true);
  };

  useEffect(() => {
    console.log('Tiggy: walletAddress state changed:', walletAddress);
  }, [walletAddress]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        
        // Check for level up
        if (profile && data.level > profile.level) {
          setShowLevelUp(data.level);
        }
        
        setProfile(data);
      } else {
        // Initialize profile
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Tiggy User',
          photoURL: user.photoURL || '',
          balance: 0,
          lockedSavings: 0,
          level: 1,
          isPremium: false,
          createdAt: new Date().toISOString(),
        };
        setDoc(doc(db, 'users', user.uid), newProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
      }
      setLoading(false);
    }, (error) => {
      console.error('Profile snapshot error:', error);
      setLoading(false);
      // Don't throw here, just log and set loading false
    });

    return () => unsubscribe();
  }, [user, profile?.level]);

  // Transactions Subscription
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      collection(db, 'transactions'),
      (snapshot) => {
        const txs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
          .filter(tx => tx.uid === user.uid)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setTransactions(txs);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Pending Withdrawals Subscription (Admin Only)
  useEffect(() => {
    if (!user || !isAdmin) return;
    const unsubscribe = onSnapshot(
      collection(db, 'withdrawals'),
      (snapshot) => {
        const ws = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((w: any) => w.status === 'pending')
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setPendingWithdrawals(ws);
      }
    );
    return () => unsubscribe();
  }, [user, isAdmin]);

  // Treasury Subscription
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'treasury', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setTreasury(snapshot.data() as Treasury);
      } else {
        // Map the uploaded JSON data
        const assets = treasuryData.treasury_balances as TreasuryAsset[];
        const holdings: Treasury['holdings'] = {};
        let totalHoldingsUSD = 0;

        assets.forEach(asset => {
          const rate = MOCK_RATES[asset.asset] || 0;
          const usdValue = asset.available_balance * rate;
          
          if (!holdings[asset.asset]) {
            holdings[asset.asset] = {
              balance: 0,
              usdValue: 0,
              rate: rate,
              networks: []
            };
          }
          
          holdings[asset.asset].balance += asset.available_balance;
          holdings[asset.asset].usdValue += usdValue;
          holdings[asset.asset].networks?.push({
            ...asset,
            usdValue,
            rate
          });
          
          totalHoldingsUSD += usdValue;
        });

        const initialTreasury: Treasury = {
          walletAddress: '0xTIGGYTREASURYVAULT_777',
          totalHoldingsUSD,
          totalEarnedUSD: 51383.88,
          totalWithdrawnUSD: 398679.36,
          holdings,
          assets,
          lastUpdated: treasuryData.exported_at,
          votesUp: 0,
          votesDown: 0
        };
        setDoc(doc(db, 'treasury', 'main'), initialTreasury).catch(e => handleFirestoreError(e, OperationType.WRITE, 'treasury/main'));
      }
    }, (error) => {
      console.error('Treasury snapshot error:', error);
      // Treasury is non-critical for initial load
    });

    return () => unsubscribe();
  }, []);

  // Votes Subscription
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'votes'),
      (snapshot) => {
        const vs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10); // Only keep latest 10 for performance
        setVotes(vs);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateBalance = useCallback(async (amount: number, type: Transaction['type']) => {
    if (!user || !profile) return;

    const newBalance = profile.balance + amount;
    
    // Calculate new level
    let newLevel = 1;
    for (let l = 10; l >= 1; l--) {
      if (newBalance >= LEVEL_THRESHOLDS[l]) {
        newLevel = l;
        break;
      }
    }

    const lockedSavings = LEVEL_THRESHOLDS[newLevel];

    await updateDoc(doc(db, 'users', user.uid), {
      balance: newBalance,
      level: newLevel,
      lockedSavings: lockedSavings,
    });

    await addDoc(collection(db, 'transactions'), {
      uid: user.uid,
      amount,
      type,
      status: 'completed',
      timestamp: new Date().toISOString(),
      from: type === 'deposit' ? walletAddress || 'EXTERNAL' : '0xTIGGYTREASURYVAULT_777',
      to: type === 'deposit' ? '0xTIGGYTREASURYVAULT_777' : walletAddress || 'USER_WALLET'
    });
  }, [user, profile]);

  const deposit = async (amount: number, method: 'polygon' | 'prepaid' | 'plisio' | 'sticpay' | 'spritz' | 'tron' = 'polygon', manualHash?: string) => {
    if (method === 'plisio') {
      try {
        const response = await fetch('/api/plisio/create-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            uid: user?.uid,
            currency: 'USDT_TRC20',
            order_name: `Tiggy Deposit - ${user?.email}`,
          }),
        });

        const data = await response.json();
        if (data.status === 'success' && data.data.invoice_url) {
          window.open(data.data.invoice_url, '_blank');
          return data.data.txn_id;
        } else {
          throw new Error(data.data.message || 'Failed to create Plisio invoice');
        }
      } catch (error: any) {
        console.error('Plisio Deposit Error:', error);
        throw error;
      }
    }

    if (method === 'polygon') {
      if (manualHash) {
        // Manual Transfer Mode: Just record the hash and update balance (pending verification)
        await updateBalance(amount, 'deposit');
        return manualHash;
      }

      // OPTION B: Backend-powered deposit
      try {
        const response = await fetch('/api/onchain/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user?.uid,
            amountCAD: amount
          }),
        });

        const data = await response.json();
        if (data.status === 'success') {
          // Balance is already updated in Firestore by the backend
          return data.txHash;
        } else {
          throw new Error(data.error || 'Failed to process on-chain deposit');
        }
      } catch (error: any) {
        console.error('On-Chain Deposit Error:', error);
        throw error;
      }
    }
    
    const type = method === 'prepaid' ? 'prepaid_deposit' : 'deposit';
    return updateBalance(amount, type);
  };

  const payBill = async (amountCAD: number, destinationAddress: string, network: 'polygon' | 'tron' = 'polygon') => {
    if (!user || !profile || !treasury) return;

    const withdrawable = profile.balance - profile.lockedSavings;
    if (!isAdmin && amountCAD > withdrawable) throw new Error('Insufficient withdrawable funds for bill payment');
    if (isAdmin && amountCAD > profile.balance) throw new Error('Insufficient total balance');

    // Execute the transaction
    let txHash = '';
    const asset = network === 'polygon' ? 'MATIC' : 'TRX';
    const rate = MOCK_RATES[asset] || 0.4;
    const cryptoAmount = amountCAD / rate;
    const cryptoAmountStr = cryptoAmount.toFixed(6);

    try {
      if (network === 'polygon') {
        if (walletAddress?.startsWith('0xSIM_')) {
          txHash = `SIM-BILL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        } else {
          // Real Polygon transaction
          if (!isConnected || !wagmiAddress || !connector) {
            console.log('Tiggy: Wallet not connected, attempting to connect...');
            const addr = await connect(false);
            if (!addr) throw new Error('Please connect your Polygon wallet to pay this bill.');
          }

          // Ensure we are on Polygon
          if (chain?.id !== 137) {
            console.log('Tiggy: Switching to Polygon network...');
            try {
              await switchChainAsync({ chainId: 137 });
            } catch (err) {
              console.error('Failed to switch chain:', err);
              throw new Error('Please switch your wallet to the Polygon network to pay this bill.');
            }
          }

          // Add a small retry loop for "Connector not connected" error
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              txHash = await wagmiSendTransaction({
                to: destinationAddress as `0x${string}`,
                value: parseEther(cryptoAmountStr),
                connector: connector, // Pass the connector explicitly
              });
              break; // Success!
            } catch (err: any) {
              if (err.message?.includes('Connector not connected') && retryCount < maxRetries - 1) {
                console.log(`Tiggy: Connector not connected, retrying... (${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
                retryCount++;
              } else {
                throw err; // Re-throw if it's not the specific error or we're out of retries
              }
            }
          }
        }
      } else {
        // Tron logic
        if (isTronConnected && tronAddress && signTransaction) {
          const tronWeb = new (TronWeb as any)({
            fullHost: 'https://api.trongrid.io',
          });
          
          const transaction = await tronWeb.transactionBuilder.sendTrx(
            destinationAddress,
            Math.floor(cryptoAmount * 1_000_000),
            tronAddress
          );
          
          const signedTransaction = await signTransaction(transaction);
          const result = await tronWeb.trx.sendRawTransaction(signedTransaction);
          
          if (result.result) {
            txHash = result.txid;
          } else {
            throw new Error('Tron transaction failed to broadcast');
          }
        } else {
          throw new Error('Tron wallet not connected');
        }
      }
    } catch (err: any) {
      console.error('Bill Pay Transaction Failed:', err);
      throw new Error(`Bill payment failed: ${err.message}`);
    }

    // Update balance and log transaction
    await updateDoc(doc(db, 'users', user.uid), {
      balance: profile.balance - amountCAD,
    });

    await addDoc(collection(db, 'transactions'), {
      uid: user.uid,
      amount: -amountCAD,
      type: 'bill_pay',
      status: 'completed',
      timestamp: new Date().toISOString(),
      txHash,
      from: isAdmin ? '0xTIGGYTREASURYVAULT_777' : walletAddress || 'USER_WALLET',
      to: destinationAddress,
      network
    });

    return txHash;
  };

  const withdraw = async (amountCAD: number, payoutAddress: string, method: 'polygon' | 'prepaid' | 'plisio' | 'sticpay' | 'spritz' = 'polygon', isPrivate: boolean = false) => {
    if (!user || !profile || !treasury) return;

    const withdrawable = profile.balance - profile.lockedSavings;
    if (!isAdmin && amountCAD > withdrawable) throw new Error('Insufficient withdrawable funds');
    if (isAdmin && amountCAD > profile.balance) throw new Error('Insufficient total balance');

    // Check Treasury Liquidity (Automated Withdrawal)
    // We'll use MATIC for the payout if it's a real Polygon transaction
    const payoutAsset = method === 'plisio' || method === 'sticpay' ? 'USDT' : 'MATIC';
    const rate = MOCK_RATES[payoutAsset] || 0.4; // CAD per asset
    const cryptoAmount = amountCAD / rate;
    // Round for display and parseEther
    const cryptoAmountStr = cryptoAmount.toFixed(6);

    // God Mode: Admin can bypass 60/40 split
    const isGodModeActive = isGodMode;
    
    // 60/40 Split logic (Bypassed if God Mode)
    const payoutAmount = isGodModeActive ? amountCAD : amountCAD * 0.6;
    const savingsAmount = isGodModeActive ? 0 : amountCAD * 0.4;

    let txHash = '';
    const fromAddress = isAdmin ? '0xTIGGYTREASURYVAULT_777' : walletAddress || 'SYSTEM_VAULT';
    
    if (method === 'plisio' || method === 'sticpay') {
      try {
        const response = await fetch('/api/plisio/payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: payoutAmount,
            to: payoutAddress,
            uid: user.uid,
            currency: 'USDT_TRC20',
            method: method === 'sticpay' ? 'sticpay' : 'plisio'
          }),
        });

        const data = await response.json();
        if (data.status === 'success') {
          txHash = data.data.txn_id;
        } else {
          throw new Error(data.data.message || `${method} payout failed`);
        }
      } catch (error: any) {
        console.error(`${method} Payout Error:`, error);
        throw error;
      }
    } else if (method === 'spritz') {
      // Spritz Off-Ramp Simulation
      console.log(`Tiggy: Off-ramping ${payoutAmount} CAD via Spritz to ${payoutAddress}`);
      txHash = `SPRITZ-OR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      // In a real app, we would trigger a transaction to Spritz's contract
    } else if (method === 'polygon') {
      // REAL TRANSACTION: Trigger actual Polygon transaction
      try {
        if (walletAddress?.startsWith('0xSIM_') || isAdmin) {
          console.log(`Tiggy: ${isAdmin ? 'Admin' : 'Simulation'} Mode - Payout from TIGGYTREASURYVAULT_777`);
          txHash = `TREASURY-TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        } else {
          console.log(`Tiggy: Sending real transaction of ${cryptoAmountStr} MATIC to ${payoutAddress}`);
          try {
            txHash = await wagmiSendTransaction({
              to: payoutAddress as `0x${string}`,
              value: parseEther(cryptoAmountStr),
              gas: BigInt(30000), // Slightly higher than standard for safety
            });
          } catch (err: any) {
            console.warn('Withdrawal gas estimation failed, retrying without manual gas limit:', err);
            txHash = await wagmiSendTransaction({
              to: payoutAddress as `0x${string}`,
              value: parseEther(cryptoAmountStr),
            });
          }
          console.log(`Tiggy: Real transaction successful! Hash: ${txHash}`);
        }
      } catch (error: any) {
        console.error('Tiggy: Real transaction failed:', error);
        throw new Error(`Blockchain transaction failed: ${error.message}`);
      }
    } else {
      // Internal routing for prepaid cards
      txHash = `ROUTE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }
    
    // Automation: Auto-approve under $20, manual above
    const isAutoApprove = amountCAD < 20 || isAdmin;
    const status = isAutoApprove ? 'completed' : 'pending';
    
    if (isAutoApprove) {
      // Update Treasury Liquidity
      const newHoldings = { ...treasury.holdings };
      if (newHoldings[payoutAsset]) {
        newHoldings[payoutAsset].balance -= cryptoAmount;
        newHoldings[payoutAsset].usdValue -= amountCAD;
        
        // Also update the network-specific balance for transparency
        if (newHoldings[payoutAsset].networks) {
          const networkName = method === 'plisio' ? 'TRON' : 'Polygon';
          const networkIndex = newHoldings[payoutAsset].networks!.findIndex(n => n.network === networkName);
          if (networkIndex !== -1) {
            newHoldings[payoutAsset].networks![networkIndex].available_balance -= cryptoAmount;
            newHoldings[payoutAsset].networks![networkIndex].hot_balance -= cryptoAmount;
            newHoldings[payoutAsset].networks![networkIndex].usdValue = (newHoldings[payoutAsset].networks![networkIndex].usdValue || 0) - amountCAD;
          }
        }
      }

      const newTreasury = {
        ...treasury,
        totalHoldingsUSD: treasury.totalHoldingsUSD - amountCAD,
        totalWithdrawnUSD: treasury.totalWithdrawnUSD + amountCAD,
        holdings: newHoldings,
        lastUpdated: new Date().toISOString()
      };

      // Update Treasury in Firestore
      await updateDoc(doc(db, 'treasury', 'main'), newTreasury as any);
    }

    await addDoc(collection(db, 'withdrawals'), {
      uid: user.uid,
      amountCAD,
      payoutAmount,
      savingsAmount,
      payoutAddress,
      txHash,
      method,
      isPrivate: isPrivate || isPrivateMode,
      savingsVaultAddress: profile.savingsVaultAddress || 'SYSTEM_VAULT',
      status,
      timestamp: new Date().toISOString(),
      from: fromAddress,
      to: payoutAddress
    });

    // Update balance (deduct full amount)
    await updateBalance(-amountCAD, method === 'prepaid' ? 'prepaid_withdrawal' : 'withdrawal');
    
    // Add to transactions with hash
    await addDoc(collection(db, 'transactions'), {
      uid: user.uid,
      amount: -amountCAD,
      type: method === 'prepaid' ? 'prepaid_withdrawal' : 'withdrawal',
      status,
      txHash,
      timestamp: new Date().toISOString(),
      from: fromAddress,
      to: payoutAddress
    });

    if (isGodModeActive) {
      console.log(`GOD MODE: Automated Withdrawal processed via ${method} ${profile.prepaidCardId || payoutAddress}. Split bypassed.`);
    } else if (isAutoApprove) {
      console.log(`AUTOMATION: Withdrawal of ${amountCAD} CAD fulfilled automatically using Treasury Liquidity.`);
    } else {
      console.log(`SECURITY: Withdrawal of ${amountCAD} CAD requires manual Admin approval.`);
    }
  };

  const routeLosses = async () => {
    if (!user || !profile) return;
    
    const unroutedTxs = transactions.filter(tx => tx.type === 'game_loss' && !tx.isRouted);
    if (unroutedTxs.length === 0) return;

    const totalLoss = unroutedTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const savingsAmount = totalLoss * 0.4; // 40% of losses go to savings

    const batch = writeBatch(db);
    
    // Update user profile
    const userRef = doc(db, 'users', user.uid);
    batch.update(userRef, {
      lockedSavings: increment(savingsAmount)
    });

    // Mark transactions as routed
    unroutedTxs.forEach(tx => {
      if (tx.id) {
        const txRef = doc(db, 'transactions', tx.id);
        batch.update(txRef, { isRouted: true });
      }
    });

    // Log routing transaction
    const routingTxRef = doc(collection(db, 'transactions'));
    batch.set(routingTxRef, {
      uid: user.uid,
      amount: savingsAmount,
      type: 'deposit',
      status: 'completed',
      timestamp: new Date().toISOString(),
      description: `Loss routing: ${savingsAmount.toFixed(2)} CAD moved to savings ledger.`,
      isRouted: true
    });

    await batch.commit();
    console.log(`TIGGY: Routed ${totalLoss} CAD of losses. ${savingsAmount} CAD added to savings.`);
  };

  const forgeBalance = async (amountCAD: number) => {
    if (!user || !profile) return;
    const diff = amountCAD - profile.balance;
    await updateBalance(diff, 'deposit');
  };

  const linkPrepaidCard = async (cardId: string, details: { last4: string, expiry: string, cvv: string }) => {
    if (!user || !profile) return;
    
    const isActive = !!cardId;
    
    // 1. Bind Card to Account & Identity Lock-In
    await updateDoc(doc(db, 'users', user.uid), {
      prepaidCardId: cardId || null,
      isCardActive: isActive,
      cardDetails: isActive ? {
        last4: details.last4,
        expiry: details.expiry,
        cvv: (details as any).cvv,
        activatedAt: new Date().toISOString()
      } : null
    });

    if (isActive) {
      // 2. Lore Trigger: Identity Lock-In
      await addDoc(collection(db, 'transactions'), {
        uid: user.uid,
        amount: 0,
        type: 'identity_lock',
        status: 'completed',
        timestamp: new Date().toISOString(),
        description: "The vault acknowledges your presence. Identity confirmed. Access expanding."
      });
      console.log(`TIGGY: Keycard ${cardId} activated. Identity bound to TIGGYTREASURYVAULT_777.`);
    } else {
      console.log(`TIGGY: Keycard unlinked.`);
    }
    
    // 3. Level Progression Trigger (Optional: Boost level on activation if desired)
    // For now, we just ensure the state refreshes
  };

  const forgeValue = async (amount: number, targetUid?: string, set: boolean = false) => {
    if (!isGodMode) throw new Error('God Mode required to forge value');
    
    const targetId = targetUid || user?.uid;
    if (!targetId) return;

    // 1. Update User Balance
    const userRef = doc(db, 'users', targetId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        balance: set ? amount : increment(amount)
      });
    }

    // 2. Log Forge Transaction
    await addDoc(collection(db, 'transactions'), {
      uid: targetId,
      amount,
      type: 'forge',
      status: 'completed',
      timestamp: new Date().toISOString(),
      description: `${set ? 'Balance set' : 'Value forged'} by TIGGYTREASURYVAULT_777. The ledger expands.`
    });

    console.log(`GOD MODE: ${set ? 'Set' : 'Forged'} ${amount} CAD for user ${targetId}.`);
  };

  const fulfillWithdrawal = async (id: string, realTxHash: string) => {
    if (!isAdmin) return;
    
    // Get the withdrawal to find the pending hash
    const withdrawDoc = await getDoc(doc(db, 'withdrawals', id));
    if (!withdrawDoc.exists()) return;
    const data = withdrawDoc.data();
    const pendingHash = data.txHash;
    const method = data.method;

    // Input Validation: Ensure the provided hash/code is in a valid format
    if (method === 'polygon') {
      // Polygon transaction hash: 0x followed by 64 hex characters
      const polygonRegex = /^0x[a-fA-F0-9]{64}$/;
      if (!polygonRegex.test(realTxHash)) {
        throw new Error('Invalid Polygon transaction hash format. Expected 0x followed by 64 hex characters.');
      }
    } else {
      // For prepaid cards (Shakepay/Confirmation codes), we expect alphanumeric strings
      const codeRegex = /^[a-zA-Z0-9\-_]{4,64}$/;
      if (!codeRegex.test(realTxHash)) {
        throw new Error('Invalid confirmation code format. Expected 4-64 alphanumeric characters.');
      }
    }

    await updateDoc(doc(db, 'withdrawals', id), {
      status: 'completed',
      txHash: realTxHash,
      fulfilledAt: new Date().toISOString()
    });

    // Also update the corresponding transaction record
    const q = query(collection(db, 'transactions'), where('txHash', '==', pendingHash));
    const txSnap = await getDocs(q);
    if (!txSnap.empty) {
      await updateDoc(doc(db, 'transactions', txSnap.docs[0].id), {
        status: 'completed',
        txHash: realTxHash
      });
    }
  };

  const playGames = async (bet: number, win: number) => {
    if (!user || !profile) return;
    if (bet > profile.balance) throw new Error('Insufficient balance to bet');

    const isLoss = win === 0;
    const netChange = win - bet;

    const newBalance = profile.balance + netChange;
    // God Mode: Route losses to savings ledger
    const newLockedSavings = isLoss ? profile.lockedSavings + bet : profile.lockedSavings;

    // Calculate new level
    let newLevel = profile.level;
    while (newLevel < 10 && newBalance >= LEVEL_THRESHOLDS[newLevel + 1 as keyof typeof LEVEL_THRESHOLDS]) {
      newLevel++;
    }

    await updateDoc(doc(db, 'users', user.uid), {
      balance: newBalance,
      lockedSavings: newLockedSavings,
      level: newLevel,
    });

    const txRef = await addDoc(collection(db, 'transactions'), {
      uid: user.uid,
      amount: netChange,
      type: isLoss ? 'game_loss' : 'game_win',
      status: 'completed',
      isRouted: false,
      timestamp: new Date().toISOString(),
    });

    // INTEGRATION: If it's a loss, route it
    if (isLoss) {
      if (walletAddress && !walletAddress.startsWith('0xSIM_')) {
        console.log('Tiggy: Loss detected, routing to Polygon contract via backend...');
        try {
          // We use the bet amount as the loss to route
          const response = await fetch('/api/onchain/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              amountCAD: bet
            })
          });
          
          const data = await response.json();
          if (data.status === 'success') {
            console.log('Tiggy: On-chain routing successful!');
            // Update the transaction to mark it as routed
            await updateDoc(doc(db, 'transactions', txRef.id), {
              isRouted: true,
              txHash: data.txHash
            });
          }
        } catch (err: any) {
          console.error('Tiggy: On-chain routing failed:', err);
          // Fallback to off-chain routing if on-chain fails
          await routeLosses();
        }
      } else {
        // Route to off-chain ledger if no wallet
        console.log('Tiggy: No wallet connected, routing loss to off-chain ledger...');
        await routeLosses();
      }
    }
  };

  const voteTreasury = async (direction: 'up' | 'down') => {
    if (!user || !treasury) return;
    
    const field = direction === 'up' ? 'votesUp' : 'votesDown';
    const currentVal = treasury[field] || 0;
    
    // Generate a mock hash for transparency
    const mockHash = '0x' + crypto.randomUUID().replace(/-/g, '').slice(0, 40);
    
    // 1. Update the aggregate counts
    await updateDoc(doc(db, 'treasury', 'main'), {
      [field]: currentVal + 1
    });

    // 2. Record the individual vote for verification
    await addDoc(collection(db, 'votes'), {
      uid: user.uid,
      direction,
      timestamp: new Date().toISOString(),
      txHash: mockHash
    });

    return mockHash;
  };

  const resetWallet = async () => {
    console.log('Tiggy: Resetting wallet state...');
    try {
      wagmiDisconnect();
      setWalletAddress(null);
      setWalletBalance('0');
      // Clear any local storage wagmi might have
      localStorage.removeItem('wagmi.connected');
      localStorage.removeItem('wagmi.account');
      localStorage.removeItem('wagmi.recentConnectorId');
      console.log('Tiggy: Wallet state reset successfully');
    } catch (error) {
      console.error('Tiggy: Failed to reset wallet:', error);
    }
  };

  const loseToRoute = async (amount: string) => {
    if (!wagmiAddress) throw new Error('Wallet not connected');
    
    const amountUnits = parseEther(amount); // Using parseEther for MATIC
    
    // Route Loss by calling deposit()
    const hash = await wagmiWriteContract({
      address: TIGGY_BANK_ADDRESS as `0x${string}`,
      abi: TIGGY_BANK_ABI,
      functionName: 'deposit',
      value: amountUnits,
      account: wagmiAddress,
      chain: polygon,
    });
    
    return hash;
  };

  const routeUnroutedLosses = async () => {
    if (!user || !walletAddress || totalUnroutedLosses <= 0) return;
    
    const unroutedTxs = transactions.filter(tx => tx.type === 'game_loss' && !tx.isRouted);
    const amountToRoute = (totalUnroutedLosses * CAD_USD_RATE).toString();
    
    try {
      // Use backend for routing all losses too
      const response = await fetch('/api/onchain/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          amountCAD: totalUnroutedLosses
        })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        const hash = data.txHash;
        // Update all transactions in Firestore
        const batch = writeBatch(db);
        unroutedTxs.forEach(tx => {
          if (tx.id) {
            batch.update(doc(db, 'transactions', tx.id), {
              isRouted: true,
              txHash: hash
            });
          }
        });
        await batch.commit();
        return hash;
      } else {
        throw new Error(data.error || 'Failed to route losses');
      }
    } catch (err: any) {
      console.error('Failed to route all losses:', err);
      throw err;
    }
  };

  const withdrawFromContract = async (amount: string) => {
    if (!wagmiAddress) throw new Error('Wallet not connected');
    
    const amountUnits = parseEther(amount);
    
    const hash = await wagmiWriteContract({
      address: TIGGY_BANK_ADDRESS as `0x${string}`,
      abi: TIGGY_BANK_ABI,
      functionName: 'withdrawVault',
      args: [amountUnits],
      account: wagmiAddress,
      chain: polygon,
    });
    
    return hash;
  };

  const withdrawAllSavings = async () => {
    if (!wagmiAddress) throw new Error('Wallet not connected');
    
    const hash = await wagmiWriteContract({
      address: TIGGY_BANK_ADDRESS as `0x${string}`,
      abi: TIGGY_BANK_ABI,
      functionName: 'withdrawAllSavings',
      account: wagmiAddress,
      chain: polygon,
    });
    
    return hash;
  };

  const managePool = async (to: string, amount: string) => {
    if (!wagmiAddress) throw new Error('Wallet not connected');
    if (!isAdmin) throw new Error('Admin only');
    
    const amountUnits = parseEther(amount);
    
    const hash = await wagmiWriteContract({
      address: TIGGY_BANK_ADDRESS as `0x${string}`,
      abi: TIGGY_BANK_ABI,
      functionName: 'managePool',
      args: [to as `0x${string}`, amountUnits],
      account: wagmiAddress,
      chain: polygon,
    });
    
    return hash;
  };

  return { 
    user, 
    profile, 
    treasury, 
    transactions, 
    loading, 
    showLevelUp, 
    setShowLevelUp, 
    deposit, 
    withdraw, 
    playGames,
    isAdmin, 
    isGodMode, 
    linkPrepaidCard, 
    forgeValue, 
    walletAddress, 
    walletBalance, 
    tronAddress, 
    isTronConnected, 
    tronBalance, 
    connect, 
    disconnect, 
    connectTron, 
    payBill, 
    voteTreasury, 
    votes, 
    pendingWithdrawals, 
    fulfillWithdrawal, 
    loseToRoute,
    resetWallet, 
    isPrivateMode, 
    setIsPrivateMode, 
    error, 
    setError, 
    onChainSavings: profile?.onChainSavings ? profile.onChainSavings.toFixed(2) : '0', 
    onChainVaultBalance: onChainVaultBalanceRaw ? formatUnits(onChainVaultBalanceRaw as bigint, 18) : '0', 
    globalPoolBalance: globalPoolBalanceRaw ? formatUnits(globalPoolBalanceRaw as bigint, 18) : '0', 
    loseToRouteOnChain: loseToRoute, 
    routeUnroutedLosses,
    withdrawFromContract,
    withdrawAllSavings,
    managePool,
    depositToPolygon: async (amountCAD: number) => {
      if (!user) throw new Error('User not authenticated');
      
      const response = await fetch('/api/onchain/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          amountCAD
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        return data.txHash;
      } else {
        throw new Error(data.error || 'Failed to process on-chain deposit');
      }
    },
    totalUnroutedLosses
  };
}
