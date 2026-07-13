import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "../../theme/ThemeContext";
import { SessionManager } from "../../services/session";
import { DashboardLayout } from "../../components/DashboardLayout";
import { DashboardHeader } from "../../components/DashboardHeader";

export default function AccountsScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  // Basic session details
  const [provider, setProvider] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const initSession = async () => {
    const prov = await SessionManager.getProvider();
    const mail = await SessionManager.getEmail();
    const nm = await SessionManager.getName();
    const avatar = await SessionManager.getAvatarUrl();

    setProvider(prov || "");
    setEmail(mail || "");
    setName(nm || "");
    setAvatarUrl(avatar);
  };

  useEffect(() => {
    initSession();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await initSession();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await SessionManager.clearSession();
    router.replace("/");
  };

  return (
    <DashboardLayout
      role="accounts"
      provider={provider}
      email={email}
      name={name}
      avatarUrl={avatarUrl}
      onThemeChange={async (mode) => {
        await SessionManager.setThemeMode(mode);
        Alert.alert("Success", "Theme setting saved. Please restart app to apply theme change.");
      }}
      onLogout={handleLogout}
      homeContent={(onNotificationPress, onMenuPress, onScroll) => {
        return (
          <ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            contentContainerStyle={styles.scrollContent}
          >
            {/* Welcome greeting */}
            <DashboardHeader
              title="Dashboard"
              subtitle={`Welcome, ${name.split(" ")[0] || "Accounts Officer"}`}
              onMenuPress={onMenuPress}
              onNotificationPress={onNotificationPress}
              style={{ paddingHorizontal: 0, marginBottom: 16 }}
            />

            {/* Invoices List Card */}
            <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Pending Invoices</Text>
              
              <View style={styles.invoiceList}>
                {[
                  { id: "#1024", title: "Invoice #1024", status: "PENDING", amount: "$450" },
                  { id: "#1025", title: "Invoice #1025", status: "PAID", amount: "$1,200" },
                  { id: "#1026", title: "Invoice #1026", status: "OVERDUE", amount: "$300" },
                ].map((item, idx) => {
                  const isPaid = item.status === "PAID";
                  const isOverdue = item.status === "OVERDUE";
                  
                  const statusColor = isPaid
                    ? colors.success
                    : isOverdue
                    ? colors.error
                    : colors.secondary;

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.invoiceItem,
                        { borderBottomColor: idx === 2 ? "transparent" : colors.outline },
                      ]}
                    >
                      <View>
                        <Text style={[styles.itemTitle, { color: colors.onSurface }]}>{item.title}</Text>
                        <Text style={[styles.itemStatus, { color: statusColor }]}>{item.status}</Text>
                      </View>
                      <Text style={[styles.itemAmount, { color: colors.onSurface }]}>{item.amount}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  welcomeRow: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
  },
  greetingSub: {
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16,
  },
  invoiceList: {
    width: "100%",
  },
  invoiceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemStatus: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
});
