# Cloud Build Instructions for Expo APK

This guide will help you build your Expo app as an APK using EAS Build (Expo Application Services) cloud build service.

## Prerequisites

1. **Expo Account**: You need an Expo account (free tier is available)
2. **EAS CLI**: Already installed in this project (`eas-cli` in devDependencies)
3. **Node.js**: Make sure Node.js is installed

## Setup Steps

### 1. Login to EAS

First, login to your Expo account:

```bash
npm run eas:login
```

Or directly:
```bash
npx eas-cli login
```

### 2. Verify Your Account

Check if you're logged in:

```bash
npm run eas:whoami
```

### 3. Build APK in the Cloud

You have several build options:

#### Option A: Build Preview APK (Recommended for testing)
```bash
npm run build:android
```

#### Option B: Build APK with alternative profile
```bash
npm run build:android:apk
```

#### Option C: Build Production APK
```bash
npm run build:android:production
```

#### Option D: Build with non-interactive mode (for CI/CD)
```bash
npm run build:cloud
```

## Build Profiles

The project has the following build profiles configured in `eas.json`:

- **preview**: Builds an APK for internal testing
- **preview2**: Alternative preview build
- **production**: Production build with auto-increment version
- **development**: Development build with dev client

## What Happens During Build

1. EAS Build will:
   - Upload your project to Expo's cloud servers
   - Build the APK in the cloud
   - Provide you with a download link when complete

2. You'll see:
   - Build progress in the terminal
   - A link to track the build on Expo's website
   - Download link when build completes

## Download Your APK

After the build completes:
1. You'll receive a link in the terminal
2. Or visit: https://expo.dev/accounts/[your-account]/projects/mobile/builds
3. Download the APK file
4. Install on Android device (enable "Install from unknown sources" if needed)

## Important Notes

- **First Build**: May take 15-20 minutes (subsequent builds are faster)
- **Free Tier**: Limited builds per month (check Expo pricing)
- **Project ID**: Already configured in `app.json` (`a593f8b0-30ef-4270-a797-11199addf2d9`)
- **Owner**: Set to `malik.salman.tanveer` in `app.json`

## Troubleshooting

### Build Fails?
1. Check your `app.json` configuration
2. Ensure all dependencies are in `package.json`
3. Check build logs on Expo dashboard

### Need to Update Configuration?
- Edit `eas.json` for build profiles
- Edit `app.json` for app metadata
- Run `npx eas-cli build:configure` to reconfigure

## Local Development vs Cloud Build

- **Local Development**: Use `npm start` and scan QR code with Expo Go app
- **Cloud Build**: Creates standalone APK that doesn't require Expo Go

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Dashboard](https://expo.dev)
- [EAS CLI Reference](https://docs.expo.dev/build-reference/eas-cli/)














