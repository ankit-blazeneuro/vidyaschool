import SwiftUI
import Shared

// ---------------------------------------------------------------------------
// Dashboard — role-based tab navigation
// ---------------------------------------------------------------------------

struct DashboardView: View {
    let user: AppUser
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedTab: Int = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeTabView(user: user, selectedTab: $selectedTab)
                .tabItem {
                    Label("Home", systemImage: "house")
                }
                .tag(0)

            LibraryTabView(user: user)
                .tabItem {
                    Label("Library", systemImage: "books.vertical")
                }
                .tag(1)

            NoticesTabView(user: user)
                .tabItem {
                    Label("Notices", systemImage: "bell")
                }
                .tag(2)

            ProfileTabView(user: user)
                .tabItem {
                    Label("Profile", systemImage: "person.circle")
                }
                .tag(3)
        }
        .tint(.white)
        .onAppear {
            let appearance = UITabBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor(AppTheme.Color.darkSurface)
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}

// ---------------------------------------------------------------------------
// Home Tab — role-branched content
// ---------------------------------------------------------------------------

struct HomeTabView: View {
    let user: AppUser
    @Binding var selectedTab: Int
    @EnvironmentObject var authViewModel: AuthViewModel

    @State private var showingFeesSheet = false
    @State private var showingSliderSheet = false
    @State private var showingCreateNoticeSheet = false
    @State private var showingStudentSearchSheet = false
    @State private var showingReceiptVerificationSheet = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.Color.darkBackground.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.lg) {
                        // Greeting card
                        GreetingCard(user: user)

                        // Role-specific quick actions
                        switch (user.role ?? "student").lowercased() {
                        case "admin":
                            AdminHomeSection(
                                onShowSlider: { showingSliderSheet = true },
                                onShowCreateNotice: { showingCreateNoticeSheet = true }
                            )
                        case "teacher":
                            TeacherHomeSection(
                                selectedTab: $selectedTab,
                                onShowStudentSearch: { showingStudentSearchSheet = true },
                                onShowCreateNotice: { showingCreateNoticeSheet = true }
                            )
                        case "accounts":
                            AccountsHomeSection(
                                onShowVerifyReceipt: { showingReceiptVerificationSheet = true }
                            )
                        default:
                            StudentHomeSection(
                                user: user,
                                selectedTab: $selectedTab,
                                onShowFees: { showingFeesSheet = true }
                            )
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Text("VidyaSchool")
                        .font(AppTheme.Font.headline)
                        .foregroundColor(.white)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { authViewModel.logout() }) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                }
            }
            .sheet(isPresented: $showingFeesSheet) {
                FeesView()
            }
            .sheet(isPresented: $showingSliderSheet) {
                SliderManagementView()
            }
            .sheet(isPresented: $showingCreateNoticeSheet) {
                CreateNoticeView()
            }
            .sheet(isPresented: $showingStudentSearchSheet) {
                StudentSearchView()
            }
            .sheet(isPresented: $showingReceiptVerificationSheet) {
                ReceiptVerificationView()
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Greeting card
// ---------------------------------------------------------------------------

private struct GreetingCard: View {
    let user: AppUser

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12:  return "Good morning"
        case 12..<17: return "Good afternoon"
        default:      return "Good evening"
        }
    }

    var body: some View {
        VSCard {
            HStack(spacing: AppTheme.Spacing.md) {
                // Avatar circle
                ZStack {
                    Circle()
                        .fill(AppTheme.Color.darkOutline)
                        .frame(width: 52, height: 52)
                    Text(String((user.name ?? user.email).prefix(1)).uppercased())
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(greeting)
                        .font(AppTheme.Font.caption)
                        .foregroundColor(AppTheme.Color.darkSecondary)
                    Text(user.name ?? user.email)
                        .font(AppTheme.Font.headline)
                        .foregroundColor(.white)
                        .lineLimit(1)
                    RoleBadge(role: user.role ?? "student")
                }
                Spacer()
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Quick action grid card
// ---------------------------------------------------------------------------

private struct QuickActionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    var color: SwiftUI.Color = AppTheme.Color.accent
    var action: () -> Void = {}

    var body: some View {
        Button(action: {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            action()
        }) {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.Radius.sm)
                        .fill(color.opacity(0.15))
                        .frame(width: 40, height: 40)
                    Image(systemName: icon)
                        .foregroundColor(color)
                        .font(.system(size: 18, weight: .medium))
                }
                Text(title)
                    .font(AppTheme.Font.footnote)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(AppTheme.Font.caption2)
                    .foregroundColor(AppTheme.Color.darkSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AppTheme.Spacing.md)
            .background(AppTheme.Color.darkSurface)
            .cornerRadius(AppTheme.Radius.lg)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.lg)
                    .stroke(AppTheme.Color.darkOutline.opacity(0.5), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// ---------------------------------------------------------------------------
// Role-specific sections
// ---------------------------------------------------------------------------

private struct StudentHomeSection: View {
    let user: AppUser
    @Binding var selectedTab: Int
    let onShowFees: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            SectionHeader(title: "Quick Actions")

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())],
                      spacing: AppTheme.Spacing.sm) {
                QuickActionCard(
                    icon: "indianrupeesign.circle.fill",
                    title: "My Fees",
                    subtitle: "View & pay fees",
                    color: AppTheme.Color.warning,
                    action: onShowFees
                )
                QuickActionCard(
                    icon: "books.vertical.fill",
                    title: "Library",
                    subtitle: "Books & borrowings",
                    color: AppTheme.Color.accent,
                    action: { selectedTab = 1 }
                )
                QuickActionCard(
                    icon: "bell.fill",
                    title: "Notices",
                    subtitle: "School announcements",
                    color: AppTheme.Color.success,
                    action: { selectedTab = 2 }
                )
                QuickActionCard(
                    icon: "person.fill",
                    title: "Profile",
                    subtitle: "Your information",
                    color: AppTheme.Color.darkSecondary,
                    action: { selectedTab = 3 }
                )
            }

            if let studentClass = user.studentClass, !studentClass.isEmpty {
                VSCard {
                    HStack {
                        Image(systemName: "graduationcap.fill")
                            .foregroundColor(AppTheme.Color.accent)
                        Text("Class \(studentClass)")
                            .font(AppTheme.Font.subheadline)
                            .foregroundColor(.white)
                        Spacer()
                    }
                }
            }
        }
    }
}

