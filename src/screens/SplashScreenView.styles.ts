import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  decorCircleTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.primary,
    opacity: 0.08,
  },
  decorCircleBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary,
    opacity: 0.06,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: width * 0.55,
    height: width * 0.55,
  },
  tagline: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(252, 90, 35, 0.08)',
  },
  versionText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
