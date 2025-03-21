import React, { useState } from "react";
import {
  View,
  Image,
  Alert,
  TextInput,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { KeyboardAvoidingView, SafeAreaView } from "react-native";

export default function UploadImage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const navigation = useNavigation();

  // Categories
  const categories = [
    "Nature",
    "Abstract",
    "Animals",
    "Technology",
    "Food",
    "Travel",
  ];

  const CLOUDINARY_UPLOAD_URL =
    "https://api.cloudinary.com/v1_1/dvkxffeia/image/upload";
  const CLOUDINARY_UPLOAD_PRESET = "wallpapers_upload";
  const MONGODB_API_ENDPOINT = "http://192.168.1.41:5000/api/images";

  // Function to pick an image
  const pickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Allow access to media library to continue."
      );
      return;
    }

    // Launch Image Picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    } else {
      Alert.alert("No image selected");
    }
  };

  // Convert Image URI to Blob
  const uriToBlob = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  // Upload image to Cloudinary
  const uploadImage = async () => {
    if (!selectedImage || !title.trim() || !category) {
      Alert.alert("Error", "Please complete all fields before uploading.");
      return;
    }

    setUploading(true);

    try {
      const imageBlob = await uriToBlob(selectedImage);

      const formData = new FormData();
      formData.append("file", {
        uri: selectedImage,
        type: "image/jpeg", // Adjust MIME type as necessary
        name: "upload.jpg",
      });
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      console.log("Uploading image to Cloudinary...");

      const cloudinaryResponse = await axios.post(
        CLOUDINARY_UPLOAD_URL,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // console.log("Cloudinary Response:", cloudinaryResponse.data);

      const imageUrl = cloudinaryResponse.data.secure_url;
      const publicId = cloudinaryResponse.data.public_id;

      await axios.post(MONGODB_API_ENDPOINT, {
        title,
        category,
        imageUrl,
        publicId,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Upload Successful!", `Image "${title}" has been uploaded.`);

      setSelectedImage(null);
      setTitle("");
      setCategory("");
    } catch (error) {
      console.error("Upload failed", error.response?.data || error.message);
      Alert.alert(
        "Upload failed",
        error.response?.data?.message || "Check console for details."
      );
    }

    setUploading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>Upload New Image</Text>
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigation.navigate("Wallpaper")}
            >
              <Text style={styles.buttonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
          {/* Image Preview */}
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}

          {/* Image Selection Button */}
          <TouchableOpacity
            style={styles.selectButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>Select Image</Text>
          </TouchableOpacity>

          {/* Title Input */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter image title"
            editable={!uploading}
          />

          {/* Category Selection */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categorySelected,
                ]}
                onPress={() => setCategory(cat)}
                disabled={uploading}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Upload Button */}
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!selectedImage || !title || !category || uploading) &&
                styles.buttonDisabled,
            ]}
            onPress={uploadImage}
            disabled={!selectedImage || !title || !category || uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Upload Image</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    marginTop: 40,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  navButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  previewImage: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    backgroundColor: "#e1e1e1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#ccc",
    borderStyle: "dashed",
  },
  placeholderText: {
    color: "#888888",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  categorySelected: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  categoryText: {
    color: "#555555",
  },
  categoryTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  selectButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#BBBBBB",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
