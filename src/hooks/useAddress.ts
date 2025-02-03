import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Address {
  id: string;
  user_id: string;
  label: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
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
        .from('Addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

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

      const { data, error } = await supabase
        .from('Addresses')
        .insert([{ ...newAddress, user_id: user.id }])
        .select()
        .single();

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

      await supabase.from('Addresses').update({ is_default: false }).eq('user_id', user.id);

      const { error } = await supabase
        .from('Addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;

      await useAddress.getState().fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  },
  deleteAddress: async (addressId) => {
    try {
      const { error } = await supabase.from('Addresses').delete().eq('id', addressId);

      if (error) throw error;

      set((state) => ({
        addresses: state.addresses.filter((address) => address.id !== addressId),
      }));
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  },
}));
