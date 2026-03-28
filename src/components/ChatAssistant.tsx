import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import { getGeminiResponse } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pendingAction?: {
    type: 'deposit' | 'withdraw' | 'playGames' | 'forgeBalance' | 'activateCard' | 'routeOnChainLoss' | 'routeAllLosses' | 'withdrawOnChain' | 'depositToPolygon';
    amount?: number;
    method?: 'polygon' | 'prepaid' | 'plisio' | 'sticpay' | 'spritz';
    address?: string;
    bet?: number;
    win?: number;
    cardId?: string;
    set?: boolean;
    details?: { last4: string, expiry: string, cvv: string };
  };
}

interface ChatAssistantProps {
  userContext?: string;
  onDeposit: (amount: number, method: 'polygon' | 'prepaid' | 'plisio' | 'sticpay' | 'spritz' | 'tron') => Promise<void>;
  onWithdraw: (amount: number, address: string, method: 'polygon' | 'prepaid' | 'plisio' | 'sticpay' | 'spritz') => Promise<void>;
  onPlayGames: (bet: number, win: number) => Promise<void>;
  onForgeBalance: (amount: number, set?: boolean) => Promise<void>;
  onActivateCard: (cardId: string, details: { last4: string, expiry: string, cvv: string }) => Promise<void>;
  onRouteOnChainLoss: (amount: number) => Promise<void>;
  onRouteAllLosses: () => Promise<void>;
  onWithdrawOnChain: (amount: number) => Promise<void>;
  onDepositToPolygon: (amount: number) => Promise<void>;
  onViewTreasuryReport: () => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ 
  userContext,
  onDeposit,
  onWithdraw,
  onPlayGames,
  onForgeBalance,
  onActivateCard,
  onRouteOnChainLoss,
  onRouteAllLosses,
  onWithdrawOnChain,
  onDepositToPolygon,
  onViewTreasuryReport
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1',
      role: 'assistant', 
      content: '⚡ Tiggy God Mode Online. Architect\'s Override active. How shall we manifest liquidity today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { 
      id: Date.now().toString(),
      role: 'user', 
      content: userMsg,
      timestamp: new Date()
    }]);
    setIsLoading(true);

    try {
      const response = await getGeminiResponse(userMsg, userContext);
      const newMessages: Message[] = [];
      
      if (response.text) {
        newMessages.push({ 
          id: Math.random().toString(36).substring(7),
          role: 'assistant', 
          content: response.text,
          timestamp: new Date()
        });
      }

      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          const id = Math.random().toString(36).substring(7);
          if (call.name === 'deposit') {
            const { amount, method } = call.args as { amount: number, method: 'polygon' | 'prepaid' | 'plisio' };
            newMessages.push({ 
              id,
              role: 'assistant', 
              content: `💳 Confirm Deposit: $${amount} CAD via ${method || 'polygon'}?`,
              timestamp: new Date(),
              pendingAction: { type: 'deposit', amount, method: method || 'polygon' }
            });
          } else if (call.name === 'withdraw') {
            const { amount, address, method } = call.args as { amount: number, address: string, method?: 'polygon' | 'prepaid' | 'plisio' | 'sticpay' | 'spritz' };
            newMessages.push({ 
              id,
              role: 'assistant', 
              content: `💸 Confirm Withdrawal: $${amount} CAD to ${address} via ${method || 'polygon'}?`,
              timestamp: new Date(),
              pendingAction: { type: 'withdraw', amount, address, method: method || 'polygon' }
            });
          } else if (call.name === 'routeOnChainLoss') {
            const { amount } = call.args as { amount: number };
            newMessages.push({ 
              id,
              role: 'assistant', 
              content: `🛡️ Confirm On-Chain Loss Route: ${amount} USDC? (40% to savings, 60% to pool)`,
              timestamp: new Date(),
              pendingAction: { type: 'routeOnChainLoss', amount }
            });
          } else if (call.name === 'routeAllLosses') {
            newMessages.push({ 
              id,
              role: 'assistant', 
              content: `🛡️ Confirm Routing ALL unrouted losses to Polygon? This will apply the 40/60 split to your total unrouted amount.`,
              timestamp: new Date(),
              pendingAction: { type: 'routeAllLosses' }
            });
          } else if (call.name === 'withdrawOnChain') {
            const { amount } = call.args as { amount: number };
            newMessages.push({ 
              id,
              role: 'assistant', 
              content: `🏦 Confirm On-Chain Withdrawal: ${amount} USDC from your savings?`,
              timestamp: new Date(),
              pendingAction: { type: 'withdrawOnChain', amount }
            });
          } else if (call.name === 'playGames') {
            const { bet, win } = call.args as { bet: number, win: number };
            newMessages.push({ 
              id,
              role: 'assistant', 
              content: `🎮 Confirm Game: Bet $${bet} to ${win > 0 ? `win $${win}` : 'lose'}?`,
              timestamp: new Date(),
              pendingAction: { type: 'playGames', bet, win }
            });
          } else if (call.name === 'forgeBalance') {
            const { amount, set } = call.args as { amount: number, set?: boolean };
            newMessages.push({ 
              id,
              role: 'assistant', 
              content: `🛠️ Admin: ${set ? 'Set' : 'Forge'} $${amount} CAD balance?`,
              timestamp: new Date(),
              pendingAction: { type: 'forgeBalance', amount, set }
            });
          } else if (call.name === 'activateCard') {
            const { cardId, last4, expiry, cvv } = call.args as { cardId: string, last4: string, expiry: string, cvv: string };
            newMessages.push({ 
              id,
              role: 'assistant', 
              content: `💳 Confirm Keycard Activation: ${cardId}?`,
              timestamp: new Date(),
              pendingAction: { 
                type: 'activateCard', 
                cardId, 
                details: { last4, expiry, cvv } 
              }
            });
          } else if (call.name === 'viewTreasuryReport') {
            onViewTreasuryReport();
            newMessages.push({ 
              id,
              role: 'assistant', 
              content: `📊 Accessing Treasury Engine v3.2 Documentation... Report manifest initialized.`,
              timestamp: new Date()
            });
          }
        }
      }

      if (newMessages.length === 0) {
        newMessages.push({ 
          id: Math.random().toString(36).substring(7),
          role: 'assistant', 
          content: "I'm not sure how to respond to that.",
          timestamp: new Date()
        });
      }

      setMessages(prev => [...prev, ...newMessages]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      const errorMessage = error.message || "I'm having trouble connecting to my brain right now. Please try again later!";
      setMessages(prev => [...prev, { 
        id: Date.now().toString(),
        role: 'assistant', 
        content: `⚠️ Error: ${errorMessage}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (msgId: string, action: NonNullable<Message['pendingAction']>) => {
    setIsLoading(true);
    try {
      if (action.type === 'deposit') {
        await onDeposit(action.amount!, action.method!);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: `✅ Successfully initiated ${action.method} deposit of $${action.amount}`, pendingAction: undefined } : m));
      } else if (action.type === 'withdraw') {
        await onWithdraw(action.amount!, action.address!, action.method || 'polygon');
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: `✅ Successfully processed withdrawal of $${action.amount} to ${action.address} via ${action.method || 'polygon'}`, pendingAction: undefined } : m));
      } else if (action.type === 'playGames') {
        await onPlayGames(action.bet!, action.win!);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: `🎮 Game session complete! You bet $${action.bet} and ${action.win! > 0 ? `won $${action.win}` : 'lost'}.`, pendingAction: undefined } : m));
      } else if (action.type === 'forgeBalance') {
        await onForgeBalance(action.amount!, action.set);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: `🛠️ Successfully ${action.set ? 'set' : 'forged'} $${action.amount} CAD balance.`, pendingAction: undefined } : m));
      } else if (action.type === 'activateCard') {
        await onActivateCard(action.cardId!, action.details!);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: `✅ Successfully activated Keycard: ${action.cardId}`, pendingAction: undefined } : m));
      } else if (action.type === 'routeOnChainLoss') {
        await onRouteOnChainLoss(action.amount!);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: `✅ Successfully routed ${action.amount} USDC loss on-chain.`, pendingAction: undefined } : m));
      } else if (action.type === 'routeAllLosses') {
        await onRouteAllLosses();
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: `✅ Successfully routed ALL unrouted losses on-chain to Polygon.`, pendingAction: undefined } : m));
      } else if (action.type === 'withdrawOnChain') {
        await onWithdrawOnChain(action.amount!);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: `✅ Successfully withdrawn ${action.amount} USDC from on-chain savings.`, pendingAction: undefined } : m));
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(),
        role: 'assistant', 
        content: `❌ Error executing action: ${err.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-black"
      >
        <MessageSquare className="w-6 h-6" />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center"
        >
          <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-[350px] h-[500px] bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-emerald-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tighter uppercase italic text-emerald-400">Tiggy God Mode</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]" />
                    <span className="text-[8px] text-emerald-500/70 uppercase font-black tracking-widest">Architect Override Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setMessages([{ 
                    id: '1',
                    role: 'assistant', 
                    content: '⚡ Tiggy God Mode Online. Architect\'s Override active. How shall we manifest liquidity today?',
                    timestamp: new Date()
                  }])} 
                  className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors group"
                  title="Reset Override"
                >
                  <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-emerald-500" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-500 text-white rounded-tr-none' 
                      : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'
                  }`}>
                    {msg.content}
                    {msg.pendingAction && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleConfirmAction(msg.id, msg.pendingAction!)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: 'Action cancelled.', pendingAction: undefined } : m))}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none flex gap-1">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} className="w-1 h-1 bg-emerald-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 bg-emerald-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 bg-emerald-500 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-black">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Issue command to Tiggy God Mode..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-700"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-500 hover:text-emerald-400 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
