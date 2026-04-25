import React, { useMemo, useState } from 'react';
import { nativeBridge } from '../services/nativeBridge';

type ModuleKey = 'wifi' | 'bluetooth' | 'nfc';

interface ModuleState {
  enabled: boolean;
  status: string;
  lastChecked: string;
}

const nowLabel = () => new Date().toLocaleTimeString('pt-BR');

const AndroidControlCenter: React.FC = () => {
  const [modules, setModules] = useState<Record<ModuleKey, ModuleState>>({
    wifi: { enabled: false, status: 'Pronto para diagnóstico', lastChecked: nowLabel() },
    bluetooth: { enabled: false, status: 'Pronto para diagnóstico', lastChecked: nowLabel() },
    nfc: { enabled: false, status: 'Pronto para diagnóstico', lastChecked: nowLabel() },
  });
  const [activityLog, setActivityLog] = useState<string[]>([]);

  const isNativeAndroid = useMemo(() => nativeBridge.isNative() && nativeBridge.getPlatform() === 'android', []);

  const logAction = (message: string) => {
    setActivityLog((prev) => [`${new Date().toLocaleString('pt-BR')} • ${message}`, ...prev].slice(0, 12));
  };

  const setModuleState = (key: ModuleKey, status: string, enabled?: boolean) => {
    setModules((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: enabled ?? prev[key].enabled,
        status,
        lastChecked: nowLabel(),
      },
    }));
  };

  const handleWiFi = async () => {
    setModuleState('wifi', 'Executando varredura segura...');
    const networks = await nativeBridge.scanWifi();
    const found = networks.length;
    const status = found > 0 ? `${found} rede(s) detectada(s)` : 'Sem redes detectadas (ou permissão indisponível)';
    setModuleState('wifi', status, found > 0);
    logAction(`Wi-Fi auditado: ${status}.`);
  };

  const handleBluetooth = async () => {
    setModuleState('bluetooth', 'Executando varredura BLE autorizada...');
    const devices = await nativeBridge.scanBluetooth();
    const found = devices.length;
    const status = found > 0 ? `${found} dispositivo(s) próximo(s)` : 'Sem dispositivos detectados (ou permissão indisponível)';
    setModuleState('bluetooth', status, found > 0);
    logAction(`Bluetooth auditado: ${status}.`);
  };

  const handleNFC = async () => {
    setModuleState('nfc', 'NFC exige controle pelo sistema operacional Android.');
    logAction('NFC: exibição de orientação de uso sem bypass de segurança.');
  };

  const runFullAudit = async () => {
    logAction('Iniciando varredura completa local (Wi-Fi + Bluetooth + NFC).');
    await handleWiFi();
    await handleBluetooth();
    await handleNFC();
    logAction('Varredura completa finalizada.');
  };

  const generateIncidentSafeToken = () => {
    const token = `SAFE-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    logAction(`Token inédito de sessão segura gerado: ${token}`);
  };

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-blue-400">Android Control Center (Seguro)</h2>
        <p className="text-gray-300 mt-2 text-sm">
          Controle separado por botões para diagnóstico de Wi-Fi, Bluetooth e NFC, sem invasão e sem bypass de permissões.
        </p>
        <div className="mt-4 text-xs">
          <span className={`px-3 py-1 rounded-full border ${isNativeAndroid ? 'border-green-500 text-green-300' : 'border-yellow-500 text-yellow-300'}`}>
            {isNativeAndroid ? 'Android nativo detectado' : 'Modo Web/Simulação (algumas funções limitadas)'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={handleWiFi} className="p-5 rounded-2xl bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-left">
          <h3 className="font-bold text-blue-300">Wi-Fi</h3>
          <p className="text-xs text-gray-300 mt-2">{modules.wifi.status}</p>
          <p className="text-[10px] text-gray-500 mt-2">Última checagem: {modules.wifi.lastChecked}</p>
        </button>

        <button onClick={handleBluetooth} className="p-5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-left">
          <h3 className="font-bold text-indigo-300">Bluetooth</h3>
          <p className="text-xs text-gray-300 mt-2">{modules.bluetooth.status}</p>
          <p className="text-[10px] text-gray-500 mt-2">Última checagem: {modules.bluetooth.lastChecked}</p>
        </button>

        <button onClick={handleNFC} className="p-5 rounded-2xl bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-left">
          <h3 className="font-bold text-purple-300">NFC</h3>
          <p className="text-xs text-gray-300 mt-2">{modules.nfc.status}</p>
          <p className="text-[10px] text-gray-500 mt-2">Última checagem: {modules.nfc.lastChecked}</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={runFullAudit} className="p-4 rounded-xl border border-green-500/40 bg-green-600/10 text-green-300 font-semibold">
          Executar Auditoria Completa
        </button>
        <button onClick={generateIncidentSafeToken} className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-600/10 text-cyan-300 font-semibold">
          Gerar Token de Sessão Segura (função inédita)
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h4 className="font-bold text-gray-200 mb-3">Log de atividades</h4>
        {activityLog.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma ação executada ainda.</p>
        ) : (
          <ul className="space-y-2 text-xs text-gray-300">
            {activityLog.map((entry) => (
              <li key={entry} className="border-b border-gray-800 pb-2">{entry}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default AndroidControlCenter;
