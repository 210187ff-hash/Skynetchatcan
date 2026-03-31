import { AppView, DetectionResult, PowerUserSettings } from '../types';

export const detectionService = {
  simulateDetection: async (
    mode: AppView,
    settings: PowerUserSettings,
    sensorData?: { emf?: number }
  ): Promise<DetectionResult> => {
    // Get real geolocation if available
    let realLocation: { lat: number; lng: number } | undefined = undefined;
    try {
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        realLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      }
    } catch (e) {
      console.warn("Geolocation failed, using fallback:", e);
    }

    return new Promise((resolve) => {
      const simulationTime = 1200;
      const confidenceRange = [0.85, 0.98];
      
      let falsePositiveRate = 0.008;
      let confidenceBonus = 0;
      
      if (settings.sensitivityLevel === 'Low') {
        falsePositiveRate = 0.002;
        confidenceBonus = -0.05;
      } else if (settings.sensitivityLevel === 'High') {
        falsePositiveRate = 0.02;
        confidenceBonus = 0.05;
      }

      // If we have real EMF data, use it to influence detection
      if (sensorData?.emf && sensorData.emf > 60) {
        confidenceBonus += 0.1; // High EMF increases detection probability
      }

      setTimeout(() => {
        let confidence = Math.random() * (confidenceRange[1] - confidenceRange[0]) + confidenceRange[0] + confidenceBonus;
        let detected = false;
        let message = '';
        let logCsvData = '';
        
        // If EMF is very high, it's a strong indicator
        if (sensorData?.emf && sensorData.emf > 80) {
          detected = true;
          confidence = Math.max(confidence, 0.92);
        } else if (confidence >= settings.f1ScoreThreshold) {
          detected = true;
        }

        if (detected) {
          message = `Câmera espiã DETECTADA com ${Math.round(confidence * 100)}% de confiança! 🚨`;
        } else {
          detected = false;
          confidence = Math.random() * 0.7 + 0.1; // Lower confidence for non-detection
          message = `Nenhuma câmera espiã detectada. Confiança: ${Math.round(confidence * 100)}%.`;
          if (Math.random() < falsePositiveRate) {
              message = `Possível falso positivo detectado. Verifique novamente.`;
          }
        }

        // Use real location or fallback
        const lat = realLocation?.lat || (34.0522 + (Math.random() - 0.5) * 0.1);
        const lng = realLocation?.lng || (-118.2437 + (Math.random() - 0.5) * 0.1);

        // Simulate CSV logging
        if (settings.saveRawYUV) {
            const timestamp = new Date().toISOString();
            logCsvData = `${timestamp},${lat.toFixed(5)},${lng.toFixed(5)},${mode},${detected ? 'TRUE' : 'FALSE'},${confidence.toFixed(2)}`;
            message += ` Dados RAW YUV e log CSV salvos em /DCIM/SpyNet/RAW/.`;
        }

        resolve({
          confidence: parseFloat(confidence.toFixed(2)),
          message,
          detected,
          timestamp: new Date().toISOString(),
          logCsvData,
          rawYUVDataSaved: settings.saveRawYUV,
          location: detected ? { lat, lng } : undefined,
        });
      }, simulationTime);
    });
  },
};
