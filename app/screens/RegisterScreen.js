import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { AuthContext } from "../context/AuthContext";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const { register, isLoading, error } = useContext(AuthContext);

  // Validate form inputs
  const validateForm = () => {
    const errors = {};

    if (name.trim() === "") errors.name = "Name is required";
    if (email.trim() === "") errors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Enter a valid email";
    if (password.trim() === "") errors.password = "Password is required";
    if (password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (confirmPassword.trim() === "")
      errors.confirmPassword = "Please confirm your password";
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const result = await register(name, email, password);
      if (result.success) {
        // Registration successful - navigate or show success message
        // Navigation is likely handled by the AuthContext already
        // OTP screen
        navigation.navigate("OTP", { email });
      }
    } catch (err) {
      Alert.alert("Registration Failed", "Please try again later.");
    }
  };

  // Display an input field with error handling
  const renderInput = (
    label,
    placeholder,
    value,
    setValue,
    keyboardType = "default",
    secureTextEntry = false,
    errorKey
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, formErrors[errorKey] && styles.inputError]}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={
          keyboardType === "email-address"
            ? "none"
            : label === "Full Name"
            ? "words"
            : "none"
        }
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={(text) => {
          setValue(text);
          if (formErrors[errorKey]) {
            setFormErrors({ ...formErrors, [errorKey]: null });
          }
        }}
      />
      {formErrors[errorKey] && (
        <Text style={styles.errorText}>{formErrors[errorKey]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Create an Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.globalError}>{error}</Text>
              </View>
            )}

            {renderInput(
              "Full Name",
              "Enter your name",
              name,
              setName,
              "default",
              false,
              "name"
            )}
            {renderInput(
              "Email",
              "Enter your email",
              email,
              setEmail,
              "email-address",
              false,
              "email"
            )}
            {renderInput(
              "Password",
              "Enter your password",
              password,
              setPassword,
              "default",
              true,
              "password"
            )}
            {renderInput(
              "Confirm Password",
              "Confirm your password",
              confirmPassword,
              setConfirmPassword,
              "default",
              true,
              "confirmPassword"
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.signupText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  inputError: {
    borderColor: "#ff3b30",
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 14,
    marginTop: 5,
  },
  errorContainer: {
    backgroundColor: "#ffeaea",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  globalError: {
    color: "#ff3b30",
    textAlign: "center",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#0066cc",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#99c2ff",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    color: "#666",
    fontSize: 16,
  },
  signupText: {
    color: "#0066cc",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RegisterScreen;
