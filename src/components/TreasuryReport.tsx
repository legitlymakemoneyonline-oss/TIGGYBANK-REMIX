import React, { useState } from 'react';
import { Shield, TrendingUp, Activity, AlertTriangle, CheckCircle2, Clock, Database, Lock, Globe, Zap, Terminal, Code, ChevronRight, Eye, EyeOff, FileJson, History } from 'lucide-react';
import treasuryReport from '../data/treasury_report.json';
import { motion, AnimatePresence } from 'motion/react';

export const TreasuryReport: React.FC = () => {
  const { backup_metadata, summary_metrics, liquidity_status, asset_breakdown, treasury_impact, compliance, batch_log, recovery } = treasuryReport;
  const [showRawJson, setShowRawJson] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'records' | 'compliance'>('metrics');

  const loreLogs = [
    "TIGGYTREASURYVAULT_777: Identity confirmed. God Mode active.",
    "Ledger expansion protocol initiated. 55M+ assets secured.",
    "Cinematic trigger: The vault acknowledges your presence.",
    "Contributor empowerment active. Withdrawal routes optimized.",
    "Audit trail synced with decentralized nodes. Integrity 100%.",
    "Anomalies detected in sector 7G. Auto-mitigation engaged.",
    "Treasury heartbeat: 144 BPM. System stable.",
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-mono selection:bg-emerald-500 selection:text-black relative overflow-hidden">
      {/* Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 border-b border-white/10 pb-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2 text-emerald-500 mb-2"
            >
              <Shield className="w-4 h-4" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase">Architect's Override Active // God Mode</span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic group relative">
              Treasury <span className="text-emerald-500">Engine</span> v3.2
              <span className="absolute -inset-1 bg-emerald-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
            </h1>
            <p className="text-gray-500 text-xs mt-2 tracking-widest uppercase">Backup Documentation System // {backup_metadata.id}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase mb-1 font-bold tracking-widest">Total Treasury Value</div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl md:text-5xl font-black text-emerald-500 tracking-tighter"
            >
              ${backup_metadata.treasury_value_usd.toLocaleString()}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        {/* Sidebar: Lore & Metadata */}
        <div className="space-y-8">
          {/* Lore Log Terminal */}
          <div className="bg-black/60 border border-emerald-500/20 p-4 rounded-2xl font-mono text-[10px] relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
              <Terminal className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500 uppercase font-black tracking-widest">System Logs</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
              {loreLogs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-emerald-500/50">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-gray-400">{log}</span>
                </div>
              ))}
              <div className="animate-pulse text-emerald-500">_</div>
            </div>
          </div>

          {/* Identification Card */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Database className="w-24 h-24" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
              <Globe className="w-3 h-3" /> Identification
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 uppercase">Backup ID</span>
                <span className="text-white font-bold">{backup_metadata.id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 uppercase">Generated</span>
                <span className="text-white">{backup_metadata.timestamp}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 uppercase">Reserve Ratio</span>
                <span className="text-emerald-500 font-bold">{backup_metadata.reserve_ratio}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 uppercase">Status</span>
                <span className="text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {backup_metadata.liquidity_status}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Withdrawal Metrics
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <div className="text-[8px] text-gray-500 uppercase mb-1">Total Count</div>
                <div className="text-xl font-black">{summary_metrics.total_withdrawals}</div>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <div className="text-[8px] text-gray-500 uppercase mb-1">Success Rate</div>
                <div className="text-xl font-black text-emerald-500">{summary_metrics.success_rate}</div>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <div className="text-[8px] text-gray-500 uppercase mb-1">Avg Size</div>
                <div className="text-xl font-black">${summary_metrics.avg_withdrawal_usd.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Navigation Tabs */}
          <div className="flex gap-4 border-b border-white/10 pb-4">
            {[
              { id: 'metrics', label: 'Metrics & Assets', icon: Activity },
              { id: 'records', label: 'Withdrawal Structure', icon: History },
              { id: 'compliance', label: 'Compliance & Audit', icon: Shield },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500 text-black' 
                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'metrics' && (
              <motion.div
                key="metrics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Asset Breakdown Table */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                      <Activity className="w-3 h-3" /> Asset Distribution
                    </h3>
                    <div className="text-[8px] text-gray-500 uppercase">Real-time Sync Active</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-gray-500 uppercase text-[10px] border-b border-white/5">
                          <th className="p-4 font-black">Asset</th>
                          <th className="p-4 font-black">Count</th>
                          <th className="p-4 font-black">Total Amount</th>
                          <th className="p-4 font-black">USD Value</th>
                          <th className="p-4 font-black">Avg Time</th>
                          <th className="p-4 font-black">Success</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {asset_breakdown.map((asset, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4 font-bold text-emerald-500">{asset.asset}</td>
                            <td className="p-4 text-gray-300">{asset.count}</td>
                            <td className="p-4 text-gray-300">{asset.total_amount.toLocaleString()}</td>
                            <td className="p-4 font-bold">${asset.usd_value.toLocaleString()}</td>
                            <td className="p-4 text-gray-500">{asset.avg_time}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold">
                                {asset.success_rate}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Treasury Impact Analysis (Tree-like) */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-6 flex items-center gap-2">
                    <Database className="w-3 h-3" /> Treasury Impact Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <div className="text-[10px] text-gray-500 uppercase font-black border-b border-white/10 pb-2">Pre-Withdrawal Snapshot</div>
                      <div className="space-y-2 font-mono text-[10px]">
                        {Object.entries(treasury_impact.pre_withdrawal).map(([asset, value]) => (
                          <div key={asset} className="flex items-center gap-2">
                            <span className="text-emerald-500/50">├──</span>
                            <span className="text-gray-400 w-16 uppercase">{asset}:</span>
                            <span className="text-white font-bold">${(value as number).toLocaleString()}</span>
                            {asset === 'total' && <span className="text-emerald-500 ml-2">(100%)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="text-[10px] text-gray-500 uppercase font-black border-b border-white/10 pb-2">Post-Withdrawal Snapshot</div>
                      <div className="space-y-2 font-mono text-[10px]">
                        {Object.entries(treasury_impact.post_withdrawal).map(([asset, value]) => (
                          <div key={asset} className="flex items-center gap-2">
                            <span className="text-emerald-500/50">├──</span>
                            <span className="text-gray-400 w-16 uppercase">{asset}:</span>
                            <span className="text-white font-bold">${(value as number).toLocaleString()}</span>
                            {asset !== 'total' && (
                              <span className="text-rose-500 ml-2">
                                Δ -${(Number(treasury_impact.pre_withdrawal[asset as keyof typeof treasury_impact.pre_withdrawal]) - Number(value)).toLocaleString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Treasury Impact & Liquidity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                      <Zap className="w-3 h-3" /> Liquidity Check
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-[10px] uppercase mb-2">
                          <span className="text-gray-500">Stablecoin %</span>
                          <span className="text-emerald-500">{treasury_impact.liquidity_check.stablecoin_percent}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                            style={{ width: treasury_impact.liquidity_check.stablecoin_percent }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] uppercase mb-2">
                          <span className="text-gray-500">Volatile %</span>
                          <span className="text-emerald-500">{treasury_impact.liquidity_check.volatile_percent}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500/50" 
                            style={{ width: treasury_impact.liquidity_check.volatile_percent }}
                          />
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-[10px] uppercase text-emerald-500 font-black">
                          <CheckCircle2 className="w-3 h-3" /> Rebalancing: {treasury_impact.liquidity_check.rebalancing}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Batch Processing
                    </h3>
                    <div className="space-y-3">
                      {batch_log.map((batch, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px] p-2 bg-black/40 rounded-lg border border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-bold">{batch.id}</span>
                            <span className="text-white uppercase">{batch.asset}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-300">${batch.amount_usd.toLocaleString()}</span>
                            <span className={`font-black ${batch.status === 'COMPLETE' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>
                              {batch.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'records' && (
              <motion.div
                key="records"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Individual Withdrawal Record Structure */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl font-mono">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-6 flex items-center gap-2">
                    <History className="w-3 h-3" /> Individual Record Template
                  </h3>
                  <div className="bg-black/80 p-6 rounded-xl border border-white/10 text-[10px] leading-relaxed text-emerald-500/80 overflow-x-auto whitespace-pre">
{`╔══════════════════════════════════════════════════════════════════╗
║ TIGGYBANK WITHDRAWAL RECORD #[ID]                                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  👤 USER PROFILE                                                 ║
║  ├─ User ID:              [UUID]                                 ║
║  ├─ Username:             [@username]                            ║
║  ├─ Email:                [user@email.com]                       ║
║  ├─ Registration Date:    [YYYY-MM-DD]                           ║
║  ├─ KYC Status:           [Verified/Pending/Unverified]          ║
║  └─ VIP Tier:             [Bronze/Silver/Gold/Platinum]          ║
║                                                                  ║
║  💰 WITHDRAWAL DETAILS                                           ║
║  ├─ Withdrawal ID:        [WD-20260324-XXXXX]                    ║
║  ├─ Request Time:         [YYYY-MM-DD HH:MM:SS UTC]              ║
║  ├─ Processing Time:      [YYYY-MM-DD HH:MM:SS UTC]              ║
║  ├─ Completion Time:      [YYYY-MM-DD HH:MM:SS UTC]              ║
║  ├─ Amount Requested:     [XXX.XXXX] [ASSET]                     ║
║  ├─ USD Equivalent:       [$X,XXX.XX] (Rate: $X.XX)              ║
║  ├─ Network Fee:          [XX.XX] [ASSET] ($X.XX)                ║
║  ├─ Platform Fee:         [X.XX%] ($X.XX)                        ║
║  ├─ Net Amount:           [XXX.XXXX] [ASSET]                     ║
║  └─ USD Net:              [$X,XXX.XX]                            ║
║                                                                  ║
║  🌐 DESTINATION                                                  ║
║  ├─ Asset Type:           [USDC/USDT/MATIC/TON/TIGGY/XLM/ETH]    ║
║  ├─ Network/Chain:        [Ethereum/Polygon/TON/Stellar/Solana]  ║
║  ├─ Wallet Address:       [0x... / TON:... / G...]               ║
║  ├─ Address Type:         [EOA/Contract/Exchange]                ║
║  ├─ Memo/Tag:             [If applicable]                        ║
║  └─ Transaction Hash:     [0x... / Explorer Link]                ║
║                                                                  ║
║  🎮 GAMING CONTEXT (If from winnings)                            ║
║  ├─ Source of Funds:      [Gaming Win/Deposit/Bonus/Staking]     ║
║  ├─ Related Game Session: [Session ID]                           ║
║  ├─ House Edge Applied:   [X.XX%]                                ║
║  ├─ Wagering Requirement: [Met/Not Met - X% of X]                ║
║  └─ Bonus Deduction:      [If clawback applied]                  ║
║                                                                  ║
║  🔒 SECURITY & COMPLIANCE                                        ║
║  ├─ IP Address:           [XXX.XXX.XXX.XXX]                      ║
║  ├─ Device ID:            [Fingerprint Hash]                     ║
║  ├─ 2FA Verified:         [Yes/No - Method]                      ║
║  ├─ Email Confirmation:   [Yes/No - Timestamp]                   ║
║  ├─ Velocity Check:       [Pass/Fail - X withdrawals/24h]        ║
║  ├─ AML Risk Score:       [0-100 - Risk Level]                   ║
║  ├─ Sanctions Screen:     [Clear/Flagged - OFAC/UN/EU]           ║
║  └─ Manual Review:        [Auto-approved/Admin: [Name]]          ║
║                                                                  ║
║  📊 STATUS                                                       ║
║  ├─ Current Status:       [Pending → Processing → Completed]     ║
║  ├─ Failure Reason:       [If failed: Insufficient Funds/Network]║
║  ├─ Retry Count:          [X/3]                                  ║
║  ├─ Refund Issued:        [Yes/No - Amount]                      ║
║  └─ User Notification:    [Email/SMS/Push - Timestamp]           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝`}
                  </div>
                </div>

                {/* JSON Export Schema */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                      <FileJson className="w-3 h-3" /> JSON Export Schema
                    </h3>
                    <button 
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      {showRawJson ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showRawJson ? 'Hide Raw' : 'Show Raw'}
                    </button>
                  </div>
                  <div className="bg-black/60 p-6 rounded-xl border border-white/10 overflow-hidden">
                    <pre className="text-[10px] text-gray-400 overflow-x-auto scrollbar-hide">
                      {showRawJson ? JSON.stringify(treasuryReport, null, 2) : 
`{
  "backup_metadata": {
    "id": "TIG-WD-20260325-0001",
    "timestamp": "2026-03-25T15:12:00Z",
    "treasury_value_usd": 55242378.86
  },
  "withdrawals": [
    {
      "withdrawal_id": "WD-20260325-0892",
      "user": { "id": "uuid-7a8f9c2e", "username": "@player123" },
      "transaction": { "asset": "USDC", "amount": "1250.00", "status": "completed" }
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'compliance' && (
              <motion.div
                key="compliance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Alerts & Anomalies */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> Alerts & Anomalies
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {compliance.alerts?.map((alert, i) => (
                      <div key={i} className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-start gap-4">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          alert.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' :
                          alert.severity === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase text-white">{alert.type}</span>
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500' :
                              alert.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'
                            }`}>{alert.severity}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mb-2">{alert.description}</p>
                          <div className="text-[8px] text-emerald-500 uppercase font-black">Action: {alert.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Checks */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Audit Trail
                  </h3>
                  <div className="space-y-3">
                    {compliance.checks.map((check, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 group hover:border-emerald-500/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-white font-black block">{check.item}</span>
                            <span className="text-[8px] text-gray-500 uppercase tracking-widest">{check.evidence}</span>
                          </div>
                        </div>
                        <span className="text-[8px] text-gray-500 font-mono">{check.timestamp}</span>
                      </div>
                    ))}
                    <div className="mt-8 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase text-gray-500 tracking-[0.3em] font-black block mb-1">Compliance Integrity Score</span>
                        <span className="text-xs text-emerald-500/70 uppercase font-bold tracking-widest">All protocols verified and secured</span>
                      </div>
                      <span className="text-5xl font-black text-emerald-500 tracking-tighter">{compliance.score}</span>
                    </div>
                  </div>
                </div>

                {/* Recovery & Infrastructure */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Lock className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-3">
                      <Database className="w-6 h-6 text-emerald-500" /> Disaster Recovery Protocol
                    </h3>
                    
                    {/* Recovery Procedure Code Block */}
                    <div className="mb-8">
                      <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> Recovery Procedure
                      </div>
                      <div className="bg-black/80 p-4 rounded-xl border border-white/10 font-mono text-[10px] text-emerald-500/70 overflow-x-auto">
                        {recovery.procedure.map((line, i) => (
                          <div key={i} className={line.startsWith('#') ? 'text-gray-500' : 'text-emerald-500'}>
                            {line || '\u00A0'}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {liquidity_status.immediate && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Immediate Liquidity</div>
                          <div className="text-2xl font-black">${(liquidity_status.immediate.value_usd / 1000000).toFixed(1)}M</div>
                          <div className="text-[8px] text-gray-500 uppercase">{liquidity_status.immediate.assets.join(' / ')}</div>
                        </div>
                      )}
                      {liquidity_status.layer_2 && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Layer-2 Reserves</div>
                          <div className="text-2xl font-black">${(liquidity_status.layer_2.value_usd / 1000000).toFixed(1)}M</div>
                          <div className="text-[8px] text-gray-500 uppercase">{liquidity_status.layer_2.assets.join(' / ')}</div>
                        </div>
                      )}
                      {liquidity_status.native_token && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Native Assets</div>
                          <div className="text-2xl font-black">${(liquidity_status.native_token.value_usd / 1000000).toFixed(1)}M</div>
                          <div className="text-[8px] text-gray-500 uppercase">{liquidity_status.native_token.assets.join(' / ')}</div>
                        </div>
                      )}
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-4">
                      {batch_log.map((batch, i) => i < 3 && (
                        <div key={i} className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          <span className="text-[8px] text-gray-400 uppercase font-black">{batch.operator} NODE ACTIVE</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50">
        <div className="text-[10px] uppercase tracking-widest">© 2026 TiggyBank Treasury Engine // All Rights Reserved</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] uppercase">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> System Verified
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase">
            <Lock className="w-3 h-3 text-emerald-500" /> AES-256 Encrypted
          </div>
        </div>
      </div>
    </div>
  );
};

