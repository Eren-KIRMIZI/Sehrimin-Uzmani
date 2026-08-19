import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { City, District } from '../types';

interface LocationState {
  selectedCity: City | null;
  selectedDistrict: District | null;
  userLat: number | null;
  userLng: number | null;

  setCity: (city: City | null) => void;
  setDistrict: (district: District | null) => void;
  setCoords: (lat: number, lng: number) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      selectedCity: null,
      selectedDistrict: null,
      userLat: null,
      userLng: null,

      setCity: (city) => set({ selectedCity: city, selectedDistrict: null }),
      setDistrict: (district) => set({ selectedDistrict: district }),
      setCoords: (lat, lng) => set({ userLat: lat, userLng: lng }),
      clearLocation: () => set({ selectedCity: null, selectedDistrict: null, userLat: null, userLng: null }),
    }),
    {
      name: 'location-store',
    }
  )
);
