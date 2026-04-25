import React, { useState, useCallback, useEffect } from 'react';
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
import SensorManager from './components/SensorManager';
import UltrasonicDetector from './components/UltrasonicDetector';
import MagneticMapper from './components/MagneticMapper';
import PrivacyAudit from './components/PrivacyAudit';
import OpticalScanner from './components/OpticalScanner';
import SigintWarRoom from './components/SigintWarRoom';
import SteganoLab from './components/SteganoLab';
import AcousticForensics from './components/AcousticForensics';
import MetadataScrubber from './components/MetadataScrubber';
import SubnetScanner from './components/SubnetScanner';
import SignalInterference from './components/SignalInterference';
import USBHardwareAudit from './components/USBHardwareAudit';
import BatteryForensics from './components/BatteryForensics';
import GeoIntegrity from './components/GeoIntegrity';
import SeismicMonitor from './components/SeismicMonitor';
import LightPulseDetector from './components/LightPulseDetector';
import NetworkJitter from './components/NetworkJitter';
import ClipboardSanitizer from './components/ClipboardSanitizer';
import KeystrokeDynamics from './components/KeystrokeDynamics';
import WebRTCLeakAudit from './components/WebRTCLeakAudit';
import ScreenIntegrity from './components/ScreenIntegrity';
import StoragePressure from './components/StoragePressure';
import FontFingerprint from './components/FontFingerprint';
import CanvasNoiseTest from './components/CanvasNoiseTest';
import AndroidControlCenter from './components/AndroidControlCenter';
import { AppView, PowerUserSettings as PowerUserSettingsType, DetectionResult } from './types';
import { INITIAL_POWER_USER_SETTINGS } from './constants';
import { nativeBridge } from './services/nativeBridge';

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

  useEffect(() => {
    // Request permissions on startup if in Native mode
    const initNative = async () => {
      if (nativeBridge.isNative()) {
        try {
          await nativeBridge.requestPermissions();
          console.log('[App] Native permissions requested.');
        } catch (error) {
          console.error('[App] Failed to request native permissions:', error);
        }
      }
    };
    initNative();
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
      case AppView.SensorManager:
        return <SensorManager />;
      case AppView.UltrasonicDetector:
        return <UltrasonicDetector />;
      case AppView.MagneticMapper:
        return <MagneticMapper />;
      case AppView.PrivacyAudit:
        return <PrivacyAudit />;
      case AppView.OpticalScanner:
        return <OpticalScanner />;
      case AppView.SigintWarRoom:
        return <SigintWarRoom />;
      case AppView.SteganoLab:
        return <SteganoLab />;
      case AppView.AcousticForensics:
        return <AcousticForensics />;
      case AppView.MetadataScrubber:
        return <MetadataScrubber />;
      case AppView.SubnetScanner:
        return <SubnetScanner />;
      case AppView.SignalInterference:
        return <SignalInterference />;
      case AppView.USBHardwareAudit:
        return <USBHardwareAudit />;
      case AppView.BatteryForensics:
        return <BatteryForensics />;
      case AppView.GeoIntegrity:
        return <GeoIntegrity />;
      case AppView.SeismicMonitor:
        return <SeismicMonitor />;
      case AppView.LightPulseDetector:
        return <LightPulseDetector />;
      case AppView.NetworkJitter:
        return <NetworkJitter />;
      case AppView.ClipboardSanitizer:
        return <ClipboardSanitizer />;
      case AppView.KeystrokeDynamics:
        return <KeystrokeDynamics />;
      case AppView.WebRTCLeakAudit:
        return <WebRTCLeakAudit />;
      case AppView.ScreenIntegrity:
        return <ScreenIntegrity />;
      case AppView.StoragePressure:
        return <StoragePressure />;
      case AppView.FontFingerprint:
        return <FontFingerprint />;
      case AppView.CanvasNoiseTest:
        return <CanvasNoiseTest />;
      case AppView.AndroidControlCenter:
        return <AndroidControlCenter />;
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
