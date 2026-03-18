import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Wallet, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number, method: 'polygon' | 'prepaid') => Promise<string | void>;
  isAdmin?: boolean;
  treasuryAddress?: string;
  walletAddress?: string | null;
  onConnect?: () => Promise<string>;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onDeposit, isAdmin, treasuryAddress, walletAddress, onConnect }) => {
  const [step, setStep] = useState<'method' | 'amount' | 'confirm' | 'processing' | 'success'>('method');
  const [method, setMethod] = useState<'polygon' | 'prepaid' | null>(null);
  const [amount, setAmount] = useState('100');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = () => {
    if (treasuryAddress) {
      navigator.clipboard.writeText(treasuryAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeposit = async () => {
    if (!method) return;
    
    if (method === 'polygon' && !walletAddress && onConnect) {
      try {
        await onConnect();
        return; // Stay on amount screen so they can confirm again
      } catch (err) {
        setError('Please connect your wallet to deposit crypto.');
        return;
      }
    }

    setIsProcessing(true);
    setStep('processing');
    setError(null);
    
    try {
      const hash = await onDeposit(Number(amount), method);
      if (hash) setTxHash(hash);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setStep('amount');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[40px] overflow-hidden relative z-10 shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold">Add Funds</h3>
                {isAdmin && (
                  <span className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.2em]">God Mode Enabled</span>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-8">
              {step === 'method' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-4">Select Payment Method</p>
                  <MethodCard 
                    title="Prepaid Card" 
                    desc="Instant deposit via Visa/Mastercard" 
                    icon={<CreditCard className="w-6 h-6 text-emerald-500" />}
                    onClick={() => { setMethod('prepaid'); setStep('amount'); }}
                  />
                  <MethodCard 
                    title="Polygon (MATIC)" 
                    desc="Direct crypto transfer from wallet" 
                    icon={<Wallet className="w-6 h-6 text-purple-500" />}
                    onClick={() => { setMethod('polygon'); setStep('amount'); }}
                  />
                </div>
              )}

              {step === 'amount' && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Amount (CAD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-black border border-white/10 p-4 pl-8 rounded-2xl focus:outline-none focus:border-emerald-500 transition-colors text-xl font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[50, 100, 500].map(val => (
                      <button 
                        key={val}
                        onClick={() => setAmount(val.toString())}
                        className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                          amount === val.toString() 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5" />
                    <p className="text-[10px] text-blue-200/60 leading-relaxed">
                      All transactions are secured by TiggyBank's {isAdmin ? 'God Mode' : 'Institutional'} protocol. Your capital is protected and routed through our transparent savings ledger.
                    </p>
                  </div>

                  {method === 'polygon' && (
                    <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Treasury Polygon Address</p>
                        {copied && <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>}
                      </div>
                      <div className="flex gap-4">
                        <div 
                          onClick={handleCopy}
                          className="flex-1 bg-black/40 p-3 rounded-xl border border-white/5 cursor-pointer hover:border-purple-500/50 transition-colors group"
                        >
                          <p className="text-[10px] font-mono text-gray-400 break-all group-hover:text-white transition-colors">
                            {treasuryAddress || '0x109d273bc4ea81b36b2c1d051ae336a9780f4eeb'}
                          </p>
                        </div>
                        <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${treasuryAddress || '0x109d273bc4ea81b36b2c1d051ae336a9780f4eeb'}`} 
                            alt="QR Code"
                            className="w-full h-full"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Instructions:</p>
                        <ul className="text-[10px] text-gray-400 space-y-1 list-disc pl-4">
                          <li>{walletAddress ? `Connected: ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : 'Connect wallet (MetaMask, ELLIPAL, etc.) to automate transfer'}</li>
                          <li>Send MATIC or USDC on the Polygon network</li>
                          <li>Funds will be credited after network confirmation</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => setStep('confirm')}
                    className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    Review Deposit
                  </button>
                  {error && <p className="text-xs text-red-500 text-center font-bold">{error}</p>}
                  <button onClick={() => setStep('method')} className="w-full text-xs text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors">
                    Back
                  </button>
                </div>
              )}

              {step === 'confirm' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold mb-2">Confirm Deposit</h4>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Summary of your transaction</p>
                  </div>

                  <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase font-bold">Amount</span>
                      <span className="text-xl font-bold text-emerald-500">${Number(amount).toFixed(2)} CAD</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase font-bold">Method</span>
                      <span className="text-sm font-bold text-white">{method === 'prepaid' ? 'Prepaid Card' : 'Polygon Network'}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Destination Treasury</p>
                      <p className="text-[10px] font-mono text-gray-400 bg-black/40 p-3 rounded-xl border border-white/5 break-all">
                        {treasuryAddress || '0x109d273bc4ea81b36b2c1d051ae336a9780f4eeb'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <p className="text-[10px] text-yellow-200/60 leading-relaxed">
                      By confirming, you agree to the TiggyBank {isAdmin ? 'God Mode' : 'Institutional'} protocol. Funds will be credited after network confirmation.
                    </p>
                  </div>

                  <button 
                    onClick={handleDeposit}
                    className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    {method === 'polygon' && !walletAddress ? 'Connect & Deposit' : 'Confirm & Send'}
                  </button>
                  <button onClick={() => setStep('amount')} className="w-full text-xs text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors">
                    Edit Amount
                  </button>
                </div>
              )}

              {step === 'processing' && (
                <div className="py-12 text-center space-y-6">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"
                  />
                  <div>
                    <h4 className="text-xl font-bold mb-2">Processing Transaction</h4>
                    <p className="text-sm text-gray-500">Securing your funds in the TiggyBank vault...</p>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="py-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold mb-2">Deposit Successful!</h4>
                    <p className="text-sm text-gray-400 mb-4">Your balance has been updated and your level progression has advanced.</p>
                    {txHash && (
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5 mb-6">
                        <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Transaction Hash</p>
                        <p className="text-[10px] font-mono text-emerald-500 truncate">{txHash}</p>
                      </div>
                    )}
                    <button 
                      onClick={onClose}
                      className="w-full bg-white text-black py-4 rounded-2xl font-bold"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const MethodCard = ({ title, desc, icon, onClick }: { title: string; desc: string; icon: React.ReactNode; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all"
  >
    <div className="flex items-center gap-4">
      <div className="p-3 bg-black rounded-xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-left">
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-[10px] text-gray-500">{desc}</p>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" />
  </button>
);
