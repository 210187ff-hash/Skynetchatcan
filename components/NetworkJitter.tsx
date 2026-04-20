import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, Info, Zap, Wifi, ArrowDownUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NetworkJitter: React.FC = () => {
  const [jitterData, setJitterData] = useState<{ time: string; latency: number }[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const avgLatency = jitterData.length > 0 
    ? jitterData.reduce((acc, curr) => acc + curr.latency, 0) / jitterData.length 
    : 0;

  const currentJitter = jitterData.length > 1
    ? Math.abs(jitterData[jitterData.length - 1].latency - jitterData[jitterData.length - 2].latency)
    : 0;

  const runTest = async () => {
    const startTime = performance.now();
    try {
      // Fetch a small asset with cache busting
      await fetch(`https://www.google.com/favicon.ico?cb=${Date.now()}`, { mode: 'no-cors' });
      const endTime = performance.now();
      const latency = endTime - startTime;

      const newEntry = { time: new Date().toLocaleTimeString(), latency };
      
      setJitterData(prev => [...prev.slice(-19), newEntry]);
    } catch (err) {
      console.error('Ping error:', err);
    }
  };

  useEffect(() => {
    if (isTesting) {
      timerRef.current = setInterval(runTest, 2000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTesting]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <ArrowDownUp className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Network Jitter Analysis</h2>
              <p className="text-xs text-gray-400 font-mono">Monitoramento de estabilidade de conexão e detecção de MITM</p>
            </div>
          </div>
          <button 
            onClick={() => setIsTesting(!isTesting)}
            className={`px-6 py-2 ${isTesting ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2`}
          >
            {isTesting ? 'Parar Teste' : 'Iniciar Monitoramento'}
          </button>
        </div>

        <div className="h-64 w-full bg-black/40 rounded-2xl border border-gray-800 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={jitterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                itemStyle={{ color: '#3b82f6', fontFamily: 'monospace' }}
              />
              <Line 
                type="monotone" 
                dataKey="latency" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#3b82f6' }} 
                isAnimationActive={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Latência Média</p>
          <p className="text-2xl font-mono font-black text-white">{avgLatency.toFixed(1)} <span className="text-xs text-gray-600">ms</span></p>
        </div>
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Jitter Atual</p>
          <p className={`text-2xl font-mono font-black ${currentJitter > 50 ? 'text-red-500' : 'text-green-500'}`}>
            {currentJitter.toFixed(1)} <span className="text-xs">ms</span>
          </p>
        </div>
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Integridade de Rota</p>
          <p className={`text-lg font-bold uppercase ${currentJitter > 100 ? 'text-red-500' : 'text-blue-400'}`}>
            {currentJitter > 100 ? 'Instável / MITM?' : 'Segura'}
          </p>
        </div>
      </div>

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <Wifi className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Análise Forense de Rede</h3>
        </div>
        <p className="text-xs text-blue-300 leading-relaxed">
          O "Jitter" é a variação no atraso de entrega dos pacotes. Em uma rede segura e direta, o jitter deve ser baixo. Picos constantes de jitter ou variações extremas na latência podem indicar que seu tráfego está sendo interceptado, analisado ou redirecionado por um nó intermediário malicioso (Man-in-the-Middle).
        </p>
        <div className="flex items-center gap-2 text-[10px] text-blue-400/80 italic">
          <Info className="w-3 h-3" />
          Nota: Este teste realiza pings reais para servidores de borda globais para medir a estabilidade do link.
        </div>
      </div>
    </div>
  );
};

export default NetworkJitter;
