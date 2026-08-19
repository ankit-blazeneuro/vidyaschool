import SwiftUI
import Shared

// ---------------------------------------------------------------------------
// AgentView — AI Assistant / AI Chat Screen (iOS equivalent of Android AgentScreen)
// ---------------------------------------------------------------------------

struct AgentView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var authViewModel: AuthViewModel

    @State private var messages: [ChatMessage] = [
        ChatMessage(
            sender: .agent,
            text: "Hello! I am your VidyaAI Assistant. How can I help you today with your class schedules, fees, library books, or academic performance?",
            timestamp: currentTimeString()
        )
    ]
    @State private var inputText: String = ""
    @State private var isThinking: Bool = false
    @State private var selectedModel: String = "VidyaAI GPT-4o"
    @State private var activeToolStatus: String? = nil
    @State private var showAttachmentPicker: Bool = false

    let availableModels = ["VidyaAI GPT-4o", "Claude 3.5 Sonnet", "Gemini 1.5 Pro"]

    let quickPrompts = [
        "📊 Calculate overall GPA & Rank",
        "📅 Show upcoming exams schedule",
        "📝 Draft a leave application",
        "💰 Check pending fee details",
        "📚 Search library catalog"
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                GlassBackground()

                VStack(spacing: 0) {
                    // Header Bar
                    headerBar

                    // Quick Prompt Pills
                    quickPromptsScrollView

                    // Chat Messages ScrollView
                    ScrollViewReader { proxy in
                        ScrollView {
                            VStack(spacing: AppTheme.Spacing.md) {
                                ForEach(messages) { msg in
                                    ChatBubbleView(message: msg)
                                }

                                if let tool = activeToolStatus {
                                    ToolExecutingBadge(toolName: tool)
                                }

                                if isThinking {
                                    ThinkingIndicatorView()
                                }
                            }
                            .padding(.horizontal, AppTheme.Spacing.md)
                            .padding(.vertical, AppTheme.Spacing.sm)
                        }
                        .onChange(of: messages.count) { _ in
                            if let lastId = messages.last?.id {
                                withAnimation {
                                    proxy.scrollTo(lastId, anchor: .bottom)
                                }
                            }
                        }
                    }

                    // Input Bar
                    inputActionBar
                }
            }
            .navigationBarHidden(true)
        }
    }

    // Header bar with model picker & controls
    private var headerBar: some View {
        HStack(spacing: AppTheme.Spacing.sm) {
            Button(action: { dismiss() }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .padding(8)
                    .background(Circle().fill(Color.white.opacity(0.1)))
            }

            // AI Avatar & Title
            HStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "#6366F1"), Color(hex: "#A855F7")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 36, height: 36)
                    Image(systemName: "sparkles")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text("VidyaAI Agent")
                            .font(AppTheme.Font.headline)
                            .foregroundColor(.white)

                        Circle()
                            .fill(Color(hex: "#22C55E"))
                            .frame(width: 6, height: 6)
                    }

                    Picker("Model", selection: $selectedModel) {
                        ForEach(availableModels, id: \.self) { model in
                            Text(model).tag(model)
                        }
                    }
                    .pickerStyle(.menu)
                    .tint(AppTheme.Color.darkSecondary)
                    .scaleEffect(0.85, anchor: .leading)
                }
            }

            Spacer()

            // Clear conversation button
            Button(action: clearChat) {
                Image(systemName: "trash")
                    .font(.system(size: 15))
                    .foregroundColor(AppTheme.Color.darkSecondary)
                    .padding(8)
                    .background(Circle().fill(Color.white.opacity(0.1)))
            }
        }
        .padding(.horizontal, AppTheme.Spacing.md)
        .padding(.vertical, AppTheme.Spacing.sm)
        .background(.ultraThinMaterial)
    }

    // Quick prompt pills
    private var quickPromptsScrollView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(quickPrompts, id: \.self) { prompt in
                    Button(action: { sendUserMessage(prompt) }) {
                        Text(prompt)
                            .font(AppTheme.Font.caption)
                            .foregroundColor(.white.opacity(0.9))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 7)
                            .background(
                                Capsule()
                                    .fill(Color.white.opacity(0.08))
                                    .overlay(Capsule().stroke(Color.white.opacity(0.18), lineWidth: 1))
                            )
                    }
                }
            }
            .padding(.horizontal, AppTheme.Spacing.md)
            .padding(.vertical, 8)
        }
        .background(Color.black.opacity(0.2))
    }

    // Bottom input bar
    private var inputActionBar: some View {
        HStack(spacing: 10) {
            Button(action: { showAttachmentPicker = true }) {
                Image(systemName: "paperclip")
                    .font(.system(size: 18))
                    .foregroundColor(AppTheme.Color.darkSecondary)
            }

            HStack {
                TextField("Ask VidyaAI assistant...", text: $inputText)
                    .foregroundColor(.white)
                    .font(AppTheme.Font.subheadline)
                    .onSubmit { handleSend() }

                if !inputText.isEmpty {
                    Button(action: { inputText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(AppTheme.Color.darkSecondary)
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color.white.opacity(0.08))
            .cornerRadius(20)
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.15), lineWidth: 1))

            Button(action: handleSend) {
                ZStack {
                    Circle()
                        .fill(inputText.trimmingCharacters(in: .whitespaces).isEmpty ? Color.white.opacity(0.1) : AppTheme.Color.accent)
                        .frame(width: 40, height: 40)
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            .disabled(inputText.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(.horizontal, AppTheme.Spacing.md)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
    }

    private func handleSend() {
        let text = inputText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        inputText = ""
        sendUserMessage(text)
    }

    private func sendUserMessage(_ text: String) {
        let userMsg = ChatMessage(sender: .user, text: text, timestamp: currentTimeString())
        messages.append(userMsg)
        isThinking = true

        // Simulate tool execution & AI response
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            activeToolStatus = "Executing database query..."
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) {
            activeToolStatus = nil
            isThinking = false
            let aiResponse = generateSimulatedResponse(for: text)
            let aiMsg = ChatMessage(sender: .agent, text: aiResponse, timestamp: currentTimeString())
            messages.append(aiMsg)
        }
    }

    private func clearChat() {
        messages = [
            ChatMessage(
                sender: .agent,
                text: "Chat cleared. What can I assist you with now?",
                timestamp: currentTimeString()
            )
        ]
    }

    private func generateSimulatedResponse(for prompt: String) -> String {
        let lower = prompt.lowercased()
        if lower.contains("gpa") || lower.contains("rank") {
            return "Based on your latest exam records, your current Cumulative GPA is **3.88/4.0** (Rank #2 in Class 10-A). You scored 98.6% in Mathematics and 97.4% in Science."
        } else if lower.contains("fee") || lower.contains("pending") {
            return "You have 1 pending fee installment:\n• **Q3 Tuition Fee**: ₹12,500.00 (Due: Dec 15).\nWould you like me to open the payment screen for you?"
        } else if lower.contains("exam") || lower.contains("schedule") {
            return "Your upcoming mid-term examinations schedule:\n• **Physics**: Monday, 9:00 AM\n• **Chemistry**: Wednesday, 11:30 AM\n• **Mathematics**: Friday, 9:00 AM"
        } else if lower.contains("leave") {
            return "Here is a draft leave application for your review:\n\n*To the Principal,\nSubject: Application for Leave of Absence*\n\nRespected Sir/Madam,\nI request leave for 2 days due to personal reasons. Kindly grant me leave.\n\nThank you,\nStudent ID: 1024"
        } else {
            return "I have processed your query for '\(prompt)'. All records look up-to-date in the school database!"
        }
    }
}

// ---------------------------------------------------------------------------
// Supporting Data Models & Subviews
// ---------------------------------------------------------------------------

enum SenderType {
    case user
    case agent
}

struct ChatMessage: Identifiable {
    let id: String = UUID().uuidString
    let sender: SenderType
    let text: String
    let timestamp: String
}

private struct ChatBubbleView: View {
    let message: ChatMessage

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            if message.sender == .agent {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [Color(hex: "#6366F1"), Color(hex: "#A855F7")], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 28, height: 28)
                    Image(systemName: "sparkles")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                }
            } else {
                Spacer()
            }

            VStack(alignment: message.sender == .user ? .trailing : .leading, spacing: 4) {
                Text(message.text)
                    .font(AppTheme.Font.subheadline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        message.sender == .user ?
                        AnyView(AppTheme.Color.accent) :
                        AnyView(GlassCard(padding: 0) { Color.clear })
                    )
                    .background(message.sender == .user ? AppTheme.Color.accent : Color.white.opacity(0.08))
                    .cornerRadius(18)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(message.sender == .user ? Color.clear : Color.white.opacity(0.18), lineWidth: 1)
                    )

                Text(message.timestamp)
                    .font(.system(size: 10))
                    .foregroundColor(AppTheme.Color.darkSecondary)
                    .padding(.horizontal, 4)
            }
            .frame(maxWidth: 280, alignment: message.sender == .user ? .trailing : .leading)

            if message.sender == .user {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 28, height: 28)
                    Image(systemName: "person.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.white)
                }
            } else {
                Spacer()
            }
        }
    }
}

