import React from 'react';
import { DetectionResult } from '../types';

interface HistoryLogProps {
  history: DetectionResult[];
}

const HistoryLog: React.FC<HistoryLogProps> = ({ history }) => {
  const downloadCSV = (data: string, timestamp: string) => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `spynet_log_${timestamp.replace(/[:.]/g, '-')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <section className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700">
      <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center font-display">Histórico de Detecções</h2>
      
      {history.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-dashed border-gray-700">
          <p className="text-gray-400">Nenhuma detecção registrada até o momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                item.detected ? 'bg-red-900/20 border-red-500/50' : 'bg-green-900/20 border-green-500/50'
              }`}
            >
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                    item.detected ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {item.detected ? 'Positivo' : 'Negativo'}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Data desconhecida'}
                  </span>
                </div>
                <p className="text-gray-100 font-medium">{item.message}</p>
                {item.location && (
                  <p className="text-xs text-blue-400 font-mono mt-1">
                    LAT: {item.location.lat.toFixed(5)} | LNG: {item.location.lng.toFixed(5)}
                  </p>
                )}
                {item.logCsvData && (
                  <button 
                    onClick={() => downloadCSV(item.logCsvData!, item.timestamp!)}
                    className="mt-2 flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest transition-colors"
                  >
                    <span>📥</span> Baixar Log CSV
                  </button>
                )}
              </div>
              
              <div className="flex flex-col items-end">
                <div className="text-sm font-bold text-gray-300">Confiança</div>
                <div className={`text-2xl font-black ${
                  item.confidence > 0.8 ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {(item.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-300">
        <p className="flex items-center">
          <span className="mr-2">ℹ️</span>
          Os logs são armazenados localmente durante esta sessão de uso.
        </p>
      </div>
    </section>
  );
};

export default HistoryLog;
