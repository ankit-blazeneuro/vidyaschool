import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
} from "react-native";
import { useThemeColors } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { SessionManager } from "../../services/session";
import { Input } from "../CustomTextField";
import { Select, SelectOption } from "../Select";
import { PrimaryButton } from "../PrimaryButton";
import { SecondaryButton } from "../SecondaryButton";

interface StudentOnboardingDrawerProps {
  email: string;
  sessionToken: string;
  onComplete: (username: string, newClass: string | null) => void;
}

const CLASS_OPTIONS: SelectOption[] = [
  { value: "Nursery", label: "Nursery" },
  { value: "KG", label: "KG" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Class ${i + 1}`,
  })),
];

const SECTION_OPTIONS: SelectOption[] = ["A", "B", "C", "D", "E"].map((s) => ({
  value: s,
  label: s,
}));

const TRANSPORT_OPTIONS: SelectOption[] = [
  { value: "walking", label: "Walking" },
  { value: "transport", label: "School Transport" },
];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export const StudentOnboardingDrawer: React.FC<StudentOnboardingDrawerProps> = ({
  email,
  sessionToken,
  onComplete,
}) => {
  const colors = useThemeColors();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [section, setSection] = useState("");
  const [transportMode, setTransportMode] = useState("walking");

  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  const [username, setUsername] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const validateCurrentStep = (): boolean => {
    switch (step) {
      case 1:
        if (!admissionNumber.trim()) {
          Alert.alert("Error", "Please enter your Admission Number");
          return false;
        }
        if (!phoneNumber.trim()) {
          Alert.alert("Error", "Please enter your Phone Number");
          return false;
        }
        if (!studentClass || !section) {
          Alert.alert("Error", "Please select your class and section");
          return false;
        }
        return true;
      case 2:
        if (!parentName.trim() || !parentPhone.trim()) {
          Alert.alert("Error", "Please fill in parent/guardian contact details");
          return false;
        }
        return true;
      case 3:
        if (!username.trim()) {
          Alert.alert("Error", "Please choose a username");
          return false;
        }
        if (username.length < 3) {
          Alert.alert("Error", "Username must be at least 3 characters long");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((s) => s + 1);
    }
  };

  const handleSubmit = async () => {
    if (!address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      Alert.alert("Error", "Please complete your address details");
      return;
    }
    if (pincode.trim().length !== 6 || isNaN(Number(pincode.trim()))) {
      Alert.alert("Error", "Pincode must be a 6-digit number");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.submitOnboarding({
        admissionNumber: admissionNumber.trim().toUpperCase(),
        username: username.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentEmail: parentEmail.trim().length > 0 ? parentEmail.trim() : null,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        class: studentClass,
        section,
        transportMode,
      });
      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert("Success", "Profile onboarding completed successfully!");
        await SessionManager.updateOnboardingData(username.trim().toLowerCase(), studentClass);
        onComplete(username.trim().toLowerCase(), studentClass);
      } else {
        throw new Error(data.message || "Failed to complete onboarding");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <View style={[styles.drawerContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.handle, { backgroundColor: colors.outline }]} />
            
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: colors.onSurface }]}>
                  Complete Onboarding
                </Text>
                <Text style={[styles.subtitle, { color: colors.secondary }]}>
                  Set up your student profile to continue
                </Text>
              </View>
              <Text style={[styles.stepText, { color: colors.primary }]}>
                Step {step} of 4
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressTrack, { backgroundColor: colors.outline }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: colors.primary,
                    width: `${(step / 4) * 100}%`,
                  },
                ]}
              />
            </View>

            {/* Scrollable Form Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {step === 1 && (
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Academic details</Text>
                  <Input
                    value={admissionNumber}
                    onValueChange={setAdmissionNumber}
                    placeholder="e.g. 2024/STU/102"
                    label="Admission Number"
                    autoCapitalize="characters"
                  />
                  <Input
                    value={phoneNumber}
                    onValueChange={setPhoneNumber}
                    placeholder="e.g. 9876543210"
                    label="Phone Number"
                    keyboardType="phone-pad"
                  />
                  <Select
                    selectedValue={studentClass}
                    onValueChange={setStudentClass}
                    options={CLASS_OPTIONS}
                    label="Assigned Class"
                    placeholder="e.g. Class 10"
                  />
                  <Select
                    selectedValue={section}
                    onValueChange={setSection}
                    options={SECTION_OPTIONS}
                    label="Section"
                    placeholder="e.g. A"
                  />
                  <Select
                    selectedValue={transportMode}
                    onValueChange={setTransportMode}
                    options={TRANSPORT_OPTIONS}
                    label="Mode of Commute"
                    placeholder="e.g. Walking or School Transport"
                  />
                </View>
              )}

              {step === 2 && (
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Parent / Guardian details</Text>
                  <Input
                    value={parentName}
                    onValueChange={setParentName}
                    placeholder="e.g. Rajesh Kumar"
                    label="Parent Name"
                    autoCapitalize="words"
                  />
                  <Input
                    value={parentPhone}
                    onValueChange={setParentPhone}
                    placeholder="e.g. 9876543210"
                    label="Parent Phone Number"
                    keyboardType="phone-pad"
                  />
                  <Input
                    value={parentEmail}
                    onValueChange={setParentEmail}
                    placeholder="e.g. parent@email.com (optional)"
                    label="Parent Email"
                    keyboardType="email-address"
                  />
                </View>
              )}

              {step === 3 && (
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Account identity</Text>
                  <Input
                    value={username}
                    onValueChange={(txt) => setUsername(txt.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="e.g. student_name"
                    label="Username"
                  />
                  <Text style={[styles.helpText, { color: colors.secondary }]}>
                    Choose a unique handle. Only lowercase letters, numbers, and underscores.
                  </Text>
                  
                  <View style={[styles.infoBox, { backgroundColor: colors.outline }]}>
                    <Text style={[styles.infoBoxText, { color: colors.onSurface }]}>
                      Registered email: {email}
                    </Text>
                    <Text style={[styles.infoBoxText, { color: colors.onSurface, marginTop: 4 }]}>
                      Your role: Student
                    </Text>
                  </View>
                </View>
              )}

              {step === 4 && (
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Contact & Mailing address</Text>
                  <Input
                    value={address}
                    onValueChange={setAddress}
                    placeholder="e.g. 42 MG Road, Block B"
                    label="Street Address"
                  />
                  <Input
                    value={city}
                    onValueChange={setCity}
                    placeholder="e.g. Delhi"
                    label="City"
                  />
                  <Input
                    value={state}
                    onValueChange={setState}
                    placeholder="e.g. Delhi"
                    label="State"
                  />
                  <Input
                    value={pincode}
                    onValueChange={setPincode}
                    placeholder="e.g. 110001"
                    label="Pincode"
                    keyboardType="numeric"
                  />
                </View>
              )}
            </ScrollView>

            {/* Actions Footer */}
            <View style={styles.footer}>
              {step > 1 ? (
                <SecondaryButton
                  text="Back"
                  onPress={() => setStep((s) => s - 1)}
                  style={styles.backBtn}
                />
              ) : (
                <View style={styles.backPlaceholder} />
              )}

              {step < 4 ? (
                <PrimaryButton text="Next" onPress={handleNext} style={styles.nextBtn} />
              ) : (
                <PrimaryButton
                  text="Complete"
                  onPress={handleSubmit}
                  loading={isLoading}
                  style={styles.nextBtn}
                />
              )}
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
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  keyboardContainer: {
    width: "100%",
  },
  drawerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 24,
    height: SCREEN_HEIGHT * 0.88,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  stepText: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    width: "100%",
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 16,
  },
  helpText: {
    fontSize: 11.5,
    marginTop: -4,
    marginBottom: 16,
    lineHeight: 16,
  },
  infoBox: {
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoBoxText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  backBtn: {
    flex: 1,
    marginRight: 8,
  },
  backPlaceholder: {
    flex: 1,
  },
  nextBtn: {
    flex: 1,
    marginLeft: 8,
  },
});
export default StudentOnboardingDrawer;
