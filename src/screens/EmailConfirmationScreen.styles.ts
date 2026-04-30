import { StyleSheet } from 'react-native';
import { Colors as BrandColors } from '../constants/Colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: '100%',
    maxWidth: 400,
    // @ts-ignore
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.05)",
    elevation: 8,
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    color: "#1E293B",
    textAlign: 'center',
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: BrandColors.primary,
    borderRadius: 2,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 24,
  },
  emailBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  emailText: {
    fontSize: 16,
    fontWeight: "700",
    color: BrandColors.primary,
  },
  instructionText: {
    fontSize: 14,
    textAlign: "center",
    color: "#94A3B8",
    lineHeight: 22,
  },
  button: {
    backgroundColor: BrandColors.primary,
    width: '100%',
    maxWidth: 400,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // @ts-ignore
    boxShadow: "0px 6px 15px rgba(252, 90, 35, 0.3)",
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
