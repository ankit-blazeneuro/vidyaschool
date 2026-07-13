import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useThemeColors } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { Feather } from "@expo/vector-icons";
import { FONT_FAMILY } from "../../theme/colors";

export default function FeeReceiptScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { receiptNo } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    const loadReceipt = async () => {
      if (!receiptNo) return;
      setLoading(true);
      setError(null);
      try {
        const response = await ApiService.verifyReceipt(receiptNo as string);
        const data = await response.json();
        if (response.ok && data) {
          setReceipt(data);
        } else {
          setError("Receipt not found");
        }
      } catch (e) {
        setError("Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [receiptNo]);

  const renderReceiptRow = (label: string, value: string) => {
    return (
      <View style={[styles.infoRow, { borderBottomColor: colors.outline }]}>
        <Text style={[styles.infoLabel, { color: colors.secondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.onSurface }]}>{value || "—"}</Text>
      </View>
    );
  };

  const getFormattedClass = () => {
    if (!receipt) return "N/A";
    const cls = receipt.class;
    const sec = receipt.section;
    if (cls) {
      const clsPrefix = cls === "Nursery" || cls === "KG" ? "" : "Class ";
      return `${clsPrefix}${cls}${sec ? ` - ${sec}` : ""}`;
    }
    return "N/A";
  };

  const getFormattedAmount = () => {
    if (!receipt) return "—";
    const amt = receipt.amount;
    return `₹${Number(amt).toLocaleString()}`;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Bar Header */}
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Fee Receipt</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Text style={[styles.errorDesc, { color: colors.secondary }]}>
            This receipt link is invalid or does not exist.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Verified green banner */}
          <View style={[styles.verifiedBanner, { backgroundColor: "#10B98115", borderColor: "#10B98130" }]}>
            <Text style={styles.verifiedIcon}>✅</Text>
            <View>
              <Text style={styles.verifiedTitle}>Payment Verified</Text>
              <Text style={[styles.verifiedSub, { color: colors.secondary }]}>
                Vidya School — Official Fee Receipt
              </Text>
            </View>
          </View>

          {/* Details Card */}
          <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
            {renderReceiptRow("Receipt No.", receipt.receipt_no)}
            {renderReceiptRow("Student Name", receipt.student_name)}
            {renderReceiptRow("Admission No.", receipt.admission_number)}
            {renderReceiptRow("Class", getFormattedClass())}
            {renderReceiptRow("Month", `${receipt.month} ${receipt.year}`)}
            {renderReceiptRow("Amount Paid", getFormattedAmount())}
            {renderReceiptRow("Paid On", receipt.paid_date)}
            {renderReceiptRow("Payment Mode", receipt.payment_method)}
          </View>

          {/* Verification Footer Note */}
          <Text style={[styles.footerText, { color: colors.secondary }]}>
            This receipt has been verified against the Vidya School database. No physical signature required.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  placeholder: {
    width: 36,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,

      fontFamily: FONT_FAMILY,

    },
  errorText: {
    fontSize: 15,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  errorDesc: {
    fontSize: 12,
    marginTop: 4,

      fontFamily: FONT_FAMILY,

    },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  verifiedBanner: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 16,
  },
  verifiedIcon: {
    fontSize: 22,
    marginRight: 10,

      fontFamily: FONT_FAMILY,

    },
  verifiedTitle: {
    color: "#10B981",
    fontSize: 15,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  verifiedSub: {
    fontSize: 11,
    marginTop: 2,

      fontFamily: FONT_FAMILY,

    },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13,

      fontFamily: FONT_FAMILY,

    },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",

      fontFamily: FONT_FAMILY,

    },
  footerText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: 12,

      fontFamily: FONT_FAMILY,

    },
});
