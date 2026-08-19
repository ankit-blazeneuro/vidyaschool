import SwiftUI
import Shared

// ---------------------------------------------------------------------------
// Dashboard — Full Android Layout Parity with iOS Glass UI
// ---------------------------------------------------------------------------

struct DashboardView: View {
    let user: AppUser
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedTab: Int = 0
    @State private var isDrawerOpen: Bool = false
    @State private var hasUnreadNotifications: Bool = true
    @State private var showNotificationsSheet: Bool = false

    var body: some View {
        ZStack {
            // Main Glass Backdrop
            GlassBackground()

            // 5-Tab Navigation Matching Android
            TabView(selection: $selectedTab) {
                HomeTabView(
                    user: user,
                    selectedTab: $selectedTab,
                    onOpenDrawer: { isDrawerOpen = true },
                    onOpenNotifications: { showNotificationsSheet = true },
                    hasUnreadNotifications: hasUnreadNotifications
                )
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

                NoticesTabView(user: user)
                    .tabItem {
                        Label("Notice", systemImage: "bell.fill")
                    }
                    .tag(1)

                // Students → Fees | Others → Library
                if user.role.lowercased() == "student" {
                    FeesView()
                        .tabItem {
                            Label("Pay Fees", systemImage: "indianrupeesign.circle.fill")
                        }
                        .tag(2)
                } else {
                    LibraryTabView(user: user)
                        .tabItem {
                            Label("Library", systemImage: "books.vertical.fill")
                        }
                        .tag(2)
                }

                if user.role.lowercased() == "student" {
                    CoursesTabView()
                        .tabItem {
                            Label("Courses", systemImage: "atom")
                        }
                        .tag(3)
                } else {
                    SearchTabView(user: user, onTabSelect: { selectedTab = $0 })
                        .tabItem {
                            Label("Search", systemImage: "magnifyingglass")
                        }
                        .tag(3)
                }

                ProfileTabView(user: user)
                    .tabItem {
                        Label("Profile", systemImage: "person.crop.circle.fill")
                    }
                    .tag(4)
            }
            .tint(AppTheme.Color.accent)

            // Side Navigation Drawer (Frosted Glass Sheet)
            if isDrawerOpen {
                GlassNavigationDrawer(
                    user: user,
                    selectedTab: $selectedTab,
                    isOpen: $isDrawerOpen,
                    onOpenNotifications: { showNotificationsSheet = true }
                )
                .transition(.move(edge: .leading).combined(with: .opacity))
                .zIndex(10)
            }
        }
        .sheet(isPresented: $showNotificationsSheet) {
            NotificationHistoryView()
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
                .sheetBackground(AppTheme.Color.darkBackground)
        }
        .onAppear {
            let appearance = UITabBarAppearance()
            appearance.configureWithTransparentBackground()
            appearance.backgroundColor = UIColor(AppTheme.Color.darkSurface.opacity(0.85))
            appearance.backgroundEffect = UIBlurEffect(style: .systemUltraThinMaterialDark)
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}

// ---------------------------------------------------------------------------
// Home Tab View with Sticky Header & Android Layout Sections
// ---------------------------------------------------------------------------

struct HomeTabView: View {
    let user: AppUser
    @Binding var selectedTab: Int
    let onOpenDrawer: () -> Void
    let onOpenNotifications: () -> Void
    let hasUnreadNotifications: Bool

    @State private var showingSliderSheet = false
    @State private var showingCreateNoticeSheet = false
    @State private var showingStudentSearchSheet = false
    @State private var showingReceiptVerificationSheet = false
    @State private var showingAgentSheet = false
    @State private var showingQRLoginSheet = false
    @State private var showingAcademicMarksSheet = false
    @State private var showingComplaintSheet = false
    @State private var showingSessionsSheet = false
    @State private var scrollOffset: CGFloat = 0

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        // Standard Dashboard Header
                        DashboardHeaderView(
                            title: "Dashboard",
                            subtitle: "Welcome, \(user.name ?? "Student")",
                            onMenuClick: onOpenDrawer,
                            onNotificationClick: onOpenNotifications,
                            hasUnread: hasUnreadNotifications
                        )
                        .padding(.horizontal, AppTheme.Spacing.md)
                        .padding(.top, AppTheme.Spacing.xs)

                        // Role-based Dashboard Content
                        switch user.role.lowercased() {
                        case "admin":
                            AdminHomeSection(
                                onShowSlider: { showingSliderSheet = true },
                                onShowCreateNotice: { showingCreateNoticeSheet = true },
                                onShowUsers: { showingStudentSearchSheet = true }
                            )
                        case "teacher":
                            TeacherHomeSection(
                                selectedTab: $selectedTab,
                                onShowStudentSearch: { showingStudentSearchSheet = true },
                                onShowCreateNotice: { showingCreateNoticeSheet = true }
                            )
                        case "accounts":
                            AccountsHomeSection(
                                onShowVerifyReceipt: { showingReceiptVerificationSheet = true },
                                onShowFeeRecords: { selectedTab = 2 }
                            )
                        default:
                            StudentHomeSection(
                                user: user,
                                selectedTab: $selectedTab,
                                onShowAgent: { showingAgentSheet = true },
                                onShowQRLogin: { showingQRLoginSheet = true },
                                onShowAcademicMarks: { showingAcademicMarksSheet = true }
                            )
                        }
                    }
                    .padding(.bottom, 80)
                }

                // Sticky Frosted Glass Top Header on Scroll
                if scrollOffset > 80 {
                    StickyDashboardHeader(
                        title: "Dashboard",
                        onMenuClick: onOpenDrawer,
                        onNotificationClick: onOpenNotifications,
                        hasUnread: hasUnreadNotifications
                    )
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showingSliderSheet) { SliderManagementView() }
            .sheet(isPresented: $showingCreateNoticeSheet) { CreateNoticeView() }
            .sheet(isPresented: $showingStudentSearchSheet) { StudentSearchView() }
            .sheet(isPresented: $showingReceiptVerificationSheet) { ReceiptVerificationView() }
            .sheet(isPresented: $showingAgentSheet) { AgentView() }
            .sheet(isPresented: $showingQRLoginSheet) { QRLoginView() }
            .sheet(isPresented: $showingAcademicMarksSheet) { AcademicMarksSheetView() }
            .sheet(isPresented: $showingComplaintSheet) { ComplaintSheetView() }
            .sheet(isPresented: $showingSessionsSheet) { ManageSessionsSheetView() }
        }
    }
}

