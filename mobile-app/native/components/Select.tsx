import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { useThemeColors } from "../theme/ThemeContext";
import { Feather } from "@expo/vector-icons";
import { FONT_FAMILY } from "../theme/colors";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  label?: string | null;
  placeholder?: string;
  style?: any;
}

export const Select: React.FC<SelectProps> = ({
  selectedValue,
  onValueChange,
  options,
  label = null,
  placeholder = "Select an option",
  style,
}) => {
  const colors = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>}
      
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[
          styles.button,
          {
            borderColor: colors.outline,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            { color: selectedOption ? colors.onSurface : colors.secondary },
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.secondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismiss}
            onPress={() => setModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.outline }]} />
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
              {label || "Select Option"}
            </Text>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: colors.outline }]} />
              )}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.value)}
                    style={styles.optionItem}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: colors.onSurface,
                          fontWeight: isSelected ? "600" : "400",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
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

      fontFamily: FONT_FAMILY,

    },
  button: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 14,

      fontFamily: FONT_FAMILY,

    },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 24,
    maxHeight: "60%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,

      fontFamily: FONT_FAMILY,

    },
  listContent: {
    paddingBottom: 24,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 15,

      fontFamily: FONT_FAMILY,

    },
  separator: {
    height: 1,
    width: "100%",
  },
});
export default Select;
export { SelectProps };
export const SelectOptionClass = Select;
export const SelectOptionRow = Select;
export const SelectRow = Select;
