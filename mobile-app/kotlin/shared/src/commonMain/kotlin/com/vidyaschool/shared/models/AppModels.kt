package com.vidyaschool.shared.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

enum class AuthProvider { GOOGLE, GITHUB, EMAIL }

data class UserInfo(
    val id: String,
    val email: String,
    val name: String?,
    val avatarUrl: String?
)

sealed class AuthResult {
    data class Success(
        val token: String,
        val provider: AuthProvider,
        val userInfo: UserInfo
    ) : AuthResult()
    data class Error(val message: String, val cause: Throwable? = null) : AuthResult()
    object Cancelled : AuthResult()
}

// ---------------------------------------------------------------------------
// Device Code Auth (Browser Login)
// ---------------------------------------------------------------------------

@Serializable
data class DeviceCodeResponse(
    @SerialName("user_code") val userCode: String,
    @SerialName("device_token") val deviceToken: String,
    @SerialName("verification_uri") val verificationUri: String,
    @SerialName("expires_in") val expiresIn: Int = 600,
    val interval: Int = 3
)

@Serializable
data class DevicePollRequest(
    @SerialName("device_token") val deviceToken: String
)

@Serializable
data class DevicePollUser(
    val email: String? = null,
    val name: String? = null,
    val role: String? = null,
    val image: String? = null,
    val `class`: String? = null
)

@Serializable
data class DevicePollResponse(
    val status: String,
    @SerialName("session_token") val sessionToken: String? = null,
    val user: DevicePollUser? = null,
    val message: String? = null
)

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class SignupRequest(
    val email: String,
    val password: String,
    val name: String,
    val role: String = "student"
)

@Serializable
data class CreateSessionRequest(
    val email: String
)

@Serializable
data class PayFeesRequest(
    @SerialName("installment_ids") val installmentIds: List<String>,
    @SerialName("payment_method") val paymentMethod: String? = "Card / Online"
)

@Serializable
data class CreateOrderRequest(
    @SerialName("installment_ids") val installmentIds: List<String>,
    val amount: Int,
    val receipt: String? = null
)

@Serializable
data class VerifyPaymentRequest(
    @SerialName("order_id") val orderId: String,
    @SerialName("payment_id") val paymentId: String,
    val signature: String,
    @SerialName("installment_ids") val installmentIds: List<String>,
    @SerialName("payment_method") val paymentMethod: String = "Razorpay"
)

@Serializable
data class ProfileUpdateRequest(
    val username: String? = null,
    val phoneNumber: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val pincode: String? = null,
    val parentName: String? = null,
    val parentPhone: String? = null,
    val parentEmail: String? = null,
    @SerialName("class") val class_: String? = null,
    val section: String? = null
)

@Serializable
data class OnboardingSubmitRequest(
    val admissionNumber: String? = null,
    val username: String,
    val phoneNumber: String? = null,
    val parentName: String? = null,
    val parentPhone: String? = null,
    val parentEmail: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val pincode: String? = null,
    @SerialName("class") val class_: String? = null,
    val section: String? = null,
    @SerialName("transportMode") val transportMode: String? = null
)

@Serializable
data class StudentRenewRequest(
    val id: String
)

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

@Serializable
data class User(
    val id: String,
    val email: String,
    val name: String? = null,
    val role: String? = null,
    val image: String? = null
)

@Serializable
data class Session(
    val token: String,
    val expiresAt: String
)

@Serializable
data class LoginResponse(
    val user: User? = null,
    val token: String? = null,
    val session: Session? = null,
    val message: String? = null
)

@Serializable
data class SignupResponse(
    val user: User? = null,
    val token: String? = null,
    val message: String? = null
)

@Serializable
data class UserRoleResponse(
    val role: String,
    val name: String? = null,
    val image: String? = null,
    @SerialName("student_class") val studentClass: String? = null
)

@Serializable
data class SessionDetails(
    val id: String,
    val token: String,
    val expiresAt: String
)

@Serializable
data class CreateSessionResponse(
    val success: Boolean,
    val session: SessionDetails? = null
)

@Serializable
data class VerifySessionResponse(
    val valid: Boolean,
    val role: String? = null,
    val name: String? = null,
    val image: String? = null,
    @SerialName("student_class") val studentClass: String? = null,
    val username: String? = null
)

@Serializable
data class SliderImage(
    val id: Int,
    val url: String,
    val title: String,
    val enabled: Boolean,
    @SerialName("target_audience") val targetAudience: String = "all",
    @SerialName("target_classes") val targetClasses: String = "all"
)

@Serializable
data class UpdateSliderImagesResponse(
    val success: Boolean,
    val images: List<SliderImage>
)

@Serializable
data class FeeInstallment(
    val id: String,
    @SerialName("user_id") val userId: String,
    val month: String,
    val year: String,
    val amount: Double,
    @SerialName("due_date") val dueDate: String? = null,
    val status: String,
    @SerialName("paid_date") val paidDate: String? = null,
    @SerialName("receipt_no") val receiptNo: String? = null,
    @SerialName("payment_method") val paymentMethod: String? = null,
    @SerialName("qr_data_url") val qrDataUrl: String? = null
)

@Serializable
data class PayFeesResponse(
    val success: Boolean,
    @SerialName("receipt_no") val receiptNo: String? = null,
    @SerialName("paid_date") val paidDate: String? = null
)

