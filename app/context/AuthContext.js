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

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/auth/login", { email, password });
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

  const register = async (username, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/auth/register", {
        username,
        email,
        password,
      });
      setUserToken(response.data.token);
      setUserInfo(response.data.user);

      await AsyncStorage.setItem("token", response.data.token);
      await AsyncStorage.setItem(
        "userInfo",
        JSON.stringify(response.data.user)
      );
    } catch (error) {
      setError(
        error.response?.data?.message || "An error occurred during registration"
      );
      console.log("Registration error:", error);
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

      if (userInfo) {
        userInfo = JSON.parse(userInfo);
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
