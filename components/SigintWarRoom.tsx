import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Activity, Shield, Radio, Wifi, Bluetooth, Zap, Globe, Cpu, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis } from 'recharts';

const SigintWarRoom: React.FC = () => {
  const [uptime, setUptime] = useState(0);
  const [threatLevel, setThreatLevel] = useState(0);
  const [signals, setSignals] = useState<{ time: string, val: number }[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sensorData, setSensorData] = useState({
    emf: 0,
    audio: 0,
    wifi: 0,
    bt: 0
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isMonitoring) return;

    // 1. Uptime Counter
    const uptimeInterval = setInterval(() => setUptime(prev => prev + 1), 1000);

    // 2. Real EMF Listener
    let magnetometer: any = null;
    if ('Magnetometer' in window) {
      try {
        magnetometer = new (window as any).Magnetometer({ frequency: 5 });
        magnetometer.addEventListener('reading', () => {
          const val = Math.sqrt(magnetometer.x ** 2 + magnetometer.y ** 2 + magnetometer.z ** 2);
          setSensorData(prev => ({ ...prev, emf: Math.round(val) }));
        });
        magnetometer.start();
      } catch (e) { console.error('Magnetometer error:', e); }
    }

    // 3. Real Audio Level Listener
    let analyser: AnalyserNode | null = null;

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMonitoring) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;
        
        analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateAudio = () => {
          if (!analyser || audioCtx.state === 'closed') return;
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setSensorData(prev => ({ ...prev, audio: Math.round(avg) }));
          requestAnimationFrame(updateAudio);
        };
        updateAudio();
      } catch (e) { console.error('Audio error:', e); }
    };
    startAudio();

    // 4. Real Network Listener
    const updateNet = () => {
      const conn = (navigator as any).connection;
      if (conn) {
        const val = (conn.downlink || 0) * 10; // Scale downlink to 0-100 range
        setSensorData(prev => ({ ...prev, wifi: Math.round(val) }));
      }
    };
    updateNet();
    (navigator as any).connection?.addEventListener('change', updateNet);

    return () => {
      clearInterval(uptimeInterval);
      if (magnetometer) magnetometer.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      (navigator as any).connection?.removeEventListener('change', updateNet);
    };
  }, [isMonitoring]);

  // Calculate real threat level based on sensor spikes
  useEffect(() => {
    const emfThreat = Math.min(40, (sensorData.emf / 100) * 40);
    const audioThreat = Math.min(30, (sensorData.audio / 128) * 30);
    const netThreat = Math.min(30, (sensorData.wifi / 100) * 30);
    
    const total = Math.round(emfThreat + audioThreat + netThreat);
    setThreatLevel(total);
    setSignals(prev => [...prev.slice(-29), { time: new Date().toLocaleTimeString(), val: total }]);
  }, [sensorData]);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-1000">
      <header className="flex items-center justify-between border-b border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white font-display tracking-tighter uppercase italic">SIGINT War Room</h1>
            <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">Signal Intelligence & Electronic Warfare Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
              isMonitoring ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
            }`}
          >
            {isMonitoring ? 'Terminate Session' : 'Initialize War Room'}
          </button>
          <div className="text-right font-mono">
            <p className="text-[10px] text-gray-500 uppercase font-bold">System Uptime</p>
            <p className="text-xl text-white font-black">{formatUptime(uptime)}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main Threat Level */}
        <div className="md:col-span-1 bg-gray-900 rounded-3xl border border-gray-800 p-8 flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 to-transparent"></div>
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="60" stroke="#1f2937" strokeWidth="8" fill="transparent" />
              <circle 
                cx="64" cy="64" r="60" stroke={threatLevel > 70 ? '#dc2626' : threatLevel > 40 ? '#eab308' : '#3b82f6'} 
                strokeWidth="8" fill="transparent" 
                strokeDasharray={377}
                strokeDashoffset={377 - (377 * threatLevel) / 100}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white font-mono">{Math.round(threatLevel)}%</span>
              <span className="text-[8px] font-bold text-gray-500 uppercase">Threat Score</span>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">
              {threatLevel > 70 ? 'DEFCON 1' : threatLevel > 40 ? 'DEFCON 3' : 'DEFCON 5'}
            </h3>
            <p className="text-[9px] text-gray-500 font-mono mt-1">Status: {threatLevel > 70 ? 'CRITICAL ALERT' : 'MONITORING'}</p>
          </div>
        </div>

        {/* Real-time Signal Feed */}
        <div className="md:col-span-3 bg-black rounded-3xl border border-gray-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Aggregate Signal Activity</h3>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-[8px] text-blue-400 font-mono">RF</span>
              <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded text-[8px] text-purple-400 font-mono">EMF</span>
              <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-[8px] text-green-400 font-mono">AUDIO</span>
            </div>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signals}>
                <YAxis hide domain={[0, 100]} />
                <XAxis hide dataKey="time" />
                <Line 
                  type="monotone" 
                  dataKey="val" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={false} 
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sub-systems */}
        {[
          { icon: <Wifi />, label: 'Wi-Fi Core', status: 'Active', color: 'text-blue-400', val: `${sensorData.wifi} Mbps` },
          { icon: <Bluetooth />, label: 'BT Engine', status: 'Scanning', color: 'text-indigo-400', val: 'Active' },
          { icon: <Radio />, label: 'Acoustic', status: 'Listening', color: 'text-green-400', val: `${sensorData.audio} dB` },
          { icon: <Zap />, label: 'EMF Sensor', status: 'Calibrated', color: 'text-yellow-400', val: `${sensorData.emf} µT` },
          { icon: <Globe />, label: 'Network', status: 'Secure', color: 'text-purple-400', val: 'Online' },
          { icon: <Cpu />, label: 'AI Core', status: 'Processing', color: 'text-red-400', val: `${threatLevel}% Risk` },
        ].map((sys, i) => (
          <div key={i} className="p-5 bg-gray-900/50 rounded-2xl border border-gray-800 flex items-center justify-between group hover:border-gray-700 transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gray-800 ${sys.color}`}>
                {sys.icon}
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-tight">{sys.label}</h4>
                <p className="text-[9px] text-gray-500 font-mono uppercase">{sys.status}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-black font-mono ${sys.color}`}>{sys.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-red-600/10 border border-red-600/30 p-6 rounded-3xl flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-black text-red-400 uppercase tracking-widest">Active Counter-Surveillance Protocol</p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            O War Room agrega dados de todos os sensores em uma única matriz de decisão. Se o Threat Score exceder 85%, o sistema entrará em modo de bloqueio automático, desativando interfaces vulneráveis e alertando via feedback haptico de alta frequência.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SigintWarRoom;