// ---------------------------------------------------------------------------
// Header Bar & Sticky Glass Bar (Matches Android DashboardHeader)
// ---------------------------------------------------------------------------

struct DashboardHeaderView: View {
    let title: String
    let subtitle: String
    let onMenuClick: () -> Void
    let onNotificationClick: () -> Void
    let hasUnread: Bool

    var body: some View {
        HStack(spacing: 12) {
            // Hamburger Menu Button with Frosted Border
            Button(action: onMenuClick) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.08))
                        .frame(width: 38, height: 38)
                        .overlay(Circle().stroke(Color.white.opacity(0.18), lineWidth: 1))

                    Image(systemName: "line.3.horizontal")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                }
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(AppTheme.Color.darkSecondary)
            }

            Spacer()

            // Notification Bell with Unread Blue Dot Badge
            Button(action: onNotificationClick) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.08))
                        .frame(width: 38, height: 38)
                        .overlay(Circle().stroke(Color.white.opacity(0.18), lineWidth: 1))

                    Image(systemName: "bell.fill")
                        .font(.system(size: 16))
                        .foregroundColor(.white)

                    if hasUnread {
                        Circle()
                            .fill(Color(hex: "#3B82F6"))
                            .frame(width: 10, height: 10)
                            .overlay(Circle().stroke(AppTheme.Color.darkBackground, lineWidth: 2))
                            .offset(x: 10, y: -10)
                    }
                }
            }
        }
        .padding(.vertical, 8)
    }
}

struct StickyDashboardHeader: View {
    let title: String
    let onMenuClick: () -> Void
    let onNotificationClick: () -> Void
    let hasUnread: Bool

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button(action: onMenuClick) {
                    Image(systemName: "line.3.horizontal")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(8)
                        .background(Circle().fill(Color.white.opacity(0.1)))
                }

                Spacer()

                Text(title)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)

                Spacer()

                Button(action: onNotificationClick) {
                    ZStack {
                        Image(systemName: "bell.fill")
                            .font(.system(size: 16))
                            .foregroundColor(.white)
                            .padding(8)
                            .background(Circle().fill(Color.white.opacity(0.1)))

                        if hasUnread {
                            Circle()
                                .fill(Color(hex: "#3B82F6"))
                                .frame(width: 8, height: 8)
                                .offset(x: 6, y: -6)
                        }
                    }
                }
            }
            .padding(.horizontal, AppTheme.Spacing.md)
            .padding(.vertical, 10)

            Divider().background(Color.white.opacity(0.1))
        }
        .background(.ultraThinMaterial)
    }
}

// ---------------------------------------------------------------------------
// Student Dashboard Home Section
// ---------------------------------------------------------------------------

private struct StudentHomeSection: View {
    let user: AppUser
    @Binding var selectedTab: Int
    let onShowAgent: () -> Void
    let onShowQRLogin: () -> Void
    let onShowAcademicMarks: () -> Void

    @StateObject private var libraryVM = LibraryViewModel()

    var body: some View {
        VStack(spacing: AppTheme.Spacing.lg) {
            // Auto-playing Glass Banner Carousel
            StudentBannerCarousel()

            // Academic Performance Card (Grade Ring & Stats)
            AcademicPerformanceCard(onShowDetails: onShowAcademicMarks)

            // Today's Timetable Section
            StudentTimetableSection()

            // Library Books Preview Section
            LibraryPreviewSection(viewModel: libraryVM, onShowMore: { selectedTab = 2 })

            // Quick Actions Glass Grid
            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                Text("Quick Actions")
                    .font(AppTheme.Font.headline)
                    .foregroundColor(.white)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    QuickActionGlassCard(
                        icon: "sparkles",
                        title: "VidyaAI Agent",
                        subtitle: "Smart AI Assistant",
                        color: Color(hex: "#818CF8"),
                        action: onShowAgent
                    )

                    QuickActionGlassCard(
                        icon: "qrcode.viewfinder",
                        title: "QR Login",
                        subtitle: "Pair with Desktop",
                        color: AppTheme.Color.accent,
                        action: onShowQRLogin
                    )

                    QuickActionGlassCard(
                        icon: "indianrupeesign.circle.fill",
                        title: "My Fees",
                        subtitle: "View & Pay online",
                        color: AppTheme.Color.warning,
                        action: { selectedTab = 2 }
                    )

                    QuickActionGlassCard(
                        icon: "books.vertical.fill",
                        title: "Library",
                        subtitle: "Books & renewals",
                        color: AppTheme.Color.accentPurple,
                        action: { selectedTab = 2 }
                    )

                    QuickActionGlassCard(
                        icon: "bell.fill",
                        title: "Notices",
                        subtitle: "Announcements",
                        color: AppTheme.Color.success,
                        action: { selectedTab = 1 }
                    )

                    QuickActionGlassCard(
                        icon: "person.crop.circle.fill",
                        title: "Profile",
                        subtitle: "Your information",
                        color: AppTheme.Color.darkSecondary,
                        action: { selectedTab = 4 }
                    )
                }
            }
        }
        .padding(.horizontal, AppTheme.Spacing.md)
        .onAppear {
            libraryVM.fetchBorrowings()
        }
    }
}

// ---------------------------------------------------------------------------
// Student Banner Carousel (Slider)
// ---------------------------------------------------------------------------

struct StudentBannerCarousel: View {
    @State private var currentIndex: Int = 0
    let timer = Timer.publish(every: 4.5, on: .main, in: .common).autoconnect()

    struct SlideItem: Identifiable {
        let id = UUID()
        let title: String
        let tag: String
        let subtitle: String
        let gradient: [SwiftUI.Color]
        let icon: String
    }

    let slides: [SlideItem] = [
        SlideItem(
            title: "Annual Science & AI Exhibition",
            tag: "EVENT",
            subtitle: "Join the robotics & coding showcases on Friday in the Main Auditorium.",
            gradient: [Color(hex: "#4F46E5"), Color(hex: "#7C3AED")],
            icon: "sparkles.rectangle.stack"
        ),
        SlideItem(
            title: "Term 2 Examination Schedule",
            tag: "ACADEMICS",
            subtitle: "Final exam dates released. Check subjects timetable in portal.",
            gradient: [Color(hex: "#059669"), Color(hex: "#0D9488")],
            icon: "doc.text.fill"
        ),
        SlideItem(
            title: "Inter-School Sports Meet",
            tag: "SPORTS",
            subtitle: "Cheer for the school football and athletics teams this Saturday.",
            gradient: [Color(hex: "#D97706"), Color(hex: "#DC2626")],
            icon: "trophy.fill"
        )
    ]

