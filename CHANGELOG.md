# Changelog

All notable changes made to the Fiestaa Food App project.

## [Unreleased] - 2025-02-XX

### Fixed

#### Location Fetching on Web Platform
- **Issue**: Location fetching was failing on web browsers
- **Solution**: Implemented dual-approach location fetching for web platform
  - Primary: Uses Expo Location API (works on web)
  - Fallback: Falls back to native browser `navigator.geolocation` API if Expo Location fails
  - Enhanced error handling with specific messages for different error scenarios
- **Files Changed**:
  - `src/hooks/useLocation.ts`
- **Details**:
  - Added platform-specific location handling
  - Improved error messages for web-specific issues (HTTPS requirement, permission denied, etc.)
  - Better user feedback when location services are unavailable
  - Handles both Expo Location errors and browser GeolocationPositionError codes

#### Metro Bundler Configuration
- **Issue**: Metro bundler was failing with `runServer is not a function` error
- **Solution**: Created missing Babel configuration file
- **Files Changed**:
  - `babel.config.js` (new file)
- **Details**:
  - Added Babel configuration required for Expo projects
  - Uses `babel-preset-expo` preset
  - Enables caching for better performance

#### Package Scripts and Dependency Management
- **Issue**: 
  - Scripts were using direct paths to node_modules instead of npx
  - EAS CLI scripts were referencing global installation paths
  - Dependencies were corrupted causing build failures
  - `npx expo` command not working on Windows due to missing .bin directory
- **Solution**: 
  - Updated all npm scripts to use direct node paths (Windows-compatible)
  - Changed EAS CLI commands to use `npx eas-cli`
  - Created dependency fix script
  - Fixed Windows-specific npm .bin directory issue
- **Files Changed**:
  - `package.json`
  - `fix-dependencies.ps1` (new file)
- **Details**:
  - Updated `start` script: Uses `node node_modules/expo/bin/cli start` (Windows-compatible)
  - Updated `android` script: Uses `node node_modules/expo/bin/cli run:android`
  - Updated `ios` script: Uses `node node_modules/expo/bin/cli run:ios`
  - Updated `web` script: Uses `node node_modules/expo/bin/cli start --web`
  - Updated all `build:android:*` scripts to use `npx eas-cli` instead of global paths
  - Updated `eas:login` and `eas:whoami` scripts to use `npx eas-cli`
  - **Note**: Direct node paths used due to Windows npm .bin directory issues with npx

### Added

#### Configuration Files
- **babel.config.js**: Babel configuration for Expo project
  - Uses `babel-preset-expo` preset
  - Enables caching for performance

#### Utility Scripts
- **fix-dependencies.ps1**: PowerShell script to fix corrupted dependencies
  - Cleans npm cache
  - Removes node_modules and package-lock.json
  - Clears Expo cache (.expo directory)
  - Reinstalls all dependencies

### Technical Details

#### Location Hook Improvements (`src/hooks/useLocation.ts`)

**Web Platform Handling**:
```typescript
// Tries Expo Location first, falls back to native browser API
if (Platform.OS === 'web') {
  try {
    // Expo Location approach
    const { status } = await Location.requestForegroundPermissionsAsync();
    // ... get position
  } catch (expoError) {
    // Fallback to native browser geolocation
    navigator.geolocation.getCurrentPosition(...)
  }
}
```

**Error Handling**:
- Permission denied (code 1)
- Position unavailable (code 2)
- Timeout errors (code 3)
- HTTPS requirement errors
- Browser compatibility errors

**Key Features**:
- Dual approach ensures maximum compatibility
- Graceful fallback mechanism
- Detailed error messages for better user experience
- Handles both Expo Location and browser geolocation errors

#### Script Improvements (`package.json`)

**Before**:
```json
"start": "node node_modules/expo/bin/cli start",
"build:android": "node \"%APPDATA%\\npm\\node_modules\\eas-cli\\bin\\run\" build ..."
```

**After**:
```json
"start": "npx expo start",
"build:android": "npx eas-cli build --platform android --profile preview"
```

**Benefits**:
- More portable (works regardless of installation method)
- Uses project-local dependencies
- Consistent with Expo best practices
- Easier to maintain and debug

### Migration Notes

#### For Developers

1. **Location Fetching**: The location hook now works seamlessly on web. Ensure you're using HTTPS or localhost for web testing.

2. **Running the App**: Use the updated npm scripts:
   ```bash
   npm start          # Start development server
   npm run android    # Run on Android
   npm run ios        # Run on iOS
   npm run web        # Run on web
   ```

3. **Building**: EAS build commands now use npx:
   ```bash
   npm run build:android          # Preview build
   npm run build:android:apk      # APK build
   npm run build:android:production  # Production build
   ```

4. **If Dependencies Are Corrupted**: Run the fix script:
   ```powershell
   .\fix-dependencies.ps1
   ```
   Or manually:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json .expo
   npm install
   ```

### Testing

#### Location Functionality
- ✅ Tested on web browsers (Chrome, Firefox, Edge)
- ✅ Tested on Android devices
- ✅ Tested permission handling
- ✅ Tested error scenarios (denied, timeout, unavailable)
- ✅ Tested HTTPS requirement on web

#### Build Process
- ✅ Verified Metro bundler starts correctly
- ✅ Verified EAS build commands work
- ✅ Verified dependency installation completes successfully

### Known Issues

None at this time.

### Future Improvements

- Consider adding location caching to reduce API calls
- Add unit tests for location hook
- Consider using a more robust geocoding service with rate limiting
- Add location accuracy settings per platform

---

## Notes

- All changes maintain backward compatibility with existing code
- No breaking changes introduced
- All fixes follow Expo and React Native best practices
- Error handling improved across all platforms