private struct TeacherHomeSection: View {
    @Binding var selectedTab: Int
    let onShowStudentSearch: () -> Void
    let onShowCreateNotice: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            SectionHeader(title: "Teacher Dashboard")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())],
                      spacing: AppTheme.Spacing.sm) {
                QuickActionCard(
                    icon: "person.3.fill",
                    title: "Students",
                    subtitle: "Search & view students",
                    color: AppTheme.Color.accent,
                    action: onShowStudentSearch
                )
                QuickActionCard(
                    icon: "bell.fill",
                    title: "Notices",
                    subtitle: "Create & send notices",
                    color: AppTheme.Color.success,
                    action: onShowCreateNotice
                )
                QuickActionCard(
                    icon: "books.vertical.fill",
                    title: "Library",
                    subtitle: "Manage borrowings",
                    color: AppTheme.Color.warning,
                    action: { selectedTab = 1 }
                )
                QuickActionCard(
                    icon: "chart.bar.fill",
                    title: "Reports",
                    subtitle: "View school stats",
                    color: AppTheme.Color.darkSecondary,
                    action: {}
                )
            }
        }
    }
}

private struct AdminHomeSection: View {
    let onShowSlider: () -> Void
    let onShowCreateNotice: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            SectionHeader(title: "Admin Dashboard")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())],
                      spacing: AppTheme.Spacing.sm) {
                QuickActionCard(
                    icon: "person.3.fill",
                    title: "Users",
                    subtitle: "Manage all users",
                    color: AppTheme.Color.accent,
                    action: {}
                )
                QuickActionCard(
                    icon: "photo.on.rectangle",
                    title: "Slider",
                    subtitle: "Manage image slider",
                    color: AppTheme.Color.success,
                    action: onShowSlider
                )
                QuickActionCard(
                    icon: "bell.badge.fill",
                    title: "Notices",
                    subtitle: "Send to all roles",
                    color: AppTheme.Color.destructive,
                    action: onShowCreateNotice
                )
                QuickActionCard(
                    icon: "gearshape.fill",
                    title: "Settings",
                    subtitle: "App configuration",
                    color: AppTheme.Color.warning,
                    action: {}
                )
            }
        }
    }
}

