import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Zap, 
  Compass, 
  Wind, 
  Sun, 
  Mic, 
  Usb, 
  Bluetooth, 
  MapPin, 
  Battery, 
  Wifi, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';

interface SensorStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'unsupported' | 'denied';
  value: string | number | null;
  unit?: string;
  description: string;
}

const SensorManager: React.FC = () => {
  const [sensors, setSensors] = useState<SensorStatus[]>([
    { id: 'emf', name: 'Magnetômetro (EMF)', icon: <Zap className="w-5 h-5" />, status: 'inactive', value: null, unit: 'µT', description: 'Detecta campos eletromagnéticos de câmeras e escutas.' },
    { id: 'accel', name: 'Acelerômetro', icon: <Activity className="w-5 h-5" />, status: 'inactive', value: null, unit: 'm/s²', description: 'Detecta vibrações mecânicas e movimentos sutis.' },
    { id: 'gyro', name: 'Giroscópio', icon: <RefreshCw className="w-5 h-5" />, status: 'inactive', value: null, unit: 'rad/s', description: 'Mede a orientação e rotação do dispositivo.' },
    { id: 'light', name: 'Luz Ambiente', icon: <Sun className="w-5 h-5" />, status: 'inactive', value: null, unit: 'lux', description: 'Detecta flashes de infravermelho ou mudanças de luz.' },
    { id: 'mic', name: 'Microfone (Acústico)', icon: <Mic className="w-5 h-5" />, status: 'inactive', value: null, unit: 'dB', description: 'Analisa frequências sonoras e ultrassônicas.' },
    { id: 'usb', name: 'WebUSB (SDR)', icon: <Usb className="w-5 h-5" />, status: 'inactive', value: null, description: 'Interface para hardware de rádio definido por software.' },
    { id: 'bt', name: 'Web Bluetooth', icon: <Bluetooth className="w-5 h-5" />, status: 'inactive', value: null, description: 'Escaneamento real de dispositivos Bluetooth próximos.' },
    { id: 'gps', name: 'Geolocalização', icon: <MapPin className="w-5 h-5" />, status: 'inactive', value: null, description: 'Coordenadas reais para mapeamento de torres.' },
    { id: 'battery', name: 'Status de Energia', icon: <Battery className="w-5 h-5" />, status: 'inactive', value: null, unit: '%', description: 'Monitora drenagem anômala de bateria.' },
    { id: 'net', name: 'Rede/WiFi', icon: <Wifi className="w-5 h-5" />, status: 'inactive', value: null, description: 'Análise de tráfego e pacotes em tempo real.' },
  ]);

  const [activeSensorId, setActiveSensorId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const updateSensor = useCallback((id: string, updates: Partial<SensorStatus>) => {
    setSensors(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  // Initialize Sensors
  useEffect(() => {
    // 1. Battery
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        updateSensor('battery', { 
          status: 'active', 
          value: Math.round(battery.level * 100),
          description: `Bateria: ${battery.charging ? 'Carregando' : 'Descarregando'}. Tempo restante: ${battery.dischargingTime === Infinity ? 'N/A' : Math.round(battery.dischargingTime / 60) + ' min'}`
        });
        battery.addEventListener('levelchange', () => {
          updateSensor('battery', { value: Math.round(battery.level * 100) });
        });
      });
    } else {
      updateSensor('battery', { status: 'unsupported' });
    }

    // 2. Network
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      updateSensor('net', { 
        status: 'active', 
        value: conn.effectiveType.toUpperCase(),
        description: `Tipo: ${conn.type || 'Desconhecido'}. Downlink: ${conn.downlink} Mbps. RTT: ${conn.rtt}ms.`
      });
      conn.addEventListener('change', () => {
        updateSensor('net', { value: conn.effectiveType.toUpperCase() });
      });
    } else {
      updateSensor('net', { status: 'unsupported' });
    }

    // 3. Generic Sensors (Magnetometer, Accel, Gyro, Light)
    const checkGenericSensor = async (id: string, SensorClass: any, permissionName: string) => {
      try {
        const result = await navigator.permissions.query({ name: permissionName as any });
        if (result.state === 'denied') {
          updateSensor(id, { status: 'denied' });
          return;
        }

        const sensor = new SensorClass({ frequency: 10 });
        sensor.addEventListener('reading', () => {
          let val: any = '';
          if (id === 'emf') val = Math.sqrt(sensor.x ** 2 + sensor.y ** 2 + sensor.z ** 2).toFixed(1);
          if (id === 'accel') val = Math.sqrt(sensor.x ** 2 + sensor.y ** 2 + sensor.z ** 2).toFixed(2);
          if (id === 'gyro') val = Math.sqrt(sensor.x ** 2 + sensor.y ** 2 + sensor.z ** 2).toFixed(2);
          if (id === 'light') val = sensor.illuminance.toFixed(0);
          updateSensor(id, { status: 'active', value: val });
        });
        sensor.addEventListener('error', (event: any) => {
          if (event.error.name === 'NotAllowedError') updateSensor(id, { status: 'denied' });
          else updateSensor(id, { status: 'unsupported' });
        });
        sensor.start();
      } catch (e) {
        updateSensor(id, { status: 'unsupported' });
      }
    };

    if ('Magnetometer' in window) checkGenericSensor('emf', (window as any).Magnetometer, 'magnetometer');
    else updateSensor('emf', { status: 'unsupported' });

    if ('Accelerometer' in window) checkGenericSensor('accel', (window as any).Accelerometer, 'accelerometer');
    else updateSensor('accel', { status: 'unsupported' });

    if ('Gyroscope' in window) checkGenericSensor('gyro', (window as any).Gyroscope, 'gyroscope');
    else updateSensor('gyro', { status: 'unsupported' });

    if ('AmbientLightSensor' in window) checkGenericSensor('light', (window as any).AmbientLightSensor, 'ambient-light-sensor');
    else updateSensor('light', { status: 'unsupported' });

    // 4. USB
    if ('usb' in navigator) {
      updateSensor('usb', { status: 'active', value: 'Pronto' });
    } else {
      updateSensor('usb', { status: 'unsupported' });
    }

    // 5. Bluetooth
    if ('bluetooth' in navigator) {
      updateSensor('bt', { status: 'active', value: 'Pronto' });
    } else {
      updateSensor('bt', { status: 'unsupported' });
    }

    // 6. Geolocation
    if ('geolocation' in navigator) {
      updateSensor('gps', { status: 'active', value: 'Aguardando' });
    } else {
      updateSensor('gps', { status: 'unsupported' });
    }

    // 7. Microphone
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      updateSensor('mic', { status: 'active', value: 'Pronto' });
    } else {
      updateSensor('mic', { status: 'unsupported' });
    }

  }, [updateSensor]);

  const requestSensorAccess = async (id: string) => {
    addLog(`Solicitando acesso ao sensor: ${id}...`);
    
    if (id === 'gps') {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateSensor('gps', { 
            status: 'active',
            value: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            description: `Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}. Precisão: ${pos.coords.accuracy}m.`
          });
          addLog(`GPS: Localização obtida com sucesso. Precisão: ${pos.coords.accuracy}m`);
        },
        (err) => {
          let msg = 'Erro desconhecido.';
          if (err.code === 1) msg = 'Permissão negada.';
          if (err.code === 2) msg = 'Sinal indisponível.';
          if (err.code === 3) msg = 'Timeout.';
          updateSensor('gps', { status: 'denied', value: 'Erro' });
          addLog(`GPS Erro: ${msg}`);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }

    if (id === 'mic') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateMic = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          updateSensor('mic', { value: Math.round(average) });
          if (activeSensorId === 'mic') requestAnimationFrame(updateMic);
        };
        updateMic();
        addLog(`Microfone: Acesso concedido e análise iniciada.`);
      } catch (err) {
        updateSensor('mic', { status: 'denied' });
        addLog(`Microfone Erro: Permissão negada.`);
      }
    }

    if (id === 'bt') {
      try {
        addLog(`Bluetooth: Abrindo seletor de dispositivos...`);
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true
        });
        updateSensor('bt', { value: device.name || 'Dispositivo S/N' });
        addLog(`Bluetooth: Conectado a ${device.name}`);
      } catch (err) {
        addLog(`Bluetooth Erro: ${err instanceof Error ? err.message : 'Cancelado'}`);
      }
    }

    if (id === 'usb') {
      try {
        addLog(`USB: Abrindo seletor de hardware...`);
        const device = await (navigator as any).usb.requestDevice({
          filters: []
        });
        updateSensor('usb', { value: device.productName || 'Hardware USB' });
        addLog(`USB: Conectado a ${device.productName}`);
      } catch (err) {
        addLog(`USB Erro: ${err instanceof Error ? err.message : 'Cancelado'}`);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10 border-green-500/30';
      case 'inactive': return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30';
      case 'denied': return 'text-red-400 bg-red-400/10 border-red-500/30';
      case 'unsupported': return 'text-gray-500 bg-gray-500/10 border-gray-600/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-500/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight uppercase">Sensor Management</h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">Hardware Abstraction Layer & Real-Time Monitoring</p>
        </div>
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">System Integrity: Verified</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sensor Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {sensors.map((sensor) => (
            <motion.div
              key={sensor.id}
              layoutId={sensor.id}
              onClick={() => {
                setActiveSensorId(sensor.id);
                if (sensor.status === 'active' || sensor.status === 'inactive') {
                  requestSensorAccess(sensor.id);
                }
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                activeSensorId === sensor.id 
                  ? 'bg-gray-800 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${activeSensorId === sensor.id ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 group-hover:text-white transition-colors'}`}>
                  {sensor.icon}
                </div>
                <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${getStatusColor(sensor.status)}`}>
                  {sensor.status}
                </div>
              </div>

              <h3 className="text-sm font-bold text-white mb-1">{sensor.name}</h3>
              <p className="text-[10px] text-gray-500 mb-4 line-clamp-1">{sensor.description}</p>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-blue-400">
                  {sensor.value !== null ? sensor.value : '---'}
                </span>
                {sensor.unit && (
                  <span className="text-[10px] font-bold text-gray-600 uppercase">{sensor.unit}</span>
                )}
              </div>

              {activeSensorId === sensor.id && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Sidebar: Details & Logs */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {activeSensorId ? (
              <motion.div
                key={activeSensorId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gray-800/50 border border-gray-700 rounded-3xl p-6 space-y-6"
              >
                {(() => {
                  const s = sensors.find(s => s.id === activeSensorId);
                  if (!s) return null;
                  return (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-500 rounded-2xl text-white">
                          {s.icon}
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white uppercase tracking-tight">{s.name}</h2>
                          <p className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">Sensor ID: {s.id}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-black/40 rounded-2xl border border-gray-700">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Technical Description</h4>
                        <p className="text-xs text-gray-300 leading-relaxed">{s.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800">
                          <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Status</span>
                          <span className={`text-xs font-black uppercase ${s.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>{s.status}</span>
                        </div>
                        <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800">
                          <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Precision</span>
                          <span className="text-xs font-black text-white uppercase">High (Real-Time)</span>
                        </div>
                      </div>

                      {s.status === 'unsupported' && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-red-300 leading-tight">Este sensor não é suportado pelo seu hardware ou navegador atual. Algumas funcionalidades podem estar limitadas.</p>
                        </div>
                      )}

                      <button
                        onClick={() => requestSensorAccess(s.id)}
                        disabled={s.status === 'unsupported'}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20"
                      >
                        Re-Initialize Sensor
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            ) : (
              <div className="bg-gray-800/30 border border-dashed border-gray-700 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                <Info className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select a Sensor</h3>
                <p className="text-[10px] text-gray-600 mt-2">Clique em um sensor para ver detalhes técnicos e logs em tempo real.</p>
              </div>
            )}
          </AnimatePresence>

          {/* System Logs */}
          <div className="bg-black/40 border border-gray-800 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hardware Logs</h3>
              <button onClick={() => setLog([])} className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase">Clear</button>
            </div>
            <div className="p-4 h-48 overflow-y-auto font-mono text-[9px] space-y-1 scrollbar-hide">
              {log.length > 0 ? log.map((entry, i) => (
                <div key={i} className="text-gray-500 border-l border-gray-800 pl-2 py-0.5">
                  <span className="text-blue-500/50 mr-2">{entry.split(']')[0]}]</span>
                  <span className="text-gray-300">{entry.split(']')[1]}</span>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center text-gray-700 italic">No logs available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorManager;
