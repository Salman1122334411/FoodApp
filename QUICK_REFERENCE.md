# Quick Reference Guide

Quick commands and solutions for common tasks and issues.

## 🚀 Getting Started

### Start Development Server
```bash
npm start
```

### Run on Specific Platform
```bash
npm run android    # Android
npm run ios         # iOS
npm run web         # Web browser
```

## 🔧 Common Fixes

### Location Not Working on Web
**Problem**: Location fails to fetch on web browser

**Solutions**:
1. Ensure you're using HTTPS or localhost
2. Allow location permissions in browser
3. Check browser console for errors
4. Try a different browser

**Error Messages**:
- "Location permission denied" → Allow location in browser settings
- "HTTPS required" → Use https:// or localhost
- "Location unavailable" → Enable location services on device

### Metro Bundler Errors
**Problem**: `runServer is not a function` or similar errors

**Solution**:
```bash
# Clear cache and restart
npm start -- --clear

# If that doesn't work, reinstall dependencies
npm cache clean --force
rm -rf node_modules package-lock.json .expo
npm install
```

### Expo Command Not Found (Windows)
**Problem**: `'expo' is not recognized as an internal or external command`

**Solution**:
The scripts have been updated to use direct node paths. If you still see this error:
```bash
# Rebuild npm links
npm rebuild

# Or use the direct path (already in package.json)
node node_modules/expo/bin/cli start
```

### Build Errors
**Problem**: EAS build fails or scripts don't work

**Solution**:
```bash
# Use npx commands (already updated in package.json)
npm run build:android

# If dependencies are corrupted
.\fix-dependencies.ps1  # Windows PowerShell
# OR manually:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📦 Build Commands

### Android Builds
```bash
npm run build:android          # Preview build
npm run build:android:apk      # APK build
npm run build:android:production  # Production build
```

### EAS Commands
```bash
npm run eas:login    # Login to EAS
npm run eas:whoami   # Check current user
```

## 🐛 Troubleshooting

### Dependencies Corrupted
```bash
# Windows PowerShell
.\fix-dependencies.ps1

# Manual (all platforms)
npm cache clean --force
rm -rf node_modules package-lock.json .expo
npm install
```

### Clear All Caches
```bash
# npm cache
npm cache clean --force

# Expo cache
rm -rf .expo

# Metro cache
npm start -- --clear

# All at once (PowerShell)
npm cache clean --force; Remove-Item -Recurse -Force .expo; npm start -- --clear
```

### Check Installation
```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check Expo CLI
npx expo --version

# Check installed packages
npm list --depth=0
```

## 📝 File Locations

### Key Configuration Files
- `babel.config.js` - Babel configuration
- `package.json` - Dependencies and scripts
- `app.json` - Expo app configuration
- `eas.json` - EAS Build configuration

### Important Source Files
- `src/hooks/useLocation.ts` - Location fetching logic
- `src/screens/RestaurantListScreen.tsx` - Restaurant listing
- `App.tsx` - Main app component

## 🔍 Debugging

### Check Logs
```bash
# Development server logs
npm start

# Android logs (if device connected)
adb logcat

# Metro bundler logs
# Check terminal output when running npm start
```

### Common Error Codes

**Location Errors**:
- Code 1: Permission denied
- Code 2: Position unavailable
- Code 3: Timeout

**Build Errors**:
- `MODULE_NOT_FOUND`: Missing dependency → `npm install`
- `runServer is not a function`: Missing babel.config.js → Already fixed
- `Cannot find module '@oclif/core'`: Corrupted dependencies → Reinstall

## ✅ Pre-commit Checklist

Before committing:
- [ ] Run `npm start` to ensure no errors
- [ ] Test location on web (if changed location code)
- [ ] Check that all scripts work
- [ ] Verify no console errors

## 📚 Documentation Files

- `CHANGELOG.md` - All changes made
- `TECHNICAL_CHANGES.md` - Detailed technical documentation
- `QUICK_REFERENCE.md` - This file
- `BUILD_INSTRUCTIONS.md` - Build process documentation

## 🆘 Getting Help

1. Check error messages in console
2. Review `CHANGELOG.md` for recent changes
3. Check `TECHNICAL_CHANGES.md` for implementation details
4. Search for similar issues in Expo/React Native docs

## 🔄 Update Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all packages (be careful!)
npm update

# Update specific package
npm install package-name@latest
```

## 🌐 Platform-Specific Notes

### Web
- Requires HTTPS or localhost for location
- Check browser console for errors
- Some features may differ from native

### Android
- Requires Android SDK setup
- Use `npm run android` or connect device
- Check ADB for device connection

### iOS
- Requires macOS and Xcode
- Use `npm run ios` or connect device
- Requires Apple Developer account for device testing

---

*Last Updated: 2025-02-XX*

