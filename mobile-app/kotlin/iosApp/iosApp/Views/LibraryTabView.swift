import SwiftUI
import Shared

struct LibraryTabView: View {
    let user: AppUser
    @StateObject private var viewModel = LibraryViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                if viewModel.isLoading && viewModel.borrowings.isEmpty {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else if viewModel.borrowings.isEmpty {
                    VStack(spacing: AppTheme.Spacing.md) {
                        Image(systemName: "books.vertical")
                            .font(.system(size: 48))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                        Text("No books currently issued")
                            .font(AppTheme.Font.subheadline)
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: AppTheme.Spacing.md) {
                            ForEach(viewModel.borrowings, id: \.id) { book in
                                BookBorrowingCard(book: book) {
                                    viewModel.renewBook(bookId: book.id)
                                }
                            }
                        }
                        .padding(AppTheme.Spacing.md)
                        .padding(.bottom, 60)
                    }
                }
            }
            .navigationTitle("Library Hub")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { viewModel.fetchBorrowings() }) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.white)
                            .padding(8)
                            .background(Circle().fill(Color.white.opacity(0.1)))
                    }
                }
            }
            .onAppear {
                viewModel.fetchBorrowings()
            }
        }
    }
}

private struct BookBorrowingCard: View {
    let book: StudentBorrowingResponse
    let onRenew: () -> Void

    private var renewalsLeft: Int {
        return Int(3 - book.renewalsCount)
    }

    var body: some View {
        GlassCard {
            HStack(spacing: AppTheme.Spacing.md) {
                // Glass initial avatar
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.Radius.sm)
                        .fill(Color.white.opacity(0.08))
                        .frame(width: 52, height: 52)
                        .overlay(
                            RoundedRectangle(cornerRadius: AppTheme.Radius.sm)
                                .stroke(Color.white.opacity(0.18), lineWidth: 1)
                        )
                    Text(String(book.title.prefix(1)).uppercased())
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text(book.title)
                        .font(AppTheme.Font.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .lineLimit(1)
                    Text(book.author)
                        .font(AppTheme.Font.caption2)
                        .foregroundColor(AppTheme.Color.darkSecondary)
                        .lineLimit(1)

                    HStack(spacing: 8) {
                        let isOverdue = book.status.lowercased() == "overdue"
                        Text(isOverdue ? "Overdue - Due \(formatIsoDate(book.dueDate))" : "Due \(formatIsoDate(book.dueDate))")
                            .font(.system(size: 10, weight: isOverdue ? .bold : .regular))
                            .foregroundColor(isOverdue ? AppTheme.Color.destructive : AppTheme.Color.darkSecondary)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(isOverdue ? AppTheme.Color.destructive.opacity(0.15) : Color.white.opacity(0.07))
                            .cornerRadius(6)

                        // Pip track (Glass style)
                        HStack(spacing: 3) {
                            ForEach(0..<3) { i in
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(i < Int(book.renewalsCount) ? Color.white.opacity(0.15) : Color.white.opacity(0.7))
                                    .frame(width: 10, height: 4)
                            }
                        }

                        Text("\(renewalsLeft) left")
                            .font(.system(size: 10))
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                }

                Spacer()

                if renewalsLeft > 0 {
                    Button(action: {
                        let generator = UIImpactFeedbackGenerator(style: .medium)
                        generator.impactOccurred()
                        onRenew()
                    }) {
                        Text("Renew")
                            .font(AppTheme.Font.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Capsule().fill(Color.white.opacity(0.1)))
                            .overlay(
                                Capsule()
                                    .stroke(Color.white.opacity(0.25), lineWidth: 1)
                            )
                    }
                } else {
                    Text("Max")
                        .font(AppTheme.Font.caption)
                        .fontWeight(.medium)
                        .foregroundColor(Color.white.opacity(0.35))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.06))
                        .cornerRadius(8)
                }
            }
        }
    }

    private func formatIsoDate(_ isoStr: String) -> String {
        let parts = isoStr.split(separator: "T")
        guard let datePart = parts.first else { return isoStr }
        let dateComponents = datePart.split(separator: "-")
        guard dateComponents.count == 3 else { return isoStr }

        let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        guard let year = dateComponents.first,
              let monthNum = Int(dateComponents[1]),
              let day = Int(dateComponents[2]) else { return isoStr }

        let monthName = monthNum >= 1 && monthNum <= 12 ? months[monthNum - 1] : "Month"
        return "\(monthName) \(day), \(year)"
    }
}