    var body: some View {
        VStack(spacing: 8) {
            TabView(selection: $currentIndex) {
                ForEach(Array(slides.enumerated()), id: \.element.id) { index, slide in
                    ZStack {
                        RoundedRectangle(cornerRadius: 18)
                            .fill(
                                LinearGradient(
                                    colors: slide.gradient.map { $0.opacity(0.85) },
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 18)
                                    .stroke(Color.white.opacity(0.25), lineWidth: 1)
                            )

                        HStack {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(slide.tag)
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.white.opacity(0.9))
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Capsule().fill(Color.white.opacity(0.2)))

                                Text(slide.title)
                                    .font(.system(size: 17, weight: .bold))
                                    .foregroundColor(.white)
                                    .lineLimit(2)

                                Text(slide.subtitle)
                                    .font(.system(size: 12))
                                    .foregroundColor(.white.opacity(0.85))
                                    .lineLimit(2)
                            }
                            Spacer()
                            Image(systemName: slide.icon)
                                .font(.system(size: 42))
                                .foregroundColor(.white.opacity(0.3))
                        }
                        .padding(AppTheme.Spacing.md)
                    }
                    .tag(index)
                    .padding(.horizontal, 2)
                }
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            .frame(height: 150)
            .onReceive(timer) { _ in
                withAnimation(.easeInOut(duration: 0.5)) {
                    currentIndex = (currentIndex + 1) % slides.count
                }
            }

