import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { BleClient, NumberToUUID } from '@capacitor-community/bluetooth-le';
import { CapacitorWifi } from '@capgo/capacitor-wifi';

/**
 * NativeBridge Service
 * This service acts as a bridge between the React web application and native Android/iOS capabilities.
 * It uses Capacitor plugins to access real hardware features when running as a native app.
 */

export enum Platform {
  Web = 'web',
  Android = 'android',
  Ios = 'ios'
}

export interface WiFiNetwork {
  ssid: string;
  bssid: string;
  level: number;
  frequency: number;
  capabilities: string;
}

export interface BluetoothDevice {
  name: string;
  id: string;
  rssi: number;
}

class NativeBridgeService {
  private platform: Platform;
  private isBluetoothInitialized: boolean = false;

  constructor() {
    this.platform = Capacitor.getPlatform() as Platform;
    console.log(`[NativeBridge] Initialized on platform: ${this.platform}`);
  }

  public getPlatform(): Platform {
    return this.platform;
  }

  public isNative(): boolean {
    return this.platform !== Platform.Web;
  }

  /**
   * Scans for nearby Wi-Fi networks using @capgo/capacitor-wifi.
   */
  public async scanWifi(): Promise<WiFiNetwork[]> {
    if (this.isNative()) {
      try {
        const result = await CapacitorWifi.scan();
        return result.networks.map(n => ({
          ssid: n.SSID || 'Unknown',
          bssid: n.BSSID || '',
          level: n.level || 0,
          frequency: n.frequency || 0,
          capabilities: n.capabilities || ''
        }));
      } catch (error) {
        console.error('[NativeBridge] Native Wi-Fi scan failed:', error);
        return [];
      }
    } else {
      return []; 
    }
  }

  /**
   * Scans for nearby Bluetooth devices using @capacitor-community/bluetooth-le.
   */
  public async scanBluetooth(): Promise<BluetoothDevice[]> {
    if (this.isNative()) {
      try {
        if (!this.isBluetoothInitialized) {
          await BleClient.initialize();
          this.isBluetoothInitialized = true;
        }

        const devices: BluetoothDevice[] = [];
        await BleClient.requestLEScan(
          {},
          (result) => {
            if (result.device.name) {
              devices.push({
                name: result.device.name,
                id: result.device.deviceId,
                rssi: result.rssi
              });
            }
          }
        );

        // Scan for 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        await BleClient.stopLEScan();
        
        return devices;
      } catch (error) {
        console.error('[NativeBridge] Native Bluetooth scan failed:', error);
        return [];
      }
    } else {
      return [];
    }
  }

  /**
   * Captures a photo using @capacitor/camera.
   */
  public async capturePhoto(): Promise<string | null> {
    if (this.isNative()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl
        });
        return image.dataUrl || null;
      } catch (error) {
        console.error('[NativeBridge] Camera capture failed:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Gets device information.
   */
  public async getDeviceInfo() {
    return await Device.getInfo();
  }

  /**
   * Gets current location.
   */
  public async getCurrentPosition() {
    return await Geolocation.getCurrentPosition();
  }

  /**
   * Requests native permissions required for scanning and hardware access.
   */
  public async requestPermissions(): Promise<boolean> {
    if (this.isNative()) {
      try {
        console.log('[NativeBridge] Requesting native permissions...');
        
        // Request Camera
        const cameraRes = await Camera.requestPermissions();
        
        // Request Geolocation (needed for WiFi/BT scanning on Android)
        const geoRes = await Geolocation.requestPermissions();
        
        // Bluetooth permissions are often bundled or handled via initialize()
        if (this.platform === Platform.Android) {
          // On Android, we need fine location for scanning
          console.log('[NativeBridge] Android specific: Location permission granted?', geoRes.location);
        }

        return cameraRes.camera === 'granted' && geoRes.location === 'granted';
      } catch (error) {
        console.error('[NativeBridge] Permission request failed:', error);
        return false;
      }
    }
    return true;
  }
}

export const nativeBridge = new NativeBridgeService();
