import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export const EmailConfirmationScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { email } = route.params; // email passed from sign-up screen
  const [checking, setChecking] = useState(false);

  const checkEmailConfirmation = async () => {
    setChecking(true);
    try {
      // Fetch the updated user data
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
  
      const user = data.user;
      if (user && user.email_confirmed_at) {
        // The user has confirmed their email, navigate forward
        navigation.navigate('ProfileSetup');
      } else {
        Alert.alert('Not confirmed', 'Your email has not been confirmed yet. Please check your inbox.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setChecking(false);
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>
        A confirmation email has been sent to {email}. Please check your inbox (and spam folder) and click the confirmation link.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={checkEmailConfirmation}
        disabled={checking}
      >
        {checking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>I Confirmed My Email</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20 
  },
  infoText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