            // Dot Indicators
            HStack(spacing: 6) {
                ForEach(0..<slides.count, id: \.self) { idx in
                    Circle()
                        .fill(idx == currentIndex ? Color.white : Color.white.opacity(0.3))
                        .frame(width: idx == currentIndex ? 16 : 6, height: 6)
                        .animation(.spring(), value: currentIndex)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Academic Performance Card (Mirrors Android AcademicPerformanceCard)
// ---------------------------------------------------------------------------

struct AcademicPerformanceCard: View {
    let onShowDetails: () -> Void

    var body: some View {
        GlassCard {
            VStack(spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Academic Performance")
                            .font(AppTheme.Font.headline)
                            .foregroundColor(.white)
                        Text("Current Term Cumulative GPA")
                            .font(AppTheme.Font.caption2)
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                    Spacer()
                    Button(action: onShowDetails) {
                        HStack(spacing: 4) {
                            Text("Details")
                                .font(.system(size: 12, weight: .medium))
                            Image(systemName: "chevron.right")
                                .font(.system(size: 10, weight: .bold))
                        }
                        .foregroundColor(AppTheme.Color.accent)
                    }
                }

                HStack(spacing: 20) {
                    // Gauge score ring
                    ZStack {
                        Circle()
                            .stroke(Color.white.opacity(0.1), lineWidth: 8)
                            .frame(width: 74, height: 74)

                        Circle()
                            .trim(from: 0, to: 0.92)
                            .stroke(
                                LinearGradient(
                                    colors: [Color(hex: "#6366F1"), Color(hex: "#A855F7")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                style: StrokeStyle(lineWidth: 8, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                            .frame(width: 74, height: 74)

                        VStack(spacing: 0) {
                            Text("92%")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                            Text("A+")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(AppTheme.Color.success)
                        }
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("Class Rank:")
                                .font(AppTheme.Font.caption)
                                .foregroundColor(AppTheme.Color.darkSecondary)
                            Text("#3 / 42")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.white)
                        }

                        HStack {
                            Text("Attendance:")
                                .font(AppTheme.Font.caption)
                                .foregroundColor(AppTheme.Color.darkSecondary)
                            Text("96.4%")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(AppTheme.Color.success)
                        }

                        HStack {
                            Text("Next Exam:")
                                .font(AppTheme.Font.caption)
                                .foregroundColor(AppTheme.Color.darkSecondary)
                            Text("Mathematics (Mon)")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.white)
                        }
                    }
                    Spacer()
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Today's Timetable Section (Mirrors Android StudentTimetableSection)
// ---------------------------------------------------------------------------

struct StudentTimetableSection: View {
    struct TimetableItem: Identifiable {
        let id = UUID()
        let time: String
        let subject: String
        let room: String
        let teacher: String
        let isLive: BooleanLiteralType
    }

    let todayClasses = [
        TimetableItem(time: "09:00 AM", subject: "Mathematics — Calculus", room: "Room 302", teacher: "Dr. Sharma", isLive: false),
        TimetableItem(time: "10:30 AM", subject: "Physics — Electromagnetism", room: "Lab 2", teacher: "Prof. Verma", isLive: true),
        TimetableItem(time: "01:00 PM", subject: "English Literature", room: "Room 105", teacher: "Mrs. Rao", isLive: false)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
            HStack {
                Text("Today's Schedule")
                    .font(AppTheme.Font.headline)
                    .foregroundColor(.white)
                Spacer()
                Text("Wed, Term 2")
                    .font(AppTheme.Font.caption)
                    .foregroundColor(AppTheme.Color.darkSecondary)
            }

            VStack(spacing: 8) {
                ForEach(todayClasses) { cls in
                    GlassCard(padding: 12) {
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(cls.time)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(cls.isLive ? AppTheme.Color.accent : AppTheme.Color.darkSecondary)

                                if cls.isLive {
                                    HStack(spacing: 4) {
                                        Circle().fill(Color(hex: "#22C55E")).frame(width: 6, height: 6)
                                        Text("LIVE NOW")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundColor(Color(hex: "#22C55E"))
                                    }
                                }
                            }
                            .frame(width: 75, alignment: .leading)

                            Rectangle()
                                .fill(Color.white.opacity(0.12))
                                .frame(width: 1, height: 36)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(cls.subject)
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.white)
                                Text("\(cls.teacher) • \(cls.room)")
                                    .font(.system(size: 11))
                                    .foregroundColor(AppTheme.Color.darkSecondary)
                            }
                            Spacer()
                        }
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Quick Action Frosted Glass Card
// ---------------------------------------------------------------------------

struct QuickActionGlassCard: View {
    let icon: String
    let title: String
    let subtitle: String
    var color: SwiftUI.Color = AppTheme.Color.accent
    var action: () -> Void = {}

    var body: some View {
        Button(action: {
            let gen = UIImpactFeedbackGenerator(style: .light)
            gen.impactOccurred()
            action()
        }) {
            GlassCard(padding: 14) {
                VStack(alignment: .leading, spacing: 8) {
                    ZStack {
                        RoundedRectangle(cornerRadius: AppTheme.Radius.sm)
                            .fill(color.opacity(0.18))
                            .frame(width: 38, height: 38)
                            .overlay(RoundedRectangle(cornerRadius: AppTheme.Radius.sm).stroke(color.opacity(0.35), lineWidth: 1))

                        Image(systemName: icon)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(color)
                    }

                    Text(title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)

                    Text(subtitle)
                        .font(.system(size: 11))
                        .foregroundColor(AppTheme.Color.darkSecondary)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .buttonStyle(.plain)
    }
}

// ---------------------------------------------------------------------------
// Library Preview Section
// ---------------------------------------------------------------------------

private struct LibraryPreviewSection: View {
    @ObservedObject var viewModel: LibraryViewModel
    let onShowMore: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Library Books")
                        .font(AppTheme.Font.headline).foregroundColor(.white)
                    Text("Issued books & renewals")
                        .font(AppTheme.Font.caption2).foregroundColor(AppTheme.Color.darkSecondary)
                }
                Spacer()
                if viewModel.borrowings.count > 3 {
                    Button("View all →") { onShowMore() }
                        .font(AppTheme.Font.caption)
                        .foregroundColor(AppTheme.Color.accent)
                }
            }

            if viewModel.isLoading && viewModel.borrowings.isEmpty {
                HStack { Spacer(); ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white)); Spacer() }
                    .frame(height: 80)
            } else if viewModel.borrowings.isEmpty {
                GlassCard {
                    Text("No books currently issued")
                        .font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                        .frame(maxWidth: .infinity)
                }
            } else {
                GlassCard {
                    VStack(spacing: 0) {
                        ForEach(Array(viewModel.borrowings.prefix(3).enumerated()), id: \.element.id) { idx, book in
                            if idx > 0 { Divider().background(Color.white.opacity(0.1)) }
                            LibraryPreviewRow(book: book, onRenew: { viewModel.renewBook(bookId: book.id) })
                        }
                    }
                }
            }
        }
    }
}

private struct LibraryPreviewRow: View {
    let book: StudentBorrowingResponse
    let onRenew: () -> Void
    private var renewalsLeft: Int { max(0, 3 - Int(book.renewalsCount)) }

    var body: some View {
        HStack(spacing: AppTheme.Spacing.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.Radius.sm)
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 38, height: 38)
                    .overlay(RoundedRectangle(cornerRadius: AppTheme.Radius.sm).stroke(Color.white.opacity(0.18), lineWidth: 1))
                Text(String(book.title.prefix(1)).uppercased())
                    .font(.system(size: 16, weight: .bold)).foregroundColor(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(book.title).font(AppTheme.Font.footnote).fontWeight(.semibold)
                    .foregroundColor(.white).lineLimit(1)
                Text(book.author).font(.system(size: 11)).foregroundColor(AppTheme.Color.darkSecondary).lineLimit(1)
                HStack(spacing: 6) {
                    Text("Due \(formatIsoDate(book.dueDate))")
                        .font(.system(size: 10))
                        .foregroundColor(book.status.lowercased() == "overdue" ? AppTheme.Color.destructive : AppTheme.Color.darkSecondary)
                    HStack(spacing: 3) {
                        ForEach(0..<3) { i in
                            RoundedRectangle(cornerRadius: 2)
                                .fill(i < Int(book.renewalsCount) ? Color.white.opacity(0.15) : Color.white.opacity(0.7))
                                .frame(width: 10, height: 3)
                        }
                    }
                }
            }
            Spacer()
            if renewalsLeft > 0 {
                Button(action: onRenew) {
                    Text("Renew").font(.system(size: 11, weight: .medium)).foregroundColor(.white)
                        .padding(.horizontal, 12).padding(.vertical, 6)
                        .background(Capsule().fill(Color.white.opacity(0.1)))
                        .overlay(Capsule().stroke(Color.white.opacity(0.2), lineWidth: 1))
                }
            } else {
                Text("Max").font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color.white.opacity(0.35))
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(Color.white.opacity(0.06)).cornerRadius(8)
            }
        }
        .padding(.vertical, 10)
    }

    private func formatIsoDate(_ s: String) -> String {
        let parts = s.split(separator: "T")
        guard let d = parts.first else { return s }
        let c = d.split(separator: "-")
        guard c.count == 3, let m = Int(c[1]), let day = Int(c[2]) else { return s }
        let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        return "\(months[max(0,min(11,m-1))]) \(day), \(c[0])"
    }
}

// ---------------------------------------------------------------------------
// Side Navigation Drawer (Frosted Glass Sheet)
// ---------------------------------------------------------------------------

struct GlassNavigationDrawer: View {
    let user: AppUser
    @Binding var selectedTab: Int
    @Binding var isOpen: Bool
    let onOpenNotifications: () -> Void

    @State private var notesSubject: String = "All"
    @State private var selectedNote: NoteItem? = nil

    struct NoteItem: Identifiable {
        let id = UUID()
        let title: String
        let subject: String
        let teacher: String
        let date: String
        let content: String
        let color: SwiftUI.Color
    }

    let sampleNotes: [NoteItem] = [
        NoteItem(title: "Calculus Derivatives Formula Sheet", subject: "Math", teacher: "Dr. Sharma", date: "Yesterday", content: "Key product rule, quotient rule, and chain rule summaries for next week test.", color: Color(hex: "#F59E0B")),
        NoteItem(title: "Wave Optics Lab Experiments", subject: "Physics", teacher: "Prof. Verma", date: "3 days ago", content: "Observation tables and refractive index calculations to submit in Physics practicals.", color: Color(hex: "#38BDF8")),
        NoteItem(title: "Organic Reaction Mechanisms", subject: "Chemistry", teacher: "Dr. Roy", date: "Aug 14", content: "Step-by-step aldol condensation and electrophilic aromatic substitution notes.", color: Color(hex: "#34D399"))
    ]

    var body: some View {
        ZStack(alignment: .leading) {
            // Dark Backdrop Tap to Dismiss
            Color.black.opacity(0.6)
                .ignoresSafeArea()
                .onTapGesture {
                    withAnimation(.spring()) { isOpen = false }
                }

            // Glass Drawer Panel
            VStack(alignment: .leading, spacing: 0) {
                // User Profile Header
                HStack(spacing: 12) {
                    ZStack(alignment: .bottomTrailing) {
                        Circle()
                            .fill(Color.white.opacity(0.12))
                            .frame(width: 44, height: 44)
                            .overlay(Circle().stroke(Color.white.opacity(0.25), lineWidth: 1))
                        Text(String((user.name ?? "U").prefix(1)).uppercased())
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)

                        // Green online dot
                        Circle()
                            .fill(Color(hex: "#22C55E"))
                            .frame(width: 10, height: 10)
                            .overlay(Circle().stroke(AppTheme.Color.darkBackground, lineWidth: 2))
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(user.name ?? "User")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        RoleBadge(role: user.role)
                    }

                    Spacer()

                    Button(action: { withAnimation { isOpen = false } }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                            .padding(8)
                            .background(Circle().fill(Color.white.opacity(0.08)))
                    }
                }
                .padding(.horizontal, AppTheme.Spacing.md)
                .padding(.top, 50)
                .padding(.bottom, AppTheme.Spacing.md)

                Divider().background(Color.white.opacity(0.1))

                ScrollView {
                    VStack(alignment: .leading, spacing: 6) {
                        // Navigation Links
                        DrawerRow(icon: "house.fill", title: "Home Dashboard", isSelected: selectedTab == 0) {
                            selectedTab = 0; isOpen = false
                        }

                        DrawerRow(icon: "bell.fill", title: "Notice Board", isSelected: selectedTab == 1) {
                            selectedTab = 1; isOpen = false
                        }

                        if user.role.lowercased() == "student" {
                            DrawerRow(icon: "indianrupeesign.circle.fill", title: "Pay Fees", isSelected: selectedTab == 2) {
                                selectedTab = 2; isOpen = false
                            }
                            DrawerRow(icon: "atom", title: "Courses", isSelected: selectedTab == 3) {
                                selectedTab = 3; isOpen = false
                            }
                        } else {
                            DrawerRow(icon: "books.vertical.fill", title: "Library Hub", isSelected: selectedTab == 2) {
                                selectedTab = 2; isOpen = false
                            }
                            DrawerRow(icon: "magnifyingglass", title: "Search Hub", isSelected: selectedTab == 3) {
                                selectedTab = 3; isOpen = false
                            }
                        }

                        // Student Inline Notes Section
                        if user.role.lowercased() == "student" {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Image(systemName: "note.text")
                                        .font(.system(size: 13))
                                        .foregroundColor(AppTheme.Color.accent)
                                    Text("STUDENT NOTES")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                    Spacer()
                                    Text("\(sampleNotes.count)")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 6).padding(.vertical, 2)
                                        .background(Capsule().fill(Color(hex: "#3B82F6")))
                                }
                                .padding(.horizontal, AppTheme.Spacing.md)
                                .padding(.top, 10)

                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 10) {
                                        ForEach(sampleNotes) { note in
                                            Button(action: { selectedNote = note }) {
                                                VStack(alignment: .leading, spacing: 4) {
                                                    HStack {
                                                        Circle().fill(note.color).frame(width: 6, height: 6)
                                                        Text(note.subject)
                                                            .font(.system(size: 10, weight: .bold))
                                                            .foregroundColor(note.color)
                                                        Spacer()
                                                    }
                                                    Text(note.title)
                                                        .font(.system(size: 12, weight: .semibold))
                                                        .foregroundColor(.white)
                                                        .lineLimit(2)
                                                        .multilineTextAlignment(.leading)
                                                    Spacer()
                                                    Text(note.teacher)
                                                        .font(.system(size: 9))
                                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                                }
                                                .padding(10)
                                                .frame(width: 150, height: 100)
                                                .background(
                                                    RoundedRectangle(cornerRadius: 12)
                                                        .fill(Color.white.opacity(0.06))
                                                )
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 12)
                                                        .stroke(Color.white.opacity(0.12), lineWidth: 1)
                                                )
                                            }
                                        }
                                    }
                                    .padding(.horizontal, AppTheme.Spacing.md)
                                }
                            }
                        }

