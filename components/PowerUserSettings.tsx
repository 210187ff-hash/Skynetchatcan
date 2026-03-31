import React from 'react';
import { PowerUserSettings } from '../types';

interface PowerUserSettingsProps {
  settings: PowerUserSettings;
  onSettingsChange: (newSettings: PowerUserSettings) => void;
}

const PowerUserSettingsView: React.FC<PowerUserSettingsProps> = ({ settings, onSettingsChange }) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof PowerUserSettings) => {
    onSettingsChange({ ...settings, [key]: parseFloat(e.target.value) });
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof PowerUserSettings) => {
    onSettingsChange({ ...settings, [key]: e.target.checked });
  };

  return (
    <section className="p-6 md:p-8 lg:p-10 max-w-xl mx-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700">
      <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center font-display">Configurações Power-User</h2>

      <div className="space-y-6">
        {/* Toggle Salvar RAW YUV */}
        <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg shadow-sm border border-gray-600">
          <label htmlFor="saveRawYUV" className="text-lg text-gray-100 font-medium">
            Salvar RAW YUV em /DCIM/SpyNet/RAW/
          </label>
          <input
            type="checkbox"
            id="saveRawYUV"
            checked={settings.saveRawYUV}
            onChange={(e) => handleToggleChange(e, 'saveRawYUV')}
            className="h-6 w-12 rounded-full appearance-none cursor-pointer focus:outline-none 
                       transition-colors duration-300 ease-in-out bg-gray-500 checked:bg-blue-500 
                       peer-checked:bg-blue-500 relative"
          />
        </div>

        {/* Ajustar threshold F1Score */}
        <div className="p-4 bg-gray-700 rounded-lg shadow-sm border border-gray-600">
          <label htmlFor="f1ScoreThreshold" className="block text-lg text-gray-100 font-medium mb-2">
            Threshold F1Score ({settings.f1ScoreThreshold.toFixed(2)})
          </label>
          <input
            type="range"
            id="f1ScoreThreshold"
            min="0.7"
            max="1.0"
            step="0.01"
            value={settings.f1ScoreThreshold}
            onChange={(e) => handleSliderChange(e, 'f1ScoreThreshold')}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb-blue-500"
            style={{ '--tw-range-thumb-color': '#3b82f6' } as React.CSSProperties}
          />
          <p className="text-sm text-gray-400 mt-2">Ajusta a sensibilidade do modelo de ML (0.7 - 1.0)</p>
        </div>

        {/* InclusionTimeWindow para RFTracking */}
        <div className="p-4 bg-gray-700 rounded-lg shadow-sm border border-gray-600">
          <label htmlFor="inclusionTimeWindow" className="block text-lg text-gray-100 font-medium mb-2">
            InclusionTimeWindow para RFTracking ({settings.inclusionTimeWindow} ms)
          </label>
          <input
            type="range"
            id="inclusionTimeWindow"
            min="100"
            max="500"
            step="10"
            value={settings.inclusionTimeWindow}
            onChange={(e) => handleSliderChange(e, 'inclusionTimeWindow')}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb-blue-500"
            style={{ '--tw-range-thumb-color': '#3b82f6' } as React.CSSProperties}
          />
          <p className="text-sm text-gray-400 mt-2">Define a janela de tempo para rastreamento RF (100 - 500 ms)</p>
        </div>
        {/* Nível de Alerta Sonoro */}
        <div className="p-4 bg-gray-700 rounded-lg shadow-sm border border-gray-600">
          <label htmlFor="alertVolume" className="block text-lg text-gray-100 font-medium mb-2">
            Nível de Alerta Sonoro
          </label>
          <div className="flex gap-2">
            {(['Baixo', 'Médio', 'Alto'] as const).map((level) => (
              <button
                key={level}
                onClick={() => onSettingsChange({ ...settings, alertVolume: level })}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all duration-200 ${
                  settings.alertVolume === level
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-2">Ajusta o volume do beep de detecção</p>
        </div>

        {/* Nível de Sensibilidade de Varredura */}
        <div className="p-4 bg-gray-700 rounded-lg shadow-sm border border-gray-600">
          <label htmlFor="sensitivityLevel" className="block text-lg text-gray-100 font-medium mb-2">
            Nível de Sensibilidade de Varredura
          </label>
          <div className="flex gap-2">
            {(['Low', 'Medium', 'High'] as const).map((level) => (
              <button
                key={level}
                onClick={() => onSettingsChange({ ...settings, sensitivityLevel: level })}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all duration-200 ${
                  settings.sensitivityLevel === level
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {level === 'Low' ? 'Baixo' : level === 'Medium' ? 'Médio' : 'Alto'}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-2">Influencia os limites de detecção do sistema</p>
        </div>
      </div>
    </section>
  );
};

export default PowerUserSettingsView;
