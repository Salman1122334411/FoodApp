import { StyleSheet, Platform } from "react-native";
import { Colors as BrandColors } from "../constants/Colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Light gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    paddingTop: 28,
    // @ts-ignore
    boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.08)",
    elevation: 8,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    marginTop: 12,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -70, // Overlap the card slightly
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    // @ts-ignore
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    elevation: 4,
  },
  editImageIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: BrandColors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 10,
    marginLeft: 4,
  },
  input: {
    height: 54,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#fff",
  },
  disabledInput: {
    backgroundColor: "#F8FAFC",
    borderColor: "#F1F5F9",
    color: "#94A3B8",
  },
  updateButton: {
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    // @ts-ignore
    boxShadow: "0px 6px 20px rgba(252, 90, 35, 0.3)",
    elevation: 6,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
