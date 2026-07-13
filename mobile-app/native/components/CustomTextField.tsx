import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useThemeColors } from "../theme/ThemeContext";
import { Feather } from "@expo/vector-icons";

interface CustomTextFieldProps {
  value: string;
  onValueChange: (text: string) => void;
  placeholder: string;
  label?: string | null;
  isPassword?: boolean;
  readOnly?: boolean;
  trailingIcon?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  onClick?: (() => void) | null;
  style?: any;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

export const CustomTextField: React.FC<CustomTextFieldProps> = ({
  value,
  onValueChange,
  placeholder,
  label = null,
  isPassword = false,
  readOnly = false,
  trailingIcon,
  leadingIcon,
  onClick = null,
  style,
  keyboardType = "default",
  autoCapitalize = "none",
}) => {
  const colors = useThemeColors();
  const [secureText, setSecureText] = useState(isPassword);

  const handlePress = () => {
    if (onClick) {
      onClick();
    }
  };

  const wrapperStyle = [
    styles.inputWrapper,
    {
      borderColor: colors.outline,
      backgroundColor: colors.surface,
    },
  ];

  const inner = (
    <>
      {leadingIcon && <View style={styles.leadingIcon}>{leadingIcon}</View>}
      <TextInput
        value={value}
        onChangeText={onValueChange}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        secureTextEntry={secureText}
        editable={!readOnly && !onClick}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, { color: colors.onSurface }]}
      />
      {isPassword && (
        <TouchableOpacity
          onPress={() => setSecureText(!secureText)}
          style={styles.eyeIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather
            name={secureText ? "eye-off" : "eye"}
            size={20}
            color={colors.secondary}
          />
        </TouchableOpacity>
      )}
      {!isPassword && trailingIcon && (
        <View style={styles.trailingIcon}>{trailingIcon}</View>
      )}
    </>
  );

  const content = (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>}
      {onClick ? (
        <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={wrapperStyle}>
          {inner}
        </TouchableOpacity>
      ) : (
        <View style={wrapperStyle}>
          {inner}
        </View>
      )}
    </View>
  );

  return content;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  inputWrapper: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  leadingIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: "100%",
    padding: 0, // Reset default padding
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 4,
  },
  trailingIcon: {
    marginLeft: 8,
  },
});
export default CustomTextField;
export const Input = CustomTextField; // Also export as Input for shadcn compatibility
