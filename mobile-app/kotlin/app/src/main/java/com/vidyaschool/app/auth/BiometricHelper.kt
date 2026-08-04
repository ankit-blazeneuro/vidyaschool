package com.vidyaschool.app.auth

import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

/**
 * Lightweight helper that shows a biometric / device-credential prompt.
 * Works on API 24+ (minSdk of this project).
 *
 * @param activity      A [FragmentActivity] (MainActivity is one).
 * @param title         Title shown in the system prompt dialog.
 * @param subtitle      Subtitle / description line.
 * @param onSuccess     Called on the main thread when authentication succeeds.
 * @param onFailure     Called with a human-readable reason when auth fails or
 *                      is not available.
 */
object BiometricHelper {

    /**
     * Returns true if the device has *any* biometric enrolled (strong or weak)
     * or a PIN/pattern/password set as fallback.
     */
    fun isAvailable(activity: FragmentActivity): Boolean {
        val bm = BiometricManager.from(activity)
        val authenticators = BIOMETRIC_STRONG or BIOMETRIC_WEAK or DEVICE_CREDENTIAL
        return bm.canAuthenticate(authenticators) == BiometricManager.BIOMETRIC_SUCCESS
    }

    fun showPrompt(
        activity: FragmentActivity,
        title: String = "Verify your identity",
        subtitle: String = "Use fingerprint or face to continue",
        onSuccess: () -> Unit,
        onFailure: (reason: String) -> Unit
    ) {
        val executor = ContextCompat.getMainExecutor(activity)

        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                onSuccess()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                // errorCode 10 = user cancelled, 13 = cancelled by system – treat both as cancellation
                val msg = when (errorCode) {
                    BiometricPrompt.ERROR_USER_CANCELED,
                    BiometricPrompt.ERROR_CANCELED      -> "Authentication cancelled"
                    BiometricPrompt.ERROR_LOCKOUT        -> "Too many attempts. Try again later."
                    BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> "Biometric locked out. Use device PIN."
                    BiometricPrompt.ERROR_NO_BIOMETRICS  -> "No biometrics enrolled"
                    BiometricPrompt.ERROR_HW_NOT_PRESENT -> "No biometric hardware found"
                    BiometricPrompt.ERROR_HW_UNAVAILABLE -> "Biometric hardware unavailable"
                    else                                 -> errString.toString()
                }
                onFailure(msg)
            }

            override fun onAuthenticationFailed() {
                // Individual attempt failed (wrong finger etc.) – system handles the UI retry,
                // so we don't need to do anything here.
            }
        }

        val prompt = BiometricPrompt(activity, executor, callback)

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            // Allow strong biometric OR device credential (PIN/pattern/password) as fallback
            .setAllowedAuthenticators(BIOMETRIC_STRONG or BIOMETRIC_WEAK or DEVICE_CREDENTIAL)
            .build()

        prompt.authenticate(promptInfo)
    }
}