private struct ToolExecutingBadge: View {
    let toolName: String

    var body: some View {
        HStack(spacing: 6) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: AppTheme.Color.accent))
                .scaleEffect(0.7)
            Text(toolName)
                .font(AppTheme.Font.caption2)
                .foregroundColor(AppTheme.Color.accent)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(AppTheme.Color.accent.opacity(0.15))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppTheme.Color.accent.opacity(0.3), lineWidth: 1))
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct ThinkingIndicatorView: View {
    @State private var isAnimating = false

    var body: some View {
        HStack(spacing: 6) {
            ZStack {
                Circle()
                    .fill(LinearGradient(colors: [Color(hex: "#6366F1"), Color(hex: "#A855F7")], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 28, height: 28)
                Image(systemName: "sparkles")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)
            }

            HStack(spacing: 4) {
                ForEach(0..<3) { i in
                    Circle()
                        .fill(Color.white.opacity(0.7))
                        .frame(width: 6, height: 6)
                        .scaleEffect(isAnimating ? 1.0 : 0.5)
                        .animation(
                            Animation.easeInOut(duration: 0.6)
                                .repeatForever(autoreverses: true)
                                .delay(Double(i) * 0.2),
                            value: isAnimating
                        )
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color.white.opacity(0.08))
            .cornerRadius(16)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.15), lineWidth: 1))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onAppear { isAnimating = true }
    }
}

private func currentTimeString() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "h:mm a"
    return formatter.string(from: Date())
}

