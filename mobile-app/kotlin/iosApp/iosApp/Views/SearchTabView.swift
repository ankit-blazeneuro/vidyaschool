import SwiftUI
import Shared

// ---------------------------------------------------------------------------
// Search Tab — mirrors Android SearchTabContent
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
            PageItem(name: "Home Dashboard",    description: "Access stats & shortcuts",          icon: "house",                  tabIndex: 0),
            PageItem(name: "Notice Board",       description: "School announcements",              icon: "bell",                   tabIndex: 1),
            PageItem(name: "My Profile",         description: "Settings & session info",           icon: "person.circle",          tabIndex: 4),
        ]
        if user.role.lowercased() == "student" {
            items.insert(PageItem(name: "Pay Fees", description: "Manage dues & pay online", icon: "indianrupeesign.circle", tabIndex: 2), at: 2)
            items.insert(PageItem(name: "Library",  description: "Books & borrowings",       icon: "books.vertical",         tabIndex: 2), at: 3)
        } else {
            items.insert(PageItem(name: "Library",  description: "Manage borrowings",        icon: "books.vertical",         tabIndex: 2), at: 2)
        }
        return items
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.Color.darkBackground.ignoresSafeArea()
                VStack(spacing: 0) {
                    // Search bar
                    HStack {
                        Image(systemName: "magnifyingglass").foregroundColor(AppTheme.Color.darkSecondary)
                        TextField("Search pages, users...", text: $query)
                            .foregroundColor(.white)
                            .textInputAutocapitalization(.never)
                            .disableAutocorrection(true)
                            .onChange(of: query) { q in vm.search(query: q) }
                        if !query.isEmpty {
                            Button(action: { query = ""; vm.clear() }) {
                                Image(systemName: "xmark.circle.fill").foregroundColor(AppTheme.Color.darkSecondary)
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.sm)
                    .background(AppTheme.Color.darkSurface)
                    .cornerRadius(AppTheme.Radius.md)
                    .overlay(RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                        .stroke(AppTheme.Color.darkOutline, lineWidth: 1))
                    .padding(.horizontal, AppTheme.Spacing.md)
                    .padding(.top, AppTheme.Spacing.sm)

                    // Filter pills
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: AppTheme.Spacing.sm) {
                            ForEach(["All","Pages","Users"], id: \.self) { f in
                                let sel = activeFilter == f
                                Button(action: { activeFilter = f }) {
                                    Text(f)
                                        .font(AppTheme.Font.caption).fontWeight(.medium)
                                        .foregroundColor(sel ? AppTheme.Color.darkBackground : .white)
                                        .padding(.horizontal, 14).padding(.vertical, 6)
                                        .background(sel ? Color.white : Color.clear)
                                        .cornerRadius(6)
                                        .overlay(RoundedRectangle(cornerRadius: 6)
                                            .stroke(sel ? Color.clear : AppTheme.Color.darkOutline, lineWidth: 1))
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
            HStack(spacing: AppTheme.Spacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.white.opacity(0.06))
                        .frame(width: 34, height: 34)
                    Image(systemName: icon)
                        .font(.system(size: 14))
                        .foregroundColor(Color.white.opacity(0.7))
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 13.5, weight: .semibold))
                        .foregroundColor(.white).lineLimit(1)
                    Text(subtitle)
                        .font(.system(size: 11.5))
                        .foregroundColor(AppTheme.Color.darkSecondary).lineLimit(1)
                }
                Spacer()
                Text(category)
                    .font(.system(size: 8.5, weight: .bold))
                    .foregroundColor(Color.white.opacity(0.7))
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .overlay(RoundedRectangle(cornerRadius: 4)
                        .stroke(AppTheme.Color.darkOutline, lineWidth: 1))
                Image(systemName: "chevron.right")
                    .font(.system(size: 11))
                    .foregroundColor(AppTheme.Color.darkSecondary)
            }
            .padding(.horizontal, AppTheme.Spacing.md)
            .padding(.vertical, 12)
            .background(AppTheme.Color.darkSurface)
            .cornerRadius(AppTheme.Radius.md)
            .overlay(RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                .stroke(AppTheme.Color.darkOutline.opacity(0.5), lineWidth: 1))
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
