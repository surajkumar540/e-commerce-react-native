import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const IMAGE_SIZE = width / 2 - 20;

// Static fallback data
const STATIC_WALLPAPERS = [
  {
    id: "1",
    title: "Sunset View",
    imageUrl:
      "https://images.pexels.com/photos/16354140/pexels-photo-16354140.jpeg",
    date: "March 10, 2025",
    category: "Nature",
  },
  {
    id: "2",
    title: "Green Forest",
    imageUrl:
      "https://images.pexels.com/photos/1671325/pexels-photo-1671325.jpeg",
    date: "March 15, 2025",
    category: "Nature",
  },
  {
    id: "3",
    title: "Ocean Waves",
    imageUrl:
      "https://images.pexels.com/photos/855257/pexels-photo-855257.jpeg",
    date: "March 18, 2025",
    category: "Nature",
  },
  {
    id: "4",
    title: "Pink Sky",
    imageUrl:
      "https://images.pexels.com/photos/1237119/pexels-photo-1237119.jpeg",
    date: "March 20, 2025",
    category: "Sky",
  },
  {
    id: "5",
    title: "Mountain Range",
    imageUrl:
      "https://images.pexels.com/photos/225203/pexels-photo-225203.jpeg",
    date: "March 19, 2025",
    category: "Nature",
  },
  {
    id: "6",
    title: "City Lights",
    imageUrl:
      "https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg",
    date: "March 17, 2025",
    category: "Urban",
  },
  {
    id: "7",
    title: "Desert Dunes",
    imageUrl:
      "https://images.pexels.com/photos/248771/pexels-photo-248771.jpeg",
    date: "March 16, 2025",
    category: "Nature",
  },
];

// Predefined categories (can be fetched from backend if needed)
const DEFAULT_CATEGORIES = [
  "All",
  "Nature",
  "Abstract",
  "Animals",
  "Technology",
  "Food",
  "Travel",
];

