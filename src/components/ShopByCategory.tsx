import React, { FC } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors as BrandColors } from '../constants/Colors';

type Category = {
  id: string;
  labelKey: string;
  icon: string;
  type: string | null;
  library: 'Ionicons' | 'MaterialCommunityIcons';
  bgColor: string;
};

const CATEGORIES: Category[] = [
  { id: 'ALL', labelKey: 'common.all', icon: 'apps', type: null, library: 'MaterialCommunityIcons', bgColor: '#9CA3AF' },
  { id: 'RESTAURANT', labelKey: 'categories.restaurants', icon: 'silverware-fork-knife', type: 'RESTAURANT', library: 'MaterialCommunityIcons', bgColor: '#F87171' }, // Red (Food)
  { id: 'BAKERY', labelKey: 'categories.patisserie', icon: 'cupcake', type: 'BAKERY', library: 'MaterialCommunityIcons', bgColor: '#FACC15' }, // Yellow
  { id: 'FLOWER_SHOP', labelKey: 'categories.flowers', icon: 'flower-tulip', type: 'FLOWER_SHOP', library: 'MaterialCommunityIcons', bgColor: '#C084FC' }, // Purple
  { id: 'GROCERY', labelKey: 'categories.groceries', icon: 'basket', type: 'GROCERY', library: 'MaterialCommunityIcons', bgColor: '#4ADE80' }, // Green
  { id: 'PHARMACY', labelKey: 'categories.pharmacy', icon: 'pill', type: 'PHARMACY', library: 'MaterialCommunityIcons', bgColor: '#60A5FA' }, // Blue
  { id: 'GENERAL', labelKey: 'categories.general', icon: 'shopping', type: 'GENERAL', library: 'MaterialCommunityIcons', bgColor: '#94A3B8' }, // Slate
];

interface Props {
  selectedStoreType: string | null;
  onSelectCategory: (type: string | null) => void;
  hideCategories?: boolean;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export const ShopByCategory: FC<Props> = ({ selectedStoreType, onSelectCategory, hideCategories = false, showViewAll = true, onViewAll }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={[styles.header, !hideCategories && { marginBottom: 20 }]}>
        <View style={styles.headerTitles}>
          <Text style={styles.title}>{t('home.shop_by_category', 'Shop by Category')}</Text>
          <Text style={styles.subtitle}>{t('home.find_favorite_stores', 'Find your favorite local stores')}</Text>
        </View>
        {showViewAll && onViewAll && (
          <TouchableOpacity 
            onPress={() => {
              onSelectCategory(null);
              onViewAll();
            }} 
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.viewAll}>{t('home.view_all_categories', 'View All')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories ScrollView */}
      {!hideCategories && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedStoreType === cat.type;
            return (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => onSelectCategory(cat.type)}
                activeOpacity={0.7}
              >
                {cat.library === 'MaterialCommunityIcons' ? (
                  <MaterialCommunityIcons 
                    name={cat.icon as any} 
                    size={18} 
                    color={isActive ? '#fff' : '#4B5563'} 
                    style={{ marginRight: 6 }}
                  />
                ) : (
                  <Ionicons 
                    name={cat.icon as any} 
                    size={18} 
                    color={isActive ? '#fff' : '#4B5563'} 
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
                  {t(cat.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryPillActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  labelActive: {
    color: '#FFF',
  },
});
