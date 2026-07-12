import SwiftUI
import Shared

struct NoticesTabView: View {
    let user: AppUser
    @StateObject private var viewModel = NoticesViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.Color.darkBackground.ignoresSafeArea()

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
        } else if !(notice.category ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return notice.category
        } else {
            return "Notice"
        }
    }

    private var formattedDate: String {
        return String(notice.createdAt.prefix(10))
    }

    var body: some View {
        VSCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                HStack {
                    // Urgent/Category Badge
                    Text(categoryText.uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(notice.isUrgent ? AppTheme.Color.destructive : AppTheme.Color.accent)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(notice.isUrgent ? AppTheme.Color.destructive.opacity(0.15) : AppTheme.Color.accent.opacity(0.15))
                        .cornerRadius(6)

                    Spacer()

                    Text(formattedDate)
                        .font(AppTheme.Font.caption2)
                        .foregroundColor(AppTheme.Color.darkSecondary)
                }

                Text(notice.title)
                    .font(AppTheme.Font.headline)
                    .foregroundColor(.white)

                Text(notice.content)
                    .font(AppTheme.Font.subheadline)
                    .foregroundColor(Color.white.opacity(0.85))
                    .lineSpacing(4)

                if let sender = notice.senderName, !sender.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    HStack {
                        Spacer()
                        Text("— \(sender)")
                            .font(.system(size: 11, weight: .medium, design: .default))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                    .padding(.top, 4)
                }
            }
        }
    }
}
