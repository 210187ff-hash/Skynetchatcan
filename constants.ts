import { AppView, ModeDetails, PowerUserSettings } from './types';

export const MODES: ModeDetails[] = [
  {
    id: AppView.BlueScan,
    name: 'Detector Magnético',
    icon: '🧲',
    description: 'Detecção de campos EMF (Câmeras/Microfones)',
    longDescription: `Utiliza o sensor de campo magnético (magnetômetro) do dispositivo para identificar anomalias eletromagnéticas. Dispositivos eletrônicos ocultos, como micro-câmeras e gravadores, emitem pequenas flutuações magnéticas que podem ser detectadas em curtas distâncias.`,
  },
  {
    id: AppView.OpticalScanner,
    name: 'Escaneamento Óptico',
    icon: '👁️',
    description: 'Análise de reflexos de lentes (Glint)',
    longDescription: `Utiliza a câmera e o flash do dispositivo para detectar reflexos característicos de lentes de câmeras ocultas. O sistema alterna o flash em frequências específicas para destacar o brilho da lente.`,
  },
  {
    id: AppView.UltrasonicDetector,
    name: 'Detector Ultrassônico',
    icon: '🔊',
    description: 'Captura de frequências inaudíveis',
    longDescription: `Monitora o espectro de áudio acima de 20kHz para detectar sinais de comunicação ultrassônica usados por beacons de rastreamento ou microfones de alta tecnologia.`,
  },
  {
    id: AppView.WiFiAnalyzer,
    name: 'Analisador de Redes',
    icon: '📶',
    description: 'Sniffing de pacotes e análise de tráfego',
    longDescription: `Analisa o tráfego de rede Wi-Fi local em busca de fluxos de dados suspeitos (como streaming de vídeo) vindos de dispositivos não identificados na rede.`,
  },
];

export const INITIAL_POWER_USER_SETTINGS: PowerUserSettings = {
  saveRawYUV: false,
  f1ScoreThreshold: 0.85,
  inclusionTimeWindow: 300, // ms
  alertVolume: 'Médio',
  sensitivityLevel: 'Medium',
};

export const APP_DESCRIPTION_HTML = `
  <p class="mb-4">A ideia é simples por fora, mas tem de ser cirúrgica por dentro. Nosso objetivo é um APK pronto para rodar em qualquer celular (Android 7-14) sem requerer root ou chips externos.</p>
  <h3 class="text-xl font-bold mt-6 mb-3">Como o detector vai funcionar</h3>
  <p class="mb-4">Câmeras ocultas deixam trilhas físicas que um smartphone consegue ver ou ouvir; basta usar as três principais:</p>
  <ul class="list-disc list-inside mb-4 pl-4 space-y-2">
    <li><strong class="text-blue-400">Lente</strong> - reflete luz em 780-950 nm (infravermelho próximo).</li>
    <li><strong class="text-blue-400">Sensor</strong> - oscila a 15-30 Hz quando iluminado por laser/IR.</li>
    <li><strong class="text-blue-400">Campo eletromagnético</strong> - circuito de alimentação gera ruído entre 100 kHz e 2.4 GHz.</li>
  </ul>
  <p class="mb-4">Combinaremos quatro camadas de detecção:</p>
  <ul class="list-disc list-inside mb-4 pl-4 space-y-2">
    <li><strong class="text-green-400">Infrared Lens Glint</strong> (câmera + flash em modo strobe 940 nm).</li>
    <li><strong class="text-green-400">Laser Speckle Analysis</strong> (laser de 5 mW do próprio dispositivo).</li>
    <li><strong class="text-green-400">Magnetômetro multi-eixo</strong> + filtro digital (detecta transformadores pequenos).</li>
    <li><strong class="text-green-400">RF power scan</strong> via Wi-Fi/Bluetooth chip (sniff de tráfego ou simples "ping" RSSI).</li>
  </ul>
  <h3 class="text-xl font-bold mt-6 mb-3">Pilha de tecnologia no Android</h3>
  <ul class="list-disc list-inside mb-4 pl-4 space-y-2">
    <li><strong class="text-purple-400">Kotlin + Jetpack Compose</strong> – IU leve em 120 fps.</li>
    <li><strong class="text-purple-400">Camera2 + CameraXExtensions</strong> – raw access. Exposure & gain manual.</li>
    <li><strong class="text-purple-400">NDK (C++)</strong> via JNI para pós-processamento SIMD + NEON intrinsics.</li>
    <li><strong class="text-purple-400">TensorFlow Lite</strong> – modelo CNN 200 kB rodando a 30 fps para classificar lentes IR em tempo real.</li>
    <li><strong class="text-purple-400">OpenCV 4.x</strong> – optical flow & Hough circles.</li>
    <li><strong class="text-purple-400">SensorManager</strong> – TYPE_MAGNETIC_FIELD + TYPE_GAME_ROTATION_VECTOR, filtro passa-alta (Butterworth 2ª ordem).</li>
  </ul>
`;

