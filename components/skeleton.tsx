import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;

// Create a reusable skeleton component with shimmer effect
const SkeletonPlaceholder = ({ width, height, style }: { width: any, height: any, style?: any }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    ).start();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: "#E8E8E8",
          borderRadius: 4,
          overflow: "hidden",
          // @ts-ignore
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: "100%",
          height: "100%",
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={["transparent", "rgba(255, 255, 255, 0.6)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>
    </View>
  );
};

export function HomeScreenSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <View>
            {/* Username Skeleton */}
            <SkeletonPlaceholder width={180} height={28} style={styles.greeting} />

            {/* Location Button Skeleton */}
            <View style={styles.locationButton}>
              <Ionicons name="location-outline" size={20} color="#E8E8E8" />
              <SkeletonPlaceholder width={150} height={16} style={styles.locationPlaceholder} />
              <Ionicons name="chevron-down" size={20} color="#E8E8E8" />
            </View>
          </View>
        </View>

        {/* Offers Carousel Skeleton */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersContainer}
        >
          {[1, 2].map((item) => (
            <View
              key={item}
              style={styles.offerCardSkeleton}
            >
              <View style={styles.offerContent}>
                <SkeletonPlaceholder width={100} height={24} style={{ marginBottom: 8 }} />
                <SkeletonPlaceholder width={150} height={16} style={{ marginBottom: 16 }} />
                <SkeletonPlaceholder width={90} height={32} style={{ borderRadius: 8 }} />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Popular Dishes Skeleton */}
        <View style={styles.section}>
          <SkeletonPlaceholder width={150} height={24} style={{ marginBottom: 16 }} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularDishes}
          >
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={styles.dishCardSkeleton}>
                <SkeletonPlaceholder width={200} height={150} style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
                <View style={styles.dishInfo}>
                  <SkeletonPlaceholder width={120} height={16} style={{ marginBottom: 8 }} />
                  <SkeletonPlaceholder width={100} height={14} style={{ marginBottom: 8 }} />
                  <SkeletonPlaceholder width={60} height={16} style={{}} />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Nearby Restaurants Skeleton */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SkeletonPlaceholder width={180} height={24} style={{}} />
            <SkeletonPlaceholder width={60} height={16} style={{}} />
          </View>

          {/* Restaurant Cards Skeleton */}
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.restaurantCardSkeleton}>
              <SkeletonPlaceholder
                width="100%"
                height={200}
                style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
              />

              {/* Delivery Time Chip Skeleton */}
              <View style={[styles.deliveryTimeChip, styles.deliveryTimeChipSkeleton]}>
                <SkeletonPlaceholder width={80} height={20} style={{ borderRadius: 20 }} />
              </View>

              <View style={styles.restaurantInfo}>
                <View style={styles.restaurantHeader}>
                  <View>
                    <SkeletonPlaceholder width={150} height={18} style={{ marginBottom: 8 }} />
                    <SkeletonPlaceholder width={120} height={14} style={{}} />
                  </View>
                  <SkeletonPlaceholder width={50} height={24} style={{ borderRadius: 8 }} />
                </View>

                <View style={styles.restaurantMeta}>
                  <View style={styles.metaItem}>
                    <SkeletonPlaceholder width={100} height={14} style={{}} />
                  </View>
                  <View style={styles.metaItem}>
                    <SkeletonPlaceholder width={80} height={14} style={{}} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    marginBottom: 8,
    borderRadius: 4,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    padding: 8,
    borderRadius: 20,
    maxWidth: "100%",
  },
  locationPlaceholder: {
    marginHorizontal: 8,
    borderRadius: 4,
  },
  offersContainer: {
    padding: 16,
  },
  offerCardSkeleton: {
    width: CARD_WIDTH,
    height: 160,
    marginRight: 16,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  offerContent: {
    flex: 1,
    justifyContent: "center",
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  popularDishes: {
    paddingTop: 8,
    marginBottom: 24,
  },
  dishCardSkeleton: {
    width: 200,
    marginRight: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    // @ts-ignore
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    elevation: 3,
    overflow: "hidden",
  },
  dishInfo: {
    padding: 12,
  },
  restaurantCardSkeleton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 24,
    // @ts-ignore
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  deliveryTimeChipSkeleton: {
    position: "absolute",
    top: 16,
    left: 16,
  },
  deliveryTimeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  restaurantMeta: {
    flexDirection: "row",
    marginTop: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
});