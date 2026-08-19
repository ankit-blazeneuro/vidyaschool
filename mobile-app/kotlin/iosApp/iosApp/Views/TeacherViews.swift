import SwiftUI
import Shared

struct StudentSearchView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = TeacherViewModel()
    @State private var searchQuery: String = ""

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                VStack(spacing: AppTheme.Spacing.md) {
                    // Glass Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(AppTheme.Color.darkSecondary)
                        TextField("Search students by name...", text: $searchQuery)
                            .foregroundColor(.white)
                            .textInputAutocapitalization(.never)
                            .disableAutocorrection(true)
                            .onChange(of: searchQuery) { newValue in
                                viewModel.searchStudents(query: newValue)
                            }

                        if !searchQuery.isEmpty {
                            Button(action: {
                                searchQuery = ""
                                viewModel.searchStudents(query: "")
                            }) {
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

                    // Results
                    if viewModel.isLoading {
                        Spacer()
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        Spacer()
                    } else if viewModel.students.isEmpty {
                        Spacer()
                        VStack(spacing: AppTheme.Spacing.sm) {
                            Image(systemName: "person.crop.circle.badge.questionmark")
                                .font(.system(size: 48))
                                .foregroundColor(AppTheme.Color.darkSecondary)
                            Text(searchQuery.isEmpty ? "Type student name to search" : "No matching students found")
                                .font(AppTheme.Font.subheadline)
                                .foregroundColor(AppTheme.Color.darkSecondary)
                        }
                        Spacer()
                    } else {
                        ScrollView {
                            LazyVStack(spacing: AppTheme.Spacing.sm) {
                                ForEach(viewModel.students, id: \.username) { student in
                                    StudentRow(student: student)
                                }
                            }
                            .padding(.horizontal, AppTheme.Spacing.md)
                            .padding(.bottom, 40)
                        }
                    }
                }
            }
            .navigationTitle("Search Students")
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

private struct StudentRow: View {
    let student: SearchUserResponse

    var body: some View {
        GlassCard(padding: 12) {
            HStack(spacing: AppTheme.Spacing.md) {
                // Glass Avatar
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.08))
                        .frame(width: 44, height: 44)
                        .overlay(Circle().stroke(Color.white.opacity(0.18), lineWidth: 1))
                    Text(String(student.name.prefix(1)).uppercased())
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(student.name)
                        .font(AppTheme.Font.headline)
                        .foregroundColor(.white)
                    Text("@\(student.username)")
                        .font(AppTheme.Font.caption)
                        .foregroundColor(AppTheme.Color.darkSecondary)
                }

                Spacer()

                GlassPill(text: "Enrolled", color: AppTheme.Color.success)
            }
        }
    }
}

