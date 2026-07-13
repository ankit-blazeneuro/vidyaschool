import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useThemeColors } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { SearchUserResponse, SearchBackendResponse } from "../../types";
import { SearchResultRow } from "../SearchResultRow";
import { Feather } from "@expo/vector-icons";
import { FONT_FAMILY } from "../../theme/colors";

interface SearchTabContentProps {
  onTabSelect: (tab: string) => void;
  onDocSelect: (path: string, fallbackText: string) => void;
  onShowLibrary?: () => void;
}

interface HelpDoc {
  title: string;
  category: string;
  content: string;
  url?: string;
}

const DEFAULT_DOCS: HelpDoc[] = [
  {
    title: "Library Policies & Fines",
    category: "Library",
    content: "Books can be issued for 14 days. Up to 3 renewals are allowed. Overdue fines are charged at ₹5/day.",
    url: "/docs/student/library",
  },
  {
    title: "Late Fee Structure & Penalty",
    category: "Fees",
    content: "Fees must be paid by the 10th of every month. A late fine of ₹100 is charged from the 11th to the 20th. Beyond the 20th, ₹250 is charged.",
    url: "/docs/student/fees",
  },
  {
    title: "How to Post in Community",
    category: "Social",
    content: "Open the Community tab from the bottom bar. Type your message and tap Send. Keep communication professional.",
    url: "/docs/student/complaints",
  },
];

