package com.vidyaschool.app.auth

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent

object OAuthManager {
    private const val GOOGLE_CLIENT_ID = "841705301007-pv1r9dtukce7jg9ag6aa8ogi4f7aveon.apps.googleusercontent.com"
    private const val REDIRECT_URI = "http://localhost:3000/api/auth/callback/google"
    
    fun launchGoogleAuth(context: Context) {
        val authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" +
                "client_id=$GOOGLE_CLIENT_ID&" +
                "redirect_uri=$REDIRECT_URI&" +
                "response_type=code&" +
                "scope=openid%20email%20profile&" +
                "access_type=offline&" +
                "prompt=select_account"
        launchCustomTab(context, authUrl)
    }
    
    fun launchGithubAuth(context: Context) {
        val authUrl = "https://github.com/login/oauth/authorize?" +
                "client_id=Ov23liiWAPanaeBfTfnw&" +
                "redirect_uri=http://localhost:3000/api/auth/callback/github&" +
                "scope=read:user%20user:email"
        launchCustomTab(context, authUrl)
    }
    
    private fun launchCustomTab(context: Context, url: String) {
        val intent = CustomTabsIntent.Builder()
            .setShowTitle(true)
            .build()
        intent.launchUrl(context, Uri.parse(url))
    }
}
