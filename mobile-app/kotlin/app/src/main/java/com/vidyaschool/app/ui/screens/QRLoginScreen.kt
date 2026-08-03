package com.vidyaschool.app.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.util.Size
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.res.painterResource
import com.vidyaschool.app.R
import androidx.core.content.ContextCompat
import com.google.zxing.*
import com.google.zxing.common.HybridBinarizer
import com.vidyaschool.app.api.QRConfirmRequest
import com.vidyaschool.app.api.RetrofitClient
import com.vidyaschool.app.auth.SessionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

// ── QR payload type produced by the web frontend ────────────────────────────
private data class QRPayload(val type: String, val token: String)

private fun parseQRPayload(raw: String): QRPayload? {
    return try {
        val json = JSONObject(raw)
        val type = json.optString("type", "")
        val token = json.optString("token", "")
        if (type == "vidyaschool_qr_login" && token.isNotBlank()) QRPayload(type, token)
        else null
    } catch (e: JSONException) {
        null
    }
}

// ── Sealed state for the scanner UI ─────────────────────────────────────────
private sealed class ScanState {
    object Scanning : ScanState()
    object Confirming : ScanState()
    data class Success(val userName: String) : ScanState()
    data class Error(val message: String) : ScanState()
}

// ── ZXing image analyser ─────────────────────────────────────────────────────
private class QRAnalyzer(val onResult: (String) -> Unit) : ImageAnalysis.Analyzer {
    private val reader = MultiFormatReader().apply {
        setHints(mapOf(DecodeHintType.POSSIBLE_FORMATS to listOf(BarcodeFormat.QR_CODE)))
    }
    override fun analyze(image: androidx.camera.core.ImageProxy) {
        val planes = image.planes
        val buffer = planes[0].buffer
        val bytes = ByteArray(buffer.remaining())
        buffer.get(bytes)
        val source = PlanarYUVLuminanceSource(
            bytes,
            image.width, image.height,
            0, 0, image.width, image.height, false
        )
        try {
            val result = reader.decodeWithState(BinaryBitmap(HybridBinarizer(source)))
            onResult(result.text)
        } catch (_: NotFoundException) {
            // No QR found in frame — keep scanning
        } finally {
            image.close()
        }
    }
}

