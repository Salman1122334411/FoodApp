import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import cuid from 'cuid'; // Import the cuid package

interface Address {
  id: string;
  userId: string;
  label: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddressState {
  addresses: Address[];
  loading: boolean;
  fetchAddresses: () => Promise<void>;
  addAddress: (newAddress: Partial<Address>) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
}

export const useAddress = create<AddressState>((set) => ({
  addresses: [],
  loading: true,
  fetchAddresses: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('Address')
        .select('*')
        .eq('userId', user.id)
        .order('isDefault', { ascending: false });

      if (error) throw error;

      set({ addresses: data || [] });
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      set({ loading: false });
    }
  },
  addAddress: async (newAddress) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Generate a cuid if not provided in newAddress
      const generatedId = newAddress.id ? newAddress.id : cuid();
      // Remove any existing id property to avoid conflicts
      const { id, ...addressData } = newAddress;
      // Get current timestamp in ISO format
      const currentTimestamp = new Date().toISOString();

      const { data, error } = await supabase
        .from('Address')
        .insert([{
          id: generatedId,
          ...addressData,
          userId: user.id,
          updatedAt: currentTimestamp,
          createdAt: currentTimestamp,
        }])
        .select()
        .maybeSingle();
      if (error) throw error;

      set((state) => ({ addresses: [...state.addresses, data] }));
    } catch (error) {
      console.error('Error adding address:', error);
    }
  },
  setDefaultAddress: async (addressId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      await supabase.from('Address').update({ isDefault: false }).eq('userId', user.id);

      const { error } = await supabase
        .from('Address')
        .update({ isDefault: true })
        .eq('id', addressId);

      if (error) throw error;

      await useAddress.getState().fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  },
  deleteAddress: async (addressId) => {
    try {
      const { error } = await supabase.from('Address').delete().eq('id', addressId);

      if (error) throw error;

      set((state) => ({
        addresses: state.addresses.filter((address) => address.id !== addressId),
      }));
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  },
}));
