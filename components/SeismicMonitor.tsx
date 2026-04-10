import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, Info, Maximize2, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SeismicMonitor: React.FC = () => {
  const [data, setData] = useState<{ time: number; x: number; y: number; z: number; total: number }[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [peak, setPeak] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<number>();

  const startMonitoring = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          setError('Permissão para acessar acelerômetro negada.');
          return;
        }
      } catch (err) {
        setError('Erro ao solicitar permissão de movimento.');
        return;
      }
    }

    setIsMonitoring(true);
    setError(null);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      if (!isMonitoring) return;

      const acc = event.accelerationIncludingGravity;
      if (acc) {
        const x = acc.x || 0;
        const y = acc.y || 0;
        const z = acc.z || 0;
        const total = Math.sqrt(x * x + y * y + z * z);

        if (total > peak) setPeak(total);

        setData(prev => [
          ...prev.slice(-49),
          { time: Date.now(), x, y, z, total }
        ]);
      }
    };

    if (isMonitoring) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isMonitoring, peak]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <Activity className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Seismic Vibration Monitor</h2>
              <p className="text-xs text-gray-400 font-mono">Detecção de micro-vibrações e movimentos ambientais</p>
            </div>
          </div>
          <button 
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`px-6 py-2 ${isMonitoring ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2`}
          >
            {isMonitoring ? 'Parar Monitoramento' : 'Iniciar Sensor'}
          </button>
        </div>

        <div className="h-64 w-full bg-black/40 rounded-2xl border border-gray-800 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#ef4444" 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Pico Detectado</p>
          <p className="text-2xl font-mono font-black text-white">{peak.toFixed(3)} <span className="text-xs text-gray-600">m/s²</span></p>
        </div>
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Status Ambiental</p>
          <p className={`text-lg font-bold uppercase ${peak > 12 ? 'text-red-500' : 'text-green-500'}`}>
            {peak > 12 ? 'Vibração Crítica' : 'Estável'}
          </p>
        </div>
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Sensibilidade</p>
          <p className="text-lg font-bold text-blue-400 uppercase">Alta (0.001g)</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <ShieldAlert className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Análise Sismográfica Tática</h3>
        </div>
        <p className="text-xs text-blue-300 leading-relaxed">
          Este módulo utiliza o acelerômetro de alta precisão do dispositivo para detectar vibrações estruturais. Em um cenário de espionagem, isso pode ser usado para detectar a aproximação de pessoas em superfícies sensíveis ou a ativação de motores e ventiladores de equipamentos eletrônicos ocultos próximos ao dispositivo.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-blue-400/80 italic">
          <Info className="w-3 h-3" />
          Dica: Coloque o dispositivo em uma superfície sólida e plana para calibração máxima.
        </div>
      </div>
    </div>
  );
};

export default SeismicMonitor;
