import React, { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { supabase } from "../src/lib/supabase"; // Updated import path
// This is needed to finish the authentication process
WebBrowser.maybeCompleteAuthSession();

export const GoogleLogin = () => {
    // Initialize Google OAuth
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: "273791797910-r47rpv5qf6s8itlnm796tm01sanefet5.apps.googleusercontent.com", // Replace with your Client ID
        redirectUri: "https://gemhdxmocjbitbbrwssb.supabase.co/auth/v1/callback",
        scopes: ["profile", "email"],
        useProxy: true, 
    });

    useEffect(() => {
        if (response?.type === "success") {
            const { authentication } = response;
            if (authentication?.accessToken) {
                signInWithSupabase(authentication.accessToken);
            }
        }
    }, [response]);

    // Function to sign in with Supabase using the OAuth token
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
        <Button
            title="Login with Google"
            onPress={() => promptAsync()} // Trigger Google login flow
            disabled={!request}
        />
    );
};
