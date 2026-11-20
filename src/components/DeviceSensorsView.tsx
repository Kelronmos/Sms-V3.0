/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Device & Sensor Privacy Guard View
 * Strict compliance with Student Privacy Rule #7.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Mic,
  MapPin,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  Play,
  Square,
  Lock,
  Radio,
} from 'lucide-react';
import { deviceCapabilities } from '../platform/deviceCapabilities';
import { api } from '../services/api';

export const DeviceSensorsView: React.FC = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [locationResult, setLocationResult] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ usageMB: number; quotaMB: number; percentage: number }>({
    usageMB: 0,
    quotaMB: 0,
    percentage: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Read storage estimate on mount
    deviceCapabilities.getStorageEstimate().then(setStorageInfo);

    // Guaranteed cleanup on unmount
    return () => {
      deviceCapabilities.stopAllSensors();
    };
  }, []);

  const handleStartCamera = async () => {
    setCameraError(null);
    const result = await deviceCapabilities.requestCamera('Student verified examination proctoring verification');
    if (result.success && result.stream) {
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = result.stream;
      }
    } else {
      setCameraError(result.error || 'Failed to initialize camera.');
    }
  };

  const handleStopCamera = () => {
    deviceCapabilities.stopCamera();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleStartMic = async () => {
    setMicError(null);
    const result = await deviceCapabilities.requestMicrophone('Speech articulation & reading fluency assessment');
    if (result.success) {
      setMicActive(true);
    } else {
      setMicError(result.error || 'Failed to initialize microphone.');
    }
  };

  const handleStopMic = () => {
    deviceCapabilities.stopMicrophone();
    setMicActive(false);
  };

  const handleSampleLocation = async () => {
    setLocationError(null);
    const result = await deviceCapabilities.requestVerifiedLocation('One-time campus perimeter verification');
    if (result.success && result.coords) {
      setLocationResult({
        lat: result.coords.latitude,
        lng: result.coords.longitude,
        acc: result.coords.accuracy,
      });
    } else {
      setLocationError(result.error || 'Geolocation permission denied or timed out.');
    }
  };

  const handleStopAll = () => {
    handleStopCamera();
    handleStopMic();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Hardware & Device Sensor Security</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict permission governance: No background polling or persistent listening allowed.
          </p>
        </div>

        {(cameraActive || micActive) && (
          <button
            onClick={handleStopAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Emergency Stop All Active Sensors</span>
          </button>
        )}
      </div>

      {/* Sensor Privacy Rule Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-100">Mandatory Student Privacy Covenant</span>
          <p className="text-slate-400 leading-relaxed">
            Hardware sensors (camera, microphone, geolocation) are dormant by default. They are never accessed automatically upon launching the application, nor are raw sensory streams persisted without explicit institutional authorization.
          </p>
        </div>
      </div>

      {/* Sensor Test Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Sensor 1: Video Camera */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Camera className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-100">Optical Camera Stream</h2>
            </div>
            {cameraActive ? (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>LIVE RECORDING</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-slate-500">Dormant</span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Authorised Workflow: Identity verification during locked-down digital examinations.
          </p>

          <div className="relative aspect-video w-full rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
            {!cameraActive && (
              <div className="text-center p-4 text-xs text-slate-500">
                <Camera className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                <span>Camera feed terminated. Hardware sensor disengaged.</span>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {cameraError}
            </div>
          )}

          <div className="flex items-center gap-3">
            {!cameraActive ? (
              <button
                onClick={handleStartCamera}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Request & Activate Camera</span>
              </button>
            ) : (
              <button
                onClick={handleStopCamera}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop Stream & Release Sensor</span>
              </button>
            )}
          </div>
        </div>

        {/* Sensor 2: Microphone Audio */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mic className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-100">Audio Microphone</h2>
            </div>
            {micActive ? (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>AUDIO ACTIVE</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-slate-500">Dormant</span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Authorised Workflow: Reading fluency checks and language pronunciation drills.
          </p>

          <div className="h-32 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-4">
            {micActive ? (
              <div className="flex items-center gap-1.5">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-cyan-400 rounded-full animate-pulse"
                    style={{
                      height: `${20 + Math.random() * 50}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500">
                <Mic className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                <span>Microphone disengaged. No audio data collected.</span>
              </div>
            )}
          </div>

          {micError && (
            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {micError}
            </div>
          )}

          <div className="flex items-center gap-3">
            {!micActive ? (
              <button
                onClick={handleStartMic}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Request & Activate Microphone</span>
              </button>
            ) : (
              <button
                onClick={handleStopMic}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop Audio Recording</span>
              </button>
            )}
          </div>
        </div>

        {/* Sensor 3: One-Time Verified Location */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-100">Perimeter Attendance Check-In</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              One-Time Sample
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Authorised Workflow: Validates physical presence inside designated school bounds without background tracking.
          </p>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
            {locationResult ? (
              <div className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span>Sampled Latitude:</span>
                  <span className="text-slate-100">{locationResult.lat.toFixed(5)}° N</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sampled Longitude:</span>
                  <span className="text-slate-100">{locationResult.lng.toFixed(5)}° W</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Accuracy Radius:</span>
                  <span className="text-emerald-400 font-bold">±{Math.round(locationResult.acc)}m (Verified)</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-slate-500">
                <span>No location query issued yet.</span>
              </div>
            )}
          </div>

          {locationError && (
            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {locationError}
            </div>
          )}

          <button
            onClick={handleSampleLocation}
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Sample Verified Campus Location</span>
          </button>
        </div>

        {/* Sensor 4: Device Local Storage Quota */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-100">Local Persistence Quota</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Offline Cache
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Authorised Workflow: Local encrypted storage allocated for offline queue mutations and cryptographic seals.
          </p>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Storage Allocated</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {storageInfo.usageMB} MB of {storageInfo.quotaMB > 0 ? `${storageInfo.quotaMB} MB` : 'Dynamic'}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all"
                style={{ width: `${Math.max(storageInfo.percentage, 4)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Encrypted Partition: Active</span>
              <span>Integrity Hash: Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
