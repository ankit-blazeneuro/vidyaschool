import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useThemeColors } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { FONT_FAMILY } from "../../theme/colors";

interface DocViewerScreenProps {
  path: string;
  fallbackContent?: string | null;
  onBack: () => void;
}

export const DocViewerScreen: React.FC<DocViewerScreenProps> = ({
  path,
  fallbackContent,
  onBack,
}) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<{ title: string; markdown: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ApiService.getDocMarkdown(path);
        const data = await response.json();
        if (response.ok && data.markdown) {
          setDoc(data);
        } else {
          throw new Error("Failed to load documentation");
        }
      } catch (e: any) {
        if (fallbackContent) {
          setDoc({
            title: path.split("/").pop() || "Documentation",
            markdown: fallbackContent,
          });
        } else {
          setError(e.message || "Failed to load documentation");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [path, fallbackContent]);

  // A simple markdown renderer
  const renderMarkdown = (markdown: string) => {
    const lines = markdown.split("\n");
    return lines.map((line, index) => {
      if (line.startsWith("# ")) {
        return (
          <Text
            key={index}
            style={[styles.h1, { color: colors.onSurface, borderBottomColor: colors.outline }]}
          >
            {line.replace("# ", "")}
          </Text>
        );
      } else if (line.startsWith("## ")) {
        return (
          <Text key={index} style={[styles.h2, { color: colors.onSurface }]}>
            {line.replace("## ", "")}
          </Text>
        );
      } else if (line.startsWith("### ")) {
        return (
          <Text key={index} style={[styles.h3, { color: colors.onSurface }]}>
            {line.replace("### ", "")}
          </Text>
        );
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        const content = line.substring(2);
        return (
          <View key={index} style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: colors.onSurface }]}>•</Text>
            <Text style={[styles.bulletText, { color: colors.onSurface }]}>
              {parseInlineStyles(content)}
            </Text>
          </View>
        );
      } else if (line.trim() === "") {
        return <View key={index} style={styles.space} />;
      } else {
        return (
          <Text key={index} style={[styles.paragraph, { color: colors.onSurface }]}>
            {parseInlineStyles(line)}
          </Text>
        );
      }
    });
  };

  // Helper to parse bold (**text**)
  const parseInlineStyles = (text: string) => {
    const parts = text.split("(\\*\\*|\\*\\*)"); // Regex splits on **
    const elements: React.ReactNode[] = [];
    let isBold = false;

    // A simple parser for bold text (**bold**)
    let tempText = text;
    let boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    let keyIdx = 0;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add normal text before match
      if (match.index > lastIndex) {
        elements.push(
          <Text key={`normal-${keyIdx++}`}>
            {text.substring(lastIndex, match.index)}
          </Text>
        );
      }
      // Add bold text
      elements.push(
        <Text key={`bold-${keyIdx++}`} style={styles.boldText}>
          {match[1]}
        </Text>
      );
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      elements.push(<Text key={`normal-${keyIdx++}`}>{text.substring(lastIndex)}</Text>);
    }

    return elements.length > 0 ? elements : text;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.outline, paddingTop: insets.top, height: 56 + insets.top }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          {doc ? doc.title : "Documentation"}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: colors.onPrimary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {doc && renderMarkdown(doc.markdown)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  scrollContent: {
    padding: 24,
  },
  h1: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 16,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,

      fontFamily: FONT_FAMILY,

    },
  h2: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 8,

      fontFamily: FONT_FAMILY,

    },
  h3: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 6,

      fontFamily: FONT_FAMILY,

    },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,

      fontFamily: FONT_FAMILY,

    },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingRight: 16,
  },
  bullet: {
    fontSize: 14,
    width: 16,
    textAlign: "center",

      fontFamily: FONT_FAMILY,

    },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,

      fontFamily: FONT_FAMILY,

    },
  space: {
    height: 8,
  },
  boldText: {
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 16,

      fontFamily: FONT_FAMILY,

    },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
export default DocViewerScreen;
export const DocViewerScreenComponent = DocViewerScreen;