@Serializable
data class CreateOrderResponse(
    @SerialName("order_id") val orderId: String? = null,
    val amount: Int? = null,
    val currency: String? = null,
    val receipt: String? = null,
    @SerialName("installment_ids") val installmentIds: List<String>? = null,
    @SerialName("key_id") val keyId: String? = null,
    @SerialName("mock_payment") val mockPayment: Boolean? = false
)

@Serializable
data class NotificationHistoryItem(
    val id: String,
    val title: String,
    val body: String,
    @SerialName("created_at") val createdAt: String
)

@Serializable
data class SearchUserResponse(
    val name: String,
    val username: String,
    val role: String
)

@Serializable
data class UserProfileData(
    val id: String? = null,
    @SerialName("user_id") val userId: String? = null,
    val admissionNumber: String? = null,
    val username: String? = null,
    val phoneNumber: String? = null,
    val parentName: String? = null,
    val parentPhone: String? = null,
    val parentEmail: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val pincode: String? = null,
    @SerialName("class") val studentClass: String? = null,
    val section: String? = null,
    val secondaryRole: String? = null,
    val transportMode: String? = null,
    val onboardingCompleted: Boolean? = null,
    val classSectionLastUpdated: String? = null,
    val classSectionChanges: String? = null
)

@Serializable
data class ProfileResponse(
    val user: User? = null,
    val profile: UserProfileData? = null
)

@Serializable
data class OnboardingStatusResponse(
    @SerialName("onboardingCompleted") val onboardingCompleted: Boolean
)

@Serializable
data class StudentBorrowingResponse(
    val id: String,
    val bookId: String,
    val issueDate: String,
    val dueDate: String,
    val returnDate: String? = null,
    val renewalsCount: Int,
    val status: String,
    val title: String,
    val author: String,
    val isbn: String
)

@Serializable
data class NoticeResponse(
    val id: String,
    val title: String,
    val content: String,
    val category: String,
    @SerialName("isUrgent") val isUrgent: Boolean = false,
    @SerialName("senderId") val senderId: String? = null,
    @SerialName("targetRole") val targetRole: String? = null,
    @SerialName("targetClass") val targetClass: String? = null,
    @SerialName("targetSection") val targetSection: String? = null,
    @SerialName("createdAt") val createdAt: String,
    @SerialName("senderName") val senderName: String? = null
)

@Serializable
data class SearchBackendResponse(
    val id: String,
    val title: String,
    val content: String,
    val url: String
)

@Serializable
data class DocMarkdownResponse(
    val title: String,
    val markdown: String
)

// ---------------------------------------------------------------------------
// Student Dashboard & Academic Models
// ---------------------------------------------------------------------------

@Serializable
data class TopPerformerItem(
    val id: String? = null,
    val rank: Int? = null,
    val name: String = "",
    val percentage: Double = 0.0,
    @SerialName("student_class") val studentClass: String? = null,
    val section: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null
)

@Serializable
data class LeaderboardResponse(
    val leaderboard: List<TopPerformerItem>? = null,
    @SerialName("top_performers") val topPerformers: List<TopPerformerItem>? = null,
    @SerialName("user_rank") val userRank: Int? = null,
    @SerialName("user_percentage") val userPercentage: Double? = null,
    @SerialName("total_students") val totalStudents: Int? = null
)

@Serializable
data class StudentMarkSubject(
    val subject: String = "",
    @SerialName("marks_obtained") val marksObtained: Double = 0.0,
    @SerialName("max_marks") val maxMarks: Double = 100.0,
    val score: Float? = null,
    val maxScore: Float? = null,
    val grade: String? = null
)

@Serializable
data class StudentExamResult(
    @SerialName("exam_name") val examName: String? = null,
    @SerialName("termName") val termName: String? = null,
    val subjects: List<StudentMarkSubject>? = null,
    @SerialName("total_obtained") val totalObtained: Double = 0.0,
    @SerialName("total_max") val totalMax: Double = 0.0,
    val percentage: Double = 0.0,
    val grade: String? = null
)

@Serializable
data class TeacherCalendarEvent(
    val id: String? = null,
    val title: String = "",
    val time: String = "",
    val room: String? = null
)

@Serializable
data class TeacherCalendarResponse(
    @SerialName("todayDateStr") val todayDateStr: String? = null,
    @SerialName("todayEvents") val todayEvents: List<TeacherCalendarEvent>? = null,
    @SerialName("tomorrowEvents") val tomorrowEvents: List<TeacherCalendarEvent>? = null
)

@Serializable
data class StudentNote(
    val id: String,
    @SerialName("teacher_id") val teacherId: String? = null,
    val title: String? = null,
    val content: String? = null,
    val color: String? = null,
    @SerialName("class") val targetClass: String? = null,
    val section: String? = null,
    val subject: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("teacher_name") val teacherName: String? = null,
    @SerialName("pdf_url") val pdfUrl: String? = null
)

@Serializable
data class StudentNotesResponse(
    val notes: List<StudentNote>? = null
)


// ---------------------------------------------------------------------------
// App State
// ---------------------------------------------------------------------------

/**
 * Represents the currently logged-in user's state across the app.
 */
data class AppUser(
    val email: String,
    val name: String?,
    val role: String,
    val avatarUrl: String?,
    val sessionToken: String?,
    val studentClass: String?,
    val username: String?,
    val provider: String
)
