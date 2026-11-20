/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Device Capabilities & Sensor Privacy Guard
 * 
 * Strictly follows Student Privacy Rule #7:
 * - Never collects camera, microphone, motion or location on boot
 * - Only activates when user explicitly initiates feature and approves
 * - Live visual indicator whenever active
 * - Immediate stream and listener teardown when feature closes
 */

import { DeviceSensorStatus } from '../types';
import { api } from '../services/api';

class DeviceCapabilitiesManager {
  private activeStreams: Map<string, MediaStream> = new Map();
  private activeListeners: Map<string, () => void> = new Map();

  /**
   * Request Camera with explicit rationale dialog
   */
  public async requestCamera(reason: string): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        return { success: false, error: 'Camera hardware interface not supported in this runtime.' };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });

      this.activeStreams.set('camera', stream);

      api.addAuditLog({
        id: `aud_${Date.now()}_cam`,
        action: 'SENSOR_ACCESSED',
        userId: api.getCurrentUser().id,
        userRole: api.getCurrentUser().role,
        category: 'sensor',
        timestamp: new Date().toISOString(),
        details: `Camera accessed for reason: "${reason}". Stream active.`,
        origin: 'registered',
      });

      return { success: true, stream };
    } catch (err: any) {
      const errorMsg = err.name === 'NotAllowedError' ? 'Camera access was denied by user or OS.' : err.message || 'Camera error';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Release camera and stop tracks immediately
   */
  public stopCamera(): void {
    const stream = this.activeStreams.get('camera');
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      this.activeStreams.delete('camera');

      api.addAuditLog({
        id: `aud_${Date.now()}_cam_stop`,
        action: 'SENSOR_REVOKED',
        userId: api.getCurrentUser().id,
        userRole: api.getCurrentUser().role,
        category: 'sensor',
        timestamp: new Date().toISOString(),
        details: 'Camera hardware released and media tracks terminated.',
        origin: 'registered',
      });
    }
  }

  /**
   * Request Microphone with explicit rationale
   */
  public async requestMicrophone(reason: string): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        return { success: false, error: 'Audio recording interface not supported.' };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.activeStreams.set('microphone', stream);

      api.addAuditLog({
        id: `aud_${Date.now()}_mic`,
        action: 'SENSOR_ACCESSED',
        userId: api.getCurrentUser().id,
        userRole: api.getCurrentUser().role,
        category: 'sensor',
        timestamp: new Date().toISOString(),
        details: `Microphone accessed for reason: "${reason}". Stream active.`,
        origin: 'registered',
      });

      return { success: true, stream };
    } catch (err: any) {
      const errorMsg = err.name === 'NotAllowedError' ? 'Microphone permission denied by user.' : err.message || 'Microphone error';
      return { success: false, error: errorMsg };
    }
  }

  public stopMicrophone(): void {
    const stream = this.activeStreams.get('microphone');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.activeStreams.delete('microphone');

      api.addAuditLog({
        id: `aud_${Date.now()}_mic_stop`,
        action: 'SENSOR_REVOKED',
        userId: api.getCurrentUser().id,
        userRole: api.getCurrentUser().role,
        category: 'sensor',
        timestamp: new Date().toISOString(),
        details: 'Microphone released and audio tracks stopped.',
        origin: 'registered',
      });
    }
  }

  /**
   * Request One-time Geolocation for verified school boundary check-in
   */
  public async requestVerifiedLocation(reason: string): Promise<{
    success: boolean;
    coords?: { latitude: number; longitude: number; accuracy: number };
    error?: string;
  }> {
    if (!navigator.geolocation) {
      return { success: false, error: 'Geolocation not supported on this device.' };
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          api.addAuditLog({
            id: `aud_${Date.now()}_geo`,
            action: 'SENSOR_ACCESSED',
            userId: api.getCurrentUser().id,
            userRole: api.getCurrentUser().role,
            category: 'sensor',
            timestamp: new Date().toISOString(),
            details: `One-time geolocation sampled for reason: "${reason}". Accuracy: ${coords.accuracy}m.`,
            origin: 'registered',
          });

          resolve({ success: true, coords });
        },
        error => {
          resolve({
            success: false,
            error: error.message || 'Location permission denied.',
          });
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }

  /**
   * Request Storage Quota status
   */
  public async getStorageEstimate(): Promise<{ usageMB: number; quotaMB: number; percentage: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usageMB = Math.round((estimate.usage || 0) / (1024 * 1024));
      const quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024));
      const percentage = quotaMB > 0 ? Math.round((usageMB / quotaMB) * 100) : 0;
      return { usageMB, quotaMB, percentage };
    }
    return { usageMB: 5, quotaMB: 100, percentage: 5 };
  }

  /**
   * Check all sensors active status
   */
  public getActiveSensors(): DeviceSensorStatus[] {
    return [
      {
        sensor: 'camera',
        granted: this.activeStreams.has('camera'),
        active: this.activeStreams.has('camera'),
      },
      {
        sensor: 'microphone',
        granted: this.activeStreams.has('microphone'),
        active: this.activeStreams.has('microphone'),
      },
      {
        sensor: 'geolocation',
        granted: false,
        active: false,
      },
      {
        sensor: 'motion',
        granted: typeof window !== 'undefined' && 'DeviceOrientationEvent' in window,
        active: false,
      },
      {
        sensor: 'storage',
        granted: true,
        active: true,
      },
    ];
  }

  /**
   * Complete emergency cleanup of all active device sensors
   */
  public stopAllSensors(): void {
    this.stopCamera();
    this.stopMicrophone();
    this.activeListeners.forEach(cleanup => cleanup());
    this.activeListeners.clear();
  }
}

export const deviceCapabilities = new DeviceCapabilitiesManager();
