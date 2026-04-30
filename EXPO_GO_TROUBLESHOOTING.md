# Expo Go Troubleshooting Guide

## ❌ Why Expo Go Doesn't Work for This Project

Your app **cannot run in Expo Go** because it uses native modules that require custom native code:

1. **`@react-native-google-signin/google-signin`** - Google Sign-In requires native configuration
2. **`@stripe/stripe-react-native`** - Stripe payments require native SDKs
3. **`react-native-maps`** - Maps require native map libraries
4. **`expo-dev-client`** - Development client explicitly requires custom builds

Expo Go only supports Expo's managed APIs and cannot include custom native code.

---

## ✅ Solutions

### Option 1: Build a Development Build (Recommended)

A development build is like Expo Go but with your custom native code included.

#### Steps:

1. **Login to EAS** (if not already logged in):
   ```bash
   npm run eas:login
   ```

2. **Build a Development Build**:
   ```bash
   npm run build:android:development
   ```

3. **Wait for the build to complete** (usually 10-20 minutes)

4. **Download and install the APK** from the Expo dashboard link

5. **Start the development server with tunnel**:
   ```bash
   npm run start:tunnel
   ```

6. **Open the app** on your device and scan the QR code (it will work now!)

**Note**: After the first build, subsequent updates are instant (just JavaScript changes).

---

### Option 2: Use Tunnel Mode (For Network Issues)

If you're on different networks or behind a firewall, try tunnel mode:

```bash
npm run start:tunnel
```

This uses Expo's tunnel service to connect your phone to the dev server through the internet.

**Note**: Tunnel mode is slower but works across networks and firewalls.

---

### Option 3: Use Local Network (If Same WiFi)

If both devices are on the same WiFi network:

1. **Start the dev server**:
   ```bash
   npm start
   ```

2. **Press `s` to switch to LAN mode** (if it's in tunnel mode)

3. **Make sure your firewall allows connections on port 8081**

---

### Option 4: Build a Preview APK (For Testing)

Build a standalone APK that includes all native code:

```bash
npm run build:android
```

Then install the APK on your device. This is a full standalone app (not connected to dev server).

---

## 🔧 Quick Fixes

### If QR Code Scans But Nothing Happens:

1. **Check Expo Go version**: Make sure you have the latest Expo Go app
2. **Try tunnel mode**: `npm run start:tunnel`
3. **Check network**: Both devices must be on same network (unless using tunnel)
4. **Clear cache**: `npm start -- --clear`

### If "Unable to resolve module" errors:

The app likely has native dependencies. You **must** use a development build, not Expo Go.

### If "Development build required" error:

Your app requires a development build. Follow **Option 1** above.

---

## 📱 Development Build vs Expo Go

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Native modules | ❌ Limited | ✅ Full support |
| Custom native code | ❌ No | ✅ Yes |
| Setup time | ⚡ Instant | ⏳ 10-20 min first build |
| Updates | ⚡ Instant | ⚡ Instant (after first build) |
| Distribution | ✅ Public | ✅ Private/Internal |

---

## 🚀 Recommended Workflow

1. **First time setup**: Build a development build once
   ```bash
   npm run build:android:development
   ```

2. **Daily development**: Just start the dev server
   ```bash
   npm start
   # or if network issues:
   npm run start:tunnel
   ```

3. **Code changes**: Save files and see changes instantly (no rebuild needed!)

---

## 💡 Why This Project Needs a Development Build

This project uses:
- **Google Sign-In** for authentication
- **Stripe** for payments  
- **React Native Maps** for location features
- **Development Client** for advanced debugging

All of these require native code that isn't in Expo Go. A development build includes your custom native code while still allowing instant updates during development.

---

## 📞 Still Having Issues?

1. Check that you're using the **development build APK**, not Expo Go
2. Ensure the dev server is running (`npm start` or `npm run start:tunnel`)
3. Check your device's network connection
4. Try clearing Expo cache: `npm start -- --clear`
5. Check the terminal for error messages