export const SearchTabContent: React.FC<SearchTabContentProps> = ({
  onTabSelect,
  onDocSelect,
  onShowLibrary,
}) => {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  
  // Results states
  const [userResults, setUserResults] = useState<SearchUserResponse[]>([]);
  const [backendResults, setBackendResults] = useState<SearchBackendResponse[]>([]);

  // Dialog overlays states
  const [selectedUser, setSelectedUser] = useState<SearchUserResponse | null>(null);

  // Debounced search trigger
  useEffect(() => {
    if (!searchQuery.trim()) {
      setUserResults([]);
      setBackendResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Fetch matching users
        const usersResp = await ApiService.searchUsers(searchQuery);
        if (usersResp.ok) {
          const usersData = await usersResp.json();
          setUserResults(usersData || []);
        }

        // Fetch matching backend pages/docs
        const searchResp = await ApiService.searchBackend(searchQuery, "student", "");
        if (searchResp.ok) {
          const searchData = await searchResp.json();
          setBackendResults(searchData || []);
        }
      } catch (e) {
        console.error("Search error", e);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Static list of pages/actions
  const staticPages = [
    { name: "Home Dashboard", tabKey: "home", desc: "Access stats, slider updates & shortcuts", icon: "home" },
    { name: "Notice Board", tabKey: "notice", desc: "Read school announcements and notice feed", icon: "info" },
    { name: "Pay Fees Online", tabKey: "fees", desc: "Manage dues, verify receipts & pay via Razorpay", icon: "credit-card" },
    { name: "Library Hub", tabKey: "library", desc: "Browse catalog, issue details & book returns", icon: "book", isExternal: true },
    { name: "My Profile Settings", tabKey: "profile", desc: "Control theme preferences & view session logs", icon: "person" },
  ];

  const handlePagePress = (item: typeof staticPages[0]) => {
    if (item.isExternal && onShowLibrary) {
      onShowLibrary();
    } else {
      onTabSelect(item.tabKey);
    }
  };

  const handleDocPress = (doc: HelpDoc) => {
    const targetUrl = doc.url || "/docs/student/onboarding";
    onDocSelect(targetUrl, doc.content);
  };

  const filteredPages = searchQuery.trim()
    ? backendResults
        .filter((r) => !r.url.includes("/docs/"))
        .map((r) => ({
          name: r.title,
          desc: r.content,
          tabKey: r.url.endsWith("/fees") ? "fees" : r.url.endsWith("/notice") ? "notice" : "home",
          icon: r.url.includes("/fees") ? "credit-card" : "info",
          isExternal: false,
        }))
    : staticPages;

  const filteredDocs = searchQuery.trim()
    ? backendResults
        .filter((r) => r.url.includes("/docs/"))
        .map((r) => ({
          title: r.title,
          category: "Docs",
          content: r.content,
          url: r.url,
        }))
    : DEFAULT_DOCS;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input Box */}
      <View
        style={[
          styles.searchWrapper,
          {
            borderColor: colors.outline,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Feather name="search" size={16} color={colors.secondary} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search pages, users, docs..."
          placeholderTextColor={colors.secondary}
          style={[styles.input, { color: colors.onSurface }]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
            <Feather name="x" size={16} color={colors.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {["All", "Pages", "Users", "Docs"].map((filter) => {
          const isSelected = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? colors.primary : "transparent",
                  borderColor: isSelected ? "transparent" : colors.outline,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: isSelected ? colors.onPrimary : colors.onSurface,
                    fontWeight: isSelected ? "600" : "400",
                  },
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 1. Pages & Features */}
          {(activeFilter === "All" || activeFilter === "Pages") && filteredPages.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupHeader, { color: colors.secondary }]}>PAGES & FEATURES</Text>
              {filteredPages.map((item, idx) => (
                <SearchResultRow
                  key={idx}
                  title={item.name}
                  subtitle={item.desc}
                  iconName={item.icon}
                  category="Page"
                  onPress={() => handlePagePress(item as any)}
                />
              ))}
            </View>
          )}

          {/* 2. Users Section */}
          {(activeFilter === "All" || activeFilter === "Users") && userResults.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupHeader, { color: colors.secondary }]}>
                USERS ({userResults.length})
              </Text>
              {userResults.map((user, idx) => (
                <SearchResultRow
                  key={idx}
                  title={user.name}
                  subtitle={`@${user.username}`}
                  iconName="person"
                  category={user.role}
                  onPress={() => setSelectedUser(user)}
                />
              ))}
            </View>
          )}

          {/* 3. Documentation Section */}
          {(activeFilter === "All" || activeFilter === "Docs") && filteredDocs.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupHeader, { color: colors.secondary }]}>DOCUMENTATION & HELP</Text>
              {filteredDocs.map((doc, idx) => (
                <SearchResultRow
                  key={idx}
                  title={doc.title}
                  subtitle={doc.content}
                  iconName="info"
                  category={doc.category}
                  onPress={() => handleDocPress(doc)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* User Details Modal Dialog */}
      <Modal
        visible={selectedUser !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            {selectedUser && (
              <View style={styles.modalBody}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.outline }]}>
                  <Text style={[styles.avatarText, { color: colors.onSurface }]}>
                    {(selectedUser.name || "?").substring(0, 1).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.modalName, { color: colors.onSurface }]}>{selectedUser.name}</Text>
                <Text style={[styles.modalUsername, { color: colors.secondary }]}>@{selectedUser.username}</Text>
                
                <View style={[styles.separator, { backgroundColor: colors.outline }]} />
                
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.secondary }]}>Institution Role</Text>
                  <Text style={[styles.infoValue, { color: colors.primary }]}>
                    {selectedUser.role.toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.secondary }]}>Session Authority</Text>
                  <Text style={[styles.infoValue, { color: colors.success }]}>Verified Member</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setSelectedUser(null)}
              style={[styles.closeModalBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
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
  searchWrapper: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    padding: 0,

      fontFamily: FONT_FAMILY,

    },
  clearBtn: {
    padding: 4,
  },
  filterRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  pillText: {
    fontSize: 12,

      fontFamily: FONT_FAMILY,

    },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  group: {
    marginTop: 16,
  },
  groupHeader: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.5,

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
    alignItems: "center",
  },
  modalBody: {
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  modalName: {
    fontSize: 18,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  modalUsername: {
    fontSize: 13,
    marginTop: 2,

      fontFamily: FONT_FAMILY,

    },
  separator: {
    height: 1,
    width: "100%",
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
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
  closeModalBtn: {
    width: "100%",
    height: 38,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
export default SearchTabContent;