// ── Main composable ───────────────────────────────────────────────────────────
@Composable
fun QRLoginScreen(
    onClose: () -> Unit,
    onLoginSuccess: (token: String, user: Map<String, Any?>) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()
    val sessionManager = remember { SessionManager(context) }

    var scanState by remember { mutableStateOf<ScanState>(ScanState.Scanning) }
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
                    == PackageManager.PERMISSION_GRANTED
        )
    }

    // ── Permission request ──────────────────────────────────────────────────
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> hasCameraPermission = granted }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    // ── Camera executor ─────────────────────────────────────────────────────
    val cameraExecutor: ExecutorService = remember { Executors.newSingleThreadExecutor() }
    DisposableEffect(Unit) { onDispose { cameraExecutor.shutdown() } }

    // ── QR confirmation logic ───────────────────────────────────────────────
    fun onQRDetected(raw: String) {
        if (scanState !is ScanState.Scanning) return
        val payload = parseQRPayload(raw) ?: return

        scanState = ScanState.Confirming
        val token = sessionManager.getSessionToken()
        if (token.isNullOrBlank()) {
            scanState = ScanState.Error("Please log in on your mobile app first")
            return
        }

        scope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    RetrofitClient.authApi.confirmQRToken(
                        authHeader = "Bearer $token",
                        request = QRConfirmRequest(qrToken = payload.token)
                    )
                }
                if (res.isSuccessful) {
                    val body = res.body()
                    val userName = (body?.get("message") as? String) ?: "User"
                    scanState = ScanState.Success(userName)
                    delay(1200)
                    // The web side handles the actual login via Socket.IO / polling
                    // Here we just close after confirming; optionally surface user info
                    onClose()
                } else {
                    val errBody = res.errorBody()?.string() ?: ""
                    scanState = ScanState.Error(
                        when {
                            res.code() == 404 -> "QR code expired or invalid"
                            res.code() == 409 -> "QR code already used"
                            else -> "Confirmation failed (${res.code()})"
                        }
                    )
                }
            } catch (e: Exception) {
                scanState = ScanState.Error("Network error: ${e.message}")
            }
        }
    }

    // ── Animated scan line ──────────────────────────────────────────────────
    val scanLineAnim = rememberInfiniteTransition(label = "scan")
    val scanLineY by scanLineAnim.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scanY"
    )

    val teal = Color(0xFF14B8A6)
    val tealLight = Color(0xFF5EEAD4)

    // ────────────────────────────────────────────────────────────────────────
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0A0F)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "QR Code Login",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "Scan the code shown on the web",
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.5f)
                    )
                }
                IconButton(
                    onClick = onClose,
                    modifier = Modifier
                        .size(36.dp)
                        .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                        .clip(CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color.White.copy(alpha = 0.7f),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Camera / result card
            Box(
                modifier = Modifier
                    .size(280.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .border(
                        2.dp,
                        Brush.linearGradient(listOf(teal, tealLight)),
                        RoundedCornerShape(20.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                when {
                    !hasCameraPermission -> {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier.padding(24.dp)
                        ) {
                            Text("📷", fontSize = 40.sp)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                "Camera permission required",
                                color = Color.White.copy(alpha = 0.7f),
                                textAlign = TextAlign.Center,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                                colors = ButtonDefaults.buttonColors(containerColor = teal)
                            ) {
                                Text("Grant Permission")
                            }
                        }
                    }

                    scanState is ScanState.Scanning || scanState is ScanState.Confirming -> {
                        // Live camera preview
                        AndroidView(
                            factory = { ctx ->
                                val previewView = PreviewView(ctx)
                                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                                cameraProviderFuture.addListener({
                                    val cameraProvider = cameraProviderFuture.get()
                                    val preview = Preview.Builder().build().also {
                                        it.setSurfaceProvider(previewView.surfaceProvider)
                                    }
                                    val analyzer = ImageAnalysis.Builder()
                                        .setTargetResolution(Size(1280, 720))
                                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                                        .build()
                                        .also { ia ->
                                            ia.setAnalyzer(cameraExecutor, QRAnalyzer { raw ->
                                                onQRDetected(raw)
                                            })
                                        }
                                    try {
                                        cameraProvider.unbindAll()
                                        cameraProvider.bindToLifecycle(
                                            lifecycleOwner,
                                            CameraSelector.DEFAULT_BACK_CAMERA,
                                            preview,
                                            analyzer
                                        )
                                    } catch (e: Exception) {
                                        android.util.Log.e("QRLogin", "Camera bind failed", e)
                                    }
                                }, ContextCompat.getMainExecutor(ctx))
                                previewView
                            },
                            onRelease = {
                                try {
                                    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
                                    cameraProviderFuture.addListener({
                                        cameraProviderFuture.get().unbindAll()
                                    }, ContextCompat.getMainExecutor(context))
                                } catch (e: Exception) {
                                    android.util.Log.e("QRLogin", "Camera release failed", e)
                                }
                            },
                            modifier = Modifier.fillMaxSize()
                        )

                        // Scanning overlay
                        if (scanState is ScanState.Scanning) {
                            Box(modifier = Modifier.fillMaxSize()) {
                                // Simple straight white scanning line
                                Box(
                                    Modifier
                                        .align(Alignment.TopStart)
                                        .fillMaxWidth()
                                        .height(2.dp)
                                        .graphicsLayer { translationY = 280.dp.toPx() * scanLineY }
                                        .background(Color.White)
                                )
                            }
                        }

                        // Confirming overlay
                        if (scanState is ScanState.Confirming) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Color.Black.copy(alpha = 0.6f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    CircularProgressIndicator(color = teal, strokeWidth = 3.dp)
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        "Confirming…",
                                        color = Color.White,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }
                    }

                    scanState is ScanState.Success -> {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color(0xFF052E16)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                SolarVerifiedCheckIcon(
                                    color = Color(0xFF22C55E),
                                    modifier = Modifier.size(64.dp)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    "✓ Login Approved!",
                                    color = Color(0xFF86EFAC),
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    "The web browser is now logged in.",
                                    color = Color.White.copy(alpha = 0.5f),
                                    fontSize = 12.sp,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }

                    scanState is ScanState.Error -> {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color(0xFF2D0000)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Text("⚠️", fontSize = 36.sp)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    (scanState as ScanState.Error).message,
                                    color = Color(0xFFFCA5A5),
                                    fontSize = 13.sp,
                                    textAlign = TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Button(
                                    onClick = { scanState = ScanState.Scanning },
                                    colors = ButtonDefaults.buttonColors(containerColor = teal)
                                ) {
                                    Text("Try Again")
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // Instructions
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color.White.copy(alpha = 0.04f))
                    .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(14.dp))
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    "How it works",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White.copy(alpha = 0.8f)
                )
                listOf(
                    "1" to "Go to vidyaschool.vercel.app/login on any web browser",
                    "2" to "Click \"Login with QR Code\" button",
                    "3" to "Point your phone camera at the QR code",
                    "4" to "The browser logs in instantly — no password needed!"
                ).forEach { (num, text) ->
                    Row(
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .clip(CircleShape)
                                .background(teal.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                num,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = teal
                            )
                        }
                        Text(
                            text,
                            fontSize = 12.sp,
                            color = Color.White.copy(alpha = 0.55f),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Security badge
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(teal.copy(alpha = 0.08f))
                    .border(1.dp, teal.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 12.dp, vertical = 7.dp)
            ) {
                Text("🔒", fontSize = 12.sp)
                Text(
                    "End-to-end encrypted · Token expires in 3 minutes",
                    fontSize = 11.sp,
                    color = teal.copy(alpha = 0.8f)
                )
            }
        }
    }
}

// ── Bottom-sheet QR scanner drawer ───────────────────────────────────────────
// Opened from sidebar. Pure black & white — just the scanner, nothing extra.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QRLoginDrawer(
    onDismiss: () -> Unit
) {
    val context        = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope          = rememberCoroutineScope()
    val sessionManager = remember { SessionManager(context) }
    val sheetState     = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    var scanState by remember { mutableStateOf<ScanState>(ScanState.Scanning) }
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
                    == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> hasCameraPermission = granted }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) permissionLauncher.launch(Manifest.permission.CAMERA)
    }

    val cameraExecutor: ExecutorService = remember { Executors.newSingleThreadExecutor() }
    DisposableEffect(Unit) { onDispose { cameraExecutor.shutdown() } }

    fun onQRDetected(raw: String) {
        if (scanState !is ScanState.Scanning) return
        val payload = parseQRPayload(raw) ?: return
        scanState = ScanState.Confirming
        val token = sessionManager.getSessionToken()
        if (token.isNullOrBlank()) {
            scanState = ScanState.Error("Please log in on your mobile app first")
            return
        }
        scope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    RetrofitClient.authApi.confirmQRToken(
                        authHeader = "Bearer $token",
                        request    = QRConfirmRequest(qrToken = payload.token)
                    )
                }
                if (res.isSuccessful) {
                    scanState = ScanState.Success((res.body()?.get("message") as? String) ?: "User")
                    delay(1400)
                    onDismiss()
                } else {
                    scanState = ScanState.Error(
                        when (res.code()) {
                            404  -> "QR code expired or invalid"
                            409  -> "QR code already used"
                            else -> "Confirmation failed (${res.code()})"
                        }
                    )
                }
            } catch (e: Exception) {
                scanState = ScanState.Error("Network error: ${e.message}")
            }
        }
    }

    val scanLineAnim = rememberInfiniteTransition(label = "scan")
    val scanLineY by scanLineAnim.animateFloat(
        initialValue  = 0f,
        targetValue   = 1f,
        animationSpec = infiniteRepeatable(
            animation  = tween(1800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scanY"
    )

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState       = sheetState,
        containerColor   = Color(0xFF0D0D0D),
        contentColor     = Color.White,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 12.dp, bottom = 8.dp)
                    .width(36.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color.White.copy(alpha = 0.2f))
            )
        },
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 24.dp)
                .padding(bottom = 36.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        "Scan to Login",
                        fontSize   = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color      = Color.White
                    )
                    Text(
                        "Point at the QR code on your browser",
                        fontSize = 12.sp,
                        color    = Color.White.copy(alpha = 0.38f)
                    )
                }
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.08f))
                        .clickable(
                            interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                            indication        = null
                        ) { onDismiss() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector        = Icons.Default.Close,
                        contentDescription = "Close",
                        tint               = Color.White.copy(alpha = 0.55f),
                        modifier           = Modifier.size(15.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(22.dp))

            // Scanner viewport — 260×260, black fill, white borders
            Box(
                modifier = Modifier
                    .size(260.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.Black)
                    .border(1.dp, Color.White.copy(alpha = 0.10f), RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                when {
                    !hasCameraPermission -> {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(20.dp)
                        ) {
                            Text("📷", fontSize = 32.sp)
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                "Camera access required",
                                color     = Color.White.copy(alpha = 0.55f),
                                fontSize  = 12.sp,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            OutlinedButton(
                                onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                                border  = BorderStroke(1.dp, Color.White.copy(alpha = 0.25f)),
                                colors  = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                            ) { Text("Allow Camera", fontSize = 12.sp) }
                        }
                    }

                    scanState is ScanState.Scanning || scanState is ScanState.Confirming -> {
                        AndroidView(
                            factory = { ctx ->
                                val previewView = PreviewView(ctx)
                                val future = ProcessCameraProvider.getInstance(ctx)
                                future.addListener({
                                    val provider = future.get()
                                    val preview = Preview.Builder().build().also {
                                        it.setSurfaceProvider(previewView.surfaceProvider)
                                    }
                                    val analysis = ImageAnalysis.Builder()
                                        .setTargetResolution(Size(1280, 720))
                                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                                        .build().also { ia ->
                                            ia.setAnalyzer(cameraExecutor, QRAnalyzer { raw -> onQRDetected(raw) })
                                        }
                                    try {
                                        provider.unbindAll()
                                        provider.bindToLifecycle(
                                            lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis
                                        )
                                    } catch (e: Exception) {
                                        android.util.Log.e("QRDrawer", "Bind failed", e)
                                    }
                                }, ContextCompat.getMainExecutor(ctx))
                                previewView
                            },
                            onRelease = {
                                try {
                                    val f = ProcessCameraProvider.getInstance(context)
                                    f.addListener({ f.get().unbindAll() }, ContextCompat.getMainExecutor(context))
                                } catch (e: Exception) { /* ignored */ }
                            },
                            modifier = Modifier.fillMaxSize()
                        )

                        // White scanning line
                        if (scanState is ScanState.Scanning) {
                            Box(modifier = Modifier.fillMaxSize()) {
                                // Simple straight white scanning line
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopStart)
                                        .fillMaxWidth()
                                        .height(2.dp)
                                        .graphicsLayer { translationY = 260.dp.toPx() * scanLineY }
                                        .background(Color.White)
                                )
                            }
                        }

                        if (scanState is ScanState.Confirming) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Color.Black.copy(alpha = 0.72f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    CircularProgressIndicator(
                                        color       = Color.White,
                                        strokeWidth = 2.dp,
                                        modifier    = Modifier.size(28.dp)
                                    )
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text("Confirming…", color = Color.White.copy(alpha = 0.75f), fontSize = 12.sp)
                                }
                            }
                        }
                    }

                    scanState is ScanState.Success -> {
                        Column(
                            modifier = Modifier.fillMaxSize().background(Color.Black),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            SolarVerifiedCheckIcon(
                                color = Color.White,
                                modifier = Modifier.size(56.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Login approved", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Text("Browser is now signed in", color = Color.White.copy(alpha = 0.38f), fontSize = 11.sp)
                        }
                    }

                    scanState is ScanState.Error -> {
                        Column(
                            modifier = Modifier.fillMaxSize().background(Color.Black).padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Text("✕", fontSize = 36.sp, color = Color.White.copy(alpha = 0.4f))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                (scanState as ScanState.Error).message,
                                color     = Color.White.copy(alpha = 0.65f),
                                fontSize  = 12.sp,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(14.dp))
                            OutlinedButton(
                                onClick = { scanState = ScanState.Scanning },
                                border  = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                                colors  = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                            ) { Text("Try Again", fontSize = 12.sp) }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                "vidyaschool.vercel.app → Login with QR Code",
                fontSize  = 11.sp,
                color     = Color.White.copy(alpha = 0.25f),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun SolarVerifiedCheckIcon(
    modifier: Modifier = Modifier,
    color: Color = Color.White
) {
    val vector = remember(color) {
        ImageVector.Builder(
            name = "SolarCheckCircleBoldDuotone",
            defaultWidth = 24.dp,
            defaultHeight = 24.dp,
            viewportWidth = 24f,
            viewportHeight = 24f
        ).apply {
            addPath(
                pathData = addPathNodes("M22,12C22,17.5228 17.5228,22 12,22C6.47715,22 2,17.5228 2,12C2,6.47715 6.47715,2 12,2C17.5228,2 22,6.47715 22,12Z"),
                fill = SolidColor(color),
                fillAlpha = 0.35f
            )
            addPath(
                pathData = addPathNodes("M16.0303,8.96967C16.3232,9.26256 16.3232,9.73744 16.0303,10.0303L11.0303,15.0303C10.7374,15.3232 10.2626,15.3232 9.96967,15.0303L7.96967,13.0303C7.67678,12.7374 7.67678,12.2626 7.96967,11.9697C8.26256,11.6768 8.73744,11.6768 9.03033,11.9697L10.5,13.4393L12.7348,11.2045L14.9697,8.96967C15.2626,8.67678 15.7374,8.67678 16.0303,8.96967Z"),
                fill = SolidColor(color),
                fillAlpha = 1.0f
            )
        }.build()
    }
    Icon(
        imageVector = vector,
        contentDescription = "Verified Check",
        tint = Color.Unspecified,
        modifier = modifier
    )
}


