import React, { useState, useEffect } from 'react';
import { useTiggyState } from './hooks/useTiggyState';
import { Badge } from './components/Badge';
import { LevelUpOverlay } from './components/LevelUpOverlay';
import { TreasuryDashboard } from './components/TreasuryDashboard';
import { GameView } from './components/GameView';
import { DepositModal } from './components/DepositModal';
import { WalletModal } from './components/WalletModal';
import { PrepaidCardModal } from './components/PrepaidCardModal';
import { ChatAssistant } from './components/ChatAssistant';
import { BADGE_MAP, LEVEL_THRESHOLDS, WITHDRAWAL_FEE, MATIC_USD_RATE, CAD_USD_RATE } from './constants';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  Wallet, 
  TrendingUp, 
  Lock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Crown, 
  ChevronRight,
  LogOut,
  Plus,
  History,
  BarChart3,
  Gamepad2,
  CreditCard,
  CheckCircle2,
  Zap,
  Shield,
  X,
  Mail,
  LockKeyhole
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { user, profile, treasury, transactions, loading, showLevelUp, setShowLevelUp, deposit, withdraw, playGames, isAdmin, isGodMode, linkPrepaidCard, walletAddress, walletBalance, connect, disconnect, voteTreasury, votes, pendingWithdrawals, fulfillWithdrawal, forgeValue, error: stateError } = useTiggyState();
  const [view, setView] = useState<'dashboard' | 'savings' | 'withdraw' | 'history' | 'treasury' | 'games' | 'profile' | 'admin'>('dashboard');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [isPrepaid, setIsPrepaid] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isPrepaidCardModalOpen, setIsPrepaidCardModalOpen] = useState(false);
  const [newCardId, setNewCardId] = useState('');
  const [isLinkingCard, setIsLinkingCard] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isForging, setIsForging] = useState(false);
  const [forgeAmount, setForgeAmount] = useState(100);
  const [isConfirmingWithdraw, setIsConfirmingWithdraw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email Auth States
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    try {
      if (isSigningUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mb-8"
        />
        {stateError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold max-w-xs">
            <p>⚠️ Error: {stateError}</p>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center p-6 text-center overflow-y-auto">
        <div className="max-w-lg w-full py-12">
          {stateError && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold">
              <p>⚠️ Database Error: {stateError}</p>
              <p className="text-[10px] mt-1 opacity-70">Please check your connection or contact support.</p>
            </div>
          )}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-emerald-500/20 rounded-3xl flex items-center justify-center mb-4 mx-auto border border-emerald-500/30">
              <Wallet className="w-12 h-12 text-emerald-500" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">TiggyBank Remix</h1>
            <p className="text-gray-400 max-w-xs mx-auto">The premium crypto savings app with automated 60/40 splits.</p>
          </motion.div>
          
          <div className="max-w-sm mx-auto w-full">
            {authMode === 'google' ? (
              <div className="space-y-4">
                <button
                  onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
                  className="w-full bg-white text-black px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors shadow-xl"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  Continue with Google
                </button>
                
                <button
                  onClick={() => setAuthMode('email')}
                  className="w-full bg-white/5 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Continue with Email
                </button>
              </div>
            ) : (
              <motion.form 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleEmailAuth} 
                className="space-y-4 text-left"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs text-red-500 font-bold">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold hover:bg-emerald-400 transition-all shadow-xl disabled:opacity-50"
                >
                  {authLoading ? 'Processing...' : isSigningUp ? 'Create Account' : 'Sign In'}
                </button>

                <div className="flex flex-col gap-4 items-center pt-4">
                  <button
                    type="button"
                    onClick={() => setIsSigningUp(!isSigningUp)}
                    className="text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-white transition-colors"
                  >
                    {isSigningUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setAuthMode('google')}
                    className="text-xs text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Back to Google Login
                  </button>
                </div>
              </motion.form>
            )}
          </div>

          <div className="pt-12 border-t border-white/10 mt-12">
            <div className="flex items-center justify-between mb-8">
              <div className="text-left">
                <h2 className="text-2xl font-bold text-white">Public Treasury</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Proof of Reserves & Transparency</p>
              </div>
              <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                Live Data
              </div>
            </div>
            
            <TreasuryDashboard 
              treasury={treasury} 
              isAdmin={false} 
              onVote={voteTreasury}
              isLoggedIn={!!user}
              recentVotes={votes}
            />
            
            <p className="mt-8 text-[10px] text-gray-600 leading-relaxed max-w-sm mx-auto">
              TiggyBank maintains a 1:1 reserve ratio for all user deposits. Our treasury is diversified across major crypto assets and stablecoins to ensure maximum liquidity and security.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const withdrawable = profile ? profile.balance - profile.lockedSavings : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24">
      {showLevelUp && (
        <LevelUpOverlay 
          level={showLevelUp} 
          onComplete={() => setShowLevelUp(null)} 
        />
      )}

      <DepositModal 
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDeposit={deposit}
        isAdmin={isAdmin}
        treasuryAddress={import.meta.env.VITE_TREASURY_ADDRESS || '0x109d273bc4ea81b36b2c1d051ae336a9780f4eeb'}
        walletAddress={walletAddress}
        onConnect={connect}
      />

      <WalletModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        address={walletAddress}
        balance={walletBalance}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      <PrepaidCardModal 
        isOpen={isPrepaidCardModalOpen}
        onClose={() => setIsPrepaidCardModalOpen(false)}
        onActivate={linkPrepaidCard}
      />

      {/* Notifications */}
      <AnimatePresence>
        {(error || successMessage) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6"
          >
            <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center justify-between ${error ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
              <div className="flex items-center gap-3">
                {error ? <Shield className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                <p className="text-sm font-bold">{error || successMessage}</p>
              </div>
              <button onClick={() => { setError(null); setSuccessMessage(null); }} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-black/50 backdrop-blur-lg z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Badge type={BADGE_MAP[profile?.level || 1]} size="sm" />
          <div>
            <h2 className="text-sm font-medium text-gray-400">Level {profile?.level}</h2>
            <p className="text-xs text-emerald-500 font-bold">{BADGE_MAP[profile?.level || 1]} Badge</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {profile?.isPremium && (
            <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-yellow-500/20 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Premium
            </div>
          )}
          
          <button 
            type="button"
            id="wallet-connect-btn"
            onClick={() => setIsWalletModalOpen(true)}
            className={`relative z-[100] px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              walletAddress 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : 'bg-white text-black hover:bg-gray-200 shadow-lg'
            }`}
          >
            <Wallet className="w-3 h-3" />
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
          </button>

          <button 
            onClick={() => setView('profile')}
            className={`p-2 rounded-xl transition-colors relative ${view === 'profile' ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <CreditCard className="w-5 h-5" />
            {isAdmin && pendingWithdrawals.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                {pendingWithdrawals.length}
              </span>
            )}
          </button>
          <button onClick={() => signOut(auth)} className="p-2 text-gray-500 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 p-8 rounded-[32px] mb-6 shadow-2xl shadow-emerald-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Wallet className="w-32 h-32" />
                </div>
                <p className="text-emerald-100/70 text-sm font-medium mb-1">Total Balance</p>
                <h3 className="text-5xl font-bold mb-6">${profile?.balance.toLocaleString()} <span className="text-xl opacity-50 font-normal">CAD</span></h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 text-emerald-200/60 text-xs mb-1">
                      <Lock className="w-3 h-3" /> Locked
                    </div>
                    <p className="font-bold">${profile?.lockedSavings.toLocaleString()}</p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 text-emerald-200/60 text-xs mb-1">
                      <TrendingUp className="w-3 h-3" /> Withdrawable
                    </div>
                    <p className="font-bold">${withdrawable.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => setIsDepositModalOpen(true)}
                  className="bg-white text-black p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" /> Add Funds
                </button>
                <button 
                  onClick={() => setView('withdraw')}
                  className="bg-emerald-500 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-95"
                >
                  <ArrowUpRight className="w-5 h-5" /> Withdraw
                </button>
              </div>

              {/* Admin Quick Access */}
              {isAdmin && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setView('admin')}
                  className="w-full bg-purple-500/10 border border-purple-500/30 p-6 rounded-3xl mb-6 flex items-center justify-between group hover:bg-purple-500/20 transition-all"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
                      <Shield className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-500">Admin Fulfillment Center</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{pendingWithdrawals.length} Pending Payouts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingWithdrawals.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Action Required
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-purple-500" />
                  </div>
                </motion.button>
              )}

              {/* Card Activation Prompt */}
              {!profile?.isCardActive && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setIsPrepaidCardModalOpen(true)}
                  className="w-full bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-3xl mb-6 flex items-center justify-between group hover:bg-emerald-500/20 transition-all"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-500">Activate Keycard</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Unlock Vault Access</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-500" />
                </motion.button>
              )}

              {/* Premium Upgrade */}
              {!profile?.isPremium && (
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-6 rounded-3xl mb-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-yellow-500 flex items-center gap-2">
                      <Crown className="w-4 h-4" /> Go Premium
                    </h4>
                    <p className="text-xs text-gray-400">Unlimited withdrawals & priority support.</p>
                  </div>
                  <button 
                    onClick={() => {
                      // Simulate premium purchase
                      import('./firebase').then(({ db }) => {
                        import('firebase/firestore').then(({ doc, updateDoc }) => {
                          updateDoc(doc(db, 'users', user.uid), { isPremium: true });
                        });
                      });
                    }}
                    className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Upgrade
                  </button>
                </div>
              )}

              {/* Level Progress */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold">Level {profile?.level} Progression</h4>
                  <span className="text-xs text-gray-500">Next: ${LEVEL_THRESHOLDS[(profile?.level || 1) + 1]?.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (profile?.balance || 0) / (LEVEL_THRESHOLDS[(profile?.level || 1) + 1] || 1) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Maintain ${LEVEL_THRESHOLDS[profile?.level || 1]} to keep your {BADGE_MAP[profile?.level || 1]} status.
                </p>
              </div>

              {/* Premium Upgrade */}
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setView('dashboard')} className="p-2 bg-white/5 rounded-xl">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-2xl font-bold">My Profile</h2>
              </div>

              <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] mb-6 text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} className="w-full h-full rounded-full object-cover" alt="Profile" />
                  ) : (
                    <Wallet className="w-10 h-10 text-emerald-500" />
                  )}
                </div>
                <h3 className="text-xl font-bold">{profile?.displayName}</h3>
                <p className="text-gray-500 text-sm mb-4">{profile?.email}</p>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
                  Level {profile?.level} {BADGE_MAP[profile?.level || 1]}
                </div>
              </div>

              {/* Keycard Status */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    <h4 className="font-bold">Tiggy Keycard</h4>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${profile?.isCardActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                    {profile?.isCardActive ? 'Active' : 'Not Activated'}
                  </div>
                </div>

                {profile?.isCardActive ? (
                  <div className="space-y-4">
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Card Identifier</p>
                        <p className="text-sm font-mono text-emerald-500">{profile.prepaidCardId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Last 4</p>
                        <p className="text-sm font-mono text-white">**** {profile.cardDetails?.last4}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 italic text-center">
                      "Identity confirmed. Access expanding."
                    </p>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsPrepaidCardModalOpen(true)}
                    className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold hover:bg-emerald-400 transition-all active:scale-95"
                  >
                    Activate Your Artifact
                  </button>
                )}
              </div>

              {/* Admin & God Mode Controls */}
              {isAdmin && (
                <div className="space-y-6">
                  {/* God Mode Privileges */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="w-5 h-5 text-emerald-500" />
                      <h4 className="font-bold text-emerald-500 uppercase tracking-widest text-xs">God Mode Privileges</h4>
                    </div>
                    
                    {profile?.isCardActive ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-black/40 p-3 rounded-xl border border-emerald-500/20">
                            <p className="text-[9px] text-emerald-500/50 uppercase font-bold mb-1">Split Status</p>
                            <p className="text-xs font-bold text-white">Bypassed (100%)</p>
                          </div>
                          <div className="bg-black/40 p-3 rounded-xl border border-emerald-500/20">
                            <p className="text-[9px] text-emerald-500/50 uppercase font-bold mb-1">Auto-Approve</p>
                            <p className="text-xs font-bold text-white">Infinite</p>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-3">Forge Value</p>
                          <div className="flex gap-2">
                            <input 
                              type="number"
                              value={forgeAmount}
                              onChange={(e) => setForgeAmount(Number(e.target.value))}
                              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500/50"
                            />
                            <button 
                              onClick={async () => {
                                setIsForging(true);
                                try {
                                  await forgeValue(forgeAmount);
                                  setSuccessMessage(`Forged ${forgeAmount} CAD. The ledger expands.`);
                                } catch (e: any) {
                                  setError(e.message);
                                } finally {
                                  setIsForging(false);
                                }
                              }}
                              disabled={isForging}
                              className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-400 disabled:opacity-50 transition-all"
                            >
                              {isForging ? 'Forging...' : 'Forge'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-500 italic mb-4">
                          "Activate Keycard to unlock Architect overrides."
                        </p>
                        <button 
                          onClick={() => setIsPrepaidCardModalOpen(true)}
                          className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest border border-emerald-500/30 px-4 py-2 rounded-full hover:bg-emerald-500/10 transition-all"
                        >
                          Activate Architect Key
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Payout Management */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Payout Management
                    </h4>
                    
                    <div className="flex flex-col gap-4">
                      {pendingWithdrawals.length > 0 && (
                        <button 
                          onClick={() => setView('admin')}
                          className="w-full bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between group hover:bg-red-500/20 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-red-500">{pendingWithdrawals.length} Pending Payouts</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-red-500" />
                        </button>
                      )}

                      {profile?.prepaidCardId && (
                        <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Linked Card</p>
                            <p className="text-sm font-mono text-emerald-500">{profile.prepaidCardId}</p>
                          </div>
                          <button 
                            onClick={() => linkPrepaidCard('', { last4: '', expiry: '', cvv: '' })}
                            className="text-[10px] text-red-500 font-bold hover:underline"
                          >
                            Unlink
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                  <span className="text-sm text-gray-400">Account Created</span>
                  <span className="text-sm font-medium">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                  <span className="text-sm text-gray-400">Premium Status</span>
                  <span className={`text-sm font-bold ${profile?.isPremium ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {profile?.isPremium ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'admin' && isAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setView('dashboard')} className="p-2 bg-white/5 rounded-xl">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">Fulfillment Center</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Pending Payouts</p>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      // Create a mock pending withdrawal for testing
                      await withdraw(25, 'TEST_ADDRESS_0x123', false);
                      setSuccessMessage('Test withdrawal request created (Simulation).');
                    } catch (e: any) {
                      setError(e.message);
                    }
                  }}
                  className="bg-purple-500/10 text-purple-500 border border-purple-500/20 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-purple-500/20 transition-all"
                >
                  Simulate Request
                </button>
              </div>

              <div className="space-y-4">
                {pendingWithdrawals.length > 0 ? (
                  pendingWithdrawals.map((w) => (
                    <div key={w.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">Payout Request</p>
                          <p className="text-xl font-bold">${w.amountCAD} CAD</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${w.method === 'prepaid_card' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-purple-500/10 text-purple-500'}`}>
                          {w.method === 'prepaid_card' ? 'Shakepay' : 'Polygon'}
                        </div>
                      </div>

                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 mb-6 space-y-3">
                        <div>
                          <p className="text-[8px] text-gray-500 uppercase font-bold">Destination</p>
                          <p className="text-xs font-mono break-all">{w.payoutAddress}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-500 uppercase font-bold">User UID</p>
                          <p className="text-[10px] text-gray-400">{w.uid}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Hash / Confirmation Code"
                          id={`hash-${w.id}`}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500/50"
                        />
                        <button 
                          onClick={async () => {
                            const input = document.getElementById(`hash-${w.id}`) as HTMLInputElement;
                            const hash = input?.value;
                            if (hash) {
                              try {
                                await fulfillWithdrawal(w.id, hash);
                                setSuccessMessage('Withdrawal fulfilled successfully. Ledger updated.');
                                if (input) input.value = '';
                              } catch (e: any) {
                                setError(e.message);
                              }
                            }
                          }}
                          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all"
                        >
                          Fulfill
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">All payouts are up to date.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'withdraw' && (
            <motion.div
              key="withdraw"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setView('dashboard')} className="p-2 bg-white/5 rounded-xl">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-2xl font-bold">Withdraw Crypto</h2>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-6">
                <div className="flex justify-between mb-6">
                  <span className="text-gray-400">Available to Withdraw</span>
                  <span className="font-bold text-emerald-500">${withdrawable.toLocaleString()} CAD</span>
                </div>

                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                          {isAdmin ? <Shield className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                          {isAdmin ? 'God Mode' : 'Institutional Payout'}
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          {isPrepaid 
                            ? (isAdmin ? 'Prepaid Card Withdrawal (No 60/40 Split)' : 'Direct to Prepaid Card (60/40 Split applies)')
                            : 'Standard Polygon Network Withdrawal'}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          const nextState = !isPrepaid;
                          setIsPrepaid(nextState);
                          if (nextState && profile?.prepaidCardId) {
                            setPayoutAddress(profile.prepaidCardId);
                          } else if (!nextState) {
                            setPayoutAddress('');
                          }
                        }}
                        className={`w-10 h-5 rounded-full transition-colors relative ${isPrepaid ? 'bg-emerald-500' : 'bg-gray-700'}`}
                      >
                        <motion.div 
                          animate={{ x: isPrepaid ? 22 : 2 }}
                          className="absolute top-1 w-3 h-3 bg-white rounded-full"
                        />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Amount (CAD)</label>
                    <input 
                      type="number" 
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black border border-white/10 p-4 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">
                      {isPrepaid ? 'Prepaid Card Number / ID' : 'Polygon Payout Address'}
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={payoutAddress}
                        onChange={(e) => setPayoutAddress(e.target.value)}
                        placeholder={isPrepaid ? "Enter Card Number (e.g. 4500...)" : "0x..."}
                        className="w-full bg-black border border-white/10 p-4 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      {isPrepaid && profile?.prepaidCardId && payoutAddress !== profile.prepaidCardId && (
                        <button 
                          onClick={() => setPayoutAddress(profile.prepaidCardId!)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-lg font-bold hover:bg-emerald-500/30 transition-colors"
                        >
                          Use Linked
                        </button>
                      )}
                    </div>
                    {isPrepaid && !profile?.prepaidCardId && (
                      <p className="text-[10px] text-yellow-500 mt-2 italic">
                        Tip: Link a card in your profile for instant {isAdmin ? 'God Mode' : 'Institutional'} payouts.
                      </p>
                    )}
                    {!isPrepaid && !walletAddress && (
                      <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
                        <p className="text-[10px] text-purple-400 font-bold uppercase">Wallet Not Connected</p>
                        <button 
                          onClick={() => connect()}
                          className="text-[10px] bg-purple-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-purple-400 transition-colors"
                        >
                          Connect Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <h4 className="text-xs font-bold text-emerald-500 uppercase mb-3">
                    {isGodMode ? 'God Mode Summary' : (isPrepaid ? 'Institutional Summary' : '60/40 Split Summary')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{isGodMode ? 'Total Payout' : (isPrepaid ? 'To Prepaid Card' : 'To your wallet (60%)')}</span>
                      <span>${(Number(withdrawAmount) * (isGodMode || isPrepaid ? 1 : 0.6)).toFixed(2)}</span>
                    </div>
                    {!isGodMode && !isPrepaid && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">To savings vault (40%)</span>
                        <span>${(Number(withdrawAmount) * 0.4).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-white/5 flex justify-between font-bold">
                      <span>Total</span>
                      <span>${Number(withdrawAmount).toFixed(2)}</span>
                    </div>
                    {!isPrepaid && Number(withdrawAmount) > 0 && (
                      <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] text-purple-400 font-bold uppercase">Estimated MATIC</span>
                        <span className="text-sm font-bold text-purple-500">
                          {((Number(withdrawAmount) * (isGodMode ? 1 : 0.6) * CAD_USD_RATE) / MATIC_USD_RATE).toFixed(4)} MATIC
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setIsConfirmingWithdraw(true)}
                  disabled={
                    !withdrawAmount || 
                    !payoutAddress || 
                    isWithdrawing || 
                    Number(withdrawAmount) > (isAdmin ? profile?.balance || 0 : withdrawable) ||
                    (!isPrepaid && !walletAddress)
                  }
                  className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold mt-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isWithdrawing ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    isPrepaid ? (isAdmin ? 'Initiate God Mode Payout' : 'Initiate Institutional Payout') : 'Initiate Withdrawal'
                  )}
                </button>

                <AnimatePresence>
                  {isConfirmingWithdraw && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        onClick={() => setIsConfirmingWithdraw(false)}
                      />
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[40px] max-w-sm w-full relative z-10 text-center shadow-2xl"
                      >
                        <h3 className="text-xl font-bold mb-4">Confirm Payout</h3>
                        <p className="text-xs text-gray-500 mb-6 uppercase tracking-widest font-bold">Review Transaction Details</p>
                        
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-8 text-left space-y-4">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Amount</p>
                            <p className="text-xl font-bold text-emerald-500">${Number(withdrawAmount).toFixed(2)} CAD</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                            <div>
                              <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Payout (60%)</p>
                              <p className="text-xs font-bold">${(Number(withdrawAmount) * (isPrepaid ? 1 : 0.6)).toFixed(2)}</p>
                            </div>
                            {!isPrepaid && (
                              <div>
                                <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Savings (40%)</p>
                                <p className="text-xs font-bold">${(Number(withdrawAmount) * 0.4).toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Payout Destination</p>
                            <p className="text-xs font-mono break-all text-gray-300 bg-black/40 p-2 rounded-lg border border-white/5">{payoutAddress}</p>
                          </div>
                          {!isPrepaid && (
                            <div className="pt-2 border-t border-white/5">
                              <p className="text-[10px] text-purple-400 uppercase font-bold mb-1">Estimated MATIC Payout</p>
                              <p className="text-lg font-bold text-purple-500">
                                {((Number(withdrawAmount) * 0.6 * CAD_USD_RATE) / MATIC_USD_RATE).toFixed(4)} MATIC
                              </p>
                              <p className="text-[8px] text-gray-500 italic">Based on current rate: 1 MATIC = ${MATIC_USD_RATE} USD</p>
                            </div>
                          )}
                          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Method</p>
                              <p className="text-xs font-bold text-white">{isPrepaid ? 'Prepaid Card / Shakepay' : 'Polygon Network'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Fee</p>
                              <p className="text-xs font-bold text-red-500">${WITHDRAWAL_FEE} CAD</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => setIsConfirmingWithdraw(false)}
                            className="flex-1 py-4 rounded-2xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors text-gray-400"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={async () => {
                              setIsConfirmingWithdraw(false);
                              try {
                                setIsWithdrawing(true);
                                setError(null);
                                await withdraw(Number(withdrawAmount), payoutAddress, isPrepaid);
                                setView('dashboard');
                                setIsPrepaid(false);
                                setWithdrawAmount('');
                                setPayoutAddress('');
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'Withdrawal failed');
                              } finally {
                                setIsWithdrawing(false);
                              }
                            }}
                            className="flex-1 py-4 rounded-2xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 transition-colors text-white shadow-lg shadow-emerald-500/20"
                          >
                            Confirm
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
                {error && (
                  <p className="text-xs text-red-500 mt-2 text-center font-bold">{error}</p>
                )}
                <p className="text-[10px] text-center text-gray-500 mt-4">
                  Fee: ${WITHDRAWAL_FEE} CAD per transaction. Auto-approved if &lt; $20.
                </p>
                <p className="text-[8px] text-center text-yellow-500/40 mt-2 uppercase tracking-widest">
                  Prototype Environment: Hashes are simulated for demonstration.
                </p>
              </div>
            </motion.div>
          )}

          {view === 'savings' && (
            <motion.div
              key="savings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold mb-8">Level Progression</h2>
              <div className="space-y-4">
                {Object.entries(LEVEL_THRESHOLDS).map(([lvl, threshold]) => {
                  const levelNum = Number(lvl);
                  const isReached = (profile?.level || 1) >= levelNum;
                  const isCurrent = profile?.level === levelNum;
                  
                  return (
                    <div 
                      key={lvl}
                      className={`p-4 rounded-2xl border flex items-center justify-between ${
                        isCurrent ? 'bg-emerald-500/10 border-emerald-500' : 
                        isReached ? 'bg-white/5 border-white/10' : 'bg-white/5 border-transparent opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Badge type={BADGE_MAP[levelNum]} size="sm" animate={isCurrent} />
                        <div>
                          <p className="font-bold">Level {lvl}</p>
                          <p className="text-xs text-gray-500">${threshold.toLocaleString()} Locked</p>
                        </div>
                      </div>
                      {isReached && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold mb-8">Transaction History</h2>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold capitalize">{tx.type.replace('_', ' ')}</p>
                          <p className="text-[10px] text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} CAD
                          </p>
                          {tx.status === 'awaiting_fulfillment' && (
                            <div className="flex items-center gap-1 mt-1 justify-end">
                              <motion.div 
                                animate={{ opacity: [1, 0.4, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-1.5 h-1.5 rounded-full bg-yellow-500"
                              />
                              <span className="text-[8px] text-yellow-500 font-black uppercase tracking-tighter">Awaiting Treasury Fulfillment</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {tx.txHash && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[8px] text-gray-500 uppercase font-bold">
                              {tx.type.includes('prepaid') ? 'Routing ID' : 'Polygon Hash'}
                            </span>
                            <span className="text-[10px] text-emerald-500 font-mono truncate max-w-[150px]">{tx.txHash}</span>
                          </div>
                          {tx.type.includes('prepaid') ? (
                            <div className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20">
                              Internal Route
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-yellow-500/50 uppercase font-bold">Prototype</span>
                              <a 
                                href={`https://polygonscan.com/tx/${tx.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                              >
                                Verify
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                  <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No transactions yet.</p>
                  <p className="text-xs text-gray-600 mt-2">Your deposits and withdrawals will appear here.</p>
                </div>
              )}
            </motion.div>
          )}

          {view === 'games' && (
            <motion.div
              key="games"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GameView 
                balance={profile?.balance || 0} 
                level={profile?.level || 1}
                onPlay={playGames}
                isAdmin={isAdmin}
              />
            </motion.div>
          )}

          {view === 'treasury' && (
            <motion.div
              key="treasury"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TreasuryDashboard 
                treasury={treasury} 
                isAdmin={isAdmin} 
                onVote={voteTreasury}
                isLoggedIn={!!user}
                recentVotes={votes}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/5 z-40">
        <div className="max-w-lg mx-auto flex justify-around items-center">
          <button 
            onClick={() => setView('dashboard')}
            className={`p-3 rounded-2xl flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-emerald-500' : 'text-gray-500'}`}
          >
            <Wallet className="w-6 h-6" />
            <span className="text-[10px] font-bold">Wallet</span>
          </button>
          <button 
            onClick={() => setView('savings')}
            className={`p-3 rounded-2xl flex flex-col items-center gap-1 ${view === 'savings' ? 'text-emerald-500' : 'text-gray-500'}`}
          >
            <Lock className="w-6 h-6" />
            <span className="text-[10px] font-bold">Savings</span>
          </button>
          <button 
            onClick={() => setView('games')}
            className={`p-3 rounded-2xl flex flex-col items-center gap-1 ${view === 'games' ? 'text-emerald-500' : 'text-gray-500'}`}
          >
            <Gamepad2 className="w-6 h-6" />
            <span className="text-[10px] font-bold">Games</span>
          </button>
          <button 
            onClick={() => setView('history')}
            className={`p-3 rounded-2xl flex flex-col items-center gap-1 ${view === 'history' ? 'text-emerald-500' : 'text-gray-500'}`}
          >
            <History className="w-6 h-6" />
            <span className="text-[10px] font-bold">History</span>
          </button>
          <button 
            onClick={() => setView('treasury')}
            className={`p-3 rounded-2xl flex flex-col items-center gap-1 ${view === 'treasury' ? 'text-emerald-500' : 'text-gray-500'}`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-[10px] font-bold">Treasury</span>
          </button>
        </div>
      </nav>
      <ChatAssistant 
        userContext={profile ? `User is Level ${profile.level} with a balance of $${profile.balance} CAD. They have $${profile.lockedSavings} CAD in locked savings.` : undefined} 
        onDeposit={async (amount) => {
          await deposit(amount);
          setSuccessMessage(`Successfully deposited ${amount} MATIC`);
        }}
        onWithdraw={async (amount, address) => {
          await withdraw(amount, address);
          setSuccessMessage(`Withdrawal of $${amount} CAD initiated to ${address}`);
        }}
        onPlayGames={async (bet, win) => {
          await playGames(bet, win);
        }}
      />
    </div>
  );
}
