export enum AppView {
  Dashboard = 'Dashboard',
  Introduction = 'Introduction',
  Flowchart = 'Flowchart',
  BlueScan = 'BlueScan',
  PowerUserSettings = 'PowerUserSettings',
  HistoryLog = 'HistoryLog',
  WiFiAnalyzer = 'WiFiAnalyzer',
  BluetoothSniffer = 'BluetoothSniffer',
  SensorManager = 'SensorManager',
  UltrasonicDetector = 'UltrasonicDetector',
  MagneticMapper = 'MagneticMapper',
  PrivacyAudit = 'PrivacyAudit',
  OpticalScanner = 'OpticalScanner',
  SigintWarRoom = 'SigintWarRoom',
  SteganoLab = 'SteganoLab',
  AcousticForensics = 'AcousticForensics',
  MetadataScrubber = 'MetadataScrubber',
  SubnetScanner = 'SubnetScanner',
  SignalInterference = 'SignalInterference',
  USBHardwareAudit = 'USBHardwareAudit',
  BatteryForensics = 'BatteryForensics',
  GeoIntegrity = 'GeoIntegrity',
  SeismicMonitor = 'SeismicMonitor',
  LightPulseDetector = 'LightPulseDetector',
  NetworkJitter = 'NetworkJitter',
  ClipboardSanitizer = 'ClipboardSanitizer',
  KeystrokeDynamics = 'KeystrokeDynamics',
  WebRTCLeakAudit = 'WebRTCLeakAudit',
  ScreenIntegrity = 'ScreenIntegrity',
  StoragePressure = 'StoragePressure',
  FontFingerprint = 'FontFingerprint',
  CanvasNoiseTest = 'CanvasNoiseTest',
  AndroidControlCenter = 'AndroidControlCenter',
}

export interface ModeDetails {
  id: AppView;
  name: string;
  description: string;
  icon: string; // Tailwind icon class or SVG string
  longDescription?: string;
  isPixelExclusive?: boolean;
}

export interface PowerUserSettings {
  saveRawYUV: boolean;
  f1ScoreThreshold: number; // 0.7 - 1.0
  inclusionTimeWindow: number; // 100 - 500 ms
  alertVolume: 'Baixo' | 'Médio' | 'Alto';
  sensitivityLevel: 'Low' | 'Medium' | 'High';
}

export interface DetectionResult {
  confidence: number;
  message: string;
  detected: boolean;
  location?: { lat: number; lng: number };
  timestamp?: string;
  logCsvData?: string;
  rawYUVDataSaved?: boolean;
  groundingUrls?: string[]; // For Maps/Search grounding simulation
}

export type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface Base64Image {
  data: string;
  mimeType: string;
}
