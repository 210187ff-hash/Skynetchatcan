import React, { useState } from 'react';

interface BTDevice {
  name: string;
  id: string;
  connected: boolean;
}

const BluetoothSniffer: React.FC = () => {
  const [devices, setDevices] = useState<BTDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestBluetoothDevice = async () => {
    setIsScanning(true);
    setError(null);
    try {
      // Real Web Bluetooth API call
      // Note: This opens a native browser dialog for the user to pick a device
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'] // Example service
      });

      const newDevice: BTDevice = {
        name: device.name || 'Dispositivo Sem Nome',
        id: device.id,
        connected: device.gatt?.connected || false
      };

      setDevices(prev => {
        // Avoid duplicates
        if (prev.find(d => d.id === newDevice.id)) return prev;
        return [newDevice, ...prev];
      });
    } catch (err: any) {
      console.error("Bluetooth Error:", err);
      if (err.name === 'NotFoundError') {
        setError('Nenhum dispositivo selecionado ou Bluetooth desativado.');
      } else if (err.name === 'SecurityError') {
        setError('Acesso ao Bluetooth negado pelo navegador.');
      } else {
        setError('Erro ao acessar hardware Bluetooth. Certifique-se de que o Bluetooth está ligado.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-400 font-display">Bluetooth Sniffer (Real-Time)</h2>
          <p className="text-gray-400">Detecção real via Web Bluetooth API</p>
        </div>
        <button
          onClick={requestBluetoothDevice}
          disabled={isScanning}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            isScanning ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
          }`}
        >
          {isScanning ? 'Aguardando Seleção...' : 'Buscar Dispositivos'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/40 rounded-xl text-red-400 text-sm flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      <div className="grid gap-4">
        {devices.length > 0 ? (
          devices.map((dev, idx) => (
            <div 
              key={idx}
              className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{dev.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">ID: {dev.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${dev.connected ? 'bg-green-600/20 text-green-500' : 'bg-gray-700 text-gray-400'}`}>
                    {dev.connected ? 'Conectado' : 'Detectado'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : !isScanning && (
          <div className="p-12 text-center bg-gray-900/30 rounded-xl border border-dashed border-gray-700">
            <p className="text-gray-500 text-sm italic">Clique em "Buscar Dispositivos" para iniciar a detecção real via hardware.</p>
          </div>
        )}

        {isScanning && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-400 text-xs font-mono animate-pulse">Aguardando interação com o seletor nativo...</p>
          </div>
        )}
      </div>

      <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
        <p className="text-[10px] text-blue-400/80 leading-relaxed italic">
          <strong>Nota Técnica:</strong> Esta ferramenta utiliza a Web Bluetooth API. Por segurança, o navegador exige que você selecione manualmente o dispositivo que deseja analisar através de uma janela nativa do sistema.
        </p>
      </div>
    </div>
  );
};

export default BluetoothSniffer;
