import React from 'react';
import { AppView, ModeDetails } from '../types';
import { MODES } from '../constants';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: AppView) => void;
  activeView: AppView;
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, onSelectView, activeView }) => {
  const commonLinks = [
    { id: AppView.Dashboard, name: 'Painel de Controle', icon: '🏠' },
    { id: AppView.Introduction, name: 'Introdução', icon: '📝' },
    { id: AppView.Flowchart, name: 'Fluxograma SPYNET', icon: '📊' },
    { id: AppView.PowerUserSettings, name: 'Configurações Power-User', icon: '⚙️' },
    { id: AppView.HistoryLog, name: 'Histórico de Detecções', icon: '📜' },
    { id: AppView.WiFiAnalyzer, name: 'Wi-Fi Analyzer', icon: '📶' },
    { id: AppView.BluetoothSniffer, name: 'Bluetooth Sniffer', icon: '📱' },
  ];

  const handleSelect = (view: AppView) => {
    onSelectView(view);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}
    >
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={onClose}></div>
      <nav className="relative flex flex-col w-64 bg-gray-800 h-full shadow-xl p-4 overflow-y-auto">
        <div className="flex justify-end mb-4">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100 focus:outline-none">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h3 className="text-xl font-bold text-blue-400 mb-4 px-2 font-display">Modos de Detecção</h3>
        <ul className="space-y-2">
          {MODES.map((mode: ModeDetails) => (
            <li key={mode.id}>
              <button
                onClick={() => handleSelect(mode.id)}
                className={`flex items-center space-x-3 p-3 w-full text-left rounded-lg transition duration-200 
                            ${activeView === mode.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-100'}`}
              >
                <span className="text-xl">{mode.icon}</span>
                <span className="font-medium">{mode.name}</span>
              </button>
            </li>
          ))}
        </ul>

        <h3 className="text-xl font-bold text-blue-400 mt-8 mb-4 px-2 font-display">Navegação</h3>
        <ul className="space-y-2">
          {commonLinks.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => handleSelect(link.id)}
                className={`flex items-center space-x-3 p-3 w-full text-left rounded-lg transition duration-200 
                            ${activeView === link.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-100'}`}
              >
                <span className="text-xl">{link.icon}</span>
                <span className="font-medium">{link.name}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-6 text-xs text-gray-500 text-center">
          <p>&copy; 2024 SKYNETchat. All rights reserved.</p>
        </div>
      </nav>
    </div>
  );
};

export default Drawer;