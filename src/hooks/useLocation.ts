import { create } from 'zustand';
import * as Location from 'expo-location';

interface LocationState {
  currentLocation: string;
  fetchLocation: () => Promise<void>;
}

export const useLocation = create<LocationState>((set) => ({
  currentLocation: 'Fetching current location...',
  fetchLocation: async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ currentLocation: 'Location permission denied' });
        return;
      }

      // Get current position
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      // Use Nominatim for reverse geocoding
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`;

      const response = await fetch(url, {
        headers: {
          // It is recommended to set a proper "User-Agent" per Nominatim's guidelines
          'User-Agent': 'MyApp/1.0 (your-email@example.com)',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Check if an address is returned
      if (!data || !data.address) {
        set({ currentLocation: `(${latitude.toFixed(4)}, ${longitude.toFixed(4)})` });
        return;
      }

      // Format the address based on available fields.
      // You may customize this to suit your needs.
      const { road, suburb, city, town, state, country } = data.address;
      const area = road || suburb || 'Unknown area';
      const locality = city || town || state || 'Unknown locality';

      set({
        currentLocation: ` ${area}, ${locality}, ${country || 'Unknown country'}`,
      });
      
    } catch (error) {
      console.error('Error fetching location:', error);
      set({ currentLocation: 'Error fetching location' });
    }
  },
}));
