import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Shield, Lock, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface PrepaidCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (cardId: string, details: { last4: string, expiry: string, cvv: string }) => Promise<void>;
}

export const PrepaidCardModal: React.FC<PrepaidCardModalProps> = ({ isOpen, onClose, onActivate }) => {
  const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro');
  const [loading, setLoading] = useState(false);
  const [cardId, setCardId] = useState('');
  const [last4, setLast4] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleActivate = async () => {
    setLoading(true);
    try {
      await onActivate(cardId || 'TIGGY-KEY-777', { last4, expiry, cvv });
      setStep('success');
    } catch (error) {
      console.error('Activation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[40px] overflow-hidden relative z-10 shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Keycard Activation</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-8">
              {step === 'intro' && (
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 relative"
                  >
                    <CreditCard className="w-12 h-12 text-emerald-500" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl"
                    />
                  </motion.div>
                  
                  <h4 className="text-2xl font-bold mb-4">The Artifact Has Arrived</h4>
                  <p className="text-sm text-gray-400 mb-8 leading-relaxed italic">
                    "A Keycard has arrived. The vault stirs. Forged from the circuitry of the vault itself, 
                    this is more than a payment tool—it is a binding."
                  </p>

                  <button 
                    onClick={() => setStep('form')}
                    className="w-full bg-emerald-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                  >
                    Activate Keycard
                  </button>
                </div>
              )}

              {step === 'form' && (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-8">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-4 tracking-widest">Enter Artifact Details</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[8px] text-gray-500 uppercase font-bold mb-1 block ml-1">Card ID / Identifier</label>
                        <input 
                          type="text" 
                          placeholder="TIGGY-KEY-XXXX"
                          value={cardId}
                          onChange={(e) => setCardId(e.target.value)}
                          className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm font-mono focus:border-emerald-500/50 outline-none transition-colors"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[8px] text-gray-500 uppercase font-bold mb-1 block ml-1">Last 4 Digits</label>
                          <input 
                            type="text" 
                            maxLength={4}
                            placeholder="0000"
                            value={last4}
                            onChange={(e) => setLast4(e.target.value)}
                            className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm font-mono focus:border-emerald-500/50 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-gray-500 uppercase font-bold mb-1 block ml-1">Expiry (MM/YY)</label>
                          <input 
                            type="text" 
                            placeholder="00/00"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm font-mono focus:border-emerald-500/50 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[8px] text-gray-500 uppercase font-bold mb-1 block ml-1">Security Code (CVV)</label>
                        <input 
                          type="password" 
                          maxLength={3}
                          placeholder="***"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm font-mono focus:border-emerald-500/50 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleActivate}
                    disabled={loading || !last4 || !expiry || !cvv}
                    className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Binding Identity...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Forge The Binding
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-4">
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                  >
                    <CheckCircle2 className="w-10 h-10 text-black" />
                  </motion.div>
                  
                  <h4 className="text-2xl font-bold mb-4">Identity Locked</h4>
                  <p className="text-sm text-emerald-500/80 mb-8 leading-relaxed font-medium">
                    "The vault acknowledges your presence. Identity confirmed. Access expanding."
                  </p>

                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-8 text-left space-y-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <p className="text-[10px] text-gray-300 uppercase font-bold tracking-widest">Vault Permissions Unlocked</p>
                    </div>
                    <ul className="space-y-2">
                      <li className="text-[9px] text-gray-500 flex items-center gap-2">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                        Auto-approve withdrawals &lt; $20
                      </li>
                      <li className="text-[9px] text-gray-500 flex items-center gap-2">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                        Contributor Payouts Active
                      </li>
                      <li className="text-[9px] text-gray-500 flex items-center gap-2">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                        Treasury Interactions Enabled
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={onClose}
                    className="w-full bg-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95"
                  >
                    Enter The Chamber
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-emerald-500/5 border-t border-white/5 flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <p className="text-[8px] text-emerald-500/60 font-bold uppercase tracking-[0.2em]">
                System-Level Authentication Active
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
