import SwiftUI
import Shared

// ---------------------------------------------------------------------------
// Dashboard — 5-tab navigation matching Android
// ---------------------------------------------------------------------------

struct DashboardView: View {
    let user: AppUser
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var selectedTab: Int = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeTabView(user: user, selectedTab: $selectedTab)
                .tabItem { Label("Home",    systemImage: "house") }
                .tag(0)

            NoticesTabView(user: user)
                .tabItem { Label("Notice",  systemImage: "bell") }
                .tag(1)

            // Students → Fees   |   Others → Library (community equivalent)
            if user.role.lowercased() == "student" {
                FeesView()
                    .tabItem { Label("Pay Fees", systemImage: "indianrupeesign.circle") }
                    .tag(2)
            } else {
                LibraryTabView(user: user)
                    .tabItem { Label("Library", systemImage: "books.vertical") }
                    .tag(2)
            }

            SearchTabView(user: user, onTabSelect: { selectedTab = $0 })
                .tabItem { Label("Search",  systemImage: "magnifyingglass") }
                .tag(3)

            ProfileTabView(user: user)
                .tabItem { Label("Profile", systemImage: "person.circle") }
                .tag(4)
        }
        .tint(.white)
        .onAppear {
            let appearance = UITabBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor(AppTheme.Color.darkSurface)
            UITabBar.appearance().standardAppearance    = appearance
            UITabBar.appearance().scrollEdgeAppearance  = appearance
        }
    }
}

// ---------------------------------------------------------------------------
// Home Tab
// ---------------------------------------------------------------------------

struct HomeTabView: View {
    let user: AppUser
    @Binding var selectedTab: Int
    @EnvironmentObject var authViewModel: AuthViewModel

    @State private var showingSliderSheet          = false
    @State private var showingCreateNoticeSheet    = false
    @State private var showingStudentSearchSheet   = false
    @State private var showingReceiptVerificationSheet = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.Color.darkBackground.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: AppTheme.Spacing.lg) {
                        GreetingCard(user: user)

                        switch user.role.lowercased() {
                        case "admin":
                            AdminHomeSection(
                                onShowSlider:       { showingSliderSheet = true },
                                onShowCreateNotice: { showingCreateNoticeSheet = true }
                            )
                        case "teacher":
                            TeacherHomeSection(
                                selectedTab:          $selectedTab,
                                onShowStudentSearch:  { showingStudentSearchSheet = true },
                                onShowCreateNotice:   { showingCreateNoticeSheet = true }
                            )
                        case "accounts":
                            AccountsHomeSection(
                                onShowVerifyReceipt: { showingReceiptVerificationSheet = true }
                            )
                        default:
                            StudentHomeSection(user: user, selectedTab: $selectedTab)
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Dashboard")
                            .font(AppTheme.Font.headline)
                            .foregroundColor(.white)
                        Text("Welcome, \(user.name ?? "User")")
                            .font(AppTheme.Font.caption2)
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { authViewModel.logout() }) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                }
            }
            .sheet(isPresented: $showingSliderSheet)          { SliderManagementView() }
            .sheet(isPresented: $showingCreateNoticeSheet)    { CreateNoticeView() }
            .sheet(isPresented: $showingStudentSearchSheet)   { StudentSearchView() }
            .sheet(isPresented: $showingReceiptVerificationSheet) { ReceiptVerificationView() }
        }
    }
}

// ---------------------------------------------------------------------------
// Greeting card
// ---------------------------------------------------------------------------

private struct GreetingCard: View {
    let user: AppUser

    private var greeting: String {
        let h = Calendar.current.component(.hour, from: Date())
        if h < 12 { return "Good morning" }
        if h < 17 { return "Good afternoon" }
        return "Good evening"
    }

