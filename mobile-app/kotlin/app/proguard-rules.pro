# Optimization & Code Shrinking Rules for VidyaSchool App

# Preserve Retrofit / Gson Models & Annotations
-keepattributes Signature, InnerClasses, EnclosingMethod, *Annotation*
-keep class com.vidyaschool.app.api.** { *; }
-keepclassmembers class com.vidyaschool.app.api.** { *; }

# OkHttp rules
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# Gson rules
-keepclassmembers class * implements com.google.gson.TypeAdapterFactory {
    public <init>();
}
-keepclassmembers class * implements com.google.gson.JsonSerializer {
    public <init>();
}
-keepclassmembers class * implements com.google.gson.JsonDeserializer {
    public <init>();
}

# Jetpack Compose rules
-keep class androidx.compose.material3.** { *; }
-dontwarn androidx.compose.**

# Firebase & WebSockets
-dontwarn com.google.firebase.**
-keep class com.google.firebase.** { *; }

# Remove verbose log calls in optimized release builds
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
}
