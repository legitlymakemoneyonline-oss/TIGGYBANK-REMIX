import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Upload, Send, X, CheckCircle2, AlertCircle, Loader2, Globe, ShieldCheck } from 'lucide-react';
import jsQR from 'jsqr';

interface BillPayProps {
  balance: number;
  onPay: (amount: number, destination: string, network: 'polygon' | 'tron') => Promise<string>;
  isPrivateMode: boolean;
  isConnected: boolean;
}

export const BillPay: React.FC<BillPayProps> = ({ balance, onPay, isPrivateMode, isConnected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'scan' | 'confirm' | 'processing' | 'success' | 'error'>('scan');
  const [amount, setAmount] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [network, setNetwork] = useState<'polygon' | 'tron'>('polygon');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          // Robust QR data parsing
          let data = code.data.trim();
          let detectedNetwork: 'polygon' | 'tron' = 'polygon';

          // Handle URI prefixes (ethereum:, polygon:, tron:, web3:, etc.)
          if (data.includes(':')) {
            const parts = data.split(':');
            const prefix = parts[0].toLowerCase();
            data = parts[1];

            if (prefix === 'tron') {
              detectedNetwork = 'tron';
            } else {
              detectedNetwork = 'polygon';
            }
          }

          // Strip query parameters (?amount=..., ?value=..., etc.)
          if (data.includes('?')) {
            data = data.split('?')[0];
          }

          setDestination(data);
          
          // Final network auto-detection based on address format if not explicitly set by prefix
          if (data.startsWith('T')) {
            setNetwork('tron');
          } else if (data.startsWith('0x')) {
            setNetwork('polygon');
          } else {
            setNetwork(detectedNetwork);
          }

          setStep('confirm');
        } else {
          setError('Could not find a valid QR code in the image.');
          setStep('error');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePay = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (numAmount > balance) {
      setError('Insufficient balance.');
      return;
    }

    setStep('processing');
    try {
      const hash = await onPay(numAmount, destination, network);
      setTxHash(hash);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setStep('error');
    }
  };

  const reset = () => {
    setStep('scan');
    setAmount('');
    setDestination('');
    setError(null);
    setTxHash(null);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all group"
      >
        <QrCode className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Pay Bill</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Pay Bill</h2>
                    <p className="text-xs text-zinc-400">Scan QR to initiate payment</p>
                  </div>
                </div>
                <button onClick={reset} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-6">
                {step === 'scan' && (
                  <div className="space-y-6">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer transition-all group"
                    >
                      <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-zinc-400 group-hover:text-emerald-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium">Upload Payment QR</p>
                        <p className="text-sm text-zinc-500">Click to select image</p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-zinc-900 px-2 text-zinc-500">Or enter manually</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Destination Address</label>
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          placeholder="0x... or T..."
                          className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (destination) {
                            if (destination.startsWith('0x')) setNetwork('polygon');
                            else if (destination.startsWith('T')) setNetwork('tron');
                            setStep('confirm');
                          }
                        }}
                        disabled={!destination}
                        className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {step === 'confirm' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Network</span>
                        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg border border-white/5">
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span className="text-white text-xs font-bold uppercase">{network}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Recipient</span>
                        <span className="text-white text-xs font-mono truncate max-w-[200px]">{destination}</span>
                      </div>
                      <div className="pt-4 border-t border-white/5">
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Amount to Pay (CAD)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-zinc-800 border border-white/5 rounded-xl pl-8 pr-4 py-4 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                          />
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">Available: ${balance.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      <p className="text-xs text-emerald-400/80">
                        {isPrivateMode ? 'Private Mode Active: Transaction will be obfuscated in the ledger.' : 'Standard Transaction: Details will be logged in your savings ledger.'}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('scan')}
                        className="flex-1 py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePay}
                        disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || !isConnected}
                        className="flex-[2] py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {!isConnected ? 'Connect Wallet First' : 'Confirm Payment'}
                      </button>
                    </div>
                  </div>
                )}

                {step === 'processing' && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-emerald-500/20 rounded-full animate-pulse"></div>
                      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Processing Payment</h3>
                      <p className="text-zinc-400 text-sm mt-2">Broadcasting to the {network} network...</p>
                    </div>
                  </div>
                )}

                {step === 'success' && (
                  <div className="py-8 flex flex-col items-center justify-center space-y-6 text-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Payment Successful</h3>
                      <p className="text-zinc-400 text-sm mt-2">Your bill has been paid and logged.</p>
                    </div>
                    {txHash && (
                      <div className="w-full p-4 bg-zinc-800 rounded-xl border border-white/5">
                        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Transaction Hash</p>
                        <p className="text-xs text-emerald-400 font-mono break-all">{txHash}</p>
                      </div>
                    )}
                    <button
                      onClick={reset}
                      className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all"
                    >
                      Done
                    </button>
                  </div>
                )}

                {step === 'error' && (
                  <div className="py-8 flex flex-col items-center justify-center space-y-6 text-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Payment Failed</h3>
                      <p className="text-red-400 text-sm mt-2">{error}</p>
                    </div>
                    <button
                      onClick={() => setStep('confirm')}
                      className="w-full py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
