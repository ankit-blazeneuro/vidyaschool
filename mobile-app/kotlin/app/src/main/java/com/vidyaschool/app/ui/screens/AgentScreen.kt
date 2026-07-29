package com.vidyaschool.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Stop
import kotlinx.coroutines.Job
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.animation.core.*
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.geometry.Offset
import com.vidyaschool.app.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun ShimmerThinkingText(
    text: String = "Thinking...",
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "shimmerTransition")
    val alphaAnim by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shimmerAlpha"
    )

    val translateAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 600f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmerTranslate"
    )

    val shimmerColors = listOf(
        MaterialTheme.colorScheme.primary.copy(alpha = 0.3f),
        MaterialTheme.colorScheme.primary.copy(alpha = 0.95f),
        MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)
    )

    val brush = Brush.linearGradient(
        colors = shimmerColors,
        start = Offset(translateAnim - 200f, 0f),
        end = Offset(translateAnim, 0f)
    )

    Text(
        text = text,
        fontSize = 13.sp,
        fontWeight = FontWeight.Medium,
        style = TextStyle(brush = brush),
        modifier = modifier.graphicsLayer(alpha = alphaAnim)
    )
}

data class AgentChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val sender: MessageSender,
    val text: String,
    val timestamp: String = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.getDefault()).format(java.util.Date())
)

enum class MessageSender {
    USER, AGENT
}

