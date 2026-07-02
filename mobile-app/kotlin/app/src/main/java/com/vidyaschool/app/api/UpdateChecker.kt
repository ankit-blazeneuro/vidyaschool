package com.vidyaschool.app.api

import android.content.Context
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request

data class UpdateInfo(
    val versionName: String,
    val downloadUrl: String
)

private data class GitHubRelease(
    @SerializedName("tag_name") val tagName: String,
    @SerializedName("assets") val assets: List<GitHubAsset>?
)

private data class GitHubAsset(
    @SerializedName("name") val name: String,
    @SerializedName("browser_download_url") val browserDownloadUrl: String
)

object UpdateChecker {
    private val client = OkHttpClient()
    private val gson = Gson()

    suspend fun checkForUpdates(context: Context): UpdateInfo? = withContext(Dispatchers.IO) {
        try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            val currentVersion = pInfo.versionName ?: "1.0.0"

            val request = Request.Builder()
                .url("https://api.github.com/repos/ankit-blazeneuro/vidyaschool/releases/latest")
                .header("User-Agent", "Vidyaschool-App")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val bodyString = response.body?.string() ?: return@withContext null
                val release = gson.fromJson(bodyString, GitHubRelease::class.java) ?: return@withContext null

                val latestVersion = release.tagName
                val apkAsset = release.assets?.firstOrNull { it.name.endsWith(".apk") } ?: return@withContext null

                if (isNewerVersion(currentVersion, latestVersion)) {
                    return@withContext UpdateInfo(
                        versionName = latestVersion,
                        downloadUrl = apkAsset.browserDownloadUrl
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext null
    }

    fun isNewerVersion(current: String, latest: String): Boolean {
        val currClean = current.trim().removePrefix("v").split(".")
        val lateClean = latest.trim().removePrefix("v").split(".")
        val maxLen = maxOf(currClean.size, lateClean.size)
        for (i in 0 until maxLen) {
            val currVal = currClean.getOrNull(i)?.toIntOrNull() ?: 0
            val lateVal = lateClean.getOrNull(i)?.toIntOrNull() ?: 0
            if (lateVal > currVal) return true
            if (currVal > lateVal) return false
        }
        return false
    }
}
