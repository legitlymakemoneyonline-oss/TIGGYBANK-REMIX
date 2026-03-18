import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, ExternalLink, LogOut, Shield, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string | null;
  balance: string;
  onConnect: () => Promise<string>;
  onDisconnect: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ 
  isOpen, 
  onClose, 
  address, 
  balance, 
  onConnect, 
  onDisconnect 
}) => {
  const [copied, setCopied] = React.useState(false);
  const isSimulated = address?.startsWith('0xSIM_');

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-[40px] overflow-hidden relative z-10 shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Wallet</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-8">
              {!address ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <Wallet className="w-8 h-8 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-bold mb-2">No Wallet Connected</h4>
                  <p className="text-xs text-gray-500 mb-8 leading-relaxed">
                    Connect your wallet (MetaMask, ELLIPAL, etc.) to enable Polygon withdrawals and real-time treasury interactions.
                  </p>
                  <button 
                    onClick={async () => {
                      try {
                        await onConnect();
                      } catch (err) {
                        // Error handled in hook
                      }
                    }}
                    className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-lg mb-4"
                  >
                    Connect Wallet
                  </button>

                  <div className="space-y-3">
                    <p className="text-[10px] text-gray-600 uppercase font-black tracking-[0.2em]">Connection Tools</p>
                    
                    <button 
                      onClick={() => {
                        const currentUrl = window.location.href;
                        navigator.clipboard.writeText(currentUrl);
                        alert('Current Link Copied! If you get a 403 error, please use the Public Shared Link instead.');
                      }}
                      className="w-full bg-white/5 border border-white/10 text-gray-400 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Copy className="w-3 h-3" /> Copy Current Link
                    </button>

                    <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                      <p className="text-[9px] text-blue-400 leading-relaxed">
                        <strong>Tip:</strong> If you see "Page not found", make sure you have clicked the <strong>"Share"</strong> button in AI Studio to activate your public link.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isSimulated ? 'bg-yellow-500' : 'bg-emerald-500'} animate-pulse`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {isSimulated ? 'Simulation Mode' : 'Connected to Polygon'}
                      </span>
                    </div>
                    {isSimulated && (
                      <div className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-yellow-500/20">
                        Demo
                      </div>
                    )}
                  </div>

                  {/* Balance Display */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Available Balance</p>
                    <h4 className="text-3xl font-bold text-white mb-1">
                      {parseFloat(balance).toFixed(4)} <span className="text-sm text-gray-500 font-medium">MATIC</span>
                    </h4>
                    <p className="text-[10px] text-emerald-500/60 font-medium">≈ ${(parseFloat(balance) * 0.4).toFixed(2)} CAD</p>
                  </div>

                  {/* Address Display */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Wallet Address</label>
                    <div className="flex items-center gap-2 bg-black border border-white/10 p-3 rounded-2xl">
                      <p className="text-xs font-mono text-gray-300 truncate flex-1">
                        {address}
                      </p>
                      <button 
                        onClick={handleCopy}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <a 
                      href={isSimulated ? '#' : `https://polygonscan.com/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      <ExternalLink className="w-3 h-3" /> Explorer
                    </a>
                    <button 
                      onClick={onDisconnect}
                      className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 transition-all"
                    >
                      <LogOut className="w-3 h-3" /> Disconnect
                    </button>
                  </div>

                  {isSimulated && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3">
                      <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                      <p className="text-[9px] text-blue-200/60 leading-relaxed">
                        You are in <strong>Simulation Mode</strong>. No real assets are required. Open in a new tab with MetaMask to use real Polygon assets.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
