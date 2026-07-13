import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "../theme/ThemeContext";
import { ApiService } from "../services/api";
import { StudentBorrowingResponse } from "../types";
import { Feather } from "@expo/vector-icons";
import { FONT_FAMILY } from "../theme/colors";

export default function LibraryHubScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [books, setBooks] = useState<StudentBorrowingResponse[]>([]);

  const fetchBooks = async () => {
    try {
      const response = await ApiService.getStudentBorrowings();
      if (response.ok) {
        const data = await response.json();
        setBooks(data || []);
      }
    } catch (e) {
      console.error("Failed to load library borrowings", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
  };

  const handleRenew = async (id: string) => {
    try {
      const response = await ApiService.renewBook({ id });
      if (response.ok) {
        Alert.alert("Success", "Book renewed successfully");
        fetchBooks();
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Failed to renew book");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong.");
    }
  };

  const formatIsoDate = (isoStr: string): string => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  const renderBookItem = ({ item }: { item: StudentBorrowingResponse }) => {
    const renewalsLeft = 3 - item.renewalsCount;
    const isOverdue = item.status === "overdue";

    return (
      <View
        style={[
          styles.bookCard,
          {
            borderColor: colors.outline,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={styles.bookRow}>
          {/* Avatar initial */}
          <View style={[styles.bookIconCircle, { backgroundColor: colors.outline }]}>
            <Text style={[styles.bookIconText, { color: colors.onSurface }]}>
              {item.title.substring(0, 1).toUpperCase()}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.bookDetails}>
            <Text style={[styles.bookTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.bookAuthor, { color: colors.secondary }]} numberOfLines={1}>
              {item.author}
            </Text>

            <View style={styles.statusMeta}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isOverdue ? "#EF444415" : colors.outline,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: isOverdue ? colors.error : colors.secondary,
                      fontWeight: isOverdue ? "700" : "500",
                    },
                  ]}
                >
                  {isOverdue ? "Overdue" : "Due"} {formatIsoDate(item.dueDate)}
                </Text>
              </View>

              {/* Pips tracker */}
              <View style={styles.pipsRow}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.pip,
                      {
                        backgroundColor:
                          idx < item.renewalsCount
                            ? colors.secondary + "40"
                            : colors.secondary,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.renewCountText, { color: colors.secondary }]}>
                {renewalsLeft} left
              </Text>
            </View>
          </View>

          {/* Action button */}
          {renewalsLeft > 0 ? (
            <TouchableOpacity
              onPress={() => handleRenew(item.id)}
              style={[
                styles.renewBtn,
                {
                  borderColor: colors.outline,
                },
              ]}
            >
              <Text style={[styles.renewBtnText, { color: colors.onSurface }]}>Renew</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.maxBadge, { backgroundColor: colors.outline }]}>
              <Text style={[styles.maxBadgeText, { color: colors.secondary }]}>Max</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Library Hub</Text>
          <Text style={[styles.headerSub, { color: colors.secondary }]}>
            {books.length} books issued
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={renderBookItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="book-open" size={32} color={colors.secondary} />
              <Text style={[styles.emptyText, { color: colors.secondary }]}>
                No books currently issued
              </Text>
            </View>
          }
        />
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
  headerText: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  headerSub: {
    fontSize: 11,
    marginTop: 2,

      fontFamily: FONT_FAMILY,

    },
  placeholder: {
    width: 36,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  bookCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  bookRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  bookIconText: {
    fontSize: 22,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  bookDetails: {
    marginLeft: 14,
    flex: 1,
    marginRight: 8,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "600",

      fontFamily: FONT_FAMILY,

    },
  bookAuthor: {
    fontSize: 11,
    marginTop: 2,

      fontFamily: FONT_FAMILY,

    },
  statusMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 10,

      fontFamily: FONT_FAMILY,

    },
  pipsRow: {
    flexDirection: "row",
    marginRight: 8,
  },
  pip: {
    width: 10,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1.5,
  },
  renewCountText: {
    fontSize: 10,

      fontFamily: FONT_FAMILY,

    },
  renewBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  renewBtnText: {
    fontSize: 12,
    fontWeight: "500",

      fontFamily: FONT_FAMILY,

    },
  maxBadge: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  maxBadgeText: {
    fontSize: 12,
    fontWeight: "500",

      fontFamily: FONT_FAMILY,

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
});
