import { StyleSheet, Platform } from 'react-native';
import { Colors as BrandColors } from '../constants/Colors';

// Design-Specific UI Constants (Local to Checkout)
const SOFT_PINK = '#FFF5F2';
const MUTED_GRAY = '#F3F4F6';
const TEXT_DARK = '#111827';
const TEXT_GRAY = '#6B7280';
const APP_ORANGE = BrandColors.primary; // '#F74217'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#FAFBFD', // Soft background for the scrollable area
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32, // Consistent global section gap
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937', // Refined to a more neutral dark
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: '#DEE5EF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#657E96',
  },
  headerActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_ORANGE,
  },

  // Address Card
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SOFT_PINK,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: TEXT_GRAY,
    lineHeight: 20,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  phoneText: {
    fontSize: 14,
    color: TEXT_GRAY,
    fontWeight: '600',
  },

  // Delivery Timing (Horizontal Cards) - Added for DeliveryTimingCard override
  timingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timingCard: {
    flex: 1,
    backgroundColor: MUTED_GRAY,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
  },
  activeTimingCard: {
    backgroundColor: APP_ORANGE,
  },
  timingIconContainer: {
    marginBottom: 12,
  },
  timingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_GRAY,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeTimingTitle: {
    color: '#FFFFFF',
  },
  timingSubtext: {
    fontSize: 11,
    color: TEXT_GRAY,
    marginTop: 4,
    textAlign: 'center',
  },
  activeTimingSubtext: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Order Details (Item)
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  itemRestaurant: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_ORANGE,
    marginTop: 2,
  },
  itemPriceContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  capsuleTag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4B5563',
    textTransform: 'uppercase',
  },

  // Payment Option
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  activePaymentCard: {
    borderColor: APP_ORANGE,
    backgroundColor: '#FFF8F6',
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: MUTED_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentCardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  paymentCardSub: {
    fontSize: 12,
    color: TEXT_GRAY,
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  radioOuterSelected: {
    borderColor: APP_ORANGE,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: APP_ORANGE,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24, // Increased padding
    marginTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#704F38', // Muted brown label
    fontWeight: '500',
  },
  summaryValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  totalValueText: {
    fontSize: 24,
    fontWeight: '700',
    color: APP_ORANGE,
  },

  // Promo Banner
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCF3F2',
    padding: 14,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F9E1DE',
  },
  promoText: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_ORANGE,
    marginLeft: 12,
    flex: 1,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '800',
    color: APP_ORANGE,
  },

  // Footer
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    // Removed bottom shadow for cleaner alignment
  },
  closedWarningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  closedWarningText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  placeOrderButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
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
  disabledButton: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  footerTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
  },
  footerTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  placeOrderBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: APP_ORANGE,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: APP_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  placeOrderBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 8,
  },

  // Gift Section Styles
  giftToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20, // Increased padding
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  giftToggleCardText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  giftExpandedContainer: {
    marginTop: 12,
  },
  sectionHeaderGift: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  giftToggleTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  textInputProminent: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: TEXT_DARK,
    fontWeight: '600',
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxOuterSelected: {
    backgroundColor: APP_ORANGE,
    borderColor: APP_ORANGE,
  },
  giftToggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  giftContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20, // Increased padding
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '500',
  },

  bottomSpace: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: TEXT_GRAY,
    fontWeight: '600',
  },
});
