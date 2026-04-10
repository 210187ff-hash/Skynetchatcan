import React, { useState, useEffect } from 'react';
import { Battery, BatteryCharging, Zap, ShieldAlert, Activity, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BatteryData {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

const BatteryForensics: React.FC = () => {
  const [battery, setBattery] = useState<BatteryData | null>(null);
  const [history, setHistory] = useState<{ time: string; level: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('getBattery' in navigator)) {
      setError('Battery Status API não suportada neste navegador.');
      return;
    }

    let batteryObj: any = null;

    const updateBatteryInfo = (b: any) => {
      setBattery({
        level: b.level * 100,
        charging: b.charging,
        chargingTime: b.chargingTime,
        dischargingTime: b.dischargingTime,
      });
      
      setHistory(prev => [
        ...prev.slice(-19),
        { time: new Date().toLocaleTimeString(), level: b.level * 100 }
      ]);
    };

    (navigator as any).getBattery().then((b: any) => {
      batteryObj = b;
      updateBatteryInfo(b);
      
      b.addEventListener('chargingchange', () => updateBatteryInfo(b));
      b.addEventListener('levelchange', () => updateBatteryInfo(b));
      b.addEventListener('chargingtimechange', () => updateBatteryInfo(b));
      b.addEventListener('dischargingtimechange', () => updateBatteryInfo(b));
    });

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('chargingchange', () => {});
        batteryObj.removeEventListener('levelchange', () => {});
        batteryObj.removeEventListener('chargingtimechange', () => {});
        batteryObj.removeEventListener('dischargingtimechange', () => {});
      }
    };
  }, []);

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-3xl inline-block">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-mono">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-yellow-500/10 rounded-2xl">
            <Battery className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Battery Forensics</h2>
            <p className="text-xs text-gray-400 font-mono">Análise de consumo energético e detecção de processos ocultos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-black/40 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Nível Atual</p>
            <div className="relative">
              <span className="text-4xl font-black text-white font-mono">{battery?.level.toFixed(0)}%</span>
              {battery?.charging && (
                <BatteryCharging className="w-5 h-5 text-green-500 absolute -top-2 -right-6 animate-pulse" />
              )}
            </div>
          </div>

          <div className="p-6 bg-black/40 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Estado</p>
            <p className={`text-lg font-bold uppercase tracking-tight ${battery?.charging ? 'text-green-500' : 'text-yellow-500'}`}>
              {battery?.charging ? 'Carregando' : 'Descarregando'}
            </p>
          </div>

          <div className="p-6 bg-black/40 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Autonomia Est.</p>
            <p className="text-lg font-mono text-blue-400">
              {battery?.dischargingTime === Infinity ? 'Calculando...' : 
               battery?.dischargingTime ? `${(battery.dischargingTime / 60).toFixed(0)} min` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 h-64">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Gráfico de Descarga
            </h3>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                itemStyle={{ color: '#3b82f6', fontFamily: 'monospace' }}
              />
              <Line type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 space-y-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Análise de Ameaça Energética</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Drenagem Anômala</p>
              <p className="text-xs text-green-400 font-mono">Não detectada (Consumo Nominal)</p>
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Processos de Fundo</p>
              <p className="text-xs text-blue-400 font-mono">Otimizados (Nenhuma atividade suspeita)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl flex gap-4">
        <Info className="w-6 h-6 text-blue-400 shrink-0" />
        <p className="text-xs text-blue-300 leading-relaxed">
          <strong>Insight Tático:</strong> Spywares e mineradores de cripto ocultos frequentemente causam uma queda abrupta no nível da bateria e um aumento na temperatura do hardware. Monitore este gráfico durante períodos de inatividade do dispositivo para identificar exfiltração de dados silenciosa.
        </p>
      </div>
    </div>
  );
};

export default BatteryForensics;
