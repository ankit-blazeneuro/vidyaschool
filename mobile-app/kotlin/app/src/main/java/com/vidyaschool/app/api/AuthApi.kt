package com.vidyaschool.app.api

import com.google.gson.annotations.SerializedName
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Header

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val user: User?,
    val session: Session?,
    val message: String?
)

data class User(
    val id: String,
    val email: String,
    val name: String?,
    val role: String?,
    val image: String? = null
)

data class Session(
    val token: String,
    val expiresAt: String
)

data class UserRoleResponse(
    val role: String,
    val name: String?,
    val image: String? = null,
    @SerializedName("student_class") val studentClass: String? = null
)

data class CreateSessionRequest(
    val email: String
)

data class CreateSessionResponse(
    val success: Boolean,
    val session: SessionDetails?
)

data class SessionDetails(
    val id: String,
    val token: String,
    val expiresAt: String
)

data class VerifySessionResponse(
    val valid: Boolean,
    val role: String?,
    val name: String?,
    val image: String?,
    @SerializedName("student_class") val studentClass: String? = null
)

data class SliderValueResponse(
    val value: Float
)

data class UpdateSliderRequest(
    val value: Float
)

data class UpdateSliderResponse(
    val success: Boolean,
    val value: Float
)

data class UpdateSliderImagesResponse(
    val success: Boolean,
    val images: List<SliderImage>
)

data class SliderImage(
    val id: Int,
    val url: String,
    val title: String,
    val enabled: Boolean,
    @SerializedName("target_audience") val targetAudience: String = "all",
    @SerializedName("target_classes") val targetClasses: String = "all"
)

data class FeeInstallment(
    val id: String,
    @SerializedName("user_id") val userId: String,
    val month: String,
    val year: String,
    val amount: Double,
    @SerializedName("due_date") val dueDate: String?,
    val status: String,
    @SerializedName("paid_date") val paidDate: String?,
    @SerializedName("receipt_no") val receiptNo: String?,
    @SerializedName("payment_method") val paymentMethod: String?,
    @SerializedName("qr_data_url") val qrDataUrl: String?
)

data class PayFeesRequest(
    @SerializedName("installment_ids") val installmentIds: List<String>,
    @SerializedName("payment_method") val paymentMethod: String? = "Card / Online"
)

data class PayFeesResponse(
    val success: Boolean,
    @SerializedName("receipt_no") val receiptNo: String?,
    @SerializedName("paid_date") val paidDate: String?
)

data class CreateOrderRequest(
    @SerializedName("installment_ids") val installmentIds: List<String>,
    val amount: Int,
    val receipt: String? = null
)

data class CreateOrderResponse(
    @SerializedName("order_id") val orderId: String?,
    val amount: Int?,
    val currency: String?,
    val receipt: String?,
    @SerializedName("installment_ids") val installmentIds: List<String>?,
    @SerializedName("key_id") val keyId: String?,
    @SerializedName("mock_payment") val mockPayment: Boolean? = false
)

data class VerifyPaymentRequest(
    @SerializedName("order_id") val orderId: String,
    @SerializedName("payment_id") val paymentId: String,
    val signature: String,
    @SerializedName("installment_ids") val installmentIds: List<String>,
    @SerializedName("payment_method") val paymentMethod: String = "Razorpay"
)

interface AuthApi {
    @POST("api/auth/sign-in/email")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/public/user-role/{email}")
    suspend fun getUserRole(@Path("email") email: String): Response<UserRoleResponse>

    @POST("api/public/create-session")
    suspend fun createSession(@Body request: CreateSessionRequest): Response<CreateSessionResponse>

    @GET("api/public/verify-session/{token}")
    suspend fun verifySession(@Path("token") token: String): Response<VerifySessionResponse>

    @GET("api/public/academic-slider")
    suspend fun getSliderValue(): Response<SliderValueResponse>

    @POST("api/admin/academic-slider")
    suspend fun updateSliderValue(@Body request: UpdateSliderRequest): Response<UpdateSliderResponse>

    @GET("api/slider/images")
    suspend fun getSliderImages(
        @Query("role") role: String,
        @Query("student_class") studentClass: String? = null
    ): Response<List<SliderImage>>

    @POST("api/admin/slider-images")
    suspend fun updateSliderImages(@Body request: List<SliderImage>): Response<UpdateSliderImagesResponse>

    @GET("api/fees")
    suspend fun getMyFees(
        @Header("Authorization") authHeader: String
    ): Response<List<FeeInstallment>>

    @GET("api/fees/receipt/{receiptNo}")
    suspend fun verifyReceipt(
        @Path("receiptNo") receiptNo: String
    ): Response<Map<String, Any?>>

    @POST("api/fees/pay")
    suspend fun payFees(
        @Header("Authorization") authHeader: String,
        @Body request: PayFeesRequest
    ): Response<PayFeesResponse>

    @POST("api/create-order")
    suspend fun createOrder(
        @Header("Authorization") authHeader: String,
        @Body request: CreateOrderRequest
    ): Response<CreateOrderResponse>

    @POST("api/verify-payment")
    suspend fun verifyPayment(
        @Header("Authorization") authHeader: String,
        @Body request: VerifyPaymentRequest
    ): Response<PayFeesResponse>
}