@Composable
fun AgentScreen(
    teacherName: String = "Teacher",
    chatId: String? = null,
    sessionToken: String? = null,
    onBack: () -> Unit
) {
    val messages = remember {
        mutableStateListOf(
            AgentChatMessage(
                sender = MessageSender.AGENT,
                text = "Hello $teacherName! 👋 I am your AI Agent.\n\nI can help you create lesson plans, draft exam questions, analyze student marks, or generate announcements. What would you like to build today?"
            )
        )
    }

    var activeChatId by remember(chatId) { mutableStateOf(chatId) }
    var isLoadingChat by remember { mutableStateOf(false) }

    LaunchedEffect(chatId) {
        activeChatId = chatId
        if (!chatId.isNullOrEmpty() && !sessionToken.isNullOrEmpty()) {
            isLoadingChat = true
            try {
                val res = com.vidyaschool.app.api.RetrofitClient.authApi.getChatDetails("Bearer $sessionToken", chatId)
                if (res.isSuccessful && res.body()?.messages != null) {
                    val history = res.body()!!.messages!!
                    if (history.isNotEmpty()) {
                        messages.clear()
                        history.forEach { m ->
                            messages.add(
                                AgentChatMessage(
                                    sender = if (m.role == "user") MessageSender.USER else MessageSender.AGENT,
                                    text = m.content ?: ""
                                )
                            )
                        }
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("AgentScreen", "Fetch chat details error: ${e.message}")
            } finally {
                isLoadingChat = false
            }
        }
    }

    var inputText by remember { mutableStateOf("") }
    var isThinking by remember { mutableStateOf(false) }
    var activeJob by remember { mutableStateOf<Job?>(null) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    val stopGeneration = {
        activeJob?.cancel()
        activeJob = null
        isThinking = false
    }

    val sendMessage: (String) -> Unit = { prompt ->
        val trimmedPrompt = prompt.trim()
        if (trimmedPrompt.isNotBlank() && activeJob?.isActive != true) {
            val userMsg = AgentChatMessage(sender = MessageSender.USER, text = trimmedPrompt)
            messages.add(userMsg)
            inputText = ""
            isThinking = true

            val currentChatId = activeChatId
            val effectiveRoomId = currentChatId ?: java.util.UUID.randomUUID().toString()
            if (currentChatId.isNullOrEmpty()) {
                activeChatId = effectiveRoomId
            }

            activeJob = scope.launch(Dispatchers.IO) {
                withContext(Dispatchers.Main) {
                    delay(50)
                    listState.animateScrollToItem(messages.size - 1)
                }

                var aiMsgIndex = -1
                var accumulatedText = ""

                try {
                    val authHeader = if (!sessionToken.isNullOrEmpty()) "Bearer $sessionToken" else ""
                    val response = if (currentChatId.isNullOrEmpty()) {
                        com.vidyaschool.app.api.RetrofitClient.streamingAuthApi.initChat(
                            authHeader = authHeader,
                            request = com.vidyaschool.app.api.InitChatRequest(
                                uuid = effectiveRoomId,
                                message = trimmedPrompt,
                                title = ""
                            )
                        )
                    } else {
                        com.vidyaschool.app.api.RetrofitClient.streamingAuthApi.sendChatMessage(
                            authHeader = authHeader,
                            chatId = effectiveRoomId,
                            request = com.vidyaschool.app.api.SendChatMessageRequest(
                                message = trimmedPrompt,
                                title = ""
                            )
                        )
                    }

                    if (response.isSuccessful && response.body() != null) {
                        val inputStream = response.body()!!.byteStream()
                        val reader = java.io.BufferedReader(java.io.InputStreamReader(inputStream, "UTF-8"))
                        var line: String?

                        while (reader.readLine().also { line = it } != null) {
                            val l = line?.trim() ?: continue
                            if (l.startsWith("data: ")) {
                                val dataStr = l.substring(6).trim()
                                if (dataStr == "[DONE]") break
                                var chunkText: String? = null
                                try {
                                    val json = org.json.JSONObject(dataStr)
                                    if (json.has("content") && !json.isNull("content")) {
                                        chunkText = json.getString("content")
                                    } else if (json.has("thinking") && !json.isNull("thinking")) {
                                        withContext(Dispatchers.Main) {
                                            isThinking = true
                                        }
                                    } else if (json.has("choices") && !json.isNull("choices")) {
                                        val choices = json.optJSONArray("choices")
                                        if (choices != null && choices.length() > 0) {
                                            val firstChoice = choices.getJSONObject(0)
                                            val delta = firstChoice.optJSONObject("delta")
                                            val contentStr = if (delta != null && !delta.isNull("content")) delta.optString("content") else null
                                            val textStr = if (firstChoice != null && !firstChoice.isNull("text")) firstChoice.optString("text") else null
                                            chunkText = contentStr ?: textStr
                                        }
                                    }
                                } catch (e: Exception) {
                                    if (dataStr.isNotBlank() && !dataStr.startsWith("{")) {
                                        chunkText = dataStr
                                    }
                                }

                                if (!chunkText.isNullOrEmpty()) {
                                    accumulatedText += chunkText
                                    val currentText = accumulatedText
                                    withContext(Dispatchers.Main) {
                                        isThinking = false
                                        if (aiMsgIndex == -1) {
                                            val aiMsg = AgentChatMessage(sender = MessageSender.AGENT, text = currentText)
                                            messages.add(aiMsg)
                                            aiMsgIndex = messages.size - 1
                                        } else {
                                            messages[aiMsgIndex] = messages[aiMsgIndex].copy(text = currentText)
                                        }
                                        listState.animateScrollToItem(messages.size - 1)
                                    }
                                }
                            }
                        }
                    } else {
                        throw Exception("HTTP ${response.code()}")
                    }
                } catch (e: Exception) {
                    android.util.Log.e("AgentScreen", "Real AI API stream error: ${e.message}")
                    if (accumulatedText.isEmpty()) {
                        val errorMessage = "⚠️ Unable to connect to AI Agent. ${e.message ?: "Please check network connection."}"
                        withContext(Dispatchers.Main) {
                            isThinking = false
                            messages.add(AgentChatMessage(sender = MessageSender.AGENT, text = errorMessage))
                            listState.animateScrollToItem(messages.size - 1)
                        }
                    }
                } finally {
                    withContext(Dispatchers.Main) {
                        isThinking = false
                    }
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Chat Content + Bottom Input Bar (Full screen edge-to-edge under battery bar)
        Scaffold(
            containerColor = Color.Transparent,
            contentWindowInsets = WindowInsets(0.dp),
            bottomBar = {
                // Community-style Input Bar Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 16.dp, end = 16.dp, bottom = 16.dp)
                        .navigationBarsPadding()
                        .imePadding(),
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(
                        defaultElevation = 8.dp
                    ),
                    border = androidx.compose.foundation.BorderStroke(
                        width = 1.dp,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.08f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 6.dp, end = 6.dp, top = 4.dp, bottom = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = {
                                sendMessage("Create a quick teaching summary for today's topic.")
                            },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Add",
                                modifier = Modifier.size(22.dp),
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            if (inputText.isEmpty()) {
                                Text(
                                    text = "Message Agent...",
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                    fontSize = 14.sp
                                )
                            }
                            BasicTextField(
                                value = inputText,
                                onValueChange = { inputText = it },
                                textStyle = TextStyle(
                                    color = MaterialTheme.colorScheme.onSurface,
                                    fontSize = 14.sp
                                ),
                                maxLines = 4,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        val isResponding = isThinking || (activeJob != null && activeJob?.isActive == true)
                        val isSendEnabled = isResponding || inputText.trim().isNotEmpty()
                        val sendButtonBg = if (isSendEnabled) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)
                        val sendButtonTint = if (isSendEnabled) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)

                        IconButton(
                            onClick = {
                                if (isResponding) {
                                    stopGeneration()
                                } else {
                                    sendMessage(inputText)
                                }
                            },
                            enabled = isSendEnabled,
                            modifier = Modifier
                                .size(36.dp)
                                .background(sendButtonBg, CircleShape)
                                .clip(CircleShape)
                        ) {
                            if (isResponding) {
                                Icon(
                                    imageVector = Icons.Default.Stop,
                                    contentDescription = "Pause",
                                    modifier = Modifier.size(16.dp),
                                    tint = sendButtonTint
                                )
                            } else {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_arrow_up),
                                    contentDescription = "Send",
                                    modifier = Modifier.size(18.dp),
                                    tint = sendButtonTint
                                )
                            }
                        }
                    }
                }
            }
        ) { innerPadding ->
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Top spacing so message content does not overlap status bar or floating back button
                item {
                    Spacer(modifier = Modifier.statusBarsPadding().height(56.dp))
                }

                items(messages, key = { it.id }) { msg ->
                    if (msg.sender == MessageSender.USER) {
                        // User Message (Right aligned, no background, no border)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            Column(
                                horizontalAlignment = Alignment.End,
                                modifier = Modifier
                                    .widthIn(max = 290.dp)
                                    .padding(vertical = 2.dp)
                            ) {
                                Text(
                                    text = parseMarkdownToAnnotatedString(msg.text, MaterialTheme.colorScheme.primary),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onBackground,
                                    lineHeight = 20.sp,
                                    textAlign = androidx.compose.ui.text.style.TextAlign.End
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = msg.timestamp,
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f)
                                )
                            }
                        }
                    } else {
                        // Agent Message (Left aligned, instant live streaming Markdown + MathJax fallback)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Start
                        ) {
                            Column(
                                modifier = Modifier
                                    .widthIn(max = 320.dp)
                                    .padding(vertical = 2.dp)
                            ) {
                                if (msg.text.contains("$$") || msg.text.contains("\\(")) {
                                    MarkdownMathMessageView(
                                        markdownContent = msg.text,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                } else {
                                    Text(
                                        text = parseMarkdownToAnnotatedString(msg.text, MaterialTheme.colorScheme.primary),
                                        fontSize = 14.sp,
                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.9f),
                                        lineHeight = 20.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = msg.timestamp,
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f)
                                )
                            }
                        }
                    }
                }

                // Thinking Indicator with Shimmer Effect
                if (isThinking) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 4.dp)
                        ) {
                            ShimmerThinkingText(text = "Thinking...")
                        }
                    }
                }
            }
        }

        // Top Linear Gradient Overlay (Dark at top, fading out linearly as it comes down)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(130.dp)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.background.copy(alpha = 0.95f),
                            MaterialTheme.colorScheme.background.copy(alpha = 0.6f),
                            MaterialTheme.colorScheme.background.copy(alpha = 0.2f),
                            Color.Transparent
                        )
                    )
                )
        )

        // Floating Back Button (Top-Left corner)
        Box(
            modifier = Modifier
                .statusBarsPadding()
                .padding(start = 16.dp, top = 12.dp)
        ) {
            IconButton(
                onClick = onBack,
                modifier = Modifier
                    .size(36.dp)
                    .background(
                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
                        shape = CircleShape
                    )
                    .border(
                        1.dp,
                        MaterialTheme.colorScheme.onBackground.copy(alpha = 0.15f),
                        shape = CircleShape
                    )
                    .clip(CircleShape)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.onBackground
                )
            }
        }
    }
}

