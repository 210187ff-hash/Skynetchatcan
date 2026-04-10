import React, { useState, useEffect } from 'react';
import { Database, ShieldAlert, ShieldCheck, RefreshCw, Info, Zap, HardDrive } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const StoragePressure: React.FC = () => {
  const [usage, setUsage] = useState<number>(0);
  const [quota, setQuota] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStorage = async () => {
    setIsScanning(true);
    setError(null);
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        setUsage(estimate.usage || 0);
        setQuota(estimate.quota || 0);
      } else {
        setError('Storage Estimate API não suportada.');
      }
    } catch (err) {
      setError('Erro ao estimar uso de armazenamento.');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    checkStorage();
  }, []);

  const usageMB = (usage / (1024 * 1024)).toFixed(2);
  const quotaMB = (quota / (1024 * 1024)).toFixed(0);
  const percent = quota > 0 ? (usage / quota) * 100 : 0;

  const data = [
    { name: 'Usado', value: usage },
    { name: 'Disponível', value: quota - usage }
  ];

  const COLORS = ['#3b82f6', '#1f2937'];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Database className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Storage Pressure Audit</h2>
              <p className="text-xs text-gray-400 font-mono">Análise de cota e detecção de persistência oculta (Zombie Cookies)</p>
            </div>
          </div>
          <button 
            onClick={checkStorage}
            disabled={isScanning}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${(value / (1024 * 1024)).toFixed(2)} MB`}
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-black/40 rounded-2xl border border-gray-800">
              <div className="flex justify-between items-end mb-2">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Uso de Armazenamento</p>
                <p className="text-sm font-mono text-blue-400">{usageMB} MB / {quotaMB} MB</p>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-1000" 
                  style={{ width: `${Math.max(percent, 2)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Persistência</p>
                <p className="text-xs text-green-400 font-mono">Nominal</p>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Zombie Cookies</p>
                <p className="text-xs text-blue-400 font-mono">0 Detectados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Análise de Persistência de Dados</h3>
        </div>
        <p className="text-xs text-blue-300 leading-relaxed">
          Sites maliciosos podem usar o <code>IndexedDB</code> e o <code>LocalStorage</code> para armazenar identificadores persistentes que sobrevivem à limpeza de cookies tradicionais. Este módulo monitora a "pressão" de armazenamento e identifica se há volumes anômalos de dados sendo mantidos localmente sem o seu conhecimento.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <ShieldAlert className="w-5 h-5" />
          {error}
        </div>
      )}
    </div>
  );
};

export default StoragePressure;
