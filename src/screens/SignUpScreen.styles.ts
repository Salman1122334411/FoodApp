import { StyleSheet } from 'react-native';
import { Colors as BrandColors } from '../constants/Colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#111827',
  },
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderLeftWidth: 4,
    borderLeftColor: BrandColors.primary,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 48,
  },
  passwordVisibilityButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  inputError: {
    borderLeftColor: BrandColors.primary,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: BrandColors.primary,
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    boxShadow: "0px 6px 20px rgba(252, 90, 35, 0.3)",
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: BrandColors.primary,
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 15,
  },
  linkTextBold: {
    color: BrandColors.primary,
    fontWeight: '600',
  },
});