                        Divider().background(Color.white.opacity(0.1)).padding(.vertical, 8)

                        DrawerRow(icon: "sparkles", title: "VidyaAI Assistant") {
                            isOpen = false
                        }

                        DrawerRow(icon: "qrcode.viewfinder", title: "QR Code Login") {
                            isOpen = false
                        }

                        DrawerRow(icon: "person.crop.circle.badge.checkmark", title: "Manage Sessions") {
                            isOpen = false
                        }
                    }
                    .padding(.vertical, 8)
                }

                // Drawer Footer: Quick Search bar
                Button(action: { selectedTab = 3; isOpen = false }) {
                    HStack(spacing: 10) {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(AppTheme.Color.darkSecondary)
                        Text("Search portal...")
                            .font(.system(size: 13))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                        Spacer()
                    }
                    .padding(.horizontal, 14)
                    .frame(height: 42)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.14), lineWidth: 1))
                }
                .padding(.horizontal, AppTheme.Spacing.md)
                .padding(.bottom, 36)
            }
            .frame(width: UIScreen.main.bounds.width * 0.82)
            .background(
                ZStack {
                    Rectangle().fill(.ultraThinMaterial)
                    Color(hex: "#0E0E12").opacity(0.92)
                }
            )
            .overlay(
                Rectangle()
                    .stroke(Color.white.opacity(0.15), lineWidth: 1)
            )
            .ignoresSafeArea()
        }
        .sheet(item: $selectedNote) { note in
            NoteDetailSheetView(note: note)
        }
    }
}

private struct DrawerRow: View {
    let icon: String
    let title: String
    var isSelected: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 15))
                    .foregroundColor(isSelected ? .white : AppTheme.Color.darkSecondary)
                    .frame(width: 22)

                Text(title)
                    .font(.system(size: 14, weight: isSelected ? .bold : .medium))
                    .foregroundColor(isSelected ? .white : AppTheme.Color.darkSecondary)

                Spacer()
            }
            .padding(.horizontal, AppTheme.Spacing.md)
            .frame(height: 42)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(isSelected ? Color.white.opacity(0.08) : Color.clear)
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Teacher Home Section
// ---------------------------------------------------------------------------

