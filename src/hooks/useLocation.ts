// useLocation.ts
import { create } from 'zustand';
import * as Location from 'expo-location';

interface LocationState {
  currentLocation: string;
  coords: { latitude: number; longitude: number } | null;
  fetchLocation: () => Promise<void>;
}

export const useLocation = create<LocationState>((set) => ({
  currentLocation: 'Fetching current location...',
  coords: null,
  fetchLocation: async () => {
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ currentLocation: 'Location permission denied', coords: null });
        return;
      }

      // Get the current position
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      // Reverse geocoding via Nominatim
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`;
      const response = await fetch(url, {
        headers: {
          // Make sure to follow Nominatim's guidelines for User-Agent
          'User-Agent': 'MyApp/1.0 (your-email@example.com)',
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (!data || !data.address) {
        set({
          currentLocation: `(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          coords: { latitude, longitude },
        });
        return;
      }
      const { road, suburb, city, town, state, country } = data.address;
      const area = road || suburb || 'Unknown area';
      const locality = city || town || state || 'Unknown locality';
      set({
        currentLocation: `${area}, ${locality}, ${country || 'Unknown country'}`,
        coords: { latitude, longitude },
      });
    } catch (error) {
      console.error('Error fetching location:', error);
      set({ currentLocation: 'Error fetching location', coords: null });
    }
  },
}));
