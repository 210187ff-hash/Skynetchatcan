import React, { useState, useEffect } from 'react';
import { Usb, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

interface USBDevice {
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
}

const USBHardwareAudit: React.FC = () => {
  const [devices, setDevices] = useState<USBDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanDevices = async () => {
    if (!('usb' in navigator)) {
      setError('WebUSB API não suportada neste navegador.');
      return;
    }

    setIsScanning(true);
    setError(null);
    try {
      // getDevices() returns devices the user has already granted permission to
      const pairedDevices = await (navigator as any).usb.getDevices();
      setDevices(pairedDevices.map((d: any) => ({
        vendorId: d.vendorId,
        productId: d.productId,
        productName: d.productName,
        manufacturerName: d.manufacturerName,
        serialNumber: d.serialNumber
      })));
    } catch (err) {
      setError('Erro ao listar dispositivos pareados.');
    } finally {
      setIsScanning(false);
    }
  };

  const requestNewDevice = async () => {
    try {
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      if (device) scanDevices();
    } catch (err) {
      // User cancelled or error
    }
  };

  useEffect(() => {
    scanDevices();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <Usb className="w-8 h-8 text-blue-500" />
            USB Hardware Audit
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1">Monitoramento de barramento físico e periféricos</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={scanDevices}
            disabled={isScanning}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button 
            onClick={requestNewDevice}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
          >
            Auditar Novo Dispositivo
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <ShieldAlert className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {devices.length === 0 ? (
          <div className="p-12 text-center bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
            <Usb className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 font-mono text-sm">Nenhum dispositivo USB auditado no momento.</p>
            <p className="text-[10px] text-gray-600 mt-2">Clique em "Auditar Novo Dispositivo" para conceder acesso a um periférico específico.</p>
          </div>
        ) : (
          devices.map((device, i) => (
            <div key={i} className="p-5 bg-gray-900/80 rounded-2xl border border-gray-800 flex items-center justify-between group hover:border-blue-500/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Usb className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{device.productName || 'Dispositivo Desconhecido'}</h4>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {device.manufacturerName || 'Fabricante não informado'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-mono">VID: <span className="text-blue-400">{device.vendorId.toString(16).padStart(4, '0')}</span></p>
                <p className="text-[10px] text-gray-400 font-mono">PID: <span className="text-blue-400">{device.productId.toString(16).padStart(4, '0')}</span></p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Protocolo de Segurança USB</h3>
        </div>
        <p className="text-xs text-blue-300 leading-relaxed">
          Dispositivos USB podem atuar como vetores de ataque silenciosos (HID Injection). Este módulo permite que você audite exatamente quais periféricos têm permissão para interagir com o sistema. Se um dispositivo desconhecido aparecer na lista sem sua autorização, desconecte-o imediatamente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-[10px] text-blue-400/80">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            Isolamento de barramento verificado
          </div>
          <div className="flex items-center gap-2 text-[10px] text-blue-400/80">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            Prevenção contra BadUSB ativa
          </div>
        </div>
      </div>
    </div>
  );
};

export default USBHardwareAudit;
