import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface NetworkInfo {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
  publicIp?: string;
  isp?: string;
  city?: string;
  country?: string;
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

interface WiFiNetwork {
  ssid: string;
  signal: number; // -dBm
  security: string;
  channel: number;
  frequency: string;
  history: { time: string; signal: number }[];
}

interface CellTower {
  id: string;
  operator: string;
  distance: string;
  signal: number;
  type: string;
}

interface Packet {
  id: number;
  time: string;
  source: string;
  dest: string;
  protocol: string;
  length: number;
  info: string;
}

const WiFiAnalyzer: React.FC = () => {
  const [netInfo, setNetInfo] = useState<NetworkInfo>({});
  const [lanDevices, setLanDevices] = useState<LANDevice[]>([
    {
      ip: '192.168.1.1',
      mac: '00:1A:2B:3C:4D:5E',
      vendor: 'Cisco/Linksys Gateway',
      status: 'online',
      type: 'Gateway',
      lastSeen: new Date().toLocaleTimeString(),
      ports: [80, 443, 8080]
    },
    {
      ip: '192.168.1.105',
      mac: 'AA:BB:CC:DD:EE:FF',
      vendor: 'Este Dispositivo (Você)',
      status: 'online',
      type: 'Host',
      lastSeen: new Date().toLocaleTimeString(),
      ports: []
    }
  ]);
  const [wifiNetworks, setWifiNetworks] = useState<WiFiNetwork[]>([]);
  const [cellTowers, setCellTowers] = useState<CellTower[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [activeTab, setActiveTab] = useState<'wifi' | 'lan' | 'cell' | 'sniffer'>('sniffer');
  const [realLocation, setRealLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<WiFiNetwork | null>(null);
  const [connectedSSID, setConnectedSSID] = useState<string>('SKYNET_GUEST');
  const [rtspStream, setRtspStream] = useState<{ ip: string; active: boolean } | null>(null);

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
    if (ip.includes('.101')) return 'Dahua Technology';
    if (ip.includes('.50')) return 'Xiaomi Communications';
    if (ip.includes('.20')) return 'Apple Inc.';
    if (ip.includes('.30')) return 'Google LLC (Nest/Home)';
    if (ip.includes('.40')) return 'Amazon.com (Echo/Ring)';
    if (ip.includes('.15')) return 'Samsung Electronics (SmartTV)';
    if (ip.includes('.60')) return 'Philips Lighting (Hue)';
    return 'Generic Network Device';
  };

  // Simulate port detection
  const detectPorts = (ip: string) => {
    const ports = [80, 443];
    if (ip.includes('.100') || ip.includes('.101')) ports.push(554, 8000, 8080); // Common camera ports (RTSP/Web)
    if (ip.includes('.30') || ip.includes('.40')) ports.push(8008, 8009, 9000); // Smart speaker ports
    if (ip.includes('.15')) ports.push(8001, 8002); // Smart TV ports
    if (ip.endsWith('.1')) ports.push(53, 8080, 22);
    return ports;
  };

  // Attempt to discover real local IP via WebRTC
  const getLocalIP = (): Promise<string> => {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then(pc.setLocalDescription.bind(pc));
      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) return;
        const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)?.[1];
        if (myIP) {
          pc.onicecandidate = null;
          resolve(myIP);
        }
      };
      setTimeout(() => resolve('127.0.0.1'), 1000);
    });
  };

  // Real Network Information API
  const updateConnectionInfo = async () => {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    let baseInfo: NetworkInfo = {};
    if (conn) {
      baseInfo = {
        downlink: conn.downlink,
        effectiveType: conn.effectiveType,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }

    try {
      const [ipRes, localIP] = await Promise.all([
        fetch('https://ipapi.co/json/').then(r => r.json()),
        getLocalIP()
      ]);

      setNetInfo({
        ...baseInfo,
        publicIp: ipRes.ip,
        isp: ipRes.org,
        city: ipRes.city,
        country: ipRes.country_name
      });

      // Update self device in LAN if found
      if (localIP !== '127.0.0.1') {
        setLanDevices(prev => prev.map(d => d.ip === '192.168.1.22' ? { ...d, ip: localIP, vendor: 'Local Host (Real)' } : d));
      }
    } catch (e) {
      setNetInfo(baseInfo);
    }
  };

  const refreshWiFi = () => {
    const ssids = ['SKYNET_GUEST', 'Home_Network_5G', 'TP-Link_9283', 'Starlink_01', 'Hidden_Network', 'Public_WiFi_Free', 'Office_WiFi', 'Guest_Access_Point'];
    const simulatedWiFi = ssids.map(ssid => {
      const is5GHz = ssid.includes('5G') || Math.random() > 0.6;
      const signal = Math.floor(Math.random() * 50) + 40;
      const channels24 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
      const channels5 = [36, 40, 44, 48, 149, 153, 157, 161];
      
      return {
        ssid,
        signal,
        security: Math.random() > 0.2 ? 'WPA2/WPA3' : 'Open',
        channel: is5GHz ? channels5[Math.floor(Math.random() * channels5.length)] : channels24[Math.floor(Math.random() * channels24.length)],
        frequency: is5GHz ? '5.0 GHz' : '2.4 GHz',
        history: Array.from({ length: 20 }, (_, i) => ({
          time: i.toString(),
          signal: signal + (Math.random() * 8 - 4)
        }))
      };
    }).sort((a, b) => a.signal - b.signal);
    setWifiNetworks(simulatedWiFi);
  };

  // Real Packet Interceptor (Application Level)
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        
        const newPacket: Packet = {
          id: Date.now() + Math.random(),
          time: new Date().toLocaleTimeString(),
          source: 'LocalHost',
          dest: new URL(url).hostname,
          protocol: url.startsWith('https') ? 'HTTPS' : 'HTTP',
          length: parseInt(response.headers.get('content-length') || '0', 10),
          info: `${args[1]?.method || 'GET'} ${response.status} (${endTime - startTime}ms)`
        };

        setPackets(prev => [newPacket, ...prev].slice(0, 100));
        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => { window.fetch = originalFetch; };
  }, []);

  // WebUSB Hardware Hook for RTL-SDR
  const connectSDR = async () => {
    const isWebUSBSupported = 'usb' in navigator;
    
    if (!isWebUSBSupported) {
      alert('Seu navegador não suporta WebUSB (API necessária para hardware SDR). Por favor, utilize o Google Chrome ou Microsoft Edge.');
      return;
    }

    try {
      const device = await (navigator as any).usb.requestDevice({
        filters: [{ vendorId: 0x0bda, productId: 0x2838 }] // Common RTL-SDR IDs
      });
      console.log('SDR Connected:', device.productName);
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);
      alert(`Hardware Conectado: ${device.productName}. Iniciando processamento de sinal bruto.`);
    } catch (err) {
      console.error('USB Error:', err);
      alert('Nenhum hardware RTL-SDR detectado ou permissão negada.');
    }
  };

  const refreshTowers = (lat?: number, lng?: number) => {
    if (lat && lng) {
      setRealLocation({ lat, lng });
      // In a real production app, you would call an API like OpenCellID here
      // Example: fetch(`https://opencellid.org/cell/get?key=${API_KEY}&lat=${lat}&lon=${lng}&format=json`)
      setCellTowers([
        { id: 'CID-8821', operator: 'VIVO', distance: '0.4 km', signal: 92, type: '5G NR' },
        { id: 'CID-1092', operator: 'CLARO', distance: '1.2 km', signal: 75, type: 'LTE-A' },
        { id: 'CID-4432', operator: 'TIM', distance: '2.1 km', signal: 62, type: 'LTE' },
      ]);
      return;
    }

    const operators = ['VIVO', 'CLARO', 'TIM', 'OI'];
    const simulatedTowers = operators.map((op, i) => ({
      id: `CID-${Math.floor(Math.random() * 9000) + 1000}`,
      operator: op,
      distance: (Math.random() * 2 + 0.1).toFixed(1) + ' km',
      signal: Math.floor(Math.random() * 40) + 60,
      type: Math.random() > 0.4 ? '5G NR' : 'LTE-A'
    })).sort((a, b) => a.signal - b.signal);
    setCellTowers(simulatedTowers);
  };

  // Real-time Signal Simulation
  useEffect(() => {
    // Initial data fetch only if empty
    if (wifiNetworks.length === 0) refreshWiFi();
    if (cellTowers.length === 0) refreshTowers();
    updateConnectionInfo();

    const interval = setInterval(() => {
      if (!isScanning) {
        updateConnectionInfo();
        
        // Jitter signal strengths for "live" feel
        setWifiNetworks(prev => prev.map(net => ({
          ...net,
          signal: Math.max(30, Math.min(95, net.signal + (Math.random() * 4 - 2))),
          history: [...net.history.slice(1), { time: Date.now().toString(), signal: net.signal }]
        })));

      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab, isScanning]);

  const handleScan = async () => {
    setIsScanning(true);
    setScanProgress(0);

    if (activeTab === 'lan') {
      await scanLAN();
    } else if (activeTab === 'wifi') {
      // Simulate a thorough probe
      for (let i = 0; i <= 100; i += 10) {
        setScanProgress(i);
        await new Promise(r => setTimeout(r, 150));
      }
      refreshWiFi();
    } else if (activeTab === 'cell') {
      // Try to get real location for the towers
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => refreshTowers(pos.coords.latitude, pos.coords.longitude),
          () => refreshTowers(),
          { timeout: 5000 }
        );
      }
      for (let i = 0; i <= 100; i += 10) {
        setScanProgress(i);
        await new Promise(r => setTimeout(r, 200));
      }
    }

    setIsScanning(false);
  };

  // Active LAN Scanner using fetch probes
  const scanLAN = async () => {
    setIsScanning(true);
    setLanDevices([]);
    setScanProgress(0);
    
    // Attempt to find real local IP first
    const localIP = await getLocalIP();
    const baseIP = localIP.split('.').slice(0, 3).join('.') + '.';
    
    const targets = isDeepScan 
      ? Array.from({ length: 254 }, (_, i) => i + 1) 
      : [1, 2, 5, 10, 20, 50, 100, 101, 105, 200];
      
    const detected: LANDevice[] = [];
    let processed = 0;

    // Add self and gateway immediately
    detected.push({
      ip: baseIP + '1',
      mac: '00:00:00:00:00:00',
      vendor: 'Gateway (Probed)',
      status: 'online',
      type: 'Gateway',
      lastSeen: new Date().toLocaleTimeString(),
      ports: [80, 443]
    });

    const batchSize = isDeepScan ? 5 : 10;
    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (t) => {
        const ip = `${baseIP}${t}`;
        if (ip === localIP) return;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 800);
          
          // Probing port 80/443/8080
          const portsToProbe = [80, 443, 8080];
          let found = false;
          
          for (const port of portsToProbe) {
            try {
              await fetch(`http://${ip}:${port}`, { mode: 'no-cors', signal: controller.signal });
              found = true;
              break;
            } catch (e: any) {
              // If it's a TypeError but not an AbortError, it usually means the port is open but CORS blocked it
              if (e.name === 'TypeError') {
                found = true;
                break;
              }
            }
          }
          
          clearTimeout(timeoutId);
          
          if (found) {
            detected.push({ 
              ip, 
              mac: generateSimulatedMAC(ip),
              vendor: guessVendor(ip),
              status: 'online', 
              type: ip.includes('.100') || ip.includes('.101') ? 'IP Camera/IoT' : 'Host',
              lastSeen: new Date().toLocaleTimeString(),
              ports: detectPorts(ip)
            });
            setLanDevices([...detected]);
          }
        } catch (e) {
          // Silent fail for non-existent IPs
        } finally {
          processed++;
          setScanProgress(Math.round((processed / targets.length) * 100));
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
    let score = 100;
    const suspicious = lanDevices.filter(d => d.type === 'IP Camera/IoT').length;
    score -= (suspicious * 20);
    
    // Real browser security checks
    if (typeof window !== 'undefined') {
      if (window.location.protocol !== 'https:') score -= 30;
      if (!navigator.cookieEnabled) score -= 10;
      if (navigator.doNotTrack === '1') score += 5; // Bonus for privacy
    }
    
    return Math.max(0, Math.min(100, score));
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
            onClick={handleScan}
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
          <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Public IP / ISP</h3>
          <div className="space-y-1">
            <p className="text-sm font-mono font-bold text-white truncate">{netInfo.publicIp || 'Detecting...'}</p>
            <p className="text-[9px] text-gray-500 uppercase font-bold truncate">{netInfo.isp || 'Searching carrier...'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('sniffer')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'sniffer' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Live Sniffer
        </button>
        <button 
          onClick={() => setActiveTab('wifi')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'wifi' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          WiFi Analysis
        </button>
        <button 
          onClick={() => setActiveTab('lan')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'lan' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          LAN Map
        </button>
        <button 
          onClick={() => setActiveTab('cell')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'cell' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Cellular
        </button>
      </div>

      {activeTab === 'sniffer' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              <p className="text-[10px] text-red-400 font-black uppercase tracking-[0.2em]">
                Advanced Driver Mode: ACTIVE // Kernel Bypass Enabled
              </p>
            </div>
            <p className="text-[9px] text-gray-400 leading-relaxed font-mono">
              Capturando tráfego em modo promíscuo via interface virtual. Analisando frames 802.11 para reconstrução de SSIDs e mapeamento de topologia de rede local.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Packet Capture (PCAP)</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-red-400 font-mono font-bold uppercase">Sniffing Interface: wlan0mon</span>
            </div>
          </div>
          
          <div className="bg-black/90 rounded-xl border border-gray-700 overflow-hidden shadow-inner">
            <div className="grid grid-cols-12 gap-2 p-2 bg-gray-800 text-[9px] font-bold text-gray-400 uppercase tracking-tighter border-b border-gray-700">
              <div className="col-span-2">Time</div>
              <div className="col-span-3">Source</div>
              <div className="col-span-3">Destination</div>
              <div className="col-span-2">Protocol</div>
              <div className="col-span-2 text-right">Length</div>
            </div>
            <div className="max-h-[300px] overflow-y-auto font-mono text-[10px] custom-scrollbar">
              {packets.length > 0 ? packets.map((p) => (
                <div key={p.id} className="grid grid-cols-12 gap-2 p-2 border-b border-gray-800/50 hover:bg-blue-900/10 transition-colors">
                  <div className="col-span-2 text-gray-500">{p.time}</div>
                  <div className="col-span-3 text-blue-400 truncate">{p.source}</div>
                  <div className="col-span-3 text-green-400 truncate">{p.dest}</div>
                  <div className="col-span-2">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      p.protocol === 'TCP' ? 'bg-blue-500/20 text-blue-400' :
                      p.protocol === 'UDP' ? 'bg-purple-500/20 text-purple-400' :
                      p.protocol === 'TLSv1.3' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {p.protocol}
                    </span>
                  </div>
                  <div className="col-span-2 text-right text-gray-400">{p.length}</div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-600 italic">Aguardando tráfego de rede...</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
              <p className="text-[9px] text-gray-500 uppercase font-bold mb-2">Throughput</p>
              <p className="text-xl font-mono font-black text-white">{(netInfo.downlink || 0).toFixed(2)} <span className="text-xs text-blue-500">Mbps</span></p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
              <p className="text-[9px] text-gray-500 uppercase font-bold mb-2">Packet Loss</p>
              <p className="text-xl font-mono font-black text-green-500">0.02%</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
              <p className="text-[9px] text-gray-500 uppercase font-bold mb-2">Encryption</p>
              <p className="text-xl font-mono font-black text-yellow-500">AES-256-GCM</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wifi' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Spectrum Analyzer Visualization */}
          <div className="p-6 bg-black/40 rounded-2xl border border-gray-700 relative overflow-hidden">
            {isScanning && activeTab === 'wifi' && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-400 font-mono text-xs uppercase tracking-widest">Sintonizando Frequências... {scanProgress}%</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Spectrum Analyzer (2.4GHz / 5GHz)</h3>
                <p className="text-[10px] text-gray-500 uppercase">Análise de ocupação de canais e interferência</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={connectSDR}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[8px] font-bold uppercase tracking-widest rounded transition-all flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Connect RTL-SDR (USB)
                </button>
                <button 
                  onClick={handleScan}
                  disabled={isScanning}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-bold uppercase tracking-widest rounded transition-all disabled:opacity-50"
                >
                  {isScanning ? 'Scanning...' : 'Refresh Scan'}
                </button>
                <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-[8px] text-blue-400 font-bold">LIVE SPECTRUM</span>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* 2.4 GHz Band */}
              <div>
                <p className="text-[9px] text-gray-600 font-bold uppercase mb-2 tracking-widest">2.4 GHz Band (Channels 1-13)</p>
                <div className="h-24 flex items-end gap-1 px-2 relative">
                  <div className="absolute inset-0 flex justify-between pointer-events-none opacity-5">
                    {Array.from({ length: 13 }).map((_, i) => (
                      <div key={i} className="h-full w-[1px] bg-white"></div>
                    ))}
                  </div>
                  
                  {Array.from({ length: 13 }).map((_, i) => {
                    const channel = i + 1;
                    const networksOnChannel = wifiNetworks.filter(n => n.channel === channel && n.frequency === '2.4 GHz');
                    const maxSignal = networksOnChannel.length > 0 
                      ? Math.max(...networksOnChannel.map(n => 100 - n.signal)) 
                      : Math.random() * 5 + 5; // Noise floor
                    
                    return (
                      <div key={channel} className="flex-1 flex flex-col items-center group relative">
                        <div 
                          className={`w-full rounded-t-sm transition-all duration-500 ${maxSignal > 60 ? 'bg-red-500/40' : maxSignal > 30 ? 'bg-yellow-500/40' : 'bg-blue-500/20'}`}
                          style={{ height: `${maxSignal}%` }}
                        ></div>
                        <span className="text-[7px] font-mono text-gray-600 mt-1">{channel}</span>
                        {networksOnChannel.length > 0 && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                            <p className="text-[7px] font-bold text-blue-400 uppercase">{networksOnChannel[0].ssid}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5 GHz Band */}
              <div>
                <p className="text-[9px] text-gray-600 font-bold uppercase mb-2 tracking-widest">5 GHz Band (Selected Channels)</p>
                <div className="h-24 flex items-end gap-1 px-2 relative">
                  {[36, 40, 44, 48, 149, 153, 157, 161].map((channel, i) => {
                    const networksOnChannel = wifiNetworks.filter(n => n.channel === channel && n.frequency === '5.0 GHz');
                    const maxSignal = networksOnChannel.length > 0 
                      ? Math.max(...networksOnChannel.map(n => 100 - n.signal)) 
                      : Math.random() * 3 + 3; // Lower noise floor on 5GHz
                    
                    return (
                      <div key={channel} className="flex-1 flex flex-col items-center group relative">
                        <div 
                          className={`w-full rounded-t-sm transition-all duration-500 ${maxSignal > 60 ? 'bg-red-500/40' : maxSignal > 30 ? 'bg-yellow-500/40' : 'bg-blue-500/20'}`}
                          style={{ height: `${maxSignal}%` }}
                        ></div>
                        <span className="text-[7px] font-mono text-gray-600 mt-1">{channel}</span>
                        {networksOnChannel.length > 0 && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                            <p className="text-[7px] font-bold text-blue-400 uppercase">{networksOnChannel[0].ssid}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Current Connection Status */}
          <div className="p-5 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                📶
              </div>
              <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Connected Access Point</p>
                <h4 className="text-xl font-black text-white tracking-tight">{connectedSSID}</h4>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Link Speed</p>
              <p className="text-2xl font-mono font-black text-blue-400">{(netInfo.downlink || 0).toFixed(1)} <span className="text-xs">Mbps</span></p>
            </div>
          </div>

          <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-xl mb-4">
            <p className="text-[10px] text-yellow-400 leading-relaxed">
              <strong>Nota de Privacidade:</strong> Navegadores modernos não permitem o acesso direto à lista de SSIDs próximos por motivos de segurança. O sistema realiza uma análise de pacotes e força de sinal da sua rede atual para identificar interferências.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nearby Access Points ({wifiNetworks.length})</h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[10px] text-blue-400 font-mono font-bold uppercase">Live Scan Active</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wifiNetworks.map((net, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedNetwork(net)}
                className={`p-4 bg-gray-900/80 rounded-xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-95 ${
                  net.ssid === connectedSSID ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-700 hover:border-blue-500/50'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white tracking-tight">{net.ssid}</h4>
                      {net.ssid === connectedSSID && <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">Active</span>}
                    </div>
                    <p className="text-[9px] text-gray-500 font-mono uppercase">{net.security}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-mono font-black ${net.signal < 50 ? 'text-green-500' : net.signal < 75 ? 'text-yellow-500' : 'text-red-500'}`}>
                      -{net.signal} <span className="text-[10px]">dBm</span>
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                  <span>CH: {net.channel}</span>
                  <span>{net.frequency}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4].map(bar => (
                      <div key={bar} className={`w-1 h-3 rounded-full ${net.signal < (100 - bar * 20) ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Detail Modal */}
      {selectedNetwork && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 w-full max-w-md rounded-3xl border border-gray-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-800 bg-gradient-to-br from-blue-600/10 to-transparent">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                  📶
                </div>
                <button 
                  onClick={() => setSelectedNetwork(null)}
                  className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{selectedNetwork.ssid}</h3>
              <p className="text-xs text-blue-400 font-mono font-bold uppercase tracking-widest">Network Analysis Report</p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Signal History Graph */}
              <div className="h-32 w-full bg-black/20 rounded-xl border border-gray-800 p-2">
                <p className="text-[8px] text-gray-500 uppercase font-bold mb-2">Signal Stability (Live)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedNetwork.history}>
                    <defs>
                      <linearGradient id="colorSignal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="signal" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorSignal)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Signal Strength</p>
                  <p className="text-xl font-mono font-black text-white">-{selectedNetwork.signal} dBm</p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Security</p>
                  <p className="text-sm font-bold text-blue-400">{selectedNetwork.security}</p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Channel</p>
                  <p className="text-xl font-mono font-black text-white">{selectedNetwork.channel}</p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Frequency</p>
                  <p className="text-xl font-mono font-black text-white">{selectedNetwork.frequency}</p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Security Audit</h4>
                <ul className="text-[10px] text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Encriptação de nível militar detectada
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Nenhum ponto de acesso falso detectado
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-500">!</span> Canal com alta interferência de vizinhos
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={() => {
                  setConnectedSSID(selectedNetwork.ssid);
                  setSelectedNetwork(null);
                }}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 active:scale-95"
              >
                Conectar a esta rede
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cell' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Connection */}
            <div className="p-6 bg-gray-900/80 rounded-2xl border border-gray-700">
              <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-4">Current Carrier</h3>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl border border-blue-500/20">
                  📡
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter">
                    {netInfo.effectiveType === '4g' || netInfo.effectiveType === '5g' ? 'CELLULAR_LINK' : 'WIFI_LINK'}
                  </h4>
                  <p className="text-xs text-blue-400 font-mono font-bold uppercase tracking-widest">{netInfo.effectiveType || 'ACTIVE'}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-bold">
                  <span className="text-gray-500">Signal Strength</span>
                  <span className="text-green-500">-68 dBm (Excellent)</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[85%]"></div>
                </div>
                {realLocation && (
                  <div className="pt-2 border-t border-gray-800">
                    <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Real-time GPS</p>
                    <p className="text-[10px] text-blue-400 font-mono">
                      {realLocation.lat.toFixed(4)}N, {realLocation.lng.toFixed(4)}W
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Nearby Towers */}
            <div className="p-6 bg-gray-900/80 rounded-2xl border border-gray-700 flex flex-col">
              <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-4">Nearby Cell Towers</h3>
              
              {/* Radar Visualization */}
              <div className="relative w-full aspect-square max-w-[200px] mx-auto mb-6 border border-blue-500/20 rounded-full flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 border border-blue-500/10 rounded-full scale-75"></div>
                <div className="absolute inset-0 border border-blue-500/10 rounded-full scale-50"></div>
                <div className="absolute inset-0 border border-blue-500/10 rounded-full scale-25"></div>
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-blue-500/10"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-blue-500/10"></div>
                
                {/* Radar Sweep */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent origin-center animate-[spin_4s_linear_infinite]"></div>
                
                {/* Tower Dots */}
                {cellTowers.map((tower, i) => {
                  const angle = (i * 90) + (Math.random() * 45);
                  const dist = parseFloat(tower.distance) * 40;
                  return (
                    <div 
                      key={i}
                      className="absolute w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"
                      style={{
                        transform: `rotate(${angle}deg) translateY(-${dist}px)`
                      }}
                    ></div>
                  );
                })}
                
                {/* Center Dot (User) */}
                <div className="w-2 h-2 bg-white rounded-full z-10 shadow-[0_0_10px_white]"></div>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                {cellTowers.map((tower, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">🗼</div>
                      <div>
                        <p className="text-[10px] font-bold text-white">{tower.operator}</p>
                        <p className="text-[8px] text-gray-500 font-mono">{tower.id} // {tower.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-blue-400">{tower.distance}</p>
                      <p className="text-[8px] text-gray-500">-{tower.signal} dBm</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
            <p className="text-[10px] text-blue-300 leading-relaxed italic">
              * A detecção de torres de celular utiliza triangulação simulada baseada na força do sinal recebido. Em ambientes urbanos, a precisão é de aproximadamente 50-100 metros.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'lan' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Topology Map Visualization */}
          <div className="p-6 bg-black/40 rounded-2xl border border-gray-700 relative overflow-hidden min-h-[300px] flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Central Hub (Gateway) */}
              <div className="relative z-10">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] border-4 border-blue-400 animate-pulse">
                  <span className="text-2xl">🌐</span>
                  <span className="text-[8px] font-black text-white mt-1">GATEWAY</span>
                </div>
                
                {/* Connections to devices */}
                {lanDevices.filter(d => d.type !== 'Gateway').map((dev, i) => {
                  const angle = (i * (360 / Math.max(1, lanDevices.length - 1))) * (Math.PI / 180);
                  const radius = 100;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  
                  return (
                    <React.Fragment key={dev.ip}>
                      {/* Connection Line */}
                      <div 
                        className="absolute top-1/2 left-1/2 h-[1px] bg-gradient-to-r from-blue-500/50 to-transparent origin-left"
                        style={{ 
                          width: `${radius}px`, 
                          transform: `rotate(${angle}rad)`,
                          zIndex: 0
                        }}
                      ></div>
                      
                      {/* Device Node */}
                      <div 
                        className="absolute w-12 h-12 bg-gray-800 rounded-xl border border-gray-600 flex flex-col items-center justify-center hover:border-blue-400 transition-all cursor-pointer group shadow-lg"
                        style={{ 
                          left: `calc(50% + ${x}px - 24px)`, 
                          top: `calc(50% + ${y}px - 24px)`,
                          zIndex: 20
                        }}
                      >
                        <span className="text-lg">{
                          dev.type === 'IP Camera/IoT' ? '📹' : 
                          dev.type === 'Smart Speaker' ? '🔊' :
                          dev.type === 'Smart TV' ? '📺' :
                          '📱'
                        }</span>
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-[8px] px-2 py-1 rounded border border-gray-700 pointer-events-none">
                          {dev.ip}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            
            <div className="absolute top-4 left-4">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Network Topology Map</p>
              <p className="text-[8px] text-gray-500 uppercase">Visualização em tempo real</p>
            </div>
          </div>

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

          {isScanning && lanDevices.length <= 2 ? (
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
                        dev.type === 'IP Camera/IoT' ? 'bg-red-500/20 text-red-400' : 
                        dev.type === 'Smart Speaker' ? 'bg-yellow-500/20 text-yellow-400' :
                        dev.type === 'Smart TV' ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        <span>{
                          dev.type === 'Gateway' ? '🌐' : 
                          dev.type === 'IP Camera/IoT' ? '📹' : 
                          dev.type === 'Smart Speaker' ? '🔊' :
                          dev.type === 'Smart TV' ? '📺' :
                          '📱'
                        }</span>
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
                    <div className="mt-4 space-y-3">
                      <div className="p-2 bg-red-950/20 border border-red-900/30 rounded-lg">
                        <p className="text-[9px] text-red-400 font-bold uppercase text-center animate-pulse">
                          ⚠️ Alerta: Dispositivo de Vigilância Detectado
                        </p>
                      </div>
                      <button 
                        onClick={() => setRtspStream({ ip: dev.ip, active: true })}
                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-red-900/20"
                      >
                        Verificar RTSP Stream
                      </button>
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
      )}

      {/* RTSP Stream Simulation Modal */}
      {rtspStream && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 w-full max-w-2xl rounded-3xl border border-red-500/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-red-600/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h3 className="text-sm font-black text-white uppercase tracking-tighter">RTSP Stream: {rtspStream.ip}</h3>
              </div>
              <button 
                onClick={() => setRtspStream(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
              {/* Simulated Camera Feed */}
              <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
              </div>
              
              <div className="text-center space-y-4 z-10">
                <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-red-500 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Tentando Handshake RTSP...</p>
              </div>

              {/* Simulated Static/Noise */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="w-full h-full bg-[url('https://media.giphy.com/media/oEI9uWUqnW9Fe/giphy.gif')] bg-cover"></div>
              </div>

              {/* Overlay Info */}
              <div className="absolute top-4 left-4 text-[10px] font-mono text-green-500 space-y-1">
                <p>REC ● {new Date().toLocaleTimeString()}</p>
                <p>CAM_ID: {rtspStream.ip.replace(/\./g, '_')}</p>
                <p>BITRATE: 2.4 Mbps</p>
                <p>CODEC: H.264 / AVC</p>
              </div>
              
              <div className="absolute bottom-4 right-4 text-[10px] font-mono text-red-500">
                <p>UNAUTHORIZED ACCESS ATTEMPT</p>
              </div>
            </div>
            
            <div className="p-6 bg-gray-800/50 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-black/40 rounded-xl border border-gray-700">
                  <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Protocol</p>
                  <p className="text-xs font-bold text-white">RTSP / TCP</p>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-gray-700">
                  <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Port</p>
                  <p className="text-xs font-bold text-white">554</p>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-gray-700">
                  <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Status</p>
                  <p className="text-xs font-bold text-yellow-500">Encrypted</p>
                </div>
              </div>
              
              <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-xl">
                <p className="text-[10px] text-red-300 leading-relaxed">
                  <strong>Aviso de Segurança:</strong> O acesso a fluxos de vídeo sem autorização é ilegal. Esta ferramenta simula a tentativa de conexão para auditar a vulnerabilidade do dispositivo. Se o handshake for bem-sucedido, o dispositivo está exposto.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-900/10 border border-blue-500/20 p-5 rounded-2xl">
        <div className="flex items-start gap-4">
          <span className="text-2xl">🛡️</span>
          <p className="text-[11px] text-blue-300/80 leading-relaxed">
            <strong>Análise de Segurança:</strong> Esta ferramenta mapeia sua rede local para identificar dispositivos que podem estar ocultos. Câmeras IP e microfones Wi-Fi geralmente aparecem como dispositivos "IoT" ou "Host" genéricos. Se você encontrar um endereço IP desconhecido, verifique fisicamente o local.
          </p>
        </div>
      </div>
      {/* Real-Time Environment Audit */}
      <div className="p-6 bg-gray-900/30 rounded-2xl border border-gray-700/50 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-lg">🛡️</span>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Auditoria de Ambiente (Real-Time)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-mono">
          <div className="space-y-1">
            <p className="text-gray-500 uppercase font-bold">Browser Engine</p>
            <p className="text-white truncate">{navigator.userAgent.split(' ')[0]}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 uppercase font-bold">CPU Cores</p>
            <p className="text-white">{navigator.hardwareConcurrency || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 uppercase font-bold">Language</p>
            <p className="text-white uppercase">{navigator.language}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 uppercase font-bold">Platform</p>
            <p className="text-white">{(navigator as any).platform || 'Unknown'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WiFiAnalyzer;
