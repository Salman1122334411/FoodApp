import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 18,
    color: '#000000',
    opacity: 0.9,
    marginBottom: 40,
    fontFamily: 'System',
  },
  imageContainer: {
    width: '80%',
    aspectRatio: 1,
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  decorationLeft: {
    position: 'absolute',
    left: -20,
    top: '50%',
  },
  decorationRight: {
    position: 'absolute',
    right: -20,
    top: '30%',
  },
  decorationBottom: {
    position: 'absolute',
    bottom: -20,
    left: '40%',
  },
  decorationEmoji: {
    fontSize: 24,
  },
});
