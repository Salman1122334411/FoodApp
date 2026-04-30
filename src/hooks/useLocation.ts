// useLocation.ts
import { create } from 'zustand';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import i18next from 'i18next';

interface LocationState {
  currentLocation: string;
  coords: { latitude: number; longitude: number } | null;
  isFetching: boolean;
  isManual: boolean;
  fetchLocation: (force?: boolean) => Promise<void>;
  setManualLocation: (label: string, coords: { latitude: number; longitude: number }) => void;
}

export const useLocation = create<LocationState>((set, get) => ({
  currentLocation: i18next.t('location.fetching'),
  coords: null,
  isFetching: false,
  isManual: false,
  fetchLocation: async (force = false) => {
    const { isFetching, isManual, coords } = get();
    
    // Prevent multiple simultaneous fetches
    if (isFetching) {
      console.log('Location fetch already in progress, skipping...');
      return;
    }

    // BLOCK automated fetch if a manual location is already set, unless forced
    if (isManual && coords && !force) {
      console.log('Manual location already set, skipping automated fetch...');
      return;
    }

    set({ isFetching: true });
    try {
      // 1. Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        set({
          currentLocation: i18next.t('location.disabled'),
          coords: null,
          isFetching: false
        });
        return;
      }

      // 2. Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({
          currentLocation: i18next.t('location.denied'),
          coords: null,
          isFetching: false
        });
        return;
      }

      // 3. Try to get last known position first (faster)
      let loc = await Location.getLastKnownPositionAsync({});

      // 4. If no last known position, fetch current position with longer timeout
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      if (!loc) {
        throw new Error(i18next.t('location.error'));
      }

      const { latitude, longitude } = loc.coords;

      // Try native geocoding first (Google Maps / Apple Maps), but skip on web as it often fails or is unsupported
      try {
        if (Platform.OS !== 'web') {
          const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
            latitude,
            longitude
          });

          if (reverseGeocodedAddress && reverseGeocodedAddress.length > 0) {
            const address = reverseGeocodedAddress[0];
            const area = address.street || address.name || i18next.t('location.unknown_area');
            const locality = address.city || address.subregion || address.region || i18next.t('location.unknown_locality');
            const countryName = address.country || i18next.t('location.unknown_country');

            set({
              currentLocation: `${area}, ${locality}, ${countryName}`,
              coords: { latitude, longitude },
              isFetching: false,
              isManual: false,
            });
            return;
          }
        }
      } catch (nativeError) {
        console.warn('Native geocoding failed, falling back to Nominatim:', nativeError);
      }

      // Fallback: Reverse geocoding via Nominatim
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${i18next.language}`;
      const response = await fetch(url, {
        headers: {
          // Improved User-Agent to avoid blocking
          'User-Agent': 'FiestaFoodApp/1.0',
          'Referer': 'https://fiestafood.app'
        },
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (!data || !data.address) {
        set({
          currentLocation: `(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          coords: { latitude, longitude },
          isFetching: false,
        });
        return;
      }
      const { road, suburb, city, town, state, country } = data.address;
      const area = road || suburb || i18next.t('location.unknown_area');
      const locality = city || town || state || i18next.t('location.unknown_locality');
      set({
        currentLocation: `${area}, ${locality}, ${country || i18next.t('location.unknown_country')}`,
        coords: { latitude, longitude },
        isFetching: false,
        isManual: false,
      });
    } catch (error: any) {
      console.error('Error fetching location:', error);
      let errorMessage = i18next.t('location.error');
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      }
      set({
        currentLocation: errorMessage,
        coords: null,
        isFetching: false,
        isManual: false
      });
    }
  },
  setManualLocation: (label: string, coords: { latitude: number; longitude: number }) => {
    set({
      currentLocation: label,
      coords,
      isFetching: false,
      isManual: true,
    });
  },
}));
