import { StyleSheet, Dimensions } from "react-native";
import { Colors as BrandColors } from "../constants/Colors";

const { width } = Dimensions.get("window");

export const searchBarStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(255,255,255)",
    borderRadius: 50,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: "#000",
  },
});

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", 
  },
  header: {
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: "hidden",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  listContainer: {
    padding: 16,
    paddingHorizontal: 20, // Standardized side padding
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  restaurantIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  restaurantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  orderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 6,
  },
  addressText: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 6,
    flex: 1,
  },
  paymentText: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 6,
  },
  totalAmountContainer: {
    alignItems: "flex-end",
    marginBottom: 12,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  totalAmountLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  orderItemsSection: {
    marginBottom: 12,
  },
  orderItemsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  orderItemContainer: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  orderItemName: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: BrandColors.primary,
  },
  orderItemQuantity: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  reorderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BrandColors.primary,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  reorderButtonText: {
    fontSize: 14,
    color: BrandColors.primary,
    fontWeight: "600",
    marginLeft: 6,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  totalItems: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#4B5563",
    marginTop: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
