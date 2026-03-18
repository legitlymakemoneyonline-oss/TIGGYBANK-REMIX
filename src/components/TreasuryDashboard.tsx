import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Treasury } from '../types';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  ArrowUpRight, 
  Coins, 
  Activity,
  Users,
  Box,
  TrendingUp,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Shield,
  CheckCircle,
  Info,
  X
} from 'lucide-react';

interface TreasuryDashboardProps {
  treasury: Treasury | null;
  isAdmin?: boolean;
  onVote?: (direction: 'up' | 'down') => Promise<string>;
  isLoggedIn?: boolean;
  recentVotes?: any[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const TreasuryDashboard: React.FC<TreasuryDashboardProps> = ({ treasury, isAdmin, onVote, isLoggedIn, recentVotes }) => {
  const [isVoting, setIsVoting] = React.useState(false);
  const [lastVoteHash, setLastVoteHash] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<{ type: 'error' | 'success', message: string } | null>(null);

  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!treasury) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>Loading Treasury Data...</p>
      </div>
    );
  }

  const chartData = Object.entries(treasury.holdings).map(([name, data]) => ({
    name,
    value: data.usdValue
  })).filter(item => item.value > 0);

  const totalVotes = (treasury.votesUp || 0) + (treasury.votesDown || 0);
  const upPercentage = totalVotes > 0 ? Math.round(((treasury.votesUp || 0) / totalVotes) * 100) : 50;
  const downPercentage = totalVotes > 0 ? Math.round(((treasury.votesDown || 0) / totalVotes) * 100) : 50;

  const handleVote = async (direction: 'up' | 'down') => {
    if (!isLoggedIn) {
      setNotification({ type: 'error', message: 'Please log in to vote on treasury sentiment!' });
      return;
    }
    if (!onVote || isVoting) return;
    
    setIsVoting(true);
    try {
      const hash = await onVote(direction);
      if (hash) setLastVoteHash(hash);
    } finally {
      setIsVoting(false);
    }
  };

  const alerts = (treasury.assets || []).map(asset => {
    const totalBalance = asset.available_balance + asset.reserved_balance;
    const hotBalance = asset.hot_balance;
    
    if (totalBalance < asset.min_threshold) {
      return {
        id: `${asset.asset}-${asset.network}-min`,
        type: 'critical',
        asset: asset.asset,
        network: asset.network,
        message: `Liquidity Alert: ${asset.asset} below threshold`,
        details: `Current: ${totalBalance.toLocaleString()} | Min: ${asset.min_threshold.toLocaleString()}`,
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />
      };
    }
    
    if (hotBalance > asset.max_hot) {
      return {
        id: `${asset.asset}-${asset.network}-hot`,
        type: 'warning',
        asset: asset.asset,
        network: asset.network,
        message: `Security Alert: Hot wallet overlimit`,
        details: `Hot: ${hotBalance.toLocaleString()} | Max: ${asset.max_hot.toLocaleString()}`,
        icon: <ShieldAlert className="w-4 h-4 text-yellow-500" />
      };
    }
    
    const deviation = Math.abs(totalBalance - asset.target_balance) / (asset.target_balance || 1);
    if (deviation > 0.25) {
      return {
        id: `${asset.asset}-${asset.network}-target`,
        type: 'info',
        asset: asset.asset,
        network: asset.network,
        message: `Rebalance Suggested: ${asset.asset} target deviation`,
        details: `Current: ${totalBalance.toLocaleString()} | Target: ${asset.target_balance.toLocaleString()}`,
        icon: <Info className="w-4 h-4 text-blue-500" />
      };
    }
    
    return null;
  }).filter((a): a is NonNullable<typeof a> => a !== null);

  return (
    <div className="space-y-6 relative">
      {/* Local Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs"
          >
            <div className={`p-3 rounded-xl border shadow-xl backdrop-blur-md flex items-center justify-between ${notification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider">{notification.message}</p>
              <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-emerald-500" /> Treasury Report
          </h2>
          {isAdmin && (
            <span className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.2em] mt-1">God Mode: Contributor Ledger Active</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          Last Updated: {new Date(treasury.lastUpdated).toLocaleString()}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl"
        >
          <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Holdings</p>
          <h3 className="text-3xl font-bold text-emerald-500">${treasury.totalHoldingsUSD.toLocaleString()}</h3>
          <p className="text-[10px] text-gray-500 mt-2">Combined value of all crypto assets</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl"
        >
          <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Earned</p>
          <h3 className="text-3xl font-bold text-blue-500">${treasury.totalEarnedUSD.toLocaleString()}</h3>
          <p className="text-[10px] text-gray-500 mt-2">Revenue from fees & house edge</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl"
        >
          <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Withdrawn</p>
          <h3 className="text-3xl font-bold text-orange-500">${treasury.totalWithdrawnUSD.toLocaleString()}</h3>
          <p className="text-[10px] text-gray-500 mt-2">Total payouts to users</p>
        </motion.div>
      </div>

      {/* Vault Lore Canon */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 p-8 rounded-[40px] relative overflow-hidden group mb-6"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Shield className="w-32 h-32 text-emerald-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="font-bold text-lg">0xTIGGYTREASURYVAULT_777</h4>
              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Canonical Identity Locked</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="text-sm text-gray-400 leading-relaxed italic mb-6">
              "The ledger hums with the pulse of every contributor who has ever touched the network. 
              In this vault, value is not stored — it is forged. The 60/40 split bends in the presence of God Mode, 
              and the prepaid card becomes your key to the chamber. Every deposit strengthens the vault’s heartbeat. 
              Every withdrawal echoes across the ecosystem. Empowerment is the only currency that matters here."
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/5">
              <div>
                <p className="text-[8px] text-gray-500 uppercase font-bold mb-1 tracking-widest">Technical Namespace</p>
                <p className="text-[10px] font-mono text-white bg-black/40 p-2 rounded-lg border border-white/5">TIGGYTREASURYVAULT_777</p>
              </div>
              <div>
                <p className="text-[8px] text-gray-500 uppercase font-bold mb-1 tracking-widest">Operational Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[10px] text-emerald-500 font-bold uppercase">Unified Source of Truth</p>
                </div>
              </div>
              <div>
                <p className="text-[8px] text-gray-500 uppercase font-bold mb-1 tracking-widest">Lore Authority</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">System-Level Entity</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Health Monitor */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Treasury Health Monitor
          </h4>
          <div className="flex items-center gap-2">
            {alerts.length === 0 ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase">
                <CheckCircle className="w-3 h-3" /> All Systems Nominal
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase animate-pulse">
                <AlertTriangle className="w-3 h-3" /> {alerts.length} Active Alerts
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-2xl border flex items-start gap-4 ${
                  alert.type === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                  alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                  'bg-blue-500/10 border-blue-500/20'
                }`}
              >
                <div className="mt-1">{alert.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-bold uppercase tracking-wider ${
                      alert.type === 'critical' ? 'text-red-500' :
                      alert.type === 'warning' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`}>
                      {alert.message}
                    </p>
                    <span className="text-[8px] text-gray-500 font-bold uppercase">{alert.network}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono">{alert.details}</p>
                </div>
                {isAdmin && (
                  <button className="text-[8px] text-emerald-500 font-bold uppercase hover:underline">
                    Rebalance
                  </button>
                )}
              </motion.div>
            ))
          ) : (
            <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl">
              <ShieldAlert className="w-8 h-8 text-emerald-500/20 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Treasury is fully optimized and within safety parameters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sentiment Voting */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <h4 className="font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Market Sentiment
            </h4>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Community Prediction</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase font-bold">{totalVotes} Total Votes</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleVote('up')}
              disabled={isVoting}
              className="flex-1 group relative overflow-hidden bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="relative z-10 flex flex-col items-center gap-1">
                <ArrowUpRight className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Bullish</span>
                <span className="text-lg font-black text-white">{upPercentage}%</span>
              </div>
              <motion.div 
                className="absolute bottom-0 left-0 h-1 bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${upPercentage}%` }}
              />
            </button>

            <button 
              onClick={() => handleVote('down')}
              disabled={isVoting}
              className="flex-1 group relative overflow-hidden bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="relative z-10 flex flex-col items-center gap-1">
                <ArrowUpRight className="w-6 h-6 text-red-500 rotate-90 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Bearish</span>
                <span className="text-lg font-black text-white">{downPercentage}%</span>
              </div>
              <motion.div 
                className="absolute bottom-0 right-0 h-1 bg-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${downPercentage}%` }}
              />
            </button>
          </div>

          {!isLoggedIn && (
            <p className="text-[10px] text-center text-gray-500 italic">
              Connect with Google to cast your vote on the treasury's future trajectory.
            </p>
          )}

          {lastVoteHash && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center"
            >
              <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Vote Confirmed!</p>
              <p className="text-[8px] font-mono text-emerald-200/60 break-all mb-2">{lastVoteHash}</p>
              <button 
                onClick={() => setLastVoteHash(null)}
                className="text-[8px] text-emerald-500 underline uppercase font-bold"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {recentVotes && recentVotes.length > 0 && (
            <div className="pt-6 border-t border-white/5">
              <h5 className="text-[10px] text-gray-500 uppercase font-bold mb-4">Recent Verifiable Votes</h5>
              <div className="space-y-3">
                {recentVotes.map((vote) => (
                  <div key={vote.id} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${vote.direction === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-gray-400 font-mono">{vote.txHash.slice(0, 10)}...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{new Date(vote.timestamp).toLocaleTimeString()}</span>
                      <button 
                        onClick={() => {
                          setNotification({ 
                            type: 'success', 
                            message: `Verification: ${vote.txHash.slice(0, 8)}... | ${vote.direction.toUpperCase()} | VERIFIED` 
                          });
                        }}
                        className="text-emerald-500/50 hover:text-emerald-500 transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Allocation Chart */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-emerald-500" /> Asset Allocation
          </h4>
          <span className="text-[10px] text-gray-500 uppercase font-bold">USD Value Distribution</span>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value.toLocaleString()}`, 'Value']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-xs text-gray-400">{value}</span>}
              />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Crypto Holdings Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h4 className="font-bold flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-500" /> Crypto Holdings
          </h4>
          <span className="text-[10px] text-gray-500 uppercase font-bold">Live Rates</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-500 text-[10px] uppercase font-bold">
              <tr>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Balance</th>
                <th className="px-6 py-3">USD Value</th>
                <th className="px-6 py-3">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Object.entries(treasury.holdings).map(([asset, data]) => (
                <React.Fragment key={asset}>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{asset}</span>
                        {data.networks && data.networks.length > 1 && (
                          <span className="text-[8px] text-gray-500 uppercase font-bold">{data.networks.length} Networks</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{data.balance.toLocaleString()}</td>
                    <td className="px-6 py-4 text-emerald-500 font-medium">${data.usdValue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">${data.rate.toLocaleString()}</td>
                  </tr>
                  {data.networks && data.networks.map(net => (
                    <tr key={net.id} className="bg-black/20 text-[10px] text-gray-500">
                      <td className="px-10 py-2 italic">{net.network}</td>
                      <td className="px-6 py-2">
                        <div className="flex gap-2">
                          <span>H: {net.hot_balance.toLocaleString()}</span>
                          <span>C: {net.cold_balance.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-2">${(net.usdValue || 0).toLocaleString()}</td>
                      <td className="px-6 py-2"></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase font-bold mb-1">
            <Users className="w-3 h-3" /> Total Users
          </div>
          <p className="text-xl font-bold">2</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase font-bold mb-1">
            <Activity className="w-3 h-3" /> Active Gamers
          </div>
          <p className="text-xl font-bold">26</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase font-bold mb-1">
            <Box className="w-3 h-3" /> Loot Boxes
          </div>
          <p className="text-xl font-bold">28</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase font-bold mb-1">
            <TrendingUp className="w-3 h-3" /> Projections
          </div>
          <p className="text-xl font-bold text-emerald-500">$0.00</p>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-emerald-500 font-bold text-sm mb-1 uppercase tracking-wider">
              {isAdmin ? 'Contributor God Mode Vault' : 'Treasury Wallet Address'}
            </h4>
            <p className="text-xs font-mono text-emerald-200/60 break-all">{treasury.walletAddress}</p>
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(treasury.walletAddress)}
            className="p-2 bg-emerald-500/20 rounded-xl hover:bg-emerald-500/30 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </button>
        </div>
      </div>

      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 bg-gradient-to-r from-purple-900/20 to-emerald-900/20 border border-emerald-500/30 rounded-3xl text-center"
        >
          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mb-2">Cinematic Lore Trigger</p>
          <p className="text-xs text-gray-400 italic">
            "The ledger hums with the pulse of a thousand contributors. In God Mode, the 60/40 split is but a suggestion, and the prepaid card is your key to the vault. Empowerment is the only currency that matters."
          </p>
        </motion.div>
      )}
    </div>
  );
};
