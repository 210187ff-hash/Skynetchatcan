import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import Drawer from './components/Drawer';
import Introduction from './components/Introduction';
import FlowchartDisplay from './components/FlowchartDisplay';
import ModeDisplay from './components/ModeDisplay';
import PowerUserSettingsView from './components/PowerUserSettings';
import HistoryLog from './components/HistoryLog';
import Dashboard from './components/Dashboard';
import WiFiAnalyzer from './components/WiFiAnalyzer';
import BluetoothSniffer from './components/BluetoothSniffer';
import { AppView, PowerUserSettings as PowerUserSettingsType, DetectionResult } from './types';
import { INITIAL_POWER_USER_SETTINGS } from './constants';

const App: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<AppView>(AppView.Dashboard);
  const [powerUserSettings, setPowerUserSettings] = useState<PowerUserSettingsType>(INITIAL_POWER_USER_SETTINGS);
  const [history, setHistory] = useState<DetectionResult[]>([]);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const handleSelectView = useCallback((view: AppView) => {
    setActiveView(view);
    setIsDrawerOpen(false); // Close drawer on view selection
  }, []);

  const handlePowerUserSettingsChange = useCallback((newSettings: PowerUserSettingsType) => {
    setPowerUserSettings(newSettings);
  }, []);

  const handleDetectionComplete = useCallback((result: DetectionResult) => {
    setHistory((prev) => [result, ...prev]);
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case AppView.Dashboard:
        return <Dashboard onSelectView={handleSelectView} />;
      case AppView.Introduction:
        return <Introduction />;
      case AppView.Flowchart:
        return <FlowchartDisplay />;
      case AppView.PowerUserSettings:
        return <PowerUserSettingsView settings={powerUserSettings} onSettingsChange={handlePowerUserSettingsChange} />;
      case AppView.HistoryLog:
        return <HistoryLog history={history} />;
      case AppView.WiFiAnalyzer:
        return <WiFiAnalyzer />;
      case AppView.BluetoothSniffer:
        return <BluetoothSniffer />;
      case AppView.BlueScan:
        return (
          <ModeDisplay 
            activeModeId={activeView} 
            powerUserSettings={powerUserSettings} 
            onDetectionComplete={handleDetectionComplete}
          />
        );
      default:
        return <Dashboard onSelectView={handleSelectView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      <Header onMenuClick={toggleDrawer} />
      <Drawer
        isOpen={isDrawerOpen}
        onClose={toggleDrawer}
        onSelectView={handleSelectView}
        activeView={activeView}
      />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        {renderContent()}
      </main>
      {/* Optional footer */}
      <footer className="w-full bg-gray-800 border-t border-gray-700 p-4 text-center text-gray-500 text-sm">
        <p>Desenvolvido por SKYNETchat</p>
      </footer>
    </div>
  );
};

export default App;