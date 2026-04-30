import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice } from "../utils/currency";
import QuantitySelector from "./QuantitySelector";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Colors as BrandColors } from "../constants/Colors";
import { getMenuItemAddons, AddonGroup, AddonOption } from "../lib/supabase";
import { ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { calculateItemSubtotal } from "../hooks/useCart";

const { width, height } = Dimensions.get("window");

interface ProductDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  product: any;
  restaurant: any;
  onAddToCart: (product: any, quantity: number, selectedOptions: AddonOption[]) => void;
  initialQuantity?: number;
  initialSelectedOptions?: AddonOption[];
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isVisible,
  onClose,
  product,
  restaurant,
  onAddToCart,
  initialQuantity = 0,
  initialSelectedOptions = [],
}) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const insets = useSafeAreaInsets();
  
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, AddonOption[]>>({});
  const [loadingAddons, setLoadingAddons] = useState(false);

  useEffect(() => {
    if (isVisible && product?.id) {
      setQuantity(initialQuantity || 1);
      fetchAddons();
    }
  }, [isVisible, initialQuantity, product?.id]);

  const fetchAddons = async () => {

    setLoadingAddons(true);
    try {
      const groups = await getMenuItemAddons(product.id, restaurant.id);
      console.log(`[Modal Diagnostic] Discovered ${groups.length} addon groups for ${product.label}`);
      groups.forEach(g => console.log(`  - Group "${g.displayName || g.name}" has ${g.options?.length || 0} options.`));
      setAddonGroups(groups);
      
      // Initialize options from hydration (cart) or defaults
      const initialSelections: Record<string, AddonOption[]> = {};
      
      if (initialSelectedOptions && initialSelectedOptions.length > 0) {
        // Hydrate from existing cart selections
        initialSelectedOptions.forEach(opt => {
          if (!initialSelections[opt.addonGroupId]) {
            initialSelections[opt.addonGroupId] = [];
          }
          initialSelections[opt.addonGroupId].push(opt);
        });
      } else {
        // Fallback to defaults if no previous configuration exists
        groups.forEach(group => {
          const defaults = group.options.filter(opt => opt.isDefault);
          if (defaults.length > 0) {
            initialSelections[group.id] = defaults;
          }
        });
      }
      setSelectedOptions(initialSelections);
    } catch (error) {
      console.error("Error fetching addons in modal:", error);
    } finally {
      setLoadingAddons(false);
    }
  };

  const handleOptionSelect = (group: AddonGroup, option: AddonOption) => {
    setSelectedOptions(prev => {
      const currentGroupSelections = prev[group.id] || [];
      const isAlreadySelected = currentGroupSelections.some(opt => opt.id === option.id);
      
      // If user changes addons, reset quantity to 1 as requested
      setQuantity(1);

      if (group.selectionType === 'SINGLE') {
        return { ...prev, [group.id]: [option] };
      } else {
        if (isAlreadySelected) {
          return {
            ...prev,
            [group.id]: currentGroupSelections.filter(opt => opt.id !== option.id)
          };
        } else {
          // Check maxSelections limit
          if (group.maxSelections && currentGroupSelections.length >= group.maxSelections) {
            return prev;
          }
          return {
             ...prev,
             [group.id]: [...currentGroupSelections, option]
          };
        }
      }
    });
  };

  const isGroupValid = (group: AddonGroup) => {
    const selections = selectedOptions[group.id] || [];
    if (group.isRequired && selections.length === 0) return false;
    if (group.minSelections && selections.length < group.minSelections) return false;
    return true;
  };

  const isFormValid = () => {
    return addonGroups.every(group => isGroupValid(group));
  };

  const getAllSelectedOptions = () => {
    const all: AddonOption[] = [];
    for (const groupId in selectedOptions) {
      if (Array.isArray(selectedOptions[groupId])) {
        all.push(...selectedOptions[groupId]);
      }
    }
    return all;
  };

  if (!product || !restaurant) return null;

  const allSelectedOptions = getAllSelectedOptions();
  const itemTotalWithAddons = calculateItemSubtotal(product.price, quantity, allSelectedOptions);
  
  // High-visibility diagnostic log
  console.log(`[MATH DEBUG] ${product.label}: Qty=${quantity}, Result=${itemTotalWithAddons}`);
  
  const deliveryCharges = Number(restaurant.deliveryCharges) || Number(t('common.delivery_fee_default'));
  const grandTotal = itemTotalWithAddons + deliveryCharges;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      onRequestClose={onClose}
      animationType="slide"
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View 
          style={styles.container}
        >
          {/* Top Section: Image (Sticky) */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.5)", "transparent", "transparent", "rgba(0,0,0,0.4)"]}
              style={StyleSheet.absoluteFill}
            />

            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
              <BlurView intensity={80} tint="light" style={styles.blurButton}>
                <Ionicons name="close" size={24} color="#000" />
              </BlurView>
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            bounces={true}
            contentContainerStyle={{ paddingBottom: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
            <View style={styles.dragIndicator} />

            {/* Title & Price Row */}
            <View style={styles.headerRow}>
              <Text style={styles.productName}>{product.label}</Text>
              <Text style={styles.productPrice}>
                {formatPrice(itemTotalWithAddons / quantity, restaurant.currency)}
              </Text>
            </View>

            {product.description && (
              <Text style={styles.productDescription}>{product.description}</Text>
            )}

            {/* Info Badges Row */}
            <View style={styles.infoBar}>
              <View style={[styles.badge, styles.ratingBadge]}>
                <Ionicons name="star" size={14} color="#D97706" />
                <Text style={styles.ratingText}>
                  {restaurant.rating || "0.0"} <Text style={styles.reviewText}>({restaurant.reviewCount || t('restaurant.reviews_fallback')})</Text>
                </Text>
              </View>
              <View style={[styles.badge, styles.deliveryBadge]}>
                <Ionicons name="time" size={14} color="#4B5563" />
                <Text style={styles.deliveryText}>
                  {restaurant.deliveryTime || t('common.delivery_time_range_default')} {t('common.min')}
                </Text>
              </View>
            </View>

            {/* Delivery Cost Info */}
              <View style={styles.subInfoItem}>
                <Ionicons name="cube-outline" size={16} color={BrandColors.primary} />
                <Text style={styles.subInfoText}>
                  {t('restaurant.delivery')}: {formatPrice(deliveryCharges, restaurant.currency)}
                </Text>
              </View>

            <View style={styles.divider} />

            {/* Addon Groups */}
            {loadingAddons ? (
              <View style={styles.addonLoadingContainer}>
                <ActivityIndicator size="small" color={BrandColors.primary} />
                <Text style={styles.addonLoadingText}>{t('common.loading_addons')}</Text>
              </View>
            ) : (
              addonGroups.map((group) => (
                <View key={group.id} style={styles.addonGroup}>
                  <View style={styles.addonGroupHeader}>
                    <View>
                      <Text style={styles.addonGroupName}>
                        {group.displayName || group.name}
                        {group.isRequired && <Text style={styles.requiredAsterisk}> *</Text>}
                      </Text>
                      <Text style={styles.addonGroupSub}>
                        {group.selectionType === 'SINGLE' 
                          ? t('product_modal.select_one') 
                          : t('product_modal.select_multiple')}
                        {group.maxSelections ? ` (${t('product_modal.max_selections', { count: group.maxSelections })})` : ''}
                      </Text>
                    </View>
                    {!isGroupValid(group) && (
                      <View style={styles.errorBadge}>
                        <Text style={styles.errorBadgeText}>{t('common.required')}</Text>
                      </View>
                    )}
                  </View>

                  <View style={[
                    styles.optionsList, 
                    group.selectionType === 'SINGLE' && styles.optionsListHorizontal
                  ]}>
                    {group.options.map((option) => {
                      const isSelected = (selectedOptions[group.id] || []).some(opt => opt.id === option.id);
                      
                      if (group.selectionType === 'SINGLE') {
                        return (
                          <TouchableOpacity
                            key={option.id}
                            style={[styles.pillOption, isSelected && styles.pillOptionSelected]}
                            onPress={() => handleOptionSelect(group, option)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                              {option.name}
                              {option.priceAdjustment > 0 && ` (+ ${formatPrice(option.priceAdjustment, restaurant.currency)})`}
                            </Text>
                          </TouchableOpacity>
                        );
                      }

                      return (
                        <TouchableOpacity
                          key={option.id}
                          style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                          onPress={() => handleOptionSelect(group, option)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.optionInfo}>
                            <View style={[
                              styles.selectionIndicator,
                              styles.checkbox,
                              isSelected && styles.indicatorSelected
                            ]}>
                              {isSelected && (
                                <Ionicons 
                                  name="checkmark" 
                                  size={14} 
                                  color="#FFF" 
                                />
                              )}
                            </View>
                            <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                              {option.name}
                            </Text>
                          </View>
                          {Number(option.priceAdjustment) > 0 && (
                            <Text style={[styles.optionPrice, isSelected && styles.optionPriceSelected]}>
                              +{formatPrice(option.priceAdjustment, restaurant.currency)}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={styles.divider} />
                </View>
              ))
            )}

            {/* Quantity Selector Section */}
            <View style={styles.selectionHeader}>
              <Text style={styles.selectionTitle}>{t('product_modal.quantity')}</Text>
              <QuantitySelector
                initialQuantity={quantity}
                onUpdate={setQuantity}
                size="medium"
                alwaysExpanded={true}
              />
            </View>

            <View style={styles.divider} />

            {/* Cost Breakdown */}
            <View style={styles.breakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{t('product_modal.order_price')}</Text>
                <Text style={styles.breakdownValue}>
                  {formatPrice(itemTotalWithAddons, restaurant.currency)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{t('product_modal.delivery_charges')}</Text>
                <Text style={styles.breakdownValue}>
                  {formatPrice(deliveryCharges, restaurant.currency)}
                </Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('product_modal.grand_total')}</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(grandTotal, restaurant.currency)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Button Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity 
            style={[
              styles.addToCartButtonContainer,
              !isFormValid() && styles.disabledButton
            ]}
            onPress={() => {
              if (isFormValid()) {
                const options = getAllSelectedOptions();
                console.log(`[Modal Submit] Item: ${product.label}, Qty: ${quantity}, Options Count: ${options.length}`);
                options.forEach(o => console.log(`  - Option: ${o.name}, Adjustment: ${o.priceAdjustment}`));
                onAddToCart(product, quantity, options);
              }
            }}
            disabled={!isFormValid()}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[BrandColors.primary, BrandColors.secondary || BrandColors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addToCartGradient}
            >
              <View style={styles.buttonContent}>
                <View style={styles.buttonLeftSection}>
                  <Ionicons name="cart-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.addToCartText}>{t('product_modal.add_to_cart')}</Text>
                </View>
                <View style={styles.buttonPriceContainer}>
                  <Text style={styles.buttonPriceText}>
                    {formatPrice(itemTotalWithAddons, restaurant.currency)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    maxHeight: height * 0.88,
    overflow: 'hidden',
    marginTop: 50, // Ensures modal never touches the absolute top status bar
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 16,
  },
  imageContainer: {
    width: "100%",
    height: 250, // Reduced height since it's sticky
    position: 'relative',
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 20,
    overflow: 'hidden',
    borderRadius: 22,
  },
  blurButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 16,
    lineHeight: 28,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.primary,
    marginTop: 2,
  },
  productDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 8,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  ratingBadge: {
    // Background removed
  },
  deliveryBadge: {
    backgroundColor: '#F3F4F6', // Soft gray
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937', 
  },
  reviewText: {
    fontWeight: '500',
    color: '#6B7280',
  },
  deliveryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  subInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2', // Very soft red/brand tint
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    alignSelf: 'flex-start',
  },
  subInfoText: {
    fontSize: 13,
    color: BrandColors.primary,
    fontWeight: '700',
  },
  deliveryRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 8,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  breakdown: {
    gap: 8,
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  addToCartButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: "0px 8px 20px rgba(247, 66, 23, 0.25)",
    elevation: 8,
    height: 48,
  },
  addToCartGradient: {
    height: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addToCartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  buttonPriceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  buttonPriceText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  addonLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  addonLoadingText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  addonGroup: {
    marginBottom: 8,
  },
  addonGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addonGroupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  requiredAsterisk: {
    color: BrandColors.primary,
  },
  addonGroupSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  errorBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  errorBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  optionsList: {
    gap: 8,
    marginBottom: 8,
  },
  optionsListHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pillOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  pillOptionSelected: {
    backgroundColor: '#FFF',
    borderColor: BrandColors.primary,
    borderWidth: 1.5,
    // Native iOS Shadow
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Native Android Shadow
    elevation: 4,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  pillTextSelected: {
    color: '#111827',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  optionRowSelected: {
    backgroundColor: '#FFF1F2',
    borderColor: BrandColors.primary + '30',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectionIndicator: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radio: {
    borderRadius: 11,
  },
  checkbox: {
    borderRadius: 6,
  },
  indicatorSelected: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  optionName: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  optionNameSelected: {
    color: '#111827',
    fontWeight: '600',
  },
  optionPrice: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  optionPriceSelected: {
    color: BrandColors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ProductDetailModal;
