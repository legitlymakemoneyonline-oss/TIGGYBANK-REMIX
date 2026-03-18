import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, getDocFromServer, getDoc, query, where, getDocs, increment } from 'firebase/firestore';
import { UserProfile, Transaction, Treasury, TreasuryAsset } from '../types';
import { LEVEL_THRESHOLDS } from '../constants';
import { parseEther, formatUnits } from 'viem';
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

import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect, useBalance, useSendTransaction } from 'wagmi';

export function useTiggyState() {
  const { open } = useWeb3Modal();
  const { address: wagmiAddress, isConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { sendTransactionAsync: wagmiSendTransaction } = useSendTransaction();
  const { data: balanceData } = useBalance({
    address: wagmiAddress,
    chainId: 137, // Polygon
  });

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
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const isAdmin = user?.email === 'morenojuffy@gmail.com';
  const isGodMode = isAdmin && profile?.isCardActive;

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

      await open();
      return wagmiAddress || '';
    } catch (error) {
      console.error('Tiggy: Wallet connection failed:', error);
      throw error;
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
    });
  }, [user, profile]);

  const deposit = async (amount: number, method: 'polygon' | 'prepaid' = 'polygon') => {
    if (method === 'polygon') {
      // REAL MODE: Trigger actual transaction
      const treasuryAddress = import.meta.env.VITE_TREASURY_ADDRESS || '0x109d273bc4ea81b36b2c1d051ae336a9780f4eeb';
      
      // Assume 1 MATIC = $0.50 CAD for demo purposes, or fetch real rate
      const maticAmount = (amount / 0.5).toString(); 
      
      let txHash = '';
      if (walletAddress?.startsWith('0xSIM_')) {
        txHash = `SIM-DEP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      } else {
        txHash = await wagmiSendTransaction({
          to: treasuryAddress as `0x${string}`,
          value: parseEther(maticAmount),
        });
      }
      
      await updateBalance(amount, 'deposit');
      
      return txHash;
    }
    
    const type = method === 'prepaid' ? 'prepaid_deposit' : 'deposit';
    return updateBalance(amount, type);
  };

  const withdraw = async (amountCAD: number, payoutAddress: string, isPrepaid: boolean = false) => {
    if (!user || !profile || !treasury) return;

    const withdrawable = profile.balance - profile.lockedSavings;
    if (!isAdmin && amountCAD > withdrawable) throw new Error('Insufficient withdrawable funds');
    if (isAdmin && amountCAD > profile.balance) throw new Error('Insufficient total balance');

    // Check Treasury Liquidity (Automated Withdrawal)
    // We'll use MATIC for the payout if it's a real Polygon transaction
    const payoutAsset = 'MATIC';
    const rate = MOCK_RATES[payoutAsset] || 0.4; // CAD per MATIC
    const cryptoAmount = amountCAD / rate;

    // God Mode: Admin can bypass 60/40 split
    const isGodModeActive = isGodMode;
    
    // 60/40 Split logic (Bypassed if God Mode)
    const payoutAmount = isGodModeActive ? amountCAD : amountCAD * 0.6;
    const savingsAmount = isGodModeActive ? 0 : amountCAD * 0.4;

    let txHash = '';
    
    if (!isPrepaid) {
      // REAL TRANSACTION: Trigger actual Polygon transaction
      try {
        if (walletAddress?.startsWith('0xSIM_')) {
          console.log('Tiggy: Simulation Mode - Skipping real transaction');
          txHash = `SIM-TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        } else {
          console.log(`Tiggy: Sending real transaction of ${cryptoAmount} MATIC to ${payoutAddress}`);
          txHash = await wagmiSendTransaction({
            to: payoutAddress as `0x${string}`,
            value: parseEther(cryptoAmount.toString()),
          });
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
          const networkIndex = newHoldings[payoutAsset].networks!.findIndex(n => n.network === 'Polygon');
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
      method: isPrepaid ? 'prepaid_card' : 'polygon',
      savingsVaultAddress: profile.savingsVaultAddress || 'SYSTEM_VAULT',
      status,
      timestamp: new Date().toISOString(),
    });

    // Update balance (deduct full amount)
    await updateBalance(-amountCAD, isPrepaid ? 'prepaid_withdrawal' : 'withdrawal');
    
    // Add to transactions with hash
    await addDoc(collection(db, 'transactions'), {
      uid: user.uid,
      amount: -amountCAD,
      type: isPrepaid ? 'prepaid_withdrawal' : 'withdrawal',
      status,
      txHash,
      timestamp: new Date().toISOString(),
    });

    if (isGodModeActive) {
      console.log(`GOD MODE: Automated Withdrawal processed via Prepaid Card ${profile.prepaidCardId || payoutAddress}. Split bypassed.`);
    } else if (isAutoApprove) {
      console.log(`AUTOMATION: Withdrawal of ${amountCAD} CAD fulfilled automatically using Treasury Liquidity.`);
    } else {
      console.log(`SECURITY: Withdrawal of ${amountCAD} CAD requires manual Admin approval.`);
    }
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

  const forgeValue = async (amount: number, targetUid?: string) => {
    if (!isGodMode) throw new Error('God Mode required to forge value');
    
    const targetId = targetUid || user?.uid;
    if (!targetId) return;

    // 1. Update User Balance
    const userRef = doc(db, 'users', targetId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        balance: increment(amount)
      });
    }

    // 2. Log Forge Transaction
    await addDoc(collection(db, 'transactions'), {
      uid: targetId,
      amount,
      type: 'forge',
      status: 'completed',
      timestamp: new Date().toISOString(),
      description: `Value forged by TIGGYTREASURYVAULT_777. The ledger expands.`
    });

    console.log(`GOD MODE: Forged ${amount} CAD for user ${targetId}.`);
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

    await addDoc(collection(db, 'transactions'), {
      uid: user.uid,
      amount: netChange,
      type: isLoss ? 'game_loss' : 'game_win',
      status: 'completed',
      timestamp: new Date().toISOString(),
    });
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

  return {
    user,
    profile,
    treasury,
    loading,
    showLevelUp,
    setShowLevelUp,
    deposit,
    withdraw,
    playGames,
    transactions,
    isAdmin,
    isGodMode,
    linkPrepaidCard,
    forgeValue,
    walletAddress,
    walletBalance,
    connect,
    disconnect,
    voteTreasury,
    votes,
    pendingWithdrawals,
    fulfillWithdrawal,
    error,
    setError
  };
}