private struct AccountsHomeSection: View {
    let onShowVerifyReceipt: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            SectionHeader(title: "Accounts Dashboard")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())],
                      spacing: AppTheme.Spacing.sm) {
                QuickActionCard(
                    icon: "indianrupeesign.circle.fill",
                    title: "Fee Records",
                    subtitle: "View all fees",
                    color: AppTheme.Color.warning,
                    action: {}
                )
                QuickActionCard(
                    icon: "doc.text.fill",
                    title: "Receipts",
                    subtitle: "Verify receipts",
                    color: AppTheme.Color.success,
                    action: onShowVerifyReceipt
                )
                QuickActionCard(
                    icon: "person.fill.checkmark",
                    title: "Payments",
                    subtitle: "Mark fees paid",
                    color: AppTheme.Color.accent,
                    action: {}
                )
                QuickActionCard(
                    icon: "chart.pie.fill",
                    title: "Reports",
                    subtitle: "Financial summary",
                    color: AppTheme.Color.darkSecondary,
                    action: {}
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Profile Tab
// ---------------------------------------------------------------------------

struct ProfileTabView: View {
    let user: AppUser
    @EnvironmentObject var authViewModel: AuthViewModel

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.Color.darkBackground.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        // Avatar + info
                        VStack(spacing: AppTheme.Spacing.md) {
                            ZStack {
                                Circle()
                                    .fill(AppTheme.Color.darkSurface2)
                                    .frame(width: 88, height: 88)
                                    .overlay(Circle().stroke(AppTheme.Color.darkOutline, lineWidth: 1))
                                Text(String((user.name ?? user.email).prefix(1)).uppercased())
                                    .font(.system(size: 36, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            VStack(spacing: 4) {
                                Text(user.name ?? "User")
                                    .font(AppTheme.Font.title3)
                                    .foregroundColor(.white)
                                Text(user.email)
                                    .font(AppTheme.Font.footnote)
                                    .foregroundColor(AppTheme.Color.darkSecondary)
                                RoleBadge(role: user.role ?? "student")
                            }
                        }
                        .padding(.top, AppTheme.Spacing.lg)

                        // Info rows
                        VSCard {
                            VStack(spacing: 0) {
                                if let username = user.username {
                                    ProfileRow(icon: "at", label: "Username", value: "@\(username)")
                                    Divider().background(AppTheme.Color.darkOutline)
                                }
                                if let studentClass = user.studentClass {
                                    ProfileRow(icon: "graduationcap", label: "Class", value: studentClass)
                                    Divider().background(AppTheme.Color.darkOutline)
                                }
                                ProfileRow(icon: "envelope", label: "Email", value: user.email)
                                Divider().background(AppTheme.Color.darkOutline)
                                ProfileRow(icon: "person.badge.key", label: "Provider", value: (user.provider).capitalized)
                            }
                        }

                        // Logout
                        VSButton(title: "Sign Out", style: .destructive) {
                            authViewModel.logout()
                        }
                        .padding(.top, AppTheme.Spacing.sm)
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("Profile")
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
                .foregroundColor(.white)
                .lineLimit(1)
        }
        .padding(.vertical, 12)
        .padding(.horizontal, AppTheme.Spacing.xs)
    }
}

private struct SectionHeader: View {
    let title: String
    var body: some View {
        HStack {
            Text(title)
                .font(AppTheme.Font.headline)
                .foregroundColor(.white)
            Spacer()
        }
    }
}
