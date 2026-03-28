import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useConnect, useAccount } from 'wagmi';
import { 
  X, 
  Wallet, 
  ExternalLink, 
  LogOut, 
  Shield, 
  RefreshCw, 
  Copy, 
  CheckCircle2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string | null;
  balance: string;
  onConnect: (isSimulated?: boolean) => Promise<string>;
  onDisconnect: () => void;
  onReset?: () => void;
  isPrivateMode?: boolean;
}

export const WalletModal: React.FC<WalletModalProps> = ({ 
  isOpen, 
  onClose, 
  address, 
  balance, 
  onConnect, 
  onDisconnect,
  onReset,
  isPrivateMode
}) => {
  const { connectors, connectAsync } = useConnect();
  const { isConnecting } = useAccount();
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
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
                {isPrivateMode && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <Shield className="w-2 h-2 text-emerald-500" />
                    <span className="text-[8px] font-bold text-emerald-500 uppercase">Private</span>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-8">
              {!address ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-bold mb-1">Connect Wallet</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Select your preferred method</p>
                  </div>

                  <div className="space-y-2">
                    {/* Real Connectors */}
                    {connectors.map((connector) => (
                      <button 
                        key={connector.uid}
                        disabled={isConnecting}
                        onClick={async () => {
                          try {
                            await connectAsync({ connector });
                            onClose();
                          } catch (err) {
                            console.error('Connection failed:', err);
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all group active:scale-[0.98] disabled:opacity-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            {connector.name.toLowerCase().includes('metamask') ? (
                              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Mirror.svg" className="w-6 h-6" alt="MM" />
                            ) : connector.name.toLowerCase().includes('walletconnect') ? (
                              <img src="https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg" className="w-6 h-6" alt="WC" />
                            ) : (
                              <Shield className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold">
                              {connector.name.toLowerCase().includes('walletconnect') ? 'Ellipal / WalletConnect' : connector.name}
                            </p>
                            <p className="text-[8px] text-gray-500 uppercase tracking-widest">
                              {connector.name.toLowerCase().includes('walletconnect') ? 'Hardware / Mobile' : 'Web3 Wallet'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                      </button>
                    ))}

                    {/* Simulated Option */}
                    <button 
                      onClick={async () => {
                        await onConnect(true);
                        onClose();
                      }}
                      className="w-full bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-center justify-between hover:bg-emerald-500/10 transition-all group active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-emerald-500">Simulated Wallet</p>
                          <p className="text-[8px] text-emerald-500/40 uppercase tracking-widest">Testing Only</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-500/20 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  </div>

                  {/* Troubleshooting */}
                  <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        <p className="text-[10px] text-amber-500 font-bold uppercase">Connection Help</p>
                      </div>
                      <p className="text-[9px] text-gray-500 leading-relaxed mb-3">
                        If MetaMask is stuck, open the app in a <strong>New Tab</strong> to bypass iframe restrictions.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => window.open(window.location.href, '_blank')}
                          className="bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10"
                        >
                          <ExternalLink className="w-3 h-3" /> New Tab
                        </button>
                        <button 
                          onClick={() => {
                            const url = window.location.href.replace('https://', '');
                            window.open(`https://metamask.app.link/dapp/${url}`, '_blank');
                          }}
                          className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-orange-500/20"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Mirror.svg" className="w-3 h-3" alt="MM" /> Mobile Fix
                        </button>
                      </div>
                      <button 
                        onClick={() => onReset?.()}
                        className="w-full mt-2 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10"
                      >
                        <RefreshCw className="w-3 h-3" /> Reset Connection
                      </button>
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