const WallpaperScreen = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const navigation = useNavigation();
  const flatListRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Categories state
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch categories from backend (optional)
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("http://192.168.1.41:5000/api/categories");
      if (response.ok) {
        const data = await response.json();
        if (data && data.categories && Array.isArray(data.categories)) {
          // Always include "All" as the first option
          setCategories(["All", ...data.categories]);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Keep using default categories on error
    }
  }, []);

  // Fetch wallpapers from API with pagination and category filter
  const fetchWallpapers = useCallback(
    async (page = 1, category = "All", shouldAppend = false) => {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(false);

      try {
        // Add pagination and category parameters to the API request
        const categoryParam = category === "All" ? "" : `&category=${category}`;
        const response = await fetch(
          `http://192.168.1.41:5000/api/get-images?page=${page}&limit=10${categoryParam}`
        );

        // Check if the response is valid
        if (!response.ok) {
          throw new Error("Failed to fetch wallpapers");
        }

        const data = await response.json();

        // Check if we received valid data
        if (data && data.images && Array.isArray(data.images)) {
          if (shouldAppend) {
            setWallpapers((prevWallpapers) => [
              ...prevWallpapers,
              ...data.images,
            ]);
          } else {
            setWallpapers(data.images);
          }

          // Update pagination information
          setCurrentPage(data.currentPage);
          setTotalPages(data.totalPages);
        } else {
          // If no valid data, fall back to static wallpapers
          let filtered = STATIC_WALLPAPERS;
          if (category !== "All") {
            filtered = STATIC_WALLPAPERS.filter(
              (item) => item.category === category
            );
          }
          setWallpapers(filtered);
          setTotalPages(1);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error("Error fetching wallpapers:", error);
        setError(true);
        // Fall back to static wallpapers on error
        let filtered = STATIC_WALLPAPERS;
        if (category !== "All") {
          filtered = STATIC_WALLPAPERS.filter(
            (item) => item.category === category
          );
        }
        setWallpapers(filtered);
        setTotalPages(1);
        setCurrentPage(1);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Load initial data on component mount
  useEffect(() => {
    fetchCategories();
    fetchWallpapers(1, "All", false);
  }, [fetchWallpapers, fetchCategories]);

  // Handle category selection
  const handleCategoryPress = useCallback(
    (category) => {
      if (category !== selectedCategory) {
        setSelectedCategory(category);
        // Reset to page 1 when changing categories
        fetchWallpapers(1, category, false);
        // Scroll back to top
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      }
    },
    [selectedCategory, fetchWallpapers]
  );

  // Handle loading more data when reaching the end of the list
  const handleLoadMore = useCallback(() => {
    if (loadingMore || currentPage >= totalPages) return;
    fetchWallpapers(currentPage + 1, selectedCategory, true);
  }, [fetchWallpapers, currentPage, totalPages, loadingMore, selectedCategory]);

  const downloadWallpaper = useCallback(async (imageUrl, id) => {
    try {
      setDownloading(id);
      const fileName = `wallpaper-${id}-${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        imageUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          // Could use this progress value to show a progress bar
        }
      );

      const { uri } = await downloadResumable.downloadAsync();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(
          "Sharing not available",
          "Sharing is not available on your device"
        );
      }
    } catch (error) {
      Alert.alert("Download Error", "Failed to download wallpaper");
      console.error("Download error:", error);
    } finally {
      setDownloading(null);
    }
  }, []);

  const retryFetch = useCallback(() => {
    fetchWallpapers(1, selectedCategory, false);
  }, [fetchWallpapers, selectedCategory]);

  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.card}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          {item.category && (
            <Text style={styles.category}>{item.category}</Text>
          )}
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <TouchableOpacity
          onPress={() => downloadWallpaper(item.imageUrl, item.id)}
          style={styles.downloadButton}
          disabled={downloading === item.id}
        >
          {downloading === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Download</Text>
          )}
        </TouchableOpacity>
      </View>
    ),
    [downloading, downloadWallpaper]
  );

  const keyExtractor = useCallback(
    (item) => item.id || String(Math.random()),
    []
  );

  // Footer component for FlatList that shows loading indicator when loading more images
  const ListFooterComponent = useCallback(() => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>Loading more wallpapers...</Text>
      </View>
    );
  }, [loadingMore]);

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {loading ? "Loading..." : "No wallpapers available for this category"}
        </Text>
        {!loading && (
          <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [retryFetch, loading]
  );

  // Render category tabs
  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryTab,
            selectedCategory === category && styles.selectedCategoryTab,
          ]}
          onPress={() => handleCategoryPress(category)}
        >
          <Text
            style={[
              styles.categoryTabText,
              selectedCategory === category && styles.selectedCategoryTabText,
            ]}
          >
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const ListHeaderComponent = useCallback(
    () => (
      <View style={styles.headerContainer}>
        <View style={{ flex: 1 }}>
          {/* Navigate Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#007AFF",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
              margin: 15,
            }}
            onPress={() => navigation.navigate("UploadImage")}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
              Upload Image
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          {error
            ? "Using offline wallpapers"
            : "Find the perfect background for your device"}
        </Text>
        {error && (
          <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}

        {/* Category tabs */}
        {renderCategoryTabs()}
      </View>
    ),
    [
      error,
      retryFetch,
      currentPage,
      totalPages,
      categories,
      selectedCategory,
      handleCategoryPress,
    ]
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={wallpapers}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            contentContainerStyle={styles.flatList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={ListEmptyComponent}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={5}
            onRefresh={() => fetchWallpapers(1, selectedCategory, false)}
            refreshing={loading}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
          />
        </View>
        {!error && totalPages > 0 && (
          <Text style={styles.paginationInfo}>
            Page {currentPage} of {totalPages}
          </Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  headerContainer: {
    padding: 15,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  paginationInfo: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  flatList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    height: IMAGE_SIZE,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  infoContainer: {
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  category: {
    fontSize: 14,
    color: "#007AFF",
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  downloadButton: {
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  footerContainer: {
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  categoriesContainer: {
    paddingVertical: 15,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  selectedCategoryTab: {
    backgroundColor: "#007AFF",
  },
  categoryTabText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  selectedCategoryTabText: {
    color: "#fff",
  },
});

export default WallpaperScreen;
