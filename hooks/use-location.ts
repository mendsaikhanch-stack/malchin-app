import * as Location from "expo-location";
import { useState, useEffect, useCallback, useRef } from "react";
import { findNearestSum, MongoliaLocation } from "../services/mongolia-geo";

type UseLocationResult = {
  location: { lat: number; lng: number } | null;
  mongoliaLocation: MongoliaLocation | null;
  address: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  permissionGranted: boolean;
};

/**
 * Format a MongoliaLocation into a human-readable Mongolian address string.
 *
 * - Улаанбаатар  -> "Улаанбаатар, {дүүрэг} дүүрэг"
 * - Other aimags -> "{аймаг} аймаг, {сум} сум"
 */
function formatAddress(loc: MongoliaLocation): string {
  if (loc.aimag === "Улаанбаатар") {
    return loc.sum
      ? `Улаанбаатар, ${loc.sum} дүүрэг`
      : "Улаанбаатар";
  }
  return loc.sum
    ? `${loc.aimag} аймаг, ${loc.sum} сум`
    : `${loc.aimag} аймаг`;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [mongoliaLocation, setMongoliaLocation] =
    useState<MongoliaLocation | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  // Prevent concurrent refresh calls
  const refreshingRef = useRef(false);

  const fetchLocation = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // 1. Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionGranted(false);
        setError("Байршлын зөвшөөрөл олгоогүй байна");
        setLoading(false);
        refreshingRef.current = false;
        return;
      }
      setPermissionGranted(true);

      // 2. Get current GPS coordinates
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = position.coords;
      setLocation({ lat, lng });

      // 3. Reverse geocode with our Mongolia database
      const mongolia = findNearestSum(lat, lng);
      setMongoliaLocation(mongolia);

      // 4. Build the address string from our database first
      let formattedAddress = formatAddress(mongolia);

      // 5. Optionally enrich with expo-location reverse geocoding
      try {
        const [geocoded] = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        if (geocoded) {
          // If expo provides a more specific street/name, append it
          const street = geocoded.street || geocoded.name;
          if (street && street.length > 0) {
            formattedAddress = `${formattedAddress}, ${street}`;
          }
        }
      } catch {
        // Reverse geocoding may fail offline — that is fine, we already
        // have the Mongolian location from our local database.
      }

      setAddress(formattedAddress);
    } catch (err: any) {
      const message =
        err?.message ?? "Байршил тодорхойлоход алдаа гарлаа";
      setError(message);
    } finally {
      setLoading(false);
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    mongoliaLocation,
    address,
    loading,
    error,
    refresh: fetchLocation,
    permissionGranted,
  };
}
