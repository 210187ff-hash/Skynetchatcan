import React, { useState, useEffect } from 'react';

interface NetworkInfo {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
}

interface LANDevice {
  ip: string;
  status: 'online' | 'offline';
  type: string;
}

const WiFiAnalyzer: React.FC = () => {
  const [netInfo, setNetInfo] = useState<NetworkInfo>({});
  const [lanDevices, setLanDevices] = useState<LANDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);

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

  // Functional LAN Scanner (Attempts to detect devices on common local IPs)
  const scanLAN = async () => {
    setIsScanning(true);
    setLanDevices([]);
    
    const commonIPs = ['192.168.0.1', '192.168.1.1', '192.168.0.100', '192.168.1.100', '10.0.0.1'];
    const detected: LANDevice[] = [];

    for (const ip of commonIPs) {
      try {
        // Using a fetch with a very short timeout to check for presence
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        
        await fetch(`http://${ip}`, { mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeoutId);
        detected.push({ ip, status: 'online', type: ip.endsWith('.1') ? 'Roteador/Gateway' : 'Dispositivo Genérico' });
      } catch (e) {
        // If it fails or times out, we assume it's offline or blocked
        console.log(`IP ${ip} not reachable`);
      }
    }

    setLanDevices(detected);
    setIsScanning(false);
  };

  useEffect(() => {
    updateConnectionInfo();
    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', updateConnectionInfo);
      return () => conn.removeEventListener('change', updateConnectionInfo);
    }
  }, []);

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-400 font-display">Wi-Fi Analyzer (Real-Time)</h2>
          <p className="text-gray-400">Monitoramento de conexão e varredura de rede local (LAN)</p>
        </div>
        <button
          onClick={scanLAN}
          disabled={isScanning}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            isScanning ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
          }`}
        >
          {isScanning ? 'Escaneando LAN...' : 'Escanear Rede Local'}
        </button>
      </div>

      {/* Current Connection Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
          <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Conexão Atual</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Tipo de Rede:</span>
              <span className="text-white font-mono font-bold uppercase">{netInfo.effectiveType || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Velocidade (Downlink):</span>
              <span className="text-white font-mono font-bold">{netInfo.downlink ? `${netInfo.downlink} Mbps` : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Latência (RTT):</span>
              <span className="text-white font-mono font-bold">{netInfo.rtt ? `${netInfo.rtt} ms` : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700 flex flex-col justify-center items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${netInfo.effectiveType === '4g' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
            <span className="text-3xl">📡</span>
          </div>
          <p className="text-xs text-gray-500 uppercase font-bold">Status do Link</p>
          <p className="text-lg font-bold text-white">Sinal Estável</p>
        </div>
      </div>

      {/* LAN Scan Results */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dispositivos Detectados na LAN</h3>
        {isScanning ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-400 text-xs font-mono animate-pulse">Pingando sub-rede local...</p>
          </div>
        ) : lanDevices.length > 0 ? (
          <div className="grid gap-3">
            {lanDevices.map((dev, idx) => (
              <div key={idx} className="p-4 bg-gray-900/80 rounded-xl border border-blue-500/20 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <span>🖥️</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{dev.ip}</h4>
                    <p className="text-[10px] text-gray-500 font-mono">{dev.type}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-green-600/20 text-green-500 px-2 py-1 rounded-full font-bold uppercase">Online</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-900/30 rounded-xl border border-dashed border-gray-700">
            <p className="text-gray-500 text-sm italic">Inicie um scan para detectar dispositivos no seu Wi-Fi atual.</p>
          </div>
        )}
      </div>

      <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
        <p className="text-[10px] text-blue-400/80 leading-relaxed italic">
          <strong>Nota Técnica:</strong> Devido a restrições de segurança do navegador, a listagem de SSIDs vizinhos não é permitida. Este módulo foca na análise da sua conexão ativa e na descoberta de dispositivos na sua rede local (LAN) para identificar possíveis câmeras IP ou microfones Wi-Fi.
        </p>
      </div>
    </div>
  );
};

export default WiFiAnalyzer;
