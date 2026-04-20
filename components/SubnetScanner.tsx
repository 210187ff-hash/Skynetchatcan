import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, Server, ShieldAlert, Info, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getLocalIP } from '../services/webrtc-adapter';

interface NetworkDevice {
  ip: string;
  status: 'online' | 'checking' | 'offline';
  type?: string;
}

const SubnetScanner: React.FC = () => {
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const startScan = async () => {
    setIsScanning(true);
    setDevices([]);
    setProgress(0);

    const ip = await getLocalIP();
    setLocalIp(ip);

    const subnet = ip.split('.').slice(0, 3).join('.');
    const targetIps = Array.from({ length: 20 }, (_, i) => `${subnet}.${i + 1}`); // Scan first 20 IPs for demo speed

    for (let i = 0; i < targetIps.length; i++) {
      const targetIp = targetIps[i];
      setDevices(prev => [...prev, { ip: targetIp, status: 'checking' }]);
      
      // Real Network Probe: Try to fetch a common port
      // Browsers block most cross-origin requests, but we can detect "opaque" responses or timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      try {
        await fetch(`http://${targetIp}`, { mode: 'no-cors', signal: controller.signal });
        // If it doesn't throw a "Network Error" immediately, it might be a device
        setDevices(prev => prev.map(d => d.ip === targetIp ? { ...d, status: 'online', type: targetIp.endsWith('.1') ? 'Gateway' : 'Host' } : d));
      } catch (e: any) {
        if (e.name === 'AbortError') {
          setDevices(prev => prev.map(d => d.ip === targetIp ? { ...d, status: 'offline' } : d));
        } else {
          // Network errors (like connection refused) actually indicate the IP is alive but port is closed
          setDevices(prev => prev.map(d => d.ip === targetIp ? { ...d, status: 'online' } : d));
        }
      }
      
      clearTimeout(timeoutId);
      setProgress(Math.round(((i + 1) / targetIps.length) * 100));
    }
    setIsScanning(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight uppercase italic">Subnet Scanner</h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">Local Network Discovery & Node Mapping</p>
        </div>
        <button 
          onClick={startScan}
          disabled={isScanning}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isScanning ? 'Scanning Subnet...' : 'Start Network Discovery'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden">
            <div className="p-4 bg-gray-800/50 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Subnet: {localIp ? `${localIp.split('.').slice(0, 3).join('.')}.0/24` : 'Detecting...'}</span>
              </div>
              <div className="text-[10px] font-mono text-blue-400">{progress}% Complete</div>
            </div>
            
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto scrollbar-hide">
              {devices.map((device, i) => (
                <motion.div 
                  key={device.ip}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    device.status === 'online' ? 'bg-green-500/10 border-green-500/30' :
                    device.status === 'checking' ? 'bg-blue-500/10 border-blue-500/30 animate-pulse' :
                    'bg-gray-800/20 border-gray-800 opacity-40'
                  }`}
                >
                  {device.status === 'online' ? <Server className="w-6 h-6 text-green-400" /> : <Globe className="w-6 h-6 text-gray-600" />}
                  <span className="text-[10px] font-mono text-white">{device.ip}</span>
                  {device.type && <span className="text-[8px] font-black text-blue-400 uppercase">{device.type}</span>}
                </motion.div>
              ))}
              {devices.length === 0 && !isScanning && (
                <div className="col-span-full py-20 text-center text-gray-600 italic text-sm">
                  Initialize scan to map local network nodes.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-3xl border border-gray-800 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl text-white">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">LAN Security</h3>
                <p className="text-[10px] text-blue-400 font-mono uppercase">Node Discovery Engine</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/40 rounded-2xl border border-gray-800">
                <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">How it works</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Esta ferramenta utiliza uma técnica de <strong>WebRTC IP Leak</strong> para identificar seu endereço local e, em seguida, realiza probes assíncronos em IPs comuns da sub-rede. Dispositivos que respondem (mesmo com erro de CORS) são marcados como ativos.
                </p>
              </div>

              <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-300 leading-tight">Útil para detectar câmeras IP, servidores de mídia ou outros dispositivos de espionagem conectados à mesma rede Wi-Fi.</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-black/40 border border-gray-800 rounded-3xl space-y-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-3 h-3 text-blue-500" />
              Scan Limitations
            </h4>
            <ul className="space-y-3">
              <li className="text-[10px] text-gray-400 flex gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                Navegadores não permitem escaneamento de portas arbitrário.
              </li>
              <li className="text-[10px] text-gray-400 flex gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                Alguns dispositivos podem ignorar probes de HTTP.
              </li>
              <li className="text-[10px] text-gray-400 flex gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                O scan é limitado à sub-rede C (/24).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubnetScanner;
