import SwiftUI
import Shared

struct NoticesTabView: View {
    let user: AppUser
    @StateObject private var viewModel = NoticesViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                if viewModel.isLoading && viewModel.notices.isEmpty {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else if viewModel.notices.isEmpty {
                    VStack(spacing: AppTheme.Spacing.md) {
                        Image(systemName: "bell.slash")
                            .font(.system(size: 48))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                        Text("No notices yet")
                            .font(AppTheme.Font.subheadline)
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: AppTheme.Spacing.md) {
                            ForEach(viewModel.notices, id: \.id) { notice in
                                NoticeCard(notice: notice)
                            }
                        }
                        .padding(AppTheme.Spacing.md)
                        .padding(.bottom, 60)
                    }
                }
            }
            .navigationTitle("Notice Board")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { viewModel.fetchNotices() }) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.white)
                            .padding(8)
                            .background(Circle().fill(Color.white.opacity(0.1)))
                    }
                }
            }
            .onAppear {
                viewModel.fetchNotices()
            }
        }
    }
}

private struct NoticeCard: View {
    let notice: NoticeResponse

    private var categoryText: String {
        if notice.isUrgent {
            return "Urgent"
        } else if !notice.category.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return notice.category
        } else {
            return "Notice"
        }
    }

    private var formattedDate: String {
        return String(notice.createdAt.prefix(10))
    }

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                HStack {
                    // Urgent/Category Glass Badge
                    GlassPill(
                        text: categoryText.uppercased(),
                        icon: notice.isUrgent ? "exclamationmark.triangle.fill" : "bell.fill",
                        color: notice.isUrgent ? AppTheme.Color.destructive : AppTheme.Color.accent
                    )

                    Spacer()

                    Text(formattedDate)
                        .font(AppTheme.Font.caption2)
                        .foregroundColor(AppTheme.Color.darkSecondary)
                }

                Text(notice.title)
                    .font(AppTheme.Font.headline)
                    .foregroundColor(.white)

                if let sender = notice.senderName, !sender.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Text("By \(sender)")
                        .font(.system(size: 12))
                        .foregroundColor(AppTheme.Color.darkSecondary)
                }

                Text(notice.content)
                    .font(AppTheme.Font.subheadline)
                    .foregroundColor(Color.white.opacity(0.85))
                    .lineSpacing(4)
            }
        }
    }
}

