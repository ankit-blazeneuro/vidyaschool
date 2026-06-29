package com.vidyaschool.app.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

import retrofit2.http.GET
import retrofit2.http.Path

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
    val image: String? = null
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
    val image: String?
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

data class SliderImage(
    val id: Int,
    val url: String,
    val title: String,
    val enabled: Boolean
)

data class UpdateSliderImagesResponse(
    val success: Boolean,
    val images: List<SliderImage>
)

interface AuthApi {
    @POST("api/auth/sign-in/email")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/backend/api/public/user-role/{email}")
    suspend fun getUserRole(@Path("email") email: String): Response<UserRoleResponse>

    @POST("api/backend/api/public/create-session")
    suspend fun createSession(@Body request: CreateSessionRequest): Response<CreateSessionResponse>

    @GET("api/backend/api/public/verify-session/{token}")
    suspend fun verifySession(@Path("token") token: String): Response<VerifySessionResponse>

    @GET("api/backend/api/public/academic-slider")
    suspend fun getSliderValue(): Response<SliderValueResponse>

    @POST("api/backend/api/admin/academic-slider")
    suspend fun updateSliderValue(@Body request: UpdateSliderRequest): Response<UpdateSliderResponse>

    @GET("api/slider/images")
    suspend fun getSliderImages(): Response<List<SliderImage>>

    @POST("api/backend/api/admin/slider-images")
    suspend fun updateSliderImages(@Body request: List<SliderImage>): Response<UpdateSliderImagesResponse>
}
