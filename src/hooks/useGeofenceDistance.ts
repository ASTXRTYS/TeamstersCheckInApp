import { useEffect, useMemo, useRef, useState } from "react";

type GeofenceStatus =
  | "idle"
  | "locating"
  | "ready"
  | "denied"
  | "unsupported"
  | "error"
  | "simulated";

export interface GeofenceTarget {
  lat: number;
  lng: number;
}

export interface GeofenceOptions {
  target: GeofenceTarget;
  radiusMeters: number;
  simulateWhenUnavailable?: boolean;
}

export interface GeofenceState {
  status: GeofenceStatus;
  distanceMeters: number | null;
  isInside: boolean | null;
  lastUpdated: Date | null;
  source: "live" | "simulated" | "none";
  error?: string;
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const earthRadiusMeters = 6371000;

const haversineDistance = (a: GeofenceTarget, b: GeofenceTarget): number => {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const haversine =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusMeters * c;
};

const buildSimulation = (target: GeofenceTarget, radiusMeters: number) => {
  let t = 0;
  return () => {
    t += 1;
    const wave = Math.sin(t / 3) * 0.6 + Math.cos(t / 5) * 0.4;
    const base = radiusMeters * (0.6 + wave * 0.25);
    const outsideBoost = Math.max(0, Math.sin(t / 4) - 0.55) * radiusMeters * 0.8;
    const distance = Math.max(0, base + outsideBoost);
    return {
      distance,
      isInside: distance <= radiusMeters,
      coords: {
        latitude: target.lat,
        longitude: target.lng
      }
    };
  };
};

export function useGeofenceDistance(options: GeofenceOptions): GeofenceState {
  const { target, radiusMeters, simulateWhenUnavailable = false } = options;
  const [state, setState] = useState<GeofenceState>({
    status: "idle",
    distanceMeters: null,
    isInside: null,
    lastUpdated: null,
    source: "none"
  });

  const simulationRef = useRef<ReturnType<typeof buildSimulation> | null>(null);
  const simulationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSimulation = () => {
    if (simulationTimer.current) {
      clearInterval(simulationTimer.current);
      simulationTimer.current = null;
    }
    simulationRef.current = null;
  };

  const updateFromDistance = (distance: number, source: "live" | "simulated", status: GeofenceStatus) => {
    setState({
      status,
      distanceMeters: distance,
      isInside: distance <= radiusMeters,
      lastUpdated: new Date(),
      source,
      error: undefined
    });
  };

  const ensureSimulation = () => {
    if (!simulateWhenUnavailable) {
      setState(prev => ({
        ...prev,
        status: prev.status === "idle" ? "unsupported" : prev.status,
        source: "none"
      }));
      return;
    }

    if (!simulationTimer.current) {
      simulationRef.current = buildSimulation(target, radiusMeters);
      updateFromDistance(radiusMeters * 0.8, "simulated", "simulated");
      simulationTimer.current = setInterval(() => {
        if (!simulationRef.current) return;
        const sample = simulationRef.current();
        updateFromDistance(sample.distance, "simulated", "simulated");
      }, 3500);
    }
  };

  useEffect(() => () => stopSimulation(), []);

  useEffect(() => {
    stopSimulation();
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      ensureSimulation();
      return;
    }

    setState(prev => ({
      ...prev,
      status: "locating",
      source: "live",
      error: undefined
    }));

    const watcher = navigator.geolocation.watchPosition(
      position => {
        stopSimulation();
        const { latitude, longitude } = position.coords;
        const distance = haversineDistance(target, { lat: latitude, lng: longitude });
        updateFromDistance(distance, "live", "ready");
      },
      error => {
        console.error("Geofence watch error", error);
        const nextStatus: GeofenceStatus =
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.POSITION_UNAVAILABLE
            ? "error"
            : "error";
        setState(prev => ({
          ...prev,
          status: nextStatus,
          error: error.message,
          source: "none"
        }));
        ensureSimulation();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 20000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watcher);
    };
  }, [radiusMeters, simulateWhenUnavailable, target.lat, target.lng]);

  return useMemo(() => state, [state]);
}
