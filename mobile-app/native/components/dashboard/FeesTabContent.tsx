import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { useThemeColors } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { SessionManager } from "../../services/session";
import { FeeInstallment } from "../../types";
import { DashboardHeader } from "../DashboardHeader";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { FONT_FAMILY } from "../../theme/colors";

interface FeesTabContentProps {
  onMenuPress: () => void;
  onNotificationPress: () => void;
}

export const FeesTabContent: React.FC<FeesTabContentProps> = ({
  onMenuPress,
  onNotificationPress,
}) => {
  const colors = useThemeColors();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fees, setFees] = useState<FeeInstallment[]>([]);
  const [payingInstallment, setPayingInstallment] = useState<FeeInstallment | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const fetchFees = async () => {
    try {
      const response = await ApiService.getMyFees();
      if (response.ok) {
        const data = await response.json();
        setFees(data || []);
      }
    } catch (e) {
      console.error("Failed to load fees", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFees();
  };

  const handlePayPress = (installment: FeeInstallment) => {
    setPayingInstallment(installment);
    setPaymentModalVisible(true);
  };

  const executePayment = async () => {
    if (!payingInstallment) return;
    setIsProcessingPayment(true);
    setPaymentModalVisible(false);

    try {
      // Step 1: Create order on backend
      const orderResp = await ApiService.createOrder({
        installment_ids: [payingInstallment.id],
        amount: Math.round(payingInstallment.amount * 100), // convert to paise
      });

      if (!orderResp.ok) {
        Alert.alert("Error", "Order creation failed. Please try again.");
        return;
      }

      const order = await orderResp.json();
      const email = await SessionManager.getEmail();
      const isMock = order.mock_payment === true;

      // Step 2: Launch Razorpay checkout
      const options: any = {
        name: "Vidya School",
        description: `Fee: ${payingInstallment.month} ${payingInstallment.year}`,
        amount: order.amount,
        currency: order.currency || "INR",
        key: order.key_id || "",
        prefill: {
          email: email || "",
          contact: "9999999999",
        },
        theme: { color: "#6750A4" },
        modal: { confirm_close: false, animation: false },
      };

      // Only attach order_id for real (non-mock) payments
      if (!isMock && order.order_id) {
        options.order_id = order.order_id;
      }

      // Step 3: Open Razorpay — callbacks handle success/failure
      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          // Payment success — verify with backend
          try {
            if (isMock) {
              // Mock mode: directly mark as paid
              await ApiService.payFees({
                installment_ids: [payingInstallment.id],
                payment_method: "Razorpay",
              });
            } else {
              // Real mode: verify HMAC signature with backend
              await ApiService.verifyPayment({
                order_id: order.order_id || "",
                payment_id: data.razorpay_payment_id,
                signature: data.razorpay_signature,
                installment_ids: [payingInstallment.id],
                payment_method: "Razorpay",
              });
            }
            Alert.alert("✓ Payment Successful", "Your fee payment has been recorded.");
            fetchFees();
          } catch (e: any) {
            console.error("Post-payment verification failed:", e);
            Alert.alert("Warning", "Payment done but verification failed. Contact admin.");
            fetchFees();
          }
        })
        .catch((error: any) => {
          // Payment cancelled or failed
          const code = error?.code ?? -1;
          const message =
            code === 0
              ? "Payment cancelled."
              : code === 1
              ? "Payment failed. Please try again."
              : code === 2
              ? "Network error. Check your connection."
              : "Payment was not completed.";
          if (code !== 0) {
            // Don't show alert for user-initiated cancellation
            Alert.alert("Payment Failed", message);
          }
        });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong. Please try again.");
    } finally {
      setIsProcessingPayment(false);
      setPayingInstallment(null);
    }
  };

  const viewReceipt = (receiptNo: string | null) => {
    if (receiptNo) {
      router.push(`/feeReceipt/${receiptNo}` as any);
    } else {
      Alert.alert("Error", "Receipt is not available yet.");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return { color: colors.success, bg: colors.success + "15" };
      case "overdue":
        return { color: colors.error, bg: colors.error + "15" };
      default:
        return { color: colors.secondary, bg: colors.outline };
    }
  };

  const renderFeeItem = ({ item }: { item: FeeInstallment }) => {
    const statusInfo = getStatusStyle(item.status);
    const isPaid = item.status.toLowerCase() === "paid";

    return (
      <View
        style={[
          styles.card,
          {
            borderColor: colors.outline,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.monthText, { color: colors.onSurface }]}>
              {item.month} {item.year}
            </Text>
            {item.due_date && (
              <Text style={[styles.dueText, { color: colors.secondary }]}>
                Due on: {new Date(item.due_date).toLocaleDateString()}
              </Text>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.bg },
            ]}
          >
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={[styles.amountRow, { borderTopColor: colors.outline }]}>
          <Text style={[styles.amountLabel, { color: colors.secondary }]}>Amount Due</Text>
          <Text style={[styles.amountValue, { color: colors.onSurface }]}>
            ₹{item.amount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.actions}>
          {isPaid ? (
            <TouchableOpacity
              onPress={() => viewReceipt(item.receipt_no)}
              style={[
                styles.receiptBtn,
                {
                  borderColor: colors.outline,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Feather name="file-text" size={14} color={colors.onSurface} style={styles.btnIcon} />
              <Text style={[styles.receiptBtnText, { color: colors.onSurface }]}>
                View Receipt
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handlePayPress(item)}
              style={[styles.payBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="credit-card" size={14} color={colors.onPrimary} style={styles.btnIcon} />
              <Text style={[styles.payBtnText, { color: colors.onPrimary }]}>Pay Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={fees}
        keyExtractor={(item) => item.id}
        renderItem={renderFeeItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <DashboardHeader
            title="Fees Portal"
            subtitle="School fees & billing statements"
            onMenuPress={onMenuPress}
            onNotificationPress={onNotificationPress}
            style={{ paddingHorizontal: 0, marginBottom: 16 }}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="credit-card" size={32} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>
              No fee records found
            </Text>
          </View>
        }
      />

      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Complete Payment</Text>
            {payingInstallment && (
              <View style={styles.modalDetails}>
                <Text style={[styles.modalLabel, { color: colors.secondary }]}>Installment</Text>
                <Text style={[styles.modalValue, { color: colors.onSurface }]}>
                  {payingInstallment.month} {payingInstallment.year}
                </Text>
                <View style={styles.spacer} />
                <Text style={[styles.modalLabel, { color: colors.secondary }]}>Total Amount</Text>
                <Text style={[styles.modalValueLarge, { color: colors.onSurface }]}>
                  ₹{payingInstallment.amount.toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setPaymentModalVisible(false)}
                disabled={isProcessingPayment}
                style={[styles.modalCancel, { borderColor: colors.outline }]}
              >
                <Text style={{ color: colors.onSurface }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={executePayment}
                disabled={isProcessingPayment}
                style={[styles.modalPay, { backgroundColor: colors.primary }]}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={{ color: colors.onPrimary, fontWeight: "600" }}>Authorize Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  monthText: {
    fontSize: 15,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  dueText: {
    fontSize: 11.5,
    marginTop: 2,

      fontFamily: FONT_FAMILY,

    },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  amountRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 13,

      fontFamily: FONT_FAMILY,

    },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  actions: {
    width: "100%",
  },
  payBtn: {
    height: 38,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  payBtnText: {
    fontSize: 13,
    fontWeight: "600",

      fontFamily: FONT_FAMILY,

    },
  receiptBtn: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  receiptBtnText: {
    fontSize: 13,
    fontWeight: "500",

      fontFamily: FONT_FAMILY,

    },
  btnIcon: {
    marginRight: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,

      fontFamily: FONT_FAMILY,

    },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",

      fontFamily: FONT_FAMILY,

    },
  modalDetails: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 11,
    marginBottom: 2,

      fontFamily: FONT_FAMILY,

    },
  modalValue: {
    fontSize: 14,
    fontWeight: "600",

      fontFamily: FONT_FAMILY,

    },
  modalValueLarge: {
    fontSize: 20,
    fontWeight: "800",

      fontFamily: FONT_FAMILY,

    },
  spacer: {
    height: 12,
  },
  modalActions: {
    flexDirection: "row",
  },
  modalCancel: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  modalPay: {
    flex: 2,
    height: 38,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
});
export default FeesTabContent;
