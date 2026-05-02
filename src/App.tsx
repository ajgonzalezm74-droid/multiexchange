/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Settings2, 
  ArrowRightLeft, 
  TrendingUp, 
  History,
  X,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface Rate {
  usd: number;
  eur: number;
  p2p: number;
}

interface Operation {
  id: string;
  type: 'USD_TO_VES' | 'VES_TO_ANY';
  amount: number;
  rateName: string;
  rateValue: number;
  result: number;
  currency: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  RATES: 'multiexchange_rates',
  HISTORY: 'multiexchange_history',
  MODO: 'multiexchange_modo'
};

export default function App() {
  // State
  const [rates, setRates] = useState<Rate>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RATES);
    return saved ? JSON.parse(saved) : { usd: 44.55, eur: 48.19, p2p: 52.25 };
  });

  const [history, setHistory] = useState<Operation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [];
  });

  const [amount, setAmount] = useState<string>('100');
  const [modo, setModo] = useState<'USD' | 'VES'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MODO);
    return (saved as 'USD' | 'VES') || 'USD';
  });

  const [status, setStatus] = useState<string>('Sistema Listo');
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODO, modo);
  }, [modo]);

  // Sync Rates via internal proxy to avoid CORS
  const syncRates = useCallback(async () => {
    setIsSyncing(true);
    setStatus('Sincronizando...');
    try {
      const response = await fetch('/api/rates');
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setRates(prev => ({
        usd: data.usd || prev.usd,
        eur: data.eur || prev.eur,
        p2p: data.p2p || prev.p2p
      }));
      
      setStatus('✅ Actualizado');
    } catch (error) {
      console.error('Sync error:', error);
      setStatus('⚠️ Usando manual');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setStatus('Sistema Listo'), 3000);
    }
  }, []);

  useEffect(() => {
    syncRates();
    const interval = setInterval(syncRates, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [syncRates]);

  // Calculations
  const results = {
    p2p: modo === 'USD' ? parseFloat(amount || '0') * rates.p2p : parseFloat(amount || '0') / rates.p2p,
    usd: modo === 'USD' ? parseFloat(amount || '0') * rates.usd : parseFloat(amount || '0') / rates.usd,
    eur: modo === 'USD' ? parseFloat(amount || '0') * rates.eur : parseFloat(amount || '0') / rates.eur,
  };

  const registerOperation = (rateKey: keyof Rate, rateName: string) => {
    const amtValue = parseFloat(amount || '0');
    if (amtValue <= 0) return;

    const newOp: Operation = {
      id: crypto.randomUUID(),
      type: modo === 'USD' ? 'USD_TO_VES' : 'VES_TO_ANY',
      amount: amtValue,
      rateName,
      rateValue: rates[rateKey],
      result: results[rateKey],
      currency: modo === 'USD' ? 'Bs' : (rateName.includes('EUR') ? 'EUR' : 'USD'),
      timestamp: Date.now()
    };

    setHistory(prev => [newOp, ...prev]);
  };

  const clearHistory = () => {
    if (confirm('¿Borrar todo el historial?')) {
      setHistory([]);
    }
  };

  const removeHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const formatNumber = (num: number, currency: string = '') => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num) + (currency ? ` ${currency}` : '');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 md:p-8 flex justify-center">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-1.5 rounded-lg">
              <TrendingUp className="w-6 h-6 text-slate-900" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-amber-500 uppercase">MultiExchange Pro</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            AJG-SOLUTION.ONRENDER.COM
          </p>
        </header>

        {/* Rates Section */}
        <section className="bg-slate-900/50 border border-amber-500/10 rounded-3xl p-5 shadow-2xl backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50 text-center">
              <span className="block text-[9px] text-slate-400 mb-1 uppercase font-semibold">🏦 BCV USD</span>
              <b className="font-mono text-xs sm:text-sm text-green-400">{rates.usd.toFixed(2)}</b>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50 text-center">
              <span className="block text-[9px] text-slate-400 mb-1 uppercase font-semibold">🏦 BCV EUR</span>
              <b className="font-mono text-xs sm:text-sm text-sky-400">{rates.eur.toFixed(2)}</b>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50 text-center">
              <span className="block text-[9px] text-slate-400 mb-1 uppercase font-semibold">🟡 P2P</span>
              <b className="font-mono text-xs sm:text-sm text-amber-400">{rates.p2p.toFixed(2)}</b>
            </div>
          </div>

          {/* Calculator Input */}
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-700 rounded-full px-6 py-3 flex items-center gap-4 focus-within:border-amber-500 transition-colors">
              <span className="text-amber-500 font-bold min-w-[45px] text-sm">{modo}</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent border-none outline-none text-2xl font-mono w-full"
                placeholder="0.00"
                step="any"
                inputMode="decimal"
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setModo('USD')}
                className={`flex-1 py-3 rounded-full text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${modo === 'USD' ? 'bg-amber-500 text-slate-900 scale-[1.02]' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
              >
                 <ArrowRightLeft className="w-3 h-3" />
                 USD → VES
              </button>
              <button 
                onClick={() => setModo('VES')}
                className={`flex-1 py-3 rounded-full text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${modo === 'VES' ? 'bg-amber-500 text-slate-900 scale-[1.02]' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                VES → TODO
              </button>
            </div>
          </div>

          {/* Instant Results */}
          <div className="mt-8 space-y-3">
            <div 
              onClick={() => registerOperation('p2p', 'Binance P2P')}
              className="group cursor-pointer bg-slate-900/40 hover:bg-slate-800 transition-all p-4 rounded-2xl border-l-4 border-amber-500 flex justify-between items-center shadow-md active:scale-95"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-500" />
                <small className="text-slate-400 font-medium">🟡 Binance P2P</small>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-mono font-bold text-lg text-slate-100">{formatNumber(results.p2p, modo === 'USD' ? 'Bs' : 'USD')}</div>
                <Plus className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div 
              onClick={() => registerOperation('usd', 'BCV USD')}
              className="group cursor-pointer bg-slate-900/40 hover:bg-slate-800 transition-all p-4 rounded-2xl border-l-4 border-green-500 flex justify-between items-center shadow-md active:scale-95"
            >
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-green-500" />
                <small className="text-slate-400 font-medium">🏦 BCV USD</small>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-mono font-bold text-lg text-slate-100">{formatNumber(results.usd, modo === 'USD' ? 'Bs' : 'USD')}</div>
                <Plus className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div 
              onClick={() => registerOperation('eur', 'BCV EUR')}
              className="group cursor-pointer bg-slate-900/40 hover:bg-slate-800 transition-all p-4 rounded-2xl border-l-4 border-sky-500 flex justify-between items-center shadow-md active:scale-95"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-500" />
                <small className="text-slate-400 font-medium">🏦 BCV EUR</small>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-mono font-bold text-lg text-slate-100">{formatNumber(results.eur, modo === 'USD' ? 'Bs' : 'EUR')}</div>
                <Plus className="w-4 h-4 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button 
              onClick={() => setIsEditingRates(true)}
              className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 text-amber-500 text-[11px] font-bold rounded-xl border border-amber-500/20 shadow-sm"
            >
              <Settings2 className="w-4 h-4" />
              Editar Tasas
            </button>
            <button 
              onClick={syncRates}
              className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-bold rounded-xl border border-sky-500/20 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
          </div>
        </section>

        {/* History Section */}
        <section className="flex flex-col gap-4">
          <div className="flex justify-end items-center px-2">
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-[10px] text-red-500/70 hover:text-red-400 font-bold uppercase transition-colors p-2"
              >
                Limpiar Historial
              </button>
            )}
          </div>

          <div className="space-y-3 min-h-[20px]">
            <AnimatePresence mode="popLayout">
              {history.map((op) => (
                <motion.div
                  key={op.id}
                    layout="position"
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    className="bg-slate-900/70 border border-slate-800 p-4 rounded-3xl group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tight">
                          {op.rateName} @ {op.rateValue.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(op.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button 
                        onClick={() => removeHistoryItem(op.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-sm font-mono text-slate-400">
                        {formatNumber(op.amount, op.type === 'USD_TO_VES' ? 'USD' : 'VES')}
                      </div>
                      <div className="text-lg font-mono font-bold text-amber-400">
                        {formatNumber(op.result, op.currency)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
          </div>
        </section>

        {/* Modal Editar Tasas */}
        <AnimatePresence>
          {isEditingRates && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative"
              >
                <button 
                  onClick={() => setIsEditingRates(false)}
                  className="absolute top-6 right-6 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <h3 className="text-xl font-bold mb-8 text-center bg-gradient-to-r from-amber-500 to-amber-200 bg-clip-text text-transparent">Configurar Tasas</h3>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 tracking-widest">BCV USD</label>
                    <input 
                      type="number" 
                      value={rates.usd}
                      onChange={(e) => setRates(prev => ({ ...prev, usd: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-700 p-4 rounded-3xl font-mono focus:border-amber-500 outline-none transition-colors"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 tracking-widest">BCV EUR</label>
                    <input 
                      type="number" 
                      value={rates.eur}
                      onChange={(e) => setRates(prev => ({ ...prev, eur: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-700 p-4 rounded-3xl font-mono focus:border-amber-500 outline-none transition-colors"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 tracking-widest">Binance P2P</label>
                    <input 
                      type="number" 
                      value={rates.p2p}
                      onChange={(e) => setRates(prev => ({ ...prev, p2p: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-700 p-4 rounded-3xl font-mono focus:border-amber-500 outline-none transition-colors"
                      step="any"
                    />
                  </div>
                  
                  <button 
                    onClick={() => setIsEditingRates(false)}
                    className="w-full bg-amber-500 text-slate-900 font-bold py-4 rounded-3xl mt-4 shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
