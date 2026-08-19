import SwiftUI
import Shared

// ---------------------------------------------------------------------------
// Slider Management View
// ---------------------------------------------------------------------------

struct SliderManagementView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AdminViewModel()

    @State private var newTitle: String = ""
    @State private var newUrl: String = ""
    @State private var newTargetAudience: String = "all"

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                if viewModel.isLoading && viewModel.sliderImages.isEmpty {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    ScrollView {
                        VStack(spacing: AppTheme.Spacing.md) {
                            // Info card
                            GlassCard {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Image Slider Control")
                                        .font(AppTheme.Font.headline)
                                        .foregroundColor(.white)
                                    Text("Enable, disable, target, or delete sliding banner cards on the home page.")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                }
                            }

                            // Current slider images list
                            ForEach(viewModel.sliderImages, id: \.id) { img in
                                SliderImageRow(image: img, onToggle: { updatedEnabled in
                                    var updated = viewModel.sliderImages
                                    if let idx = updated.firstIndex(where: { $0.id == img.id }) {
                                        updated[idx] = SliderImage(
                                            id: img.id,
                                            url: img.url,
                                            title: img.title,
                                            enabled: updatedEnabled,
                                            targetAudience: img.targetAudience,
                                            targetClasses: img.targetClasses
                                        )
                                        viewModel.updateSliderImages(images: updated)
                                    }
                                }, onDelete: {
                                    let updated = viewModel.sliderImages.filter { $0.id != img.id }
                                    viewModel.updateSliderImages(images: updated)
                                }, onTargetChange: { updatedTarget in
                                    var updated = viewModel.sliderImages
                                    if let idx = updated.firstIndex(where: { $0.id == img.id }) {
                                        updated[idx] = SliderImage(
                                            id: img.id,
                                            url: img.url,
                                            title: img.title,
                                            enabled: img.enabled,
                                            targetAudience: updatedTarget,
                                            targetClasses: img.targetClasses
                                        )
                                        viewModel.updateSliderImages(images: updated)
                                    }
                                })
                            }

                            // Add New Form Card
                            GlassCard {
                                VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
                                    Text("Add New Slider Image")
                                        .font(AppTheme.Font.headline)
                                        .foregroundColor(.white)

                                    VSTextField(label: "Image Title", text: $newTitle, placeholder: "e.g. Annual Day 2026")
                                    VSTextField(label: "Image URL", text: $newUrl, placeholder: "e.g. https://example.com/banner.jpg")

                                    VStack(alignment: .leading, spacing: AppTheme.Spacing.xs) {
                                        Text("Show to:")
                                            .font(AppTheme.Font.caption)
                                            .foregroundColor(AppTheme.Color.darkSecondary)

                                        HStack(spacing: AppTheme.Spacing.sm) {
                                            AudienceChip(title: "👥 All", isSelected: newTargetAudience == "all") {
                                                newTargetAudience = "all"
                                            }
                                            AudienceChip(title: "👨‍🎓 Students", isSelected: newTargetAudience == "students") {
                                                newTargetAudience = "students"
                                            }
                                            AudienceChip(title: "👨‍🏫 Teachers", isSelected: newTargetAudience == "teachers") {
                                                newTargetAudience = "teachers"
                                            }
                                        }
                                    }

                                    VSButton(title: "Add to Slider", isLoading: viewModel.isLoading) {
                                        guard !newTitle.isEmpty, !newUrl.isEmpty else { return }
                                        let nextId = (viewModel.sliderImages.map { Int($0.id) }.max() ?? 0) + 1
                                        let newImg = SliderImage(
                                            id: Int32(nextId),
                                            url: newUrl,
                                            title: newTitle,
                                            enabled: true,
                                            targetAudience: newTargetAudience,
                                            targetClasses: "all"
                                        )
                                        viewModel.updateSliderImages(images: viewModel.sliderImages + [newImg])
                                        newTitle = ""
                                        newUrl = ""
                                        newTargetAudience = "all"
                                    }
                                }
                            }
                        }
                        .padding(AppTheme.Spacing.md)
                        .padding(.bottom, 40)
                    }
                }
            }
            .navigationTitle("Slider Management")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundColor(.white)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { viewModel.fetchSliderImages() }) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.white)
                            .padding(8)
                            .background(Circle().fill(Color.white.opacity(0.1)))
                    }
                }
            }
            .onAppear {
                viewModel.fetchSliderImages()
            }
        }
    }
}

private struct SliderImageRow: View {
    let image: SliderImage
    let onToggle: (Bool) -> Void
    let onDelete: () -> Void
    let onTargetChange: (String) -> Void

