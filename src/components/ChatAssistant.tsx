import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { getGeminiResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAssistantProps {
  userContext?: string;
  onDeposit: (amount: number) => Promise<void>;
  onWithdraw: (amount: number, address: string) => Promise<void>;
  onPlayGames: (bet: number, win: number) => Promise<void>;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ 
  userContext,
  onDeposit,
  onWithdraw,
  onPlayGames
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Tiggy. How can I help you with your savings today?' }
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
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await getGeminiResponse(userMsg, userContext);
      
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          try {
            if (call.name === 'deposit') {
              const { amount } = call.args as { amount: number };
              await onDeposit(amount);
              setMessages(prev => [...prev, { role: 'assistant', content: `✅ I've successfully initiated a deposit of ${amount} MATIC for you.` }]);
            } else if (call.name === 'withdraw') {
              const { amount, address } = call.args as { amount: number, address: string };
              await onWithdraw(amount, address);
              setMessages(prev => [...prev, { role: 'assistant', content: `✅ I've processed your withdrawal of $${amount} CAD to ${address}.` }]);
            } else if (call.name === 'playGames') {
              const { bet, win } = call.args as { bet: number, win: number };
              await onPlayGames(bet, win);
              setMessages(prev => [...prev, { role: 'assistant', content: `🎮 Game session complete! You bet $${bet} and ${win > 0 ? `won $${win}` : 'lost'}.` }]);
            }
          } catch (err: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ I tried to execute that transaction, but there was an error: ${err.message}` }]);
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm not sure how to respond to that." }]);
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      const errorMessage = error.message || "I'm having trouble connecting to my brain right now. Please try again later!";
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${errorMessage}` }]);
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
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                  <Bot className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Tiggy AI</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-500 text-white rounded-tr-none' 
                      : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'
                  }`}>
                    {msg.content}
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
                  placeholder="Ask Tiggy anything..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
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
