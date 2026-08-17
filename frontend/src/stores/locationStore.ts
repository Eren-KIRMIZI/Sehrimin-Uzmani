import { create } from 'zustand';

interface LocationState {
  selectedCity: { id: number; name: string } | null;
  selectedDistrict: { id: number; name: string } | null;
  setSelectedCity: (city: { id: number; name: string } | null) => void;
  setSelectedDistrict: (district: { id: number; name: string } | null) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  selectedCity: JSON.parse(localStorage.getItem('selectedCity') || 'null'),
  selectedDistrict: JSON.parse(localStorage.getItem('selectedDistrict') || 'null'),
  setSelectedCity: (city) => {
    localStorage.setItem('selectedCity', JSON.stringify(city));
    set({ selectedCity: city, selectedDistrict: null });
  },
  setSelectedDistrict: (district) => {
    localStorage.setItem('selectedDistrict', JSON.stringify(district));
    set({ selectedDistrict: district });
  },
}));
