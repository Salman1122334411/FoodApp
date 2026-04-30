import { StyleSheet } from 'react-native';
import { Colors as BrandColors } from '../constants/Colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'relative',
    height: 160,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  restaurantCuisine: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  restaurantMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metaItem: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  selectedCategory: {
    backgroundColor: BrandColors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: '#4B5563',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BrandColors.primary,
    marginTop: 8,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  cartButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: BrandColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
