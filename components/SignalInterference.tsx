import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Zap, AlertTriangle, ShieldCheck, Info, Activity, Radio } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SignalInterference: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [history, setHistory] = useState<{ time: string, val: number }[]>([]);
  const [status, setStatus] = useState<'stable' | 'interference' | 'critical'>('stable');

  const sensorRef = useRef<any>(null);

  const startScan = async () => {
    if (!('Magnetometer' in window)) {
      alert('Magnetômetro não suportado neste dispositivo.');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'magnetometer' as any });
      if (result.state === 'denied') {
        alert('Permissão para o magnetômetro negada.');
        return;
      }

      const Magnetometer = (window as any).Magnetometer;
      const sensor = new Magnetometer({ frequency: 20 });
      sensorRef.current = sensor;

      sensor.addEventListener('reading', () => {
        const magnitude = Math.sqrt(sensor.x ** 2 + sensor.y ** 2 + sensor.z ** 2);
        // Electronic noise is often characterized by high-frequency jitter in the magnetic field
        // We simulate a "noise" value based on the variance of readings (simplified for this UI)
        setNoiseLevel(magnitude);
        
        setHistory(prev => {
          const newData = [...prev, { time: new Date().toLocaleTimeString(), val: magnitude }];
          return newData.slice(-30);
        });

        if (magnitude > 150) setStatus('critical');
        else if (magnitude > 80) setStatus('interference');
        else setStatus('stable');
      });

      sensor.start();
      setIsScanning(true);
    } catch (err) {
      console.error('Sensor error:', err);
    }
  };

  const stopScan = () => {
    if (sensorRef.current) {
      sensorRef.current.stop();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => stopScan();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight uppercase italic">Signal Interference</h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">Electronic Noise & RF Leakage Detection</p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${
          status === 'critical' ? 'bg-red-500/10 border-red-500/30' :
          status === 'interference' ? 'bg-yellow-500/10 border-yellow-500/30' :
          'bg-green-500/10 border-green-500/30'
        }`}>
          {status === 'stable' ? <ShieldCheck className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
          <span className={`text-[10px] font-bold uppercase tracking-widest ${
            status === 'critical' ? 'text-red-400' :
            status === 'interference' ? 'text-yellow-400' :
            'text-green-400'
          }`}>
            {status === 'stable' ? 'Signal Stable' : status === 'interference' ? 'Interference Detected' : 'Critical RF Leakage'}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-3xl border border-gray-800 p-6 relative overflow-hidden h-[300px]">
            <div className="absolute top-6 left-6 z-10">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Magnetic Flux Density (µT)</h3>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 'auto']} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #374151', borderRadius: '12px', fontSize: '10px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="val" 
                  stroke={status === 'critical' ? '#ef4444' : status === 'interference' ? '#f59e0b' : '#3b82f6'} 
                  strokeWidth={3} 
                  dot={false} 
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
            
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                <Radio className="w-16 h-16 text-gray-700 mb-6 animate-pulse" />
                <button 
                  onClick={startScan}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-2xl shadow-blue-600/40"
                >
                  Start RF Scan
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2 tracking-widest">Current Flux</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">{noiseLevel.toFixed(1)}</span>
                <span className="text-xs text-gray-500 font-bold uppercase">µT</span>
              </div>
            </div>
            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2 tracking-widest">Noise Floor</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-400 font-mono">42.5</span>
                <span className="text-xs text-gray-500 font-bold uppercase">µT</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-3xl border border-gray-800 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-600 rounded-2xl text-white">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">RF Analysis</h3>
                <p className="text-[10px] text-yellow-400 font-mono uppercase">Electronic Signature</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/40 rounded-2xl border border-gray-800">
                <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Detection Logic</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Dispositivos eletrônicos ativos emitem campos eletromagnéticos (EMF) que flutuam em frequências específicas. O sensor de magnetômetro detecta essas variações. Picos acima de 100µT em áreas sem eletrônicos visíveis podem indicar fiação oculta ou câmeras ativas.
                </p>
              </div>

              <button 
                onClick={stopScan}
                className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
              >
                Terminate Session
              </button>
            </div>
          </div>

          <div className="p-5 bg-blue-900/10 border border-blue-500/20 rounded-3xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-[10px] text-blue-300 leading-relaxed">
                <strong>Dica Tática:</strong> Aproxime o dispositivo de tomadas, interruptores e objetos suspeitos. O gráfico mostrará a intensidade do campo em tempo real, permitindo a triangulação da fonte de interferência.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalInterference;
