import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Copy, 
  ShieldCheck, 
  Zap, 
  Pause, 
  Check,
  CreditCard
} from 'lucide-react';

interface VirtualCardProps {
  cardId: string;
  last4: string;
  expiry: string;
  cvc: string;
  balance: number;
  onTopUp?: () => void;
}

export const VirtualCard: React.FC<VirtualCardProps> = ({
  cardId,
  last4,
  expiry,
  cvc,
  balance,
  onTopUp
}) => {
  const [isShowingDetails, setIsShowingDetails] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fullCardNumber = cardId.replace(/[^0-9]/g, '').padEnd(16, '0');
  const formattedCardNumber = fullCardNumber.match(/.{1,4}/g)?.join(' ') || fullCardNumber;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* The Card Itself */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative aspect-[1.586/1] w-full rounded-[24px] p-6 text-white overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #1a1c2e 0%, #0f111a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Subtle pattern/texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        {/* Top Row */}
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-3">
            {/* Gold Chip */}
            <div className="w-10 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 relative overflow-hidden">
              <div className="absolute inset-0 flex flex-col justify-between p-1">
                <div className="h-[1px] w-full bg-black/20" />
                <div className="h-[1px] w-full bg-black/20" />
                <div className="h-[1px] w-full bg-black/20" />
              </div>
              <div className="absolute inset-0 flex justify-between p-1">
                <div className="w-[1px] h-full bg-black/20" />
                <div className="w-[1px] h-full bg-black/20" />
              </div>
            </div>
            <div className="p-1.5 bg-white/10 rounded-full">
              <Pause className="w-3 h-3 fill-white" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center overflow-hidden border border-amber-400/50">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=tiggy" alt="Tiggy" className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-widest text-xs">TIGGY</span>
          </div>
        </div>

        {/* Card Number */}
        <div className="mb-8">
          <p className="text-2xl font-mono tracking-[0.2em] text-white/90">
            {isShowingDetails ? formattedCardNumber : `**** **** **** ${last4}`}
          </p>
        </div>

        {/* Bottom Row */}
        <div className="flex justify-between items-end">
          <div className="flex gap-8">
            <div>
              <p className="text-[8px] text-white/40 uppercase font-bold tracking-wider mb-1">Valid Thru</p>
              <p className="text-sm font-medium">{expiry}</p>
            </div>
            <div>
              <p className="text-[8px] text-white/40 uppercase font-bold tracking-wider mb-1">Balance</p>
              <p className="text-sm font-bold">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-80 italic font-black text-xl tracking-tighter">
            VI <span className="text-amber-500">a|</span>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button 
          onClick={() => setIsShowingDetails(!isShowingDetails)}
          className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-colors"
        >
          {isShowingDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-sm font-medium">{isShowingDetails ? 'Hide' : 'Show'}</span>
        </button>
        <button 
          onClick={onTopUp}
          className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Top Up</span>
        </button>
        <button 
          onClick={() => handleCopy(fullCardNumber, 'card')}
          className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-colors"
        >
          {copiedField === 'card' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          <span className="text-sm font-medium">Copy</span>
        </button>
      </div>

      {/* Details List */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-500/80">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-medium">Sensitive — don't share these details</span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center group">
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Card Number</p>
              <p className="text-sm font-mono tracking-wider">{isShowingDetails ? fullCardNumber : `**** **** **** ${last4}`}</p>
            </div>
            <button 
              onClick={() => handleCopy(fullCardNumber, 'card-list')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors opacity-40 group-hover:opacity-100"
            >
              {copiedField === 'card-list' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex justify-between items-center group">
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Expiry</p>
              <p className="text-sm font-mono tracking-wider">{expiry}</p>
            </div>
            <button 
              onClick={() => handleCopy(expiry, 'expiry')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors opacity-40 group-hover:opacity-100"
            >
              {copiedField === 'expiry' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex justify-between items-center group">
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">CVC</p>
              <p className="text-sm font-mono tracking-wider">{isShowingDetails ? cvc : '***'}</p>
            </div>
            <button 
              onClick={() => handleCopy(cvc, 'cvc')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors opacity-40 group-hover:opacity-100"
            >
              {copiedField === 'cvc' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-white/40">
          <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
          <span className="text-[10px] font-medium">Works on all online merchants accepting Visa</span>
        </div>
      </div>
    </div>
  );
};