export const FLOWCHART_DETAILS = `
  <h3 class="text-xl font-bold mt-6 mb-3 text-center">Fluxograma interno, batizado código "SPYNET"</h3>
  <div class="space-y-6">
    <div class="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700">
      <h4 class="text-lg font-semibold text-blue-400 mb-2">[Inicio]</h4>
      <p>Acordo de permissões em ciclo único (Câmera, Flash, Body Sensors, Nearby Devices).</p>
    </div>
    <div class="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700">
      <h4 class="text-lg font-semibold text-green-400 mb-2">Bloco A - IR Glint</h4>
      <ul class="list-disc list-inside pl-4 space-y-1">
        <li>Liga flash 940 nm em 50 ms ON / 50 ms OFF.</li>
        <li>Captura 60 fps YUV 420 888.</li>
        <li>Segmenta canal V (crominance YCrCb) para extrair reflexos ≥ 70% intensidade relativa.</li>
      </ul>
    </div>
    <div class="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700">
      <h4 class="text-lg font-semibold text-green-400 mb-2">Bloco B - Laser Speckle</h4>
      <ul class="list-disc list-inside pl-4 space-y-1">
        <li>Usa o laser autofocus ROI via FFT; busca variância fase + 4 (movimento speckle indica superfície lente).</li>
        <li>Processa 128 x 128 ROI via FFT; busca variância fase + 4 (movimento speckle indica superfície lente).</li>
        <li>Se coincidir com tag do Bloco A ~ probabilidade acumulada 0.9.</li>
      </ul>
    </div>
    <div class="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700">
      <h4 class="text-lg font-semibold text-green-400 mb-2">Bloco C - Magnetômetro</h4>
      <ul class="list-disc list-inside pl-4 space-y-1">
        <li>Coleta 200 Hz durante 1 s, remove Earth magnetic field via calibration.</li>
        <li>Detecta delta absoluto > 8 μT em 300 ms com assinatura quadra (bobina de alimentação).</li>
        <li>Se delta estiver dentro de um ângulo de 5° do eixo óptico da câmera detectada → soma 0.15 score.</li>
      </ul>
    </div>
    <div class="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700">
      <h4 class="text-lg font-semibold text-green-400 mb-2">Bloco D - RF Sniff</h4>
      <ul class="list-disc list-inside pl-4 space-y-1">
        <li>Utiliza a class WifiManager.startScan() + BluetoothLeScanner para medir RSSI.</li>
        <li>Se for possível associa uma "SSID oculta" potente ao mesmo ponto de interesse → bonus 0.1.</li>
      </ul>
    </div>
    <div class="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700">
      <h4 class="text-lg font-semibold text-red-400 mb-2">Bloco E - Fusão</h4>
      <ul class="list-disc list-inside pl-4 space-y-1">
        <li>Média ponderada dos scores (A+B=0.75, C=0.15, D=0.1).</li>
        <li>Se final > 0.85 - loca beep curtíssimo + marca balão vermelho AR na tela.</li>
      </ul>
    </div>
  </div>
`;

export const FICTIONAL_EXPANSION_CONTENT = ``;
