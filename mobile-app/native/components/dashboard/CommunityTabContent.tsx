import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useThemeColors } from "../../theme/ThemeContext";
import { SessionManager } from "../../services/session";
import { DashboardHeader } from "../DashboardHeader";
import { Feather } from "@expo/vector-icons";

interface Message {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    senderName: "Principal Sharma",
    senderRole: "admin",
    content: "Welcome to the Vidya School general community hub.",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "2",
    senderName: "HOD Mathematics",
    senderRole: "teacher",
    content: "The syllabus details for Class 10 board exams have been updated in the files section.",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: "3",
    senderName: "Accounts Dept",
    senderRole: "accounts",
    content: "Quarter 2 fee installments are now active. Receipts will be auto-generated upon Razorpay authorization.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

interface CommunityTabContentProps {
  onMenuPress: () => void;
  onNotificationPress: () => void;
}

export const CommunityTabContent: React.FC<CommunityTabContentProps> = ({
  onMenuPress,
  onNotificationPress,
}) => {
  const colors = useThemeColors();
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    SessionManager.getName().then((val) => setUserName(val || "Faculty"));
    SessionManager.getRole().then((val) => setUserRole(val || "teacher"));

    // Simulate community activity
    const typingTimer = setTimeout(() => {
      setIsTyping(true);
      const msgTimer = setTimeout(() => {
        setIsTyping(false);
        const reply: Message = {
          id: String(Date.now() + 1),
          senderName: "Admin Assistant",
          senderRole: "admin",
          content: "Hello everyone! Just a reminder that parent-teacher meetings start tomorrow at 9 AM.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, reply]);
      }, 3000);
      return () => clearTimeout(msgTimer);
    }, 8000);

    return () => clearTimeout(typingTimer);
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: String(Date.now()),
      senderName: userName,
      senderRole: userRole,
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Auto scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleLongPress = (msg: Message) => {
    if (msg.senderName !== userName) return;

    Alert.alert("Manage Message", "Do you want to delete this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        },
      },
    ]);
  };

  const formatTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.senderName === userName;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => handleLongPress(item)}
        style={[
          styles.msgContainer,
          isMe ? styles.myMsgContainer : styles.otherMsgContainer,
        ]}
      >
        {!isMe && (
          <View style={styles.senderHeader}>
            <Text style={[styles.senderName, { color: colors.onSurface }]}>
              {item.senderName}
            </Text>
            <View
              style={[
                styles.roleBadge,
                {
                  borderColor: colors.outline,
                  backgroundColor: colors.outline,
                },
              ]}
            >
              <Text style={[styles.roleBadgeText, { color: colors.onSurface }]}>
                {item.senderRole.toUpperCase()}
              </Text>
            </View>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isMe ? colors.primary : colors.surface,
              borderColor: colors.outline,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isMe ? colors.onPrimary : colors.onSurface },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.timeText,
              { color: isMe ? colors.onPrimary + "CC" : colors.secondary },
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <DashboardHeader
            title="Community"
            subtitle="General school announcements"
            onMenuPress={onMenuPress}
            onNotificationPress={onNotificationPress}
            style={{ paddingHorizontal: 0, marginBottom: 16 }}
          />
        }
      />

      {isTyping && (
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color={colors.secondary} style={styles.spinner} />
          <Text style={[styles.typingText, { color: colors.secondary }]}>
            Someone is typing...
          </Text>
        </View>
      )}

      <View style={[styles.inputRow, { borderTopColor: colors.outline, backgroundColor: colors.background }]}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Send a message..."
          placeholderTextColor={colors.secondary}
          style={[
            styles.input,
            {
              color: colors.onSurface,
              borderColor: colors.outline,
              backgroundColor: colors.surface,
            },
          ]}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="send" size={16} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 84,
  },
  msgContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  myMsgContainer: {
    alignSelf: "flex-end",
  },
  otherMsgContainer: {
    alignSelf: "flex-start",
  },
  senderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: "600",
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  roleBadgeText: {
    fontSize: 7.5,
    fontWeight: "700",
  },
  bubble: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 9,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  spinner: {
    marginRight: 6,
  },
  typingText: {
    fontSize: 11.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    marginBottom: 60,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
export default CommunityTabContent;
