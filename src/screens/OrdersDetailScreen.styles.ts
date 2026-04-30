import { StyleSheet, Platform } from "react-native";
import { Colors as BrandColors } from "../constants/Colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  
  // Custom Header Styles (if needed to override default)
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 15,
  },

  // Top Status Card
  statusSummaryCard: {
    backgroundColor: "#fff",
    borderRadius: 35,
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  statusIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#F3F4F6",
    ...Platform.select({
      ios: {
        shadowColor: BrandColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusMainTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },

  // Arrival Card (Orange)
  arrivalCard: {
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 20,
  },
  arrivalGradient: {
    padding: 24,
  },
  arrivalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  arrivalTime: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 16,
  },
  viewReceiptButton: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  viewReceiptText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Entity Cards (Restaurant & Address)
  entityCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
  },
  entityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  entityLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  entityName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  entitySub: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  addressIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFBEB", // Warmer yellow
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },

  // Tracking Section
  trackingCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 24,
    marginBottom: 24,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: "row",
    paddingBottom: 25,
  },
  timelineLeft: {
    alignItems: "center",
    width: 30,
    marginRight: 15,
  },
  timelineIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  timelineIconCircleActive: {
    backgroundColor: BrandColors.primary,
    ...Platform.select({
      ios: {
        shadowColor: BrandColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  timelineLine: {
    width: 2,
    position: "absolute",
    top: 36,
    bottom: 0,
    backgroundColor: "#E5E7EB",
    zIndex: 1,
  },
  timelineLineActive: {
    backgroundColor: BrandColors.primary,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineStatusName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  timelineStatusNameActive: {
    color: "#111827",
  },
  timelineStatusDesc: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },

  // Receipt Details (Hidden by default)
  receiptSection: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  receiptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  receiptItemName: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  receiptItemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  receiptTotalValue: {
    fontSize: 17,
    fontWeight: "900",
    color: BrandColors.primary,
  },

  // Footer Actions
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    height: 48,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    marginLeft: 10,
  },
});
