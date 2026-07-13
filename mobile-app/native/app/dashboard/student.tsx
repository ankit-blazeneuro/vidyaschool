import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "../../theme/ThemeContext";
import { ApiService } from "../../services/api";
import { SessionManager } from "../../services/session";
import { DashboardLayout } from "../../components/DashboardLayout";
import { ImageSlider } from "../../components/ImageSlider";
import { SliderSkeleton } from "../../components/SliderSkeleton";
import { StudentOnboardingDrawer } from "../../components/dashboard/StudentOnboardingDrawer";
import { DashboardHeader } from "../../components/DashboardHeader";
import { StudentBorrowingResponse, SliderImage } from "../../types";
import { Feather } from "@expo/vector-icons";
import Svg, { Line, Path, Circle, Rect, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { FONT_FAMILY } from "../../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function StudentScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  // Basic session details
  const [provider, setProvider] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [studentClass, setStudentClass] = useState("");
  const [sessionToken, setSessionToken] = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Slider states
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [isLoadingSlider, setIsLoadingSlider] = useState(true);

  // Library borrowings state
  const [borrowedBooks, setBorrowedBooks] = useState<StudentBorrowingResponse[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // Academic tab selection
  const [activeChartTab, setActiveChartTab] = useState(0);

  const initSession = async () => {
    const prov = await SessionManager.getProvider();
    const mail = await SessionManager.getEmail();
    const nm = await SessionManager.getName();
    const token = await SessionManager.getSessionToken();
    const avatar = await SessionManager.getAvatarUrl();
    const sClass = await SessionManager.getStudentClass();

    setProvider(prov || "");
    setEmail(mail || "");
    setName(nm || "");
    setSessionToken(token || "");
    setAvatarUrl(avatar);
    setStudentClass(sClass || "");
  };

  const checkOnboardingAndData = async () => {
    setIsCheckingOnboarding(true);
    try {
      const response = await ApiService.getProfile();
      if (response.ok) {
        const data = await response.json();
        const profile = data.profile;
        const onboardingCompleted = profile?.onboardingCompleted === true && profile?.username;
        setShowOnboarding(!onboardingCompleted);
        if (profile?.class) {
          setStudentClass(profile.class);
        }
      }
    } catch (e) {
      console.error("Failed to check onboarding", e);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const loadSliderImages = async (cls: string) => {
    setIsLoadingSlider(true);
    try {
      const response = await ApiService.getSliderImages("student", cls || null);
      if (response.ok) {
        const data = await response.json();
        setSliderImages(data || []);
      }
    } catch (e) {
      console.error("Failed to load slider images", e);
    } finally {
      setIsLoadingSlider(false);
    }
  };

  const loadLibraryBorrowings = async () => {
    setIsLoadingLibrary(true);
    try {
      const response = await ApiService.getStudentBorrowings();
      if (response.ok) {
        const data = await response.json();
        setBorrowedBooks(data || []);
      }
    } catch (e) {
      console.error("Failed to load library borrowings", e);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  useEffect(() => {
    const start = async () => {
      await initSession();
      await checkOnboardingAndData();
    };
    start();
  }, []);

  useEffect(() => {
    if (!showOnboarding && sessionToken) {
      loadSliderImages(studentClass);
      loadLibraryBorrowings();
    }
  }, [showOnboarding, studentClass, sessionToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await initSession();
    await checkOnboardingAndData();
    if (!showOnboarding) {
      await loadSliderImages(studentClass);
      await loadLibraryBorrowings();
    }
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await SessionManager.clearSession();
    router.replace("/");
  };

  const handleRenewBook = async (id: string) => {
    try {
      const response = await ApiService.renewBook({ id });
      if (response.ok) {
        Alert.alert("Success", "Book renewed successfully");
        loadLibraryBorrowings();
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

  // 1. Academic Charts Renderer
  const renderChart = () => {
    const CHART_WIDTH = SCREEN_WIDTH - 80;
    const CHART_HEIGHT = 160;

    switch (activeChartTab) {
      case 0: {
        // Performance Line Chart (smooth curve on SVG Canvas)
        const data = [65, 80, 75, 90, 85, 95];
        const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
        
        const paddingL = 20;
        const paddingR = 20;
        const paddingT = 15;
        const paddingB = 25;
        const activeChartWidth = CHART_WIDTH - paddingL - paddingR;
        const activeChartHeight = CHART_HEIGHT - paddingT - paddingB;

        const points = data.map((val, i) => {
          const x = paddingL + (activeChartWidth * i) / (data.length - 1);
          const y = paddingT + activeChartHeight * (1 - val / 100);
          return { x, y };
        });

        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          const p = points[i - 1];
          const c = points[i];
          const cx1 = p.x + (c.x - p.x) / 2;
          pathD += ` C ${cx1} ${p.y} ${cx1} ${c.y} ${c.x} ${c.y}`;
        }

        const fillD = `${pathD} L ${points[points.length - 1].x} ${paddingT + activeChartHeight} L ${points[0].x} ${paddingT + activeChartHeight} Z`;

        return (
          <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH, justifyContent: "center", alignItems: "center", marginVertical: 12 }}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.25} />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.0} />
                </LinearGradient>
                <LinearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor={colors.secondary} stopOpacity={0.8} />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity={1.0} />
                </LinearGradient>
              </Defs>

              {/* Dashed Grid Lines */}
              {[0, 1, 2, 3, 4].map((i) => {
                const y = paddingT + (activeChartHeight * i) / 4;
                return (
                  <Line
                    key={i}
                    x1={paddingL}
                    y1={y}
                    x2={CHART_WIDTH - paddingR}
                    y2={y}
                    stroke={colors.outline}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Gradient Fill Under Curve */}
              <Path d={fillD} fill="url(#fillGrad)" />

              {/* Main Stroke Curve */}
              <Path d={pathD} fill="none" stroke="url(#strokeGrad)" strokeWidth={2.5} strokeLinecap="round" />

              {/* Glow Dots & Circles */}
              {points.map((pt, idx) => (
                <React.Fragment key={idx}>
                  <Circle cx={pt.x} cy={pt.y} r={8} fill={colors.primary} opacity={0.15} />
                  <Circle cx={pt.x} cy={pt.y} r={4} fill={colors.primary} />
                  <Circle cx={pt.x} cy={pt.y} r={2} fill={colors.surface} />
                </React.Fragment>
              ))}

              {/* X-Axis Labels */}
              {labels.map((label, i) => {
                const x = paddingL + (activeChartWidth * i) / (labels.length - 1);
                return (
                  <SvgText
                    key={i}
                    x={x}
                    y={CHART_HEIGHT - 5}
                    fill={colors.secondary}
                    fontSize={10}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                );
              })}
            </Svg>
          </View>
        );
      }
      case 1: {
        // Subject Bar Chart with custom round rect and decreasing alphas
        const data = [72, 68, 85, 78, 91, 88];
        const labels = ["Math", "Sci", "Eng", "His", "Geo", "Art"];
        const barAlphas = [1, 0.8, 0.65, 0.5, 0.38, 0.25];

        const paddingL = 10;
        const paddingR = 10;
        const paddingT = 12;
        const paddingB = 25;
        const activeChartWidth = CHART_WIDTH - paddingL - paddingR;
        const activeChartHeight = CHART_HEIGHT - paddingT - paddingB;

        const slotW = activeChartWidth / data.length;
        const barW = slotW * 0.42;
        const cornerR = barW / 2.5;

        return (
          <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH, justifyContent: "center", alignItems: "center", marginVertical: 12 }}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              {/* Grid Lines */}
              {[0, 1, 2, 3, 4].map((i) => {
                const y = paddingT + (activeChartHeight * i) / 4;
                return (
                  <Line
                    key={i}
                    x1={paddingL}
                    y1={y}
                    x2={CHART_WIDTH - paddingR}
                    y2={y}
                    stroke={colors.outline}
                    strokeWidth={1}
                  />
                );
              })}

              {/* Bars */}
              {data.map((val, i) => {
                const barH = activeChartHeight * (val / 100);
                const cx = paddingL + i * slotW + slotW / 2;
                const x = cx - barW / 2;
                const top = paddingT + activeChartHeight - barH;
                const alpha = barAlphas[i % barAlphas.length];

                return (
                  <React.Fragment key={i}>
                    {/* Background Track */}
                    <Rect
                      x={x}
                      y={paddingT}
                      width={barW}
                      height={activeChartHeight}
                      rx={cornerR}
                      ry={cornerR}
                      fill={colors.primary}
                      opacity={0.08}
                    />
                    {/* Value Bar */}
                    <Rect
                      x={x}
                      y={top}
                      width={barW}
                      height={barH}
                      rx={cornerR}
                      ry={cornerR}
                      fill={colors.primary}
                      opacity={alpha}
                    />
                  </React.Fragment>
                );
              })}

              {/* X-Axis Labels */}
              {labels.map((label, i) => {
                const x = paddingL + i * slotW + slotW / 2;
                return (
                  <SvgText
                    key={i}
                    x={x}
                    y={CHART_HEIGHT - 5}
                    fill={colors.secondary}
                    fontSize={10}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                );
              })}
            </Svg>
          </View>
        );
      }
      case 2: {
        // Attendance Donut Chart matching Kotlin segment ratios & legend
        const present = 82;
        const absent = 10;
        const leave = 8;
        const total = present + absent + leave;

        const size = 110;
        const strokeWidth = 14;
        const radius = (size - strokeWidth) / 2;
        const circ = 2 * Math.PI * radius;

        const pLen = circ * (present / total);
        const aLen = circ * (absent / total);
        const lLen = circ * (leave / total);

        const gap = 3;
        const pStroke = Math.max(0, pLen - gap);
        const aStroke = Math.max(0, aLen - gap);
        const lStroke = Math.max(0, lLen - gap);

        const pOffset = 0;
        const aOffset = -pLen;
        const lOffset = -(pLen + aLen);

        const presentColor = colors.onSurface;
        const absentColor = colors.onSurface + "8c"; // 55% opacity
        const leaveColor = colors.onSurface + "40"; // 25% opacity
        const trackColor = colors.onSurface + "12"; // 7% opacity

        return (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: CHART_WIDTH, height: CHART_HEIGHT - 20, paddingHorizontal: 16 }}>
            {/* Donut Circle */}
            <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
              <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={trackColor}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={leaveColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${lStroke} ${circ}`}
                  strokeDashoffset={lOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={absentColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${aStroke} ${circ}`}
                  strokeDashoffset={aOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={presentColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${pStroke} ${circ}`}
                  strokeDashoffset={pOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </Svg>
              <View style={{ position: "absolute", alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.onSurface }}>
                  {present}%
                </Text>
                <Text style={{ fontSize: 9, color: colors.onSurface + "73" }}>
                  Present
                </Text>
              </View>
            </View>

            {/* Legend Column */}
            <View style={{ gap: 8, paddingLeft: 12 }}>
              {[
                { color: presentColor, label: "Present", pct: present },
                { color: absentColor, label: "Absent", pct: absent },
                { color: leaveColor, label: "Leave", pct: leave },
              ].map((item, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color }} />
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: "500", color: colors.onSurface }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onSurface }}>
                      {item.pct}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      }
    }
  };

  const enabledImages = sliderImages.filter((img) => img.enabled);

  return (
    <DashboardLayout
      role="student"
      provider={provider}
      email={email}
      name={name}
      avatarUrl={avatarUrl}
      onThemeChange={async (mode) => {
        await SessionManager.setThemeMode(mode);
        Alert.alert("Success", "Theme setting saved. Please restart app to apply theme change.");
      }}
      onLogout={handleLogout}
      onShowLibrary={() => router.push("/library")}
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
            {/* Dashboard Welcome Header */}
            <DashboardHeader
              title="Dashboard"
              subtitle={`Welcome, ${name.split(" ")[0] || "Student"}`}
              onMenuPress={onMenuPress}
              onNotificationPress={onNotificationPress}
              style={{ paddingHorizontal: 0, marginBottom: 16 }}
            />

            {/* Slider updates */}
            {isLoadingSlider ? (
              <SliderSkeleton style={styles.slider} />
            ) : enabledImages.length > 0 ? (
              <ImageSlider images={enabledImages} style={styles.slider} />
            ) : null}

            {/* Academic Chart Card */}
            <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Academic Performance</Text>
              
              {renderChart()}

              {/* Sub Tabs Pill indicator */}
              <View style={[styles.chartTabs, { backgroundColor: colors.outline }]}>
                {["Performance", "Subject", "Attendance"].map((label, idx) => {
                  const isSelected = activeChartTab === idx;
                  return (
                    <TouchableOpacity
                      key={label}
                      onPress={() => setActiveChartTab(idx)}
                      style={[
                        styles.chartTabBtn,
                        {
                          backgroundColor: isSelected ? colors.surface : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chartTabText,
                          {
                            color: isSelected ? colors.onSurface : colors.secondary,
                            fontWeight: isSelected ? "600" : "400",
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Library Section */}
            <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Library Books</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.secondary }]}>Issued books & renewals</Text>
                </View>
                {borrowedBooks.length > 3 && (
                  <TouchableOpacity onPress={() => router.push("/library")}>
                    <Text style={[styles.viewAllText, { color: colors.secondary }]}>View all →</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isLoadingLibrary && borrowedBooks.length === 0 ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
              ) : borrowedBooks.length === 0 ? (
                <View style={styles.emptyBooks}>
                  <Text style={[styles.emptyBooksText, { color: colors.secondary }]}>
                    No books currently issued
                  </Text>
                </View>
              ) : (
                <View style={styles.booksList}>
                  {borrowedBooks.slice(0, 3).map((book, idx) => {
                    const renewalsLeft = 3 - book.renewalsCount;
                    const isOverdue = book.status === "overdue";

                    return (
                      <View
                        key={book.id}
                        style={[
                          styles.bookItem,
                          { borderBottomColor: idx === 2 || idx === borrowedBooks.length - 1 ? "transparent" : colors.outline },
                        ]}
                      >
                        <View style={[styles.bookIcon, { backgroundColor: colors.outline }]}>
                          <Text style={[styles.bookIconText, { color: colors.onSurface }]}>
                            {(book.title || "B").substring(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        
                        <View style={styles.bookDetails}>
                          <Text style={[styles.bookTitle, { color: colors.onSurface }]} numberOfLines={1}>
                            {book.title}
                          </Text>
                          <Text style={[styles.bookAuthor, { color: colors.secondary }]} numberOfLines={1}>
                            {book.author}
                          </Text>
                          
                          <View style={styles.bookStatusRow}>
                            <Text
                              style={[
                                styles.bookDueDate,
                                { color: isOverdue ? colors.error : colors.secondary },
                              ]}
                            >
                              Due {formatIsoDate(book.dueDate)}
                            </Text>
                            
                            {/* Renew pips */}
                            <View style={styles.pipRow}>
                              {Array.from({ length: 3 }).map((_, pipIdx) => (
                                <View
                                  key={pipIdx}
                                  style={[
                                    styles.pip,
                                    {
                                      backgroundColor:
                                        pipIdx < book.renewalsCount
                                          ? colors.secondary + "40"
                                          : colors.secondary,
                                    },
                                  ]}
                                />
                              ))}
                            </View>
                          </View>
                        </View>

                        {renewalsLeft > 0 ? (
                          <TouchableOpacity
                            onPress={() => handleRenewBook(book.id)}
                            style={[styles.renewBtn, { borderColor: colors.outline }]}
                          >
                            <Text style={[styles.renewBtnText, { color: colors.onSurface }]}>Renew</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.maxBadge, { backgroundColor: colors.outline }]}>
                            <Text style={[styles.maxBadgeText, { color: colors.secondary }]}>Max</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
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

      fontFamily: FONT_FAMILY,

    },
  greetingSub: {
    fontSize: 12,
    marginTop: 4,

      fontFamily: FONT_FAMILY,

    },
  slider: {
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,

      fontFamily: FONT_FAMILY,

    },
  cardSubtitle: {
    fontSize: 12,

      fontFamily: FONT_FAMILY,

    },
  chartWrapper: {
    height: 180,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginVertical: 16,
  },
  chartCol: {
    alignItems: "center",
    flex: 1,
  },
  barTrack: {
    width: 20,
    height: 140,
    borderRadius: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 10,
  },
  chartLabel: {
    fontSize: 10,
    marginTop: 6,

      fontFamily: FONT_FAMILY,

    },
  attendanceWrapper: {
    height: 180,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginVertical: 16,
  },
  pieContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  pieInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  piePercentage: {
    fontSize: 22,
    fontWeight: "800",

      fontFamily: FONT_FAMILY,

    },
  pieText: {
    fontSize: 9,
    marginTop: 2,

      fontFamily: FONT_FAMILY,

    },
  pieLegend: {
    justifyContent: "center",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11.5,

      fontFamily: FONT_FAMILY,

    },
  chartTabs: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 3,
    marginTop: 8,
  },
  chartTabBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  chartTabText: {
    fontSize: 11,

      fontFamily: FONT_FAMILY,

    },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600",

      fontFamily: FONT_FAMILY,

    },
  emptyBooks: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyBooksText: {
    fontSize: 12.5,

      fontFamily: FONT_FAMILY,

    },
  booksList: {
    width: "100%",
  },
  bookItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  bookIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  bookIconText: {
    fontSize: 16,
    fontWeight: "700",

      fontFamily: FONT_FAMILY,

    },
  bookDetails: {
    marginLeft: 12,
    flex: 1,
    marginRight: 8,
  },
  bookTitle: {
    fontSize: 13.5,
    fontWeight: "600",

      fontFamily: FONT_FAMILY,

    },
  bookAuthor: {
    fontSize: 11,
    marginTop: 2,

      fontFamily: FONT_FAMILY,

    },
  bookStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  bookDueDate: {
    fontSize: 10,
    marginRight: 8,

      fontFamily: FONT_FAMILY,

    },
  pipRow: {
    flexDirection: "row",
  },
  pip: {
    width: 10,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 1.5,
  },
  renewBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  renewBtnText: {
    fontSize: 11,
    fontWeight: "500",

      fontFamily: FONT_FAMILY,

    },
  maxBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  maxBadgeText: {
    fontSize: 11,
    fontWeight: "500",

      fontFamily: FONT_FAMILY,

    },
  spinner: {
    paddingVertical: 20,
  },
});