private struct TeacherHomeSection: View {
    @Binding var selectedTab: Int
    let onShowStudentSearch: () -> Void
    let onShowCreateNotice: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            GlassCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Today's Teaching Schedule")
                        .font(AppTheme.Font.headline).foregroundColor(.white)
                    Text("• Grade 10 Math — 09:00 AM (Room 302)\n• Grade 12 Calculus — 11:00 AM (Lab 2)\n• Staff Faculty Meeting — 02:00 PM (Conference Hall)")
                        .font(AppTheme.Font.subheadline)
                        .foregroundColor(Color.white.opacity(0.85))
                        .lineSpacing(6)
                }
            }

            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                Text("Teacher Controls")
                    .font(AppTheme.Font.headline).foregroundColor(.white)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    QuickActionGlassCard(icon: "person.3.fill", title: "Students", subtitle: "Search & view", color: AppTheme.Color.accent, action: onShowStudentSearch)
                    QuickActionGlassCard(icon: "bell.fill", title: "Notices", subtitle: "Create & send", color: AppTheme.Color.success, action: onShowCreateNotice)
                    QuickActionGlassCard(icon: "books.vertical.fill", title: "Library", subtitle: "Manage borrowings", color: AppTheme.Color.warning, action: { selectedTab = 2 })
                    QuickActionGlassCard(icon: "chart.bar.fill", title: "Reports", subtitle: "School performance", color: AppTheme.Color.accentPurple, action: {})
                }
            }
        }
        .padding(.horizontal, AppTheme.Spacing.md)
    }
}

// ---------------------------------------------------------------------------
// Admin Home Section
// ---------------------------------------------------------------------------

private struct AdminHomeSection: View {
    let onShowSlider: () -> Void
    let onShowCreateNotice: () -> Void
    let onShowUsers: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            GlassCard {
                VStack(alignment: .leading, spacing: 6) {
                    Text("System Administration")
                        .font(AppTheme.Font.headline).foregroundColor(.white)
                    Text("Manage real-time portal sliders, broadcast urgent notices to all school batches, and audit accounts.")
                        .font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                }
            }

            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                Text("Admin Hub")
                    .font(AppTheme.Font.headline).foregroundColor(.white)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    QuickActionGlassCard(icon: "person.3.fill", title: "Users", subtitle: "Manage accounts", color: AppTheme.Color.accent, action: onShowUsers)
                    QuickActionGlassCard(icon: "photo.on.rectangle", title: "Slider", subtitle: "Manage banners", color: AppTheme.Color.success, action: onShowSlider)
                    QuickActionGlassCard(icon: "bell.badge.fill", title: "Notices", subtitle: "Send to all roles", color: AppTheme.Color.destructive, action: onShowCreateNotice)
                    QuickActionGlassCard(icon: "gearshape.fill", title: "Settings", subtitle: "App configuration", color: AppTheme.Color.warning, action: {})
                }
            }
        }
        .padding(.horizontal, AppTheme.Spacing.md)
    }
}

// ---------------------------------------------------------------------------
// Accounts Home Section
// ---------------------------------------------------------------------------

private struct AccountsHomeSection: View {
    let onShowVerifyReceipt: () -> Void
    let onShowFeeRecords: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            GlassCard {
                VStack(spacing: 8) {
                    Text("FINANCIAL SUMMARY")
                        .font(AppTheme.Font.caption)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.Color.darkSecondary)
                    Text("₹4,82,500")
                        .font(.system(size: 34, weight: .bold))
                        .foregroundColor(.white)
                    Text("Total Collections This Month")
                        .font(AppTheme.Font.caption2)
                        .foregroundColor(AppTheme.Color.success)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 4)
            }

            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                Text("Accounts Operations")
                    .font(AppTheme.Font.headline).foregroundColor(.white)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    QuickActionGlassCard(icon: "indianrupeesign.circle.fill", title: "Fee Records", subtitle: "View all dues", color: AppTheme.Color.warning, action: onShowFeeRecords)
                    QuickActionGlassCard(icon: "doc.text.fill", title: "Receipts", subtitle: "Audit verify", color: AppTheme.Color.success, action: onShowVerifyReceipt)
                    QuickActionGlassCard(icon: "person.fill.checkmark", title: "Payments", subtitle: "Offline payments", color: AppTheme.Color.accent, action: {})
                    QuickActionGlassCard(icon: "chart.pie.fill", title: "Reports", subtitle: "Financial records", color: AppTheme.Color.accentPurple, action: {})
                }
            }
        }
        .padding(.horizontal, AppTheme.Spacing.md)
    }
}

// ---------------------------------------------------------------------------
// Profile Tab View
// ---------------------------------------------------------------------------

struct ProfileTabView: View {
    let user: AppUser
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var themeMode: String = "dark"

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        // Avatar card with Glass styling
                        GlassCard {
                            VStack(spacing: AppTheme.Spacing.md) {
                                ZStack {
                                    Circle()
                                        .fill(Color.white.opacity(0.1))
                                        .frame(width: 88, height: 88)
                                        .overlay(Circle().stroke(Color.white.opacity(0.2), lineWidth: 1.5))
                                    Text(String((user.name ?? user.email).prefix(1)).uppercased())
                                        .font(.system(size: 36, weight: .bold)).foregroundColor(.white)
                                }

                                VStack(spacing: 4) {
                                    Text(user.name ?? "User")
                                        .font(AppTheme.Font.title3).foregroundColor(.white)
                                    Text(user.email)
                                        .font(AppTheme.Font.footnote).foregroundColor(AppTheme.Color.darkSecondary)
                                    RoleBadge(role: user.role)
                                }

                                Divider().background(Color.white.opacity(0.1))

                                VStack(spacing: 0) {
                                    if let username = user.username {
                                        ProfileRow(icon: "at", label: "Username", value: "@\(username)")
                                        Divider().background(Color.white.opacity(0.1))
                                    }
                                    ProfileRow(icon: "person.badge.key", label: "Provider", value: user.provider.capitalized)
                                    Divider().background(Color.white.opacity(0.1))
                                    ProfileRow(icon: "checkmark.shield", label: "Session", value: "Active (Encrypted)")
                                }
                            }
                        }

                        // App Appearance Theme Selector (Matches Android Profile)
                        GlassCard {
                            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                                Text("App Appearance")
                                    .font(AppTheme.Font.headline).foregroundColor(.white)

                                HStack(spacing: 6) {
                                    ForEach(["system", "light", "dark"], id: \.self) { mode in
                                        let selected = themeMode == mode
                                        Button(action: {
                                            themeMode = mode
                                            authViewModel.setThemeMode(mode)
                                        }) {
                                            Text(mode.capitalized)
                                                .font(.system(size: 13, weight: selected ? .bold : .regular))
                                                .foregroundColor(selected ? Color.black : .white)
                                                .frame(maxWidth: .infinity)
                                                .padding(.vertical, 8)
                                                .background(selected ? Color.white : Color.white.opacity(0.06))
                                                .cornerRadius(8)
                                        }
                                    }
                                }
                                .padding(4)
                                .background(Color.black.opacity(0.3))
                                .cornerRadius(10)
                            }
                        }

                        // Student Info Card
                        GlassCard {
                            VStack(spacing: 0) {
                                ProfileRow(icon: "envelope", label: "Email", value: user.email)
                                if let cls = user.studentClass {
                                    Divider().background(Color.white.opacity(0.1))
                                    ProfileRow(icon: "graduationcap", label: "Class", value: cls)
                                }
                            }
                        }

                        // Sign Out Button
                        VSButton(title: "Sign Out", style: .destructive) {
                            authViewModel.logout()
                        }
                        .padding(.top, AppTheme.Spacing.xs)
                    }
                    .padding(AppTheme.Spacing.md)
                    .padding(.bottom, 60)
                }
            }
            .navigationTitle("My Profile")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

