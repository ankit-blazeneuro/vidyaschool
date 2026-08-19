import SwiftUI
import Shared

// ---------------------------------------------------------------------------
// Search Tab — mirrors Android SearchTabContent with iOS Glass UI
// ---------------------------------------------------------------------------

struct SearchTabView: View {
    let user: AppUser
    let onTabSelect: (Int) -> Void

    @State private var query = ""
    @State private var activeFilter = "All"
    @StateObject private var vm = SearchViewModel()

    private struct PageItem: Identifiable {
        let id = UUID()
        let name: String
        let description: String
        let icon: String
        let tabIndex: Int
    }

    private var pages: [PageItem] {
        var items = [
            PageItem(name: "Home Dashboard",    description: "Access stats & shortcuts",          icon: "house.fill",                  tabIndex: 0),
            PageItem(name: "Notice Board",       description: "School announcements",              icon: "bell.fill",                   tabIndex: 1),
            PageItem(name: "My Profile",         description: "Settings & session info",           icon: "person.crop.circle.fill",     tabIndex: 4),
        ]
        if user.role.lowercased() == "student" {
            items.insert(PageItem(name: "Pay Fees", description: "Manage dues & pay online", icon: "indianrupeesign.circle.fill", tabIndex: 2), at: 2)
            items.insert(PageItem(name: "Library",  description: "Books & borrowings",       icon: "books.vertical.fill",         tabIndex: 2), at: 3)
        } else {
            items.insert(PageItem(name: "Library",  description: "Manage borrowings",        icon: "books.vertical.fill",         tabIndex: 2), at: 2)
        }
        return items
    }

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                VStack(spacing: 0) {
                    // Frosted Glass Search bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(AppTheme.Color.darkSecondary)
                        TextField("Search pages, users...", text: $query)
                            .foregroundColor(.white)
                            .textInputAutocapitalization(.never)
                            .disableAutocorrection(true)
                            .onChange(of: query) { q in vm.search(query: q) }
                        if !query.isEmpty {
                            Button(action: { query = ""; vm.clear() }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(AppTheme.Color.darkSecondary)
                            }
                        }
                    }
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                            .fill(Color.white.opacity(0.08))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                            .stroke(AppTheme.Gradient.glassBorder, lineWidth: 1)
                    )
                    .padding(.horizontal, AppTheme.Spacing.md)
                    .padding(.top, AppTheme.Spacing.sm)

                    // Frosted Glass Filter pills
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: AppTheme.Spacing.sm) {
                            ForEach(["All", "Pages", "Users"], id: \.self) { f in
                                let sel = activeFilter == f
                                Button(action: { activeFilter = f }) {
                                    Text(f)
                                        .font(AppTheme.Font.caption)
                                        .fontWeight(sel ? .bold : .medium)
                                        .foregroundColor(sel ? .black : .white)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 7)
                                        .background(sel ? Color.white : Color.white.opacity(0.08))
                                        .cornerRadius(AppTheme.Radius.full)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: AppTheme.Radius.full)
                                                .stroke(sel ? Color.clear : Color.white.opacity(0.18), lineWidth: 1)
                                        )
                                }
                            }
                        }
                        .padding(.horizontal, AppTheme.Spacing.md)
                        .padding(.vertical, AppTheme.Spacing.sm)
                    }

                    // Results
                    if vm.isLoading {
                        Spacer()
                        ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white))
                        Spacer()
                    } else {
                        ScrollView {
                            LazyVStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
                                // Pages section
                                if activeFilter == "All" || activeFilter == "Pages" {
                                    SearchGroupHeader(title: "Pages & Features")
                                    ForEach(pages) { page in
                                        SearchResultRow(
                                            title: page.name,
                                            subtitle: page.description,
                                            icon: page.icon,
                                            category: "PAGE"
                                        ) { onTabSelect(page.tabIndex) }
                                    }
                                }

                                // Users section
                                if (activeFilter == "All" || activeFilter == "Users") && !vm.users.isEmpty {
                                    SearchGroupHeader(title: "Users (\(vm.users.count))")
                                    ForEach(vm.users, id: \.username) { u in
                                        SearchResultRow(
                                            title: u.name,
                                            subtitle: "@\(u.username)",
                                            icon: "person.fill",
                                            category: u.role.uppercased()
                                        ) {}
                                    }
                                }

                                if query.isEmpty {
                                    Text("Type to search pages or users")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                        .frame(maxWidth: .infinity)
                                        .padding(.top, AppTheme.Spacing.xl)
                                }
                            }
                            .padding(AppTheme.Spacing.md)
                            .padding(.bottom, 60)
                        }
                    }
                }
            }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

private struct SearchGroupHeader: View {
    let title: String
    var body: some View {
        Text(title.uppercased())
            .font(.system(size: 11, weight: .bold))
            .foregroundColor(AppTheme.Color.darkSecondary)
            .padding(.bottom, 4)
    }
}

private struct SearchResultRow: View {
    let title: String
    let subtitle: String
    let icon: String
    let category: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            GlassCard(padding: 12) {
                HStack(spacing: AppTheme.Spacing.sm) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.white.opacity(0.08))
                            .frame(width: 34, height: 34)
                        Image(systemName: icon)
                            .font(.system(size: 14))
                            .foregroundColor(.white)
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(title)
                            .font(.system(size: 13.5, weight: .semibold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        if !subtitle.isEmpty {
                            Text(subtitle)
                                .font(.system(size: 11.5))
                                .foregroundColor(AppTheme.Color.darkSecondary)
                                .lineLimit(1)
                        }
                    }
                    Spacer()
                    GlassPill(text: category.uppercased(), color: AppTheme.Color.accent)
                }
            }
        }
        .buttonStyle(.plain)
    }
}


// ---------------------------------------------------------------------------
// SearchViewModel
// ---------------------------------------------------------------------------

@MainActor
final class SearchViewModel: ObservableObject {
    @Published var users: [SearchUserResponse] = []
    @Published var isLoading = false

    private let apiClient = ApiClient()
    private let sessionStorage = SessionStorage()
    private var searchTask: Task<Void, Never>?

    func search(query: String) {
        searchTask?.cancel()
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty else { clear(); return }
        searchTask = Task {
            try? await Task.sleep(nanoseconds: 300_000_000)
            guard !Task.isCancelled else { return }
            isLoading = true
            guard let token = sessionStorage.getSessionToken() else { isLoading = false; return }
            do {
                users = try await apiClient.searchUsers(authToken: token, query: query)
            } catch {}
            isLoading = false
        }
    }

    func clear() { users = []; isLoading = false }
}
