// app/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../config/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  const register = async (username, email, password) => {
    try {
      setIsLoading(true);
      setError(null);

      // Basic validation
      if (!username || !email || !password) {
        throw new Error("Please fill in all fields");
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      // Password validation (example: at least 6 characters)
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const response = await api.post("/api/auth/register", {
        username,
        email,
        password,
      });

      // Store user data
      const { token, user } = response.data;

      try {
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("userInfo", JSON.stringify(user));
      } catch (storageError) {
        console.error("Failed to save to AsyncStorage:", storageError);
        throw new Error("Failed to save user data");
      }

      // Update state
      setUserToken(token);
      setUserInfo(user);

      return { success: true, user };
    } catch (error) {
      const errorMessage =
        error.message ||
        error.response?.data?.message ||
        "An error occurred during registration";

      setError(errorMessage);
      console.log("Registration error:", error);

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/auth/login", { email, password });
      console.log(response, "response aya");
      setUserToken(response.data.token);
      setUserInfo(response.data.user);

      await AsyncStorage.setItem("token", response.data.token);
      await AsyncStorage.setItem(
        "userInfo",
        JSON.stringify(response.data.user)
      );
    } catch (error) {
      setError(
        error.response?.data?.message || "An error occurred during login"
      );
      console.log("Login error:", error);
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setUserInfo(null);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userInfo");
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let userToken = await AsyncStorage.getItem("token");
      let userInfo = await AsyncStorage.getItem("userInfo");

      // Ensure userInfo is a valid string before parsing
      if (userInfo) {
        try {
          userInfo = JSON.parse(userInfo);
        } catch (error) {
          console.error("Error parsing userInfo:", error);
          userInfo = null; // Set to null if parsing fails
        }
      } else {
        userInfo = null; // If userInfo is null, set it explicitly
      }

      if (userToken) {
        setUserToken(userToken);
        setUserInfo(userInfo);
      }

      setIsLoading(false);
    } catch (e) {
      console.log("isLoggedIn error:", e);
    }
  };

  const isAdmin = () => {
    return userInfo?.role === "admin";
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        register,
        isLoading,
        userToken,
        userInfo,
        error,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