private struct ProfileRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: AppTheme.Spacing.md) {
            Image(systemName: icon)
                .foregroundColor(AppTheme.Color.darkSecondary)
                .frame(width: 20)
            Text(label)
                .font(AppTheme.Font.subheadline)
                .foregroundColor(AppTheme.Color.darkSecondary)
            Spacer()
            Text(value)
                .font(AppTheme.Font.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .lineLimit(1)
        }
        .padding(.vertical, 12)
    }
}

// ---------------------------------------------------------------------------
// Academic Marks Sheet View (Detailed Performance Modal)
// ---------------------------------------------------------------------------

struct AcademicMarksSheetView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTerm: String = "Term 1 Final"

    struct SubjectMark: Identifiable {
        let id = UUID()
        let name: String
        let score: Int
        let maxScore: Int
        let classAvg: Int
        let grade: String
    }

    let subjects: [SubjectMark] = [
        SubjectMark(name: "Mathematics", score: 95, maxScore: 100, classAvg: 76, grade: "A+"),
        SubjectMark(name: "Physics", score: 91, maxScore: 100, classAvg: 72, grade: "A+"),
        SubjectMark(name: "Chemistry", score: 88, maxScore: 100, classAvg: 69, grade: "A"),
        SubjectMark(name: "Computer Science", score: 98, maxScore: 100, classAvg: 81, grade: "A+"),
        SubjectMark(name: "English Literature", score: 89, maxScore: 100, classAvg: 75, grade: "A")
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        // Term Selector
                        HStack(spacing: 8) {
                            ForEach(["Term 1 Mid", "Term 1 Final", "Term 2 Mid"], id: \.self) { term in
                                let isSel = selectedTerm == term
                                Button(action: { selectedTerm = term }) {
                                    Text(term)
                                        .font(.system(size: 12, weight: isSel ? .bold : .medium))
                                        .foregroundColor(isSel ? .black : .white)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 8)
                                        .background(isSel ? Color.white : Color.white.opacity(0.08))
                                        .cornerRadius(8)
                                }
                            }
                        }
                        .padding(.top, 8)

                        // Overview Card
                        GlassCard {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Overall Score")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                    Text("461 / 500")
                                        .font(.system(size: 24, weight: .bold))
                                        .foregroundColor(.white)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 4) {
                                    Text("Percentage")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                    Text("92.2% (Grade A+)")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundColor(AppTheme.Color.success)
                                }
                            }
                        }

                        // Subjects List
                        VStack(spacing: 10) {
                            ForEach(subjects) { sub in
                                GlassCard(padding: 14) {
                                    VStack(alignment: .leading, spacing: 8) {
                                        HStack {
                                            Text(sub.name)
                                                .font(.system(size: 15, weight: .bold))
                                                .foregroundColor(.white)
                                            Spacer()
                                            Text(sub.grade)
                                                .font(.system(size: 12, weight: .bold))
                                                .foregroundColor(AppTheme.Color.success)
                                                .padding(.horizontal, 8)
                                                .padding(.vertical, 3)
                                                .background(AppTheme.Color.success.opacity(0.15))
                                                .cornerRadius(6)
                                        }

                                        // Progress Bar
                                        GeometryReader { geo in
                                            ZStack(alignment: .leading) {
                                                RoundedRectangle(cornerRadius: 3)
                                                    .fill(Color.white.opacity(0.1))
                                                    .frame(height: 6)

                                                RoundedRectangle(cornerRadius: 3)
                                                    .fill(
                                                        LinearGradient(
                                                            colors: [Color(hex: "#6366F1"), Color(hex: "#8B5CF6")],
                                                            startPoint: .leading,
                                                            endPoint: .trailing
                                                        )
                                                    )
                                                    .frame(width: geo.size.width * CGFloat(sub.score) / CGFloat(sub.maxScore), height: 6)
                                            }
                                        }
                                        .frame(height: 6)

                                        HStack {
                                            Text("Marks: \(sub.score) / \(sub.maxScore)")
                                                .font(.system(size: 11))
                                                .foregroundColor(.white.opacity(0.8))
                                            Spacer()
                                            Text("Class Average: \(sub.classAvg)%")
                                                .font(.system(size: 11))
                                                .foregroundColor(AppTheme.Color.darkSecondary)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("Academic Performance")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundColor(.white)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Complaint Sheet View
// ---------------------------------------------------------------------------

struct ComplaintSheetView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var category: String = "Academics"
    @State private var titleText: String = ""
    @State private var descriptionText: String = ""
    @State private var isUrgent: Bool = false
    @State private var isSubmitted: Bool = false

    let categories = ["Academics", "Facilities", "Transport", "Fees", "Other"]

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        if isSubmitted {
                            GlassCard {
                                VStack(spacing: 12) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 48))
                                        .foregroundColor(AppTheme.Color.success)
                                    Text("Complaint Registered")
                                        .font(AppTheme.Font.title3)
                                        .foregroundColor(.white)
                                    Text("Your grievance has been submitted to the administration desk. Reference #VS-88192")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                        .multilineTextAlignment(.center)
                                    VSButton(title: "Done") { dismiss() }
                                }
                                .padding(.vertical, 8)
                            }
                        } else {
                            GlassCard {
                                VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
                                    Text("Grievance Category")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)

                                    ScrollView(.horizontal, showsIndicators: false) {
                                        HStack(spacing: 8) {
                                            ForEach(categories, id: \.self) { cat in
                                                let isSel = category == cat
                                                Button(action: { category = cat }) {
                                                    Text(cat)
                                                        .font(.system(size: 12, weight: isSel ? .bold : .medium))
                                                        .foregroundColor(isSel ? .black : .white)
                                                        .padding(.horizontal, 12).padding(.vertical, 6)
                                                        .background(isSel ? Color.white : Color.white.opacity(0.08))
                                                        .cornerRadius(8)
                                                }
                                            }
                                        }
                                    }

                                    VSTextField(label: "Subject", text: $titleText, placeholder: "Brief summary of the issue")
                                    VSTextField(label: "Description", text: $descriptionText, placeholder: "Provide complete details...")

                                    Toggle(isOn: $isUrgent) {
                                        Text("Mark as Urgent")
                                            .font(AppTheme.Font.subheadline)
                                            .foregroundColor(.white)
                                    }
                                    .tint(AppTheme.Color.destructive)

                                    VSButton(title: "Submit Complaint") {
                                        guard !titleText.isEmpty else { return }
                                        isSubmitted = true
                                    }
                                    .padding(.top, 4)
                                }
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("File a Complaint")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }.foregroundColor(.white)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Manage Sessions Sheet View
// ---------------------------------------------------------------------------

struct ManageSessionsSheetView: View {
    @Environment(\.dismiss) private var dismiss

    struct SessionDevice: Identifiable {
        let id = UUID()
        let name: String
        let location: String
        let lastActive: String
        let isCurrent: Bool
    }

    let sessions = [
        SessionDevice(name: "Apple iPhone 15 Pro", location: "iOS App • Mumbai, India", lastActive: "Active Now", isCurrent: true),
        SessionDevice(name: "Chrome on macOS", location: "Desktop Browser • Pune, India", lastActive: "2 hours ago", isCurrent: false),
        SessionDevice(name: "Android Tablet", location: "Android App • New Delhi, India", lastActive: "3 days ago", isCurrent: false)
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        ForEach(sessions) { sess in
                            GlassCard(padding: 14) {
                                HStack(spacing: 12) {
                                    Image(systemName: sess.isCurrent ? "iphone" : "laptopcomputer")
                                        .font(.system(size: 24))
                                        .foregroundColor(sess.isCurrent ? AppTheme.Color.accent : AppTheme.Color.darkSecondary)

                                    VStack(alignment: .leading, spacing: 2) {
                                        HStack {
                                            Text(sess.name)
                                                .font(.system(size: 14, weight: .bold))
                                                .foregroundColor(.white)
                                            if sess.isCurrent {
                                                Text("THIS DEVICE")
                                                    .font(.system(size: 9, weight: .bold))
                                                    .foregroundColor(Color(hex: "#22C55E"))
                                                    .padding(.horizontal, 6).padding(.vertical, 2)
                                                    .background(Capsule().fill(Color(hex: "#22C55E").opacity(0.15)))
                                            }
                                        }
                                        Text(sess.location)
                                            .font(.system(size: 11))
                                            .foregroundColor(AppTheme.Color.darkSecondary)
                                        Text(sess.lastActive)
                                            .font(.system(size: 10))
                                            .foregroundColor(Color.white.opacity(0.5))
                                    }
                                    Spacer()
                                    if !sess.isCurrent {
                                        Button(action: {}) {
                                            Image(systemName: "trash")
                                                .font(.system(size: 14))
                                                .foregroundColor(AppTheme.Color.destructive)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("Manage Sessions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }.foregroundColor(.white)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Notification History View
// ---------------------------------------------------------------------------

struct NotificationHistoryView: View {
    @Environment(\.dismiss) private var dismiss

    struct NotificationRecord: Identifiable {
        let id = UUID()
        let title: String
        let body: String
        let time: String
        let isUnread: Bool
    }

    let notifications = [
        NotificationRecord(title: "Term 2 Examination Hall Tickets Released", body: "Please download your hall tickets from the student portal before Friday.", time: "10 mins ago", isUnread: true),
        NotificationRecord(title: "Library Due Reminder: Concepts of Physics", body: "Book due date in 2 days. Renew in app to avoid overdue penalty.", time: "1 hour ago", isUnread: true),
        NotificationRecord(title: "Fee Payment Received ₹8,500", body: "Receipt #REC-77169 generated for Term 2 tuition installment.", time: "Yesterday", isUnread: false)
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        ForEach(notifications) { notif in
                            GlassCard(padding: 14) {
                                HStack(alignment: .top, spacing: 12) {
                                    ZStack {
                                        Circle().fill(notif.isUnread ? AppTheme.Color.accent.opacity(0.2) : Color.white.opacity(0.06))
                                            .frame(width: 36, height: 36)
                                        Image(systemName: "bell.fill")
                                            .font(.system(size: 14))
                                            .foregroundColor(notif.isUnread ? AppTheme.Color.accent : AppTheme.Color.darkSecondary)
                                    }

                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(notif.title)
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(.white)
                                        Text(notif.body)
                                            .font(.system(size: 11))
                                            .foregroundColor(AppTheme.Color.darkSecondary)
                                        Text(notif.time)
                                            .font(.system(size: 9))
                                            .foregroundColor(Color.white.opacity(0.4))
                                            .padding(.top, 2)
                                    }
                                    Spacer()
                                }
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("Notifications")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }.foregroundColor(.white)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Note Detail Sheet View
// ---------------------------------------------------------------------------

struct NoteDetailSheetView: View {
    @Environment(\.dismiss) private var dismiss
    let note: GlassNavigationDrawer.NoteItem

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
                        HStack {
                            GlassPill(text: note.subject, color: note.color)
                            Spacer()
                            Text(note.date)
                                .font(AppTheme.Font.caption2)
                                .foregroundColor(AppTheme.Color.darkSecondary)
                        }

                        Text(note.title)
                            .font(AppTheme.Font.title2)
                            .foregroundColor(.white)

                        Text("Shared by \(note.teacher)")
                            .font(AppTheme.Font.caption)
                            .foregroundColor(AppTheme.Color.darkSecondary)

                        Divider().background(Color.white.opacity(0.1))

                        GlassCard {
                            Text(note.content)
                                .font(AppTheme.Font.body)
                                .foregroundColor(.white.opacity(0.9))
                                .lineSpacing(6)
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("Note Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }.foregroundColor(.white)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Courses Tab View (Student Dashboard)
// ---------------------------------------------------------------------------

struct CoursesTabView: View {
    var body: some View {
        ZStack {
            GlassBackground()

            VStack(spacing: AppTheme.Spacing.md) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "#6366F1"), Color(hex: "#A855F7")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 80, height: 80)
                    Image(systemName: "atom")
                        .font(.system(size: 38, weight: .bold))
                        .foregroundColor(.white)
                }

                Text("Courses")
                    .font(AppTheme.Font.title1)
                    .foregroundColor(.white)

                Text("Coming Soon")
                    .font(AppTheme.Font.headline)
                    .foregroundColor(AppTheme.Color.accent)
            }
            .padding()
        }
    }
}
