import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://192.168.1.41:5000/",
  headers: { "Content-Type": "application/json" },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        console.warn("No token found in AsyncStorage");
      } else {
        console.log("Token retrieved:", token);
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error retrieving token:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
