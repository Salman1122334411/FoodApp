import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { GoogleLogin } from "../../components/GoogleLogin"; // Correct import path
import * as Google from "expo-auth-session/providers/google"; // Import Google AuthSession

export const LoginScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Logged in user:', data.user);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Google Login Logic
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "273791797910-alhj52c7e95c5b60445dfh58dei4asnm.apps.googleusercontent.com", // Replace with your Client ID
    redirectUri: "https://gemhdxmocjbitbbrwssb.supabase.co/auth/v1/callback", // Replace with your Expo redirect URI
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        signInWithSupabase(authentication.accessToken);
      }
    }
  }, [response]);

  const signInWithSupabase = async (accessToken: string) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { accessToken },
    });

    if (error) {
      console.error("Google login error:", error);
      Alert.alert("Login failed", error.message);
    } else {
      console.log("User:", data);
      Alert.alert("Login successful", `Welcome ${data.user?.email}`);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome Back!</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')} disabled={loading}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>

      {/* Google Login Button */}
      <TouchableOpacity
        style={[styles.googleButton, loading && styles.buttonDisabled]}
        onPress={() => promptAsync()}
        disabled={loading || !request}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Image
              source={require("../../assets/google-logo.png")}
              style={styles.googleLogo}
            />
            <Text style={styles.googleButtonText}>Login with Google</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  button: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#ffb5b5',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  linkText: {
    color: '#FF6B6B',
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#FF6B6B', // Google red color
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