    var body: some View {
        VSCard {
            HStack(spacing: AppTheme.Spacing.md) {
                ZStack {
                    Circle().fill(AppTheme.Color.darkOutline).frame(width: 52, height: 52)
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
                    RoleBadge(role: user.role)
                }
                Spacer()
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Quick action card
// ---------------------------------------------------------------------------

struct QuickActionCard: View {
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
                    .font(AppTheme.Font.footnote).fontWeight(.semibold)
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(AppTheme.Font.caption2)
                    .foregroundColor(AppTheme.Color.darkSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AppTheme.Spacing.md)
            .background(AppTheme.Color.darkSurface)
            .cornerRadius(AppTheme.Radius.lg)
            .overlay(RoundedRectangle(cornerRadius: AppTheme.Radius.lg)
                .stroke(AppTheme.Color.darkOutline.opacity(0.5), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

// ---------------------------------------------------------------------------
// Student home — slider placeholder + library preview + quick actions
// ---------------------------------------------------------------------------

private struct StudentHomeSection: View {
    let user: AppUser
    @Binding var selectedTab: Int
    @StateObject private var libraryVM = LibraryViewModel()

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            // Library preview (matches Android LibraryBooksSection)
            LibraryPreviewSection(viewModel: libraryVM, onShowMore: { selectedTab = 2 })

            SectionHeader(title: "Quick Actions")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())],
                      spacing: AppTheme.Spacing.sm) {
                QuickActionCard(icon: "indianrupeesign.circle.fill", title: "My Fees",
                                subtitle: "View & pay fees",    color: AppTheme.Color.warning,
                                action: { selectedTab = 2 })
                QuickActionCard(icon: "books.vertical.fill",       title: "Library",
                                subtitle: "Books & borrowings", color: AppTheme.Color.accent,
                                action: { selectedTab = 2 })
                QuickActionCard(icon: "bell.fill",                 title: "Notices",
                                subtitle: "Announcements",      color: AppTheme.Color.success,
                                action: { selectedTab = 1 })
                QuickActionCard(icon: "person.fill",               title: "Profile",
                                subtitle: "Your information",   color: AppTheme.Color.darkSecondary,
                                action: { selectedTab = 4 })
            }

            if let cls = user.studentClass, !cls.isEmpty {
                VSCard {
                    HStack {
                        Image(systemName: "graduationcap.fill").foregroundColor(AppTheme.Color.accent)
                        Text("Class \(cls)").font(AppTheme.Font.subheadline).foregroundColor(.white)
                        Spacer()
                    }
                }
            }
        }
        .onAppear { libraryVM.fetchBorrowings() }
    }
}

// ---------------------------------------------------------------------------
// Library preview card (mirrors Android LibraryBooksSection)
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
                        .foregroundColor(AppTheme.Color.darkSecondary)
                }
            }

            if viewModel.isLoading && viewModel.borrowings.isEmpty {
                HStack { Spacer(); ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white)); Spacer() }
                    .frame(height: 80)
            } else if viewModel.borrowings.isEmpty {
                VSCard {
                    Text("No books currently issued")
                        .font(AppTheme.Font.caption).foregroundColor(AppTheme.Color.darkSecondary)
                        .frame(maxWidth: .infinity)
                }
            } else {
                VSCard {
                    VStack(spacing: 0) {
                        ForEach(Array(viewModel.borrowings.prefix(3).enumerated()), id: \.element.id) { idx, book in
                            if idx > 0 { Divider().background(AppTheme.Color.darkOutline.opacity(0.4)) }
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
                    .fill(Color.white.opacity(0.06))
                    .frame(width: 38, height: 38)
                    .overlay(RoundedRectangle(cornerRadius: AppTheme.Radius.sm)
                        .stroke(AppTheme.Color.darkOutline, lineWidth: 1))
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
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(AppTheme.Color.darkOutline, lineWidth: 1))
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
// Teacher home — schedule card + quick actions
// ---------------------------------------------------------------------------

private struct TeacherHomeSection: View {
    @Binding var selectedTab: Int
    let onShowStudentSearch: () -> Void
    let onShowCreateNotice: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            // Today's schedule card (matches Android TeacherScreen)
            VSCard {
                VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                    Text("Today's Schedule")
                        .font(AppTheme.Font.headline).foregroundColor(.white)
                    Text("• Grade 10 Math — 09:00 AM\n• Grade 12 Calculus — 11:00 AM\n• Staff Meeting — 02:00 PM")
                        .font(AppTheme.Font.subheadline)
                        .foregroundColor(Color.white.opacity(0.8))
                        .lineSpacing(4)
                }
            }

            SectionHeader(title: "Teacher Dashboard")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())],
                      spacing: AppTheme.Spacing.sm) {
                QuickActionCard(icon: "person.3.fill",       title: "Students",
                                subtitle: "Search & view",   color: AppTheme.Color.accent,
                                action: onShowStudentSearch)
                QuickActionCard(icon: "bell.fill",           title: "Notices",
                                subtitle: "Create & send",   color: AppTheme.Color.success,
                                action: onShowCreateNotice)
                QuickActionCard(icon: "books.vertical.fill", title: "Library",
                                subtitle: "Manage borrowings", color: AppTheme.Color.warning,
                                action: { selectedTab = 2 })
                QuickActionCard(icon: "chart.bar.fill",      title: "Reports",
                                subtitle: "View school stats", color: AppTheme.Color.darkSecondary,
                                action: {})
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Admin home
// ---------------------------------------------------------------------------

private struct AdminHomeSection: View {
    let onShowSlider: () -> Void
    let onShowCreateNotice: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            SectionHeader(title: "Admin Dashboard")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())],
                      spacing: AppTheme.Spacing.sm) {
                QuickActionCard(icon: "person.3.fill",      title: "Users",
                                subtitle: "Manage all users", color: AppTheme.Color.accent, action: {})
                QuickActionCard(icon: "photo.on.rectangle", title: "Slider",
                                subtitle: "Manage image slider", color: AppTheme.Color.success,
                                action: onShowSlider)
                QuickActionCard(icon: "bell.badge.fill",    title: "Notices",
                                subtitle: "Send to all roles", color: AppTheme.Color.destructive,
                                action: onShowCreateNotice)
                QuickActionCard(icon: "gearshape.fill",     title: "Settings",
                                subtitle: "App configuration", color: AppTheme.Color.warning, action: {})
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Accounts home
// ---------------------------------------------------------------------------

private struct AccountsHomeSection: View {
    let onShowVerifyReceipt: () -> Void

    var body: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            SectionHeader(title: "Accounts Dashboard")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())],
                      spacing: AppTheme.Spacing.sm) {
                QuickActionCard(icon: "indianrupeesign.circle.fill", title: "Fee Records",
                                subtitle: "View all fees",    color: AppTheme.Color.warning, action: {})
                QuickActionCard(icon: "doc.text.fill",               title: "Receipts",
                                subtitle: "Verify receipts",  color: AppTheme.Color.success,
                                action: onShowVerifyReceipt)
                QuickActionCard(icon: "person.fill.checkmark",       title: "Payments",
                                subtitle: "Mark fees paid",   color: AppTheme.Color.accent, action: {})
                QuickActionCard(icon: "chart.pie.fill",               title: "Reports",
                                subtitle: "Financial summary", color: AppTheme.Color.darkSecondary, action: {})
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Profile Tab — matches Android ProfileTabContent
// ---------------------------------------------------------------------------

struct ProfileTabView: View {
    let user: AppUser
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var themeMode: String = "dark"

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.Color.darkBackground.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        // Avatar + info card
                        VSCard {
                            VStack(spacing: AppTheme.Spacing.md) {
                                ZStack {
                                    Circle().fill(AppTheme.Color.darkSurface2)
                                        .frame(width: 88, height: 88)
                                        .overlay(Circle().stroke(AppTheme.Color.darkOutline, lineWidth: 1))
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
                                Divider().background(AppTheme.Color.darkOutline)
                                VStack(spacing: 0) {
                                    if let username = user.username {
                                        ProfileRow(icon: "at",           label: "Username", value: "@\(username)")
                                        Divider().background(AppTheme.Color.darkOutline)
                                    }
                                    ProfileRow(icon: "person.badge.key", label: "Provider", value: user.provider.capitalized)
                                    Divider().background(AppTheme.Color.darkOutline)
                                    ProfileRow(icon: "checkmark.shield", label: "Session",  value: "Active")
                                }
                            }
                            .frame(maxWidth: .infinity)
                        }

                        // App Appearance (matches Android theme toggle)
                        VSCard {
                            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                                Text("App Appearance")
                                    .font(AppTheme.Font.headline).foregroundColor(.white)
                                HStack(spacing: 4) {
                                    ForEach(["system","light","dark"], id: \.self) { mode in
                                        let selected = themeMode == mode
                                        Button(action: { themeMode = mode }) {
                                            Text(mode.capitalized)
                                                .font(AppTheme.Font.caption)
                                                .fontWeight(selected ? .semibold : .regular)
                                                .foregroundColor(selected ? AppTheme.Color.darkBackground : .white)
                                                .frame(maxWidth: .infinity)
                                                .padding(.vertical, 8)
                                                .background(selected ? Color.white : Color.clear)
                                                .cornerRadius(6)
                                        }
                                    }
                                }
                                .padding(4)
                                .background(Color.white.opacity(0.06))
                                .cornerRadius(8)
                            }
                        }

                        // Info rows card
                        VSCard {
                            VStack(spacing: 0) {
                                ProfileRow(icon: "envelope",    label: "Email", value: user.email)
                                if let cls = user.studentClass {
                                    Divider().background(AppTheme.Color.darkOutline)
                                    ProfileRow(icon: "graduationcap", label: "Class", value: cls)
                                }
                            }
                        }

                        VSButton(title: "Sign Out", style: .destructive) {
                            authViewModel.logout()
                        }
                        .padding(.top, AppTheme.Spacing.sm)
                    }
                    .padding(AppTheme.Spacing.md)
                }
            }
            .navigationTitle("My Profile")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

private struct ProfileRow: View {
    let icon: String; let label: String; let value: String
    var body: some View {
        HStack(spacing: AppTheme.Spacing.md) {
            Image(systemName: icon).foregroundColor(AppTheme.Color.darkSecondary).frame(width: 20)
            Text(label).font(AppTheme.Font.subheadline).foregroundColor(AppTheme.Color.darkSecondary)
            Spacer()
            Text(value).font(AppTheme.Font.subheadline).foregroundColor(.white).lineLimit(1)
        }
        .padding(.vertical, 12)
        .padding(.horizontal, AppTheme.Spacing.xs)
    }
}

struct SectionHeader: View {
    let title: String
    var body: some View {
        HStack {
            Text(title).font(AppTheme.Font.headline).foregroundColor(.white)
            Spacer()
        }
    }
}
