import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useThemeColors } from "../../theme/ThemeContext";
import { Select, SelectOption } from "../Select";
import { Input } from "../CustomTextField";
import { PrimaryButton } from "../PrimaryButton";
import { SecondaryButton } from "../SecondaryButton";

interface ComplaintDialogProps {
  visible: boolean;
  onClose: () => void;
}

const DEPARTMENTS: SelectOption[] = [
  { value: "principal", label: "Principal Office" },
  { value: "it_support", label: "IT Support" },
  { value: "coordinator", label: "Academic Coordinator" },
];

export const ComplaintDialog: React.FC<ComplaintDialogProps> = ({
  visible,
  onClose,
}) => {
  const colors = useThemeColors();
  const [department, setDepartment] = useState("principal");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !details.trim()) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }

    const ticketId = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    Alert.alert(
      "Success",
      `Complaint submitted successfully!\nTicket ID: ${ticketId}`,
      [{ text: "OK", onPress: handleClose }]
    );
  };

  const handleClose = () => {
    setTitle("");
    setDetails("");
    setDepartment("principal");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.dialogContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.outline,
              },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: colors.onSurface }]}>
              File a Complaint
            </Text>
            
            <View style={styles.form}>
              <Select
                selectedValue={department}
                onValueChange={setDepartment}
                options={DEPARTMENTS}
                label="Select Department"
                style={styles.field}
              />

              <Input
                value={title}
                onValueChange={setTitle}
                placeholder="Summarize the issue..."
                label="Title"
                style={styles.field}
              />

              <Input
                value={details}
                onValueChange={setDetails}
                placeholder="Describe the issue in detail..."
                label="Details"
                style={styles.field}
              />
            </View>

            <View style={styles.actions}>
              <SecondaryButton
                text="Cancel"
                onPress={handleClose}
                style={styles.cancelBtn}
              />
              <PrimaryButton
                text="Submit"
                onPress={handleSubmit}
                style={styles.submitBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  keyboardContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dialogContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  form: {
    marginBottom: 20,
  },
  field: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    flex: 1,
    marginRight: 8,
  },
  submitBtn: {
    flex: 1,
    marginLeft: 8,
  },
});
export default ComplaintDialog;
export const ComplaintDialogModal = ComplaintDialog;
