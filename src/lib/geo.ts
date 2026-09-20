/**
 * KiranaPilot Geolocation & Address Service
 * Store: Shree Ganesh General Store, Sector 14, Gurugram
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface StoreLocation {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  maxDeliveryRadiusKm: number;
}

export const STORE_LOCATION: StoreLocation = {
  name: "Shree Ganesh General Store",
  latitude: 28.4720,
  longitude: 77.0425,
  address: "Shop 12, Sector 14 Market, Gurugram, Haryana 122001",
  phone: "+91 9981154672",
  maxDeliveryRadiusKm: 6.0
};

/**
 * Calculate distance between two GPS coordinates using Haversine formula (in kilometers)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number = STORE_LOCATION.latitude,
  lon2: number = STORE_LOCATION.longitude
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export interface DeliveryEstimate {
  distanceKm: number;
  isDeliverable: boolean;
  estimatedMinutes: number;
  deliveryFeePaise: number;
  deliveryTier: 'EXPRESS' | 'STANDARD' | 'OUT_OF_AREA';
  message: string;
}

/**
 * Get delivery estimate and fee based on customer coordinates
 */
export function getDeliveryEstimate(lat: number, lon: number): DeliveryEstimate {
  const dist = calculateDistanceKm(lat, lon);

  if (dist <= 2.0) {
    return {
      distanceKm: dist,
      isDeliverable: true,
      estimatedMinutes: 15 + Math.round(dist * 5),
      deliveryFeePaise: 0, // Free
      deliveryTier: 'EXPRESS',
      message: `⚡ Express Delivery in ~${15 + Math.round(dist * 5)} mins (${dist} km away • Free delivery)`
    };
  } else if (dist <= STORE_LOCATION.maxDeliveryRadiusKm) {
    return {
      distanceKm: dist,
      isDeliverable: true,
      estimatedMinutes: 25 + Math.round(dist * 6),
      deliveryFeePaise: 2000, // ₹20.00
      deliveryTier: 'STANDARD',
      message: `🛵 Standard Delivery in ~${25 + Math.round(dist * 6)} mins (${dist} km away • ₹20 delivery fee)`
    };
  } else {
    return {
      distanceKm: dist,
      isDeliverable: false,
      estimatedMinutes: 60,
      deliveryFeePaise: 5000,
      deliveryTier: 'OUT_OF_AREA',
      message: `⚠️ Store is ${dist} km away (outside 6 km delivery zone). Store pickup available.`
    };
  }
}
