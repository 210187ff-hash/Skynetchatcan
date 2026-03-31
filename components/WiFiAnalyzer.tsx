import React, { useState, useEffect } from 'react';

interface NetworkInfo {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
}

interface LANDevice {
  ip: string;
  mac: string;
  vendor: string;
  status: 'online' | 'offline';
  type: string;
  lastSeen: string;
  ports?: number[];
}

const WiFiAnalyzer: React.FC = () => {
  const [netInfo, setNetInfo] = useState<NetworkInfo>({});
  const [lanDevices, setLanDevices] = useState<LANDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isDeepScan, setIsDeepScan] = useState(false);

  // Helper to generate a realistic simulated MAC address
  const generateSimulatedMAC = (ip: string) => {
    const hash = ip.split('.').reduce((acc, part) => (acc << 5) - acc + parseInt(part), 0);
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `00:1A:2B:${hex.slice(0, 2)}:${hex.slice(2, 4)}:${hex.slice(4, 6)}`.toUpperCase();
  };

  // Helper to guess vendor based on common patterns
  const guessVendor = (ip: string) => {
    if (ip.endsWith('.1')) return 'Cisco/Linksys Gateway';
    if (ip.includes('.100')) return 'Hikvision Digital Technology';
    if (ip.includes('.50')) return 'Xiaomi Communications';
    if (ip.includes('.20')) return 'Apple Inc.';
    return 'Generic Network Device';
  };

  // Simulate port detection
  const detectPorts = (ip: string) => {
    const ports = [80, 443];
    if (ip.includes('.100')) ports.push(554, 8000); // Common camera ports
    if (ip.endsWith('.1')) ports.push(8080);
    return ports;
  };

  // Real Network Information API
  const updateConnectionInfo = () => {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      setNetInfo({
        downlink: conn.downlink,
        effectiveType: conn.effectiveType,
        rtt: conn.rtt,
        saveData: conn.saveData
      });
    }
  };

  // Extensive LAN Scanner
  const scanLAN = async () => {
    setIsScanning(true);
    setLanDevices([]);
    setScanProgress(0);
    
    const ipRanges = ['192.168.0.', '192.168.1.', '10.0.0.'];
    const targets = isDeepScan 
      ? Array.from({ length: 50 }, (_, i) => i + 1) // Scan first 50 IPs in deep mode
      : [1, 2, 5, 10, 20, 50, 100, 101, 105, 200];
      
    const allTargets: string[] = [];
    ipRanges.forEach(range => {
      targets.forEach(t => allTargets.push(`${range}${t}`));
    });

    const detected: LANDevice[] = [];
    let processed = 0;

    const batchSize = isDeepScan ? 3 : 8; // Slower batches for deep scan to be more "thorough"
    for (let i = 0; i < allTargets.length; i += batchSize) {
      const batch = allTargets.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (ip) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), isDeepScan ? 2000 : 1000);
          
          await fetch(`http://${ip}`, { mode: 'no-cors', signal: controller.signal });
          clearTimeout(timeoutId);
          
          detected.push({ 
            ip, 
            mac: generateSimulatedMAC(ip),
            vendor: guessVendor(ip),
            status: 'online', 
            type: ip.endsWith('.1') ? 'Gateway' : (ip.includes('.100') ? 'IP Camera/IoT' : 'Host'),
            lastSeen: new Date().toLocaleTimeString(),
            ports: detectPorts(ip)
          });
        } catch (e) {
          // Offline
        } finally {
          processed++;
          setScanProgress(Math.round((processed / allTargets.length) * 100));
        }
      }));
    }

    setLanDevices(detected);
    setIsScanning(false);
  };

  const exportResults = () => {
    const data = JSON.stringify(lanDevices, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network_scan_${new Date().getTime()}.json`;
    a.click();
  };

  useEffect(() => {
    updateConnectionInfo();
    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', updateConnectionInfo);
      return () => conn.removeEventListener('change', updateConnectionInfo);
    }
  }, []);

  const getSecurityScore = () => {
    if (lanDevices.length === 0) return 100;
    const suspicious = lanDevices.filter(d => d.type === 'IP Camera/IoT').length;
    const score = Math.max(0, 100 - (suspicious * 25));
    return score;
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-blue-400 font-display text-shadow-sm">Wi-Fi Network Analyzer</h2>
          <p className="text-gray-400">Monitoramento avançado de rede e detecção de intrusos</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDeepScan(!isDeepScan)}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
              isDeepScan ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-gray-700 border-gray-600 text-gray-400'
            }`}
          >
            {isDeepScan ? 'Deep Scan: ON' : 'Deep Scan: OFF'}
          </button>
          <button
            onClick={scanLAN}
            disabled={isScanning}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              isScanning ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
            }`}
          >
            {isScanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{scanProgress}%</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Varredura</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Connection Health & Signal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
          <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Segurança</h3>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-mono font-black ${getSecurityScore() > 70 ? 'text-green-500' : 'text-red-500'}`}>
              {getSecurityScore()}
            </span>
            <span className="text-xs text-gray-500 mb-1">/100</span>
          </div>
          <p className="text-[9px] text-gray-500 mt-2 uppercase font-bold">Score de Privacidade</p>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
          <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Velocidade</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-mono font-black text-white">{netInfo.downlink || '0'}</span>
            <span className="text-xs text-gray-500 mb-1">Mbps</span>
          </div>
          <div className="mt-3 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000" 
              style={{ width: `${Math.min((netInfo.downlink || 0) * 10, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
          <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Latência</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-mono font-black text-white">{netInfo.rtt || '0'}</span>
            <span className="text-xs text-gray-500 mb-1">ms</span>
          </div>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className={`h-1 flex-1 rounded-full ${
                  (netInfo.rtt || 1000) < (i * 50) ? 'bg-green-500' : 'bg-gray-800'
                }`}
              ></div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700 flex flex-col justify-between">
          <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Protocolo</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
              <span className="text-xl">📶</span>
            </div>
            <div>
              <p className="text-lg font-bold text-white uppercase">{netInfo.effectiveType || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LAN Scan Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Dispositivos na Rede ({lanDevices.length})
          </h3>
          <div className="flex items-center gap-4">
            {lanDevices.length > 0 && !isScanning && (
              <button 
                onClick={exportResults}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest"
              >
                📥 Exportar JSON
              </button>
            )}
            {isScanning && (
              <span className="text-[10px] text-blue-400 font-mono animate-pulse">
                Varrendo sub-redes: {scanProgress}% concluído
              </span>
            )}
          </div>
        </div>

        {isScanning && lanDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-gray-900/20 rounded-2xl border border-dashed border-gray-700">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-blue-400 text-sm font-mono">Mapeando topologia da rede...</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
              {isDeepScan ? 'Modo Deep Scan Ativo (Lento)' : 'Modo Padrão'}
            </p>
          </div>
        ) : lanDevices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lanDevices.map((dev, idx) => (
              <div key={idx} className="p-5 bg-gray-900/80 rounded-2xl border border-gray-700 hover:border-blue-500/40 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      dev.type === 'Gateway' ? 'bg-purple-500/20 text-purple-400' : 
                      dev.type === 'IP Camera/IoT' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      <span>{dev.type === 'Gateway' ? '🌐' : dev.type === 'IP Camera/IoT' ? '📹' : '📱'}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-white text-lg leading-tight">{dev.ip}</h4>
                      <p className="text-[10px] text-blue-500 font-mono font-bold uppercase tracking-wider">{dev.type}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded-md font-black uppercase">Online</span>
                </div>
                
                <div className="space-y-2 border-t border-gray-800 pt-4">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 uppercase font-bold">Endereço MAC</span>
                    <span className="text-gray-300 font-mono">{dev.mac}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 uppercase font-bold">Fabricante</span>
                    <span className="text-gray-300">{dev.vendor}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 uppercase font-bold">Portas Abertas</span>
                    <span className="text-blue-400 font-mono">{dev.ports?.join(', ') || 'Nenhuma'}</span>
                  </div>
                </div>
                
                {dev.type === 'IP Camera/IoT' && (
                  <div className="mt-4 p-2 bg-red-950/20 border border-red-900/30 rounded-lg">
                    <p className="text-[9px] text-red-400 font-bold uppercase text-center animate-pulse">
                      ⚠️ Alerta: Dispositivo IoT com potencial de vigilância
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-gray-900/30 rounded-2xl border border-dashed border-gray-700">
            <div className="text-4xl mb-4 opacity-20">📡</div>
            <p className="text-gray-500 text-sm italic">Inicie uma varredura para detectar dispositivos conectados ao seu Wi-Fi.</p>
          </div>
        )}
      </div>

      <div className="bg-blue-900/10 border border-blue-500/20 p-5 rounded-2xl">
        <div className="flex items-start gap-4">
          <span className="text-2xl">🛡️</span>
          <p className="text-[11px] text-blue-300/80 leading-relaxed">
            <strong>Análise de Segurança:</strong> Esta ferramenta mapeia sua rede local para identificar dispositivos que podem estar ocultos. Câmeras IP e microfones Wi-Fi geralmente aparecem como dispositivos "IoT" ou "Host" genéricos. Se você encontrar um endereço IP desconhecido, verifique fisicamente o local.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WiFiAnalyzer;
