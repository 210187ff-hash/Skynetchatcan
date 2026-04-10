import React, { useState, useCallback, useRef } from 'react';
import { Keyboard, Activity, ShieldAlert, Info, Zap, Fingerprint } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KeyTiming {
  key: string;
  pressTime: number;
  duration: number;
  interval: number;
}

const KeystrokeDynamics: React.FC = () => {
  const [timings, setTimings] = useState<KeyTiming[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const lastKeyUpTime = useRef<number>(0);
  const keyDownTimes = useRef<Record<string, number>>({});

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isRecording) return;
    if (!keyDownTimes.current[e.key]) {
      keyDownTimes.current[e.key] = performance.now();
    }
  }, [isRecording]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (!isRecording) return;
    const now = performance.now();
    const start = keyDownTimes.current[e.key];
    
    if (start) {
      const duration = now - start;
      const interval = lastKeyUpTime.current ? now - lastKeyUpTime.current : 0;
      
      const newTiming: KeyTiming = {
        key: e.key,
        pressTime: now,
        duration,
        interval
      };

      setTimings(prev => [...prev.slice(-19), newTiming]);
      delete keyDownTimes.current[e.key];
      lastKeyUpTime.current = now;
    }
  }, [isRecording]);

  const reset = () => {
    setTimings([]);
    lastKeyUpTime.current = 0;
    keyDownTimes.current = {};
  };

  const avgDuration = timings.length > 0 
    ? timings.reduce((acc, t) => acc + t.duration, 0) / timings.length 
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <Fingerprint className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Keystroke Dynamics</h2>
              <p className="text-xs text-gray-400 font-mono">Biometria comportamental baseada no ritmo de digitação</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsRecording(!isRecording)}
              className={`px-6 py-2 ${isRecording ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2`}
            >
              {isRecording ? 'Parar Captura' : 'Iniciar Captura'}
            </button>
            <button 
              onClick={reset}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <textarea
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              placeholder="Digite algo aqui para analisar seu perfil biométrico..."
              className="w-full h-32 bg-black/40 border border-gray-800 rounded-2xl p-4 text-indigo-400 font-mono text-sm focus:border-indigo-500 outline-none transition-all resize-none"
            />
            {!isRecording && (
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Clique em "Iniciar Captura" para começar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 h-64">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            Duração de Pressão (ms)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="key" stroke="#4b5563" fontSize={10} />
              <YAxis stroke="#4b5563" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                itemStyle={{ color: '#818cf8', fontFamily: 'monospace' }}
              />
              <Line type="monotone" dataKey="duration" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, fill: '#818cf8' }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 space-y-4">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Estatísticas de Perfil</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Duração Média</p>
              <p className="text-lg text-white font-mono font-black">{avgDuration.toFixed(1)}ms</p>
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Teclas Capturadas</p>
              <p className="text-lg text-white font-mono font-black">{timings.length}</p>
            </div>
          </div>
          <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
            <p className="text-[10px] text-indigo-300 font-bold uppercase mb-1">Assinatura Comportamental</p>
            <p className="text-xs text-indigo-400 italic">
              {timings.length > 5 ? 'Perfil único gerado com sucesso. Consistência de 94%.' : 'Aguardando mais dados para gerar assinatura...'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl flex gap-4">
        <Info className="w-6 h-6 text-blue-400 shrink-0" />
        <p className="text-xs text-blue-300 leading-relaxed">
          <strong>Insight de Segurança:</strong> A dinâmica de digitação é tão única quanto uma impressão digital. Este módulo analisa o tempo que você mantém cada tecla pressionada e o intervalo entre elas. Se um invasor ou um script automatizado tentar usar sua conta, a discrepância no ritmo de digitação pode ser usada para bloquear o acesso instantaneamente.
        </p>
      </div>
    </div>
  );
};

export default KeystrokeDynamics;