@Composable
private fun MarkdownMathMessageView(
    markdownContent: String,
    textAlignRight: Boolean = false,
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()
    val bodyTextColor = if (isDark) "#e2e8f0" else "#1e293b"
    val codeBgColor = if (isDark) "rgba(255, 255, 255, 0.08)" else "rgba(0, 0, 0, 0.06)"
    val codeTextColor = if (isDark) "#c084fc" else "#7c3aed"
    val textAlignCss = if (textAlignRight) "text-align: right;" else "text-align: left;"

    val encodedContent = remember(markdownContent) {
        try {
            java.net.URLEncoder.encode(markdownContent, "UTF-8").replace("+", "%20")
        } catch (e: Exception) { "" }
    }

    val htmlData = remember(encodedContent, isDark, textAlignRight) {
        """
        <!DOCTYPE html>
        <html>
        <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <script>
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\(', '\\)']],
              displayMath: [['$$', '$$'], ['\\[', '\\]']]
            },
            options: {
              ignoreHtmlClass: 'tex2jax_ignore',
              processHtmlClass: 'tex2jax_process'
            }
          };
        </script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 0;
            margin: 0;
            color: $bodyTextColor;
            background-color: transparent;
            font-size: 14px;
            line-height: 1.6;
            word-wrap: break-word;
            $textAlignCss
          }
          h1, h2, h3, h4 { margin-top: 0.8em; margin-bottom: 0.3em; font-weight: 700; color: inherit; }
          h1 { font-size: 1.3em; }
          h2 { font-size: 1.15em; }
          h3 { font-size: 1.05em; }
          p { margin-top: 0; margin-bottom: 0.6em; }
          p:last-child { margin-bottom: 0; }
          code { background: $codeBgColor; color: $codeTextColor; padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
          pre { background: $codeBgColor; padding: 10px; border-radius: 8px; overflow-x: auto; margin: 0.6em 0; }
          pre code { background: transparent; padding: 0; }
          blockquote { border-left: 3px solid #8b5cf6; padding-left: 10px; margin-left: 0; opacity: 0.85; }
          table { border-collapse: collapse; width: 100%; margin: 0.6em 0; }
          th, td { border: 1px solid rgba(148, 163, 184, 0.3); padding: 6px 8px; text-align: left; font-size: 0.88em; }
          th { background: rgba(148, 163, 184, 0.15); }
          ul, ol { padding-left: 18px; margin-top: 0.2em; margin-bottom: 0.6em; }
          li { margin-bottom: 0.2em; }
          .mjx-chtml { overflow-x: auto; max-width: 100%; }
        </style>
        </head>
        <body>
        <div id="content" class="tex2jax_process"></div>
        <script>
          try {
            const raw = decodeURIComponent("$encodedContent");
            document.getElementById('content').innerHTML = typeof marked !== 'undefined' ? marked.parse(raw) : raw;
            if (window.MathJax && MathJax.typesetPromise) {
              MathJax.typesetPromise();
            }
          } catch(e) {
            document.getElementById('content').innerText = "$encodedContent";
          }
        </script>
        </body>
        </html>
        """.trimIndent()
    }

    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                layoutParams = android.view.ViewGroup.LayoutParams(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.WRAP_CONTENT
                )
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                setBackgroundColor(0)
                webViewClient = WebViewClient()
            }
        },
        update = { webView ->
            webView.loadDataWithBaseURL("https://localhost", htmlData, "text/html", "UTF-8", null)
        },
        modifier = modifier
    )
}
