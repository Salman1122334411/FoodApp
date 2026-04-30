import { StyleSheet, Platform } from "react-native";
import { Colors as BrandColors } from "../constants/Colors";

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    // @ts-ignore
    boxShadow: "0px 2px 3.84px rgba(0, 0, 0, 0.25)",
    elevation: 5,
    maxHeight: "90%",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    padding: 5,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#fff",
    // @ts-ignore
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  tabText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: BrandColors.primary,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#333",
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  inputIcon: {
    marginLeft: 12,
  },
  inputWithIcon: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
    paddingLeft: 8,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 8,
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  datePickerDoneBtn: {
    fontSize: 16,
    fontWeight: "600",
    color: BrandColors.primary,
  },
  datePicker: {
    width: "100%",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    padding: 15,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#666",
    fontSize: 14,
  },
  errorText: {
    color: "#FF3B30",
    marginTop: 5,
    fontSize: 12,
    fontWeight: "500",
  },
  manualToggleButton: {
    marginTop: 10,
    alignItems: "center",
  },
  manualToggleButtonText: {
    color: BrandColors.primary,
    textDecorationLine: "underline",
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    marginTop: 5,
  },
  quickSelectHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 10,
  },
  quickSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickSelectChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickSelectChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
});