    var body: some View {
        GlassCard(padding: 12) {
            HStack(spacing: AppTheme.Spacing.md) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(image.title)
                        .font(AppTheme.Font.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                    Text("Target: \(image.targetAudience.capitalized)")
                        .font(AppTheme.Font.caption2)
                        .foregroundColor(AppTheme.Color.darkSecondary)
                }

                Spacer()

                HStack(spacing: 12) {
                    // Target cycle button
                    Button(action: {
                        let targets = ["all", "students", "teachers"]
                        let nextIdx = ((targets.firstIndex(of: image.targetAudience) ?? 0) + 1) % targets.count
                        onTargetChange(targets[nextIdx])
                    }) {
                        Text(audienceEmoji(image.targetAudience))
                            .font(.system(size: 16))
                            .padding(8)
                            .background(Color.white.opacity(0.08))
                            .cornerRadius(8)
                    }

                    // Enable/Disable switch
                    Toggle("", isOn: Binding(
                        get: { image.enabled },
                        set: { onToggle($0) }
                    ))
                    .labelsHidden()
                    .toggleStyle(SwitchToggleStyle(tint: AppTheme.Color.accent))

                    // Delete button
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .foregroundColor(AppTheme.Color.destructive)
                            .font(.system(size: 16))
                            .padding(8)
                    }
                }
            }
        }
    }

    private func audienceEmoji(_ target: String) -> String {
        switch target.lowercased() {
        case "students": return "👨‍🎓"
        case "teachers": return "👨‍🏫"
        default:         return "👥"
        }
    }
}

private struct AudienceChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(AppTheme.Font.caption2)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? AppTheme.Color.darkBackground : .white)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(isSelected ? Color.white : Color.white.opacity(0.08))
                .cornerRadius(AppTheme.Radius.full)
                .overlay(
                    RoundedRectangle(cornerRadius: AppTheme.Radius.full)
                        .stroke(isSelected ? Color.clear : Color.white.opacity(0.18), lineWidth: 1)
                )
        }
    }
}

// ---------------------------------------------------------------------------
// Create Notice View
// ---------------------------------------------------------------------------

struct CreateNoticeView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AdminViewModel()

    @State private var noticeTitle: String = ""
    @State private var noticeContent: String = ""
    @State private var targetRole: String = "all"

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.md) {
                        if viewModel.noticeSuccess {
                            GlassCard {
                                VStack(spacing: 8) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(AppTheme.Color.success)
                                        .font(.system(size: 40))
                                    Text("Notice Broadcasted Successfully!")
                                        .font(AppTheme.Font.headline)
                                        .foregroundColor(.white)
                                    Text("Announcement is live and visible on dashboards.")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                            }
                        }

                        GlassCard {
                            VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
                                Text("New School Announcement")
                                    .font(AppTheme.Font.title3)
                                    .foregroundColor(.white)

                                VSTextField(label: "Title", text: $noticeTitle, placeholder: "e.g. Science Fair Registration")

                                VStack(alignment: .leading, spacing: AppTheme.Spacing.xs) {
                                    Text("Description")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)

                                    TextEditor(text: $noticeContent)
                                        .frame(height: 120)
                                        .foregroundColor(.white)
                                        .padding(8)
                                        .background(Color.white.opacity(0.06))
                                        .cornerRadius(AppTheme.Radius.md)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: AppTheme.Radius.md)
                                                .stroke(Color.white.opacity(0.15), lineWidth: 1)
                                        )
                                }

                                VStack(alignment: .leading, spacing: AppTheme.Spacing.xs) {
                                    Text("Broadcast Target Role:")
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.darkSecondary)

                                    Picker("Role", selection: $targetRole) {
                                        Text("👥 All").tag("all")
                                        Text("👨‍🎓 Students").tag("student")
                                        Text("👨‍🏫 Teachers").tag("teacher")
                                    }
                                    .pickerStyle(.segmented)
                                    .background(Color.white.opacity(0.08))
                                    .cornerRadius(8)
                                }
                                .padding(.top, 4)

                                if let error = viewModel.errorMessage {
                                    Text(error)
                                        .font(AppTheme.Font.caption)
                                        .foregroundColor(AppTheme.Color.destructive)
                                }

                                VSButton(title: "Publish Announcement", isLoading: viewModel.isLoading) {
                                    guard !noticeTitle.isEmpty, !noticeContent.isEmpty else { return }
                                    viewModel.createNotice(title: noticeTitle, content: noticeContent, targetRole: targetRole)
                                }
                                .padding(.top, 8)
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Broadcast Notice")
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

