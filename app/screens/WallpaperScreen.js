import React, { useState, useCallback, useEffect } from "react";
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
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

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

const WallpaperScreen = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(null);

  // Fetch wallpapers from API
  const fetchWallpapers = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      // Replace with your actual API endpoint
      const response = await fetch("http://192.168.1.41:5000/api/wallpapers");

      // Check if the response is valid
      if (!response.ok) {
        throw new Error("Failed to fetch wallpapers");
      }

      const data = await response.json();

      // Check if we received valid data
      if (data && Array.isArray(data) && data.length > 0) {
        setWallpapers(data);
      } else {
        // If no valid data, fall back to static wallpapers
        setWallpapers(STATIC_WALLPAPERS);
      }
    } catch (error) {
      console.error("Error fetching wallpapers:", error);
      setError(true);
      // Fall back to static wallpapers on error
      setWallpapers(STATIC_WALLPAPERS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchWallpapers();
  }, [fetchWallpapers]);

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
    fetchWallpapers();
  }, [fetchWallpapers]);

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

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No wallpapers available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    ),
    [retryFetch]
  );

  const ListHeaderComponent = useCallback(
    () => (
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Featured Wallpapers</Text>
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
      </View>
    ),
    [error, retryFetch]
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <FlatList
            data={wallpapers}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            contentContainerStyle={styles.flatList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={ListEmptyComponent}
            ListHeaderComponent={ListHeaderComponent}
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={5}
            onRefresh={fetchWallpapers}
            refreshing={loading}
          />
        </View>
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
});

export default WallpaperScreen;
