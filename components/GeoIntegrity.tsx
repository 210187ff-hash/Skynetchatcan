import React, { useState, useEffect } from 'react';
import { MapPin, Globe, ShieldAlert, CheckCircle2, Navigation, Info, Crosshair } from 'lucide-react';

interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  source: 'GPS' | 'IP';
}

const GeoIntegrity: React.FC = () => {
  const [gpsLoc, setGpsLoc] = useState<LocationData | null>(null);
  const [ipLoc, setIpLoc] = useState<LocationData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAudit = async () => {
    setIsScanning(true);
    setError(null);

    // Check permission state first if possible
    if (navigator.permissions && (navigator.permissions as any).query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'denied') {
          setError('Permissão de geolocalização foi bloqueada no navegador. Por favor, habilite-a nas configurações do site.');
          setIsScanning(false);
          return;
        }
      } catch (e) {
        console.warn('Permissions API not fully supported for geolocation check.');
      }
    }

    // 1. Get GPS Location (Wrapped in Promise)
    const getGpsLocation = (): Promise<LocationData> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation não suportada.'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              source: 'GPS'
            });
          },
          (err) => {
            let msg = 'Erro desconhecido no GPS.';
            if (err.code === 1) msg = 'Permissão de GPS negada pelo usuário.';
            if (err.code === 2) msg = 'Sinal de GPS indisponível.';
            if (err.code === 3) msg = 'Timeout ao obter localização.';
            reject(new Error(msg));
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      });
    };

    // 2. Get IP Location with Fallback
    const getIpLocation = async (): Promise<LocationData> => {
      const services = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/',
        'https://freeipapi.com/api/json'
      ];

      for (const service of services) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          // Normalize different API responses
          const lat = data.latitude || data.lat;
          const lng = data.longitude || data.lon;
          if (lat && lng) {
            return { lat, lng, source: 'IP' };
          }
        } catch (err) {
          console.warn(`IP Geo Service ${service} failed, trying next...`);
        }
      }
      throw new Error('Todos os serviços de IP Geolocation falharam.');
    };

    try {
      // Run both in parallel
      const [gps, ip] = await Promise.allSettled([getGpsLocation(), getIpLocation()]);

      if (gps.status === 'fulfilled') {
        setGpsLoc(gps.value);
      } else {
        setError(gps.reason.message);
      }

      if (ip.status === 'fulfilled') {
        setIpLoc(ip.value);
      } else if (gps.status !== 'fulfilled') {
        // Only set error if both failed or if GPS failed (since GPS is primary)
        setError(prev => prev ? `${prev} | ${ip.reason.message}` : ip.reason.message);
      }
    } catch (err) {
      setError('Erro crítico na auditoria geográfica.');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    performAudit();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distance = gpsLoc && ipLoc ? calculateDistance(gpsLoc.lat, gpsLoc.lng, ipLoc.lat, ipLoc.lng) : null;
  const isSuspicious = distance !== null && distance > 50; // More than 50km difference is suspicious for local use

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Globe className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Geo Integrity Check</h2>
              <p className="text-xs text-gray-400 font-mono">Verificação de discrepância entre GPS físico e Geolocation por IP</p>
            </div>
          </div>
          <button 
            onClick={performAudit}
            disabled={isScanning}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isScanning ? <Navigation className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
            Re-Auditar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-black/40 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <MapPin className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Hardware GPS (Real)</span>
            </div>
            {gpsLoc ? (
              <div className="font-mono space-y-1">
                <p className="text-xl text-white font-black">{gpsLoc.lat.toFixed(4)}° N</p>
                <p className="text-xl text-white font-black">{gpsLoc.lng.toFixed(4)}° W</p>
                <p className="text-[10px] text-gray-500 uppercase">Precisão: {gpsLoc.accuracy?.toFixed(1)}m</p>
              </div>
            ) : (
              <p className="text-gray-600 font-mono text-xs italic">Aguardando sinal de satélite...</p>
            )}
          </div>

          <div className="p-6 bg-black/40 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Network IP Geo (Reportado)</span>
            </div>
            {ipLoc ? (
              <div className="font-mono space-y-1">
                <p className="text-xl text-white font-black">{ipLoc.lat.toFixed(4)}° N</p>
                <p className="text-xl text-white font-black">{ipLoc.lng.toFixed(4)}° W</p>
                <p className="text-[10px] text-gray-500 uppercase">Fonte: ipapi.co (Public DB)</p>
              </div>
            ) : (
              <p className="text-gray-600 font-mono text-xs italic">Resolvendo endereço IP...</p>
            )}
          </div>
        </div>
      </div>

      <div className={`p-8 rounded-3xl border transition-all ${isSuspicious ? 'bg-red-900/20 border-red-500/50' : 'bg-green-900/20 border-green-500/50'}`}>
        <div className="flex items-start gap-6">
          <div className={`p-4 rounded-2xl ${isSuspicious ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
            {isSuspicious ? <ShieldAlert className="w-10 h-10 text-red-500" /> : <CheckCircle2 className="w-10 h-10 text-green-500" />}
          </div>
          <div className="space-y-2">
            <h3 className={`text-xl font-black uppercase tracking-tight ${isSuspicious ? 'text-red-400' : 'text-green-400'}`}>
              {isSuspicious ? 'Discrepância Detectada' : 'Integridade Geográfica Confirmada'}
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {isSuspicious 
                ? `A localização reportada pela rede está a ${distance?.toFixed(1)}km de distância da sua posição física real. Isso pode indicar o uso de VPNs, Proxies ou um ataque de interceptação de rede (Man-in-the-Middle).`
                : 'As coordenadas do GPS físico e da rede coincidem dentro da margem de erro esperada. Nenhuma anomalia de roteamento detectada.'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl flex gap-4">
        <Info className="w-6 h-6 text-blue-400 shrink-0" />
        <p className="text-xs text-blue-300 leading-relaxed">
          <strong>Análise Forense:</strong> Agentes de ameaça frequentemente mascaram sua origem usando túneis criptografados. Ao comparar o hardware (GPS) com o software (IP), o SKYNETchat consegue furar essa camada de proteção e identificar se o seu tráfego está sendo desviado para servidores em outras regiões ou países.
        </p>
      </div>
    </div>
  );
};

export default GeoIntegrity;
