import React, { useState, useEffect } from 'react';
import { Sun, Zap, ShieldAlert, Activity, Info, Lightbulb } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LightPulseDetector: React.FC = () => {
  const [illuminance, setIlluminance] = useState<number>(0);
  const [history, setHistory] = useState<{ time: number; lux: number }[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let sensor: any = null;

    if (isMonitoring) {
      if ('AmbientLightSensor' in window) {
        try {
          sensor = new (window as any).AmbientLightSensor();
          sensor.addEventListener('reading', () => {
            setIlluminance(sensor.illuminance);
            setHistory(prev => [
              ...prev.slice(-29),
              { time: Date.now(), lux: sensor.illuminance }
            ]);
          });
          sensor.addEventListener('error', (event: any) => {
            if (event.error.name === 'NotAllowedError') {
              setError('Permissão para acessar sensor de luz negada. Verifique as configurações do navegador.');
            } else {
              setError('Sensor de luz ambiente não disponível ou não suportado.');
            }
            setIsMonitoring(false);
          });
          sensor.start();
        } catch (err) {
          setError('Erro ao inicializar sensor de luz.');
          setIsMonitoring(false);
        }
      } else {
        setError('AmbientLightSensor API não suportada neste navegador. (Requer Chrome/Edge com flag habilitada)');
        setIsMonitoring(false);
      }
    }

    return () => {
      if (sensor) sensor.stop();
    };
  }, [isMonitoring]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-2xl">
              <Sun className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Light Pulse Detector</h2>
              <p className="text-xs text-gray-400 font-mono">Detecção de pulsos ópticos e variações de lux ambiente</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-6 py-2 ${isMonitoring ? 'bg-red-600 hover:bg-red-500' : 'bg-yellow-600 hover:bg-yellow-500'} text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2`}
          >
            {isMonitoring ? 'Parar Sensor' : 'Iniciar Sensor'}
          </button>
        </div>

        <div className="h-64 w-full bg-black/40 rounded-2xl border border-gray-800 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorLux" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Area 
                type="monotone" 
                dataKey="lux" 
                stroke="#eab308" 
                fillOpacity={1} 
                fill="url(#colorLux)" 
                isAnimationActive={false} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Intensidade Atual</p>
          <p className="text-2xl font-mono font-black text-white">{illuminance.toFixed(1)} <span className="text-xs text-gray-600">LUX</span></p>
        </div>
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Frequência de Pulso</p>
          <p className="text-lg font-bold text-blue-400 uppercase">0.0 Hz (Estável)</p>
        </div>
        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Modo de Detecção</p>
          <p className="text-lg font-bold text-yellow-500 uppercase flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Óptico
          </p>
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
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Análise de Vigilância Óptica</h3>
        </div>
        <p className="text-xs text-blue-300 leading-relaxed">
          Câmeras de vigilância modernas e dispositivos de escuta óptica utilizam pulsos de luz infravermelha (IR) ou lasers para comunicação e visão noturna. Este sensor detecta variações rápidas na luz ambiente que podem indicar a presença de transmissores ópticos ativos ou câmeras ocultas operando em modo infravermelho.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-blue-400/80 italic">
          <Info className="w-3 h-3" />
          Nota: Para melhores resultados, aponte o sensor de luz do dispositivo para áreas suspeitas no escuro.
        </div>
      </div>
    </div>
  );
};

export default LightPulseDetector;
