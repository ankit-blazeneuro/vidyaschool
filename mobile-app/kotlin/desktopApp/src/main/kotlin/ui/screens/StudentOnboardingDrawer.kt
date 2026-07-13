package ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vidyaschool.shared.network.ApiClient
import com.vidyaschool.shared.models.OnboardingSubmitRequest
import ui.components.BottomDrawer
import ui.components.CustomTextField
import ui.components.PrimaryButton
import ui.components.SecondaryButton
import ui.shadcn.Select
import ui.shadcn.SelectOption
import kotlinx.coroutines.launch
import io.ktor.client.call.body

private val CLASS_OPTIONS = listOf("Nursery", "KG") + (1..12).map { it.toString() }
private val SECTION_OPTIONS = listOf("A", "B", "C", "D", "E")
private val TRANSPORT_OPTIONS = listOf(
    SelectOption("walking", "Walking"),
    SelectOption("transport", "School Transport")
)

@Composable
fun StudentOnboardingDrawer(
    email: String,
    sessionToken: String,
    onComplete: (username: String, studentClass: String?) -> Unit,
    showToast: (String) -> Unit
) {
    val scope = rememberCoroutineScope()
    val apiClient = remember { ApiClient() }
    val totalSteps = 4
    var step by remember { mutableIntStateOf(1) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    var admissionNumber by remember { mutableStateOf("") }
    var phoneNumber by remember { mutableStateOf("") }
    var studentClass by remember { mutableStateOf("") }
    var section by remember { mutableStateOf("") }
    var transportMode by remember { mutableStateOf("walking") }

    var parentName by remember { mutableStateOf("") }
    var parentPhone by remember { mutableStateOf("") }
    var parentEmail by remember { mutableStateOf("") }

    var username by remember { mutableStateOf("") }

    var address by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var state by remember { mutableStateOf("") }
    var pincode by remember { mutableStateOf("") }

    fun validateCurrentStep(): Boolean {
        errorMessage = null
        return when (step) {
            1 -> {
                when {
                    admissionNumber.isBlank() -> {
                        showToast("Please enter your Admission Number")
                        false
                    }
                    phoneNumber.isBlank() -> {
                        showToast("Please enter your Phone Number")
                        false
                    }
                    studentClass.isBlank() || section.isBlank() -> {
                        showToast("Please select your class and section")
                        false
                    }
                    else -> true
                }
            }
            2 -> {
                when {
                    parentName.isBlank() || parentPhone.isBlank() -> {
                        showToast("Please fill in parent/guardian contact details")
                        false
                    }
                    else -> true
                }
            }
            3 -> {
                when {
                    username.isBlank() -> {
                        showToast("Please choose a username")
                        false
                    }
                    username.length < 3 -> {
                        showToast("Username must be at least 3 characters long")
                        false
                    }
                    else -> true
                }
            }
            else -> true
        }
    }

    fun handleNext() {
        if (validateCurrentStep()) {
            step++
        }
    }

    fun handleSubmit() {
        when {
            address.isBlank() || city.isBlank() || state.isBlank() || pincode.isBlank() -> {
                showToast("Please complete your address details")
                return
            }
            pincode.length != 6 || pincode.any { !it.isDigit() } -> {
                showToast("Pincode must be a 6-digit number")
                return
            }
        }

        isLoading = true
        errorMessage = null
        scope.launch {
            try {
                val response = apiClient.submitOnboarding(
                    authToken = sessionToken,
                    request = OnboardingSubmitRequest(
                        admissionNumber = admissionNumber.trim().uppercase(),
                        username = username.trim().lowercase(),
                        phoneNumber = phoneNumber.trim(),
                        parentName = parentName.trim(),
                        parentPhone = parentPhone.trim(),
                        parentEmail = parentEmail.trim().ifBlank { null },
                        address = address.trim(),
                        city = city.trim(),
                        state = state.trim(),
                        pincode = pincode.trim(),
                        class_ = studentClass,
                        section = section,
                        transportMode = transportMode
                    )
                )
                if (response.status.value in 200..299) {
                    showToast("Profile onboarding completed successfully!")
                    onComplete(username.trim().lowercase(), studentClass)
                } else {
                    val err = try { response.body<Map<String, String>>()["message"] ?: "Failed to complete onboarding" } catch (e: Exception) { "Failed to complete onboarding" }
                    errorMessage = err
                    showToast(err)
                }
            } catch (e: Exception) {
                errorMessage = e.message
                showToast(e.message ?: "Something went wrong")
            } finally {
                isLoading = false
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.55f))
    ) {
        BottomDrawer(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxHeight(0.88f)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Complete Onboarding",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Set up your student profile to continue",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                    Text(
                        text = "Step $step of $totalSteps",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                LinearProgressIndicator(
                    progress = step.toFloat() / totalSteps,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp),
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f),
                )

                errorMessage?.let { err ->
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = err,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                MaterialTheme.colorScheme.error.copy(alpha = 0.08f),
                                RoundedCornerShape(8.dp)
                            )
                            .padding(12.dp)
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                when (step) {
                    1 -> {
                        StepHeader(title = "Academic details")
                        CustomTextField(
                            value = admissionNumber,
                            onValueChange = { admissionNumber = it.uppercase() },
                            label = "Admission Number",
                            placeholder = "e.g. 2024/STU/102",
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        CustomTextField(
                            value = phoneNumber,
                            onValueChange = { phoneNumber = it },
                            label = "Phone Number",
                            placeholder = "e.g. 9876543210",
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        Select(
                            selectedValue = studentClass,
                            onValueChange = { studentClass = it },
                            options = CLASS_OPTIONS.map { option ->
                                SelectOption(
                                    value = option,
                                    label = if (option == "Nursery" || option == "KG") option else "Class $option"
                                )
                            },
                            label = "Assigned Class",
                            placeholder = "e.g. Class 10",
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        Select(
                            selectedValue = section,
                            onValueChange = { section = it },
                            options = SECTION_OPTIONS.map { SelectOption(it, it) },
                            label = "Section",
                            placeholder = "e.g. A",
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        Select(
                            selectedValue = transportMode,
                            onValueChange = { transportMode = it },
                            options = TRANSPORT_OPTIONS,
                            label = "Mode of Commute",
                            placeholder = "e.g. Walking or School Transport"
                        )
                    }

                    2 -> {
                        StepHeader(title = "Parent / Guardian details")
                        CustomTextField(
                            value = parentName,
                            onValueChange = { parentName = it },
                            label = "Parent Name",
                            placeholder = "e.g. Rajesh Kumar",
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        CustomTextField(
                            value = parentPhone,
                            onValueChange = { parentPhone = it },
                            label = "Parent Phone Number",
                            placeholder = "e.g. 9876543210",
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        CustomTextField(
                            value = parentEmail,
                            onValueChange = { parentEmail = it },
                            label = "Parent Email",
                            placeholder = "e.g. parent@email.com (optional)",
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                    }

                    3 -> {
                        StepHeader(title = "Account identity")
                        CustomTextField(
                            value = username,
                            onValueChange = { input ->
                                username = input.lowercase().filter { it.isLetterOrDigit() || it == '_' }
                            },
                            label = "Username",
                            placeholder = "e.g. student_name",
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        Text(
                            text = "Choose a unique handle. Only lowercase letters, numbers, and underscores.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f),
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                    RoundedCornerShape(8.dp)
                                )
                                .padding(12.dp)
                        ) {
                            Text(
                                text = "Registered email: $email",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                            Text(
                                text = "Your role: Student",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }

                    4 -> {
                        StepHeader(title = "Contact & Mailing address")
                        CustomTextField(
                            value = address,
                            onValueChange = { address = it },
                            label = "Street Address",
                            placeholder = "e.g. 42 MG Road, Block B",
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            CustomTextField(
                                value = city,
                                onValueChange = { city = it },
                                label = "City",
                                placeholder = "e.g. Delhi",
                                modifier = Modifier.weight(1f)
                            )
                            CustomTextField(
                                value = state,
                                onValueChange = { state = it },
                                label = "State",
                                placeholder = "e.g. Delhi",
                                modifier = Modifier.weight(1f)
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        CustomTextField(
                            value = pincode,
                            onValueChange = { if (it.length <= 6) pincode = it.filter { c -> c.isDigit() } },
                            label = "Pincode",
                            placeholder = "e.g. 110001",
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (step > 1) {
                        SecondaryButton(
                            text = "Back",
                            onClick = { step-- },
                            modifier = Modifier.weight(1f).padding(end = 8.dp)
                        )
                    } else {
                        Spacer(modifier = Modifier.weight(1f))
                    }

                    if (step < totalSteps) {
                        PrimaryButton(
                            text = "Next",
                            onClick = { handleNext() },
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        PrimaryButton(
                            text = "Complete Onboarding",
                            onClick = { handleSubmit() },
                            loading = isLoading,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StepHeader(title: String) {
    Text(
        text = title,
        fontSize = 14.sp,
        fontWeight = FontWeight.SemiBold,
        color = MaterialTheme.colorScheme.onSurface,
        modifier = Modifier.padding(bottom = 12.dp)
    )
}
