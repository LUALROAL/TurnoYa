# E2E Test Procedure: Push Notification Delivery

## Overview

End-to-end testing of FCM push notifications requires a **physical Android device** because:
- Android emulators cannot receive real FCM push notifications
- Google Play Services are not available in most emulators
- Firebase Cloud Messaging requires actual device registration with Google servers

## Prerequisites

### Environment Setup

1. **Physical Android Device** with:
   - Google Play Services installed
   - Debug mode enabled
   - USB debugging connected OR same WiFi network as dev machine

2. **ngrok** for exposing local backend:
   ```bash
   # Install ngrok
   winget install ngrok
   
   # Or download from https://ngrok.com/download
   
   # Create free account and configure token
   ngrok config add-authtoken <YOUR_TOKEN>
   ```

3. **Firebase Console** project configured:
   - Downloaded `google-services.json` for Android
   - FCM Server Key available (for reference)
   - Test device registered in Firebase Console → Messaging

4. **Backend running locally**:
   ```bash
   cd TurnoYaAPI/TurnoYa.API
   dotnet run
   # Note the HTTP port (usually 5000 or 5001)
   ```

### Project Configuration

1. Copy Firebase credentials:
   ```bash
   # Backend credentials (service account JSON)
   copy secret\turnoya-*-firebase-adminsdk-*.json secret\firebase-service-account.json
   
   # Set in appsettings.Development.json:
   # "Firebase": {
   #   "CredentialsPath": "..\\..\\secret\\firebase-service-account.json"
   # }
   ```

2. Android app configuration:
   ```bash
   cd TurnoYaMovil
   # Ensure google-services.json is in android/app/
   npm run build
   npx cap sync android
   ```

## Test Procedure

### Step 1: Expose Backend with ngrok

```bash
ngrok http 5000 --domain=<your-ngrok-domain>  # if using custom domain
# OR
ngrok http 5000
```

**Note the HTTPS forwarding URL** (e.g., `https://abc123.ngrok.io`)

### Step 2: Configure Mobile App

The mobile app needs to point to the exposed backend:

1. Modify the API base URL in `TurnoYaMovil/src/environments/`:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'https://abc123.ngrok.io/api'  // Your ngrok URL
   };
   ```

2. Rebuild the app:
   ```bash
   cd TurnoYaMovil
   npx cap sync android
   # Rebuild APK
   ```

3. Install on physical device:
   ```bash
   adb install -r android\app\build\outputs\apk\debug\app-debug.apk
   ```

### Step 3: Register Device and Capture Token

1. **Open the app** on the physical device
2. **Login or register** a user account
3. **Grant notification permission** when prompted by the OS
4. **Capture the FCM token** — check one of these:

   **Option A: Logcat**
   ```bash
   adb logcat | grep -i "fcm\|push\|token"
   # Look for: "FCM Token: dGVzdC10b2tlbi0xMjM0..."
   ```

   **Option B: Backend logs**
   Check the backend console/serilog for:
   ```
   Token FCM registrado para usuario {UserId}. DeviceId: {DeviceId}
   ```

   **Option C: Breakpoint in PushNotificationService**
   Set a breakpoint in `PushNotificationService.SendToUserAsync` to capture the userId and deviceId.

5. **Note the deviceId** returned from `POST /devices/register`

### Step 4: Trigger Appointment Event

You can trigger push notifications through any of these methods:

#### Method A: API Request (Recommended)

Create an appointment via the API to trigger the push:

```bash
# 1. Login to get JWT token
curl -X POST https://abc123.ngrok.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@turnoya.com","password":"test123"}'

# 2. Get business/service IDs
# (Check your database or API documentation)

# 3. Create appointment
curl -X POST https://abc123.ngrok.io/api/appointments \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "<BUSINESS_ID>",
    "serviceId": "<SERVICE_ID>",
    "scheduledDate": "2026-03-20T10:00:00Z"
  }'
```

This should trigger `AppointmentCreated` → push to **business owner**.

#### Method B: Telegram Callback (If configured)

If Telegram bot is configured:
1. Start a conversation with the bot
2. Complete the linking flow
3. Create an appointment through the normal flow
4. Click "Confirm" button in Telegram

#### Method C: Direct Database Manipulation (For testing)

Update an appointment status directly to trigger status transitions:

```sql
-- Confirm appointment
UPDATE Appointments SET Status = 'Confirmed' WHERE Id = '<APPOINTMENT_ID>';

-- Complete appointment  
UPDATE Appointments SET Status = 'Completed' WHERE Id = '<APPOINTMENT_ID>';

-- Mark as no-show
UPDATE Appointments SET Status = 'NoShow' WHERE Id = '<APPOINTMENT_ID>';
```

Then trigger via a separate API call or restart the backend.

### Step 5: Verify Notification Arrives

**On the physical device:**
- The notification should appear in the system notification tray
- Tap to open the app (deep link handling)

**Expected notifications:**

| Event | Title | Body Template |
|-------|-------|---------------|
| AppointmentCreated | "¡Nueva Cita!" | "Test Service - 20/03/2026 10:00 - $100" |
| AppointmentConfirmed | "Tu cita ha sido confirmada" | "Test Business - 20/03/2026 10:00" |
| AppointmentCancelled | "Tu cita ha sido cancelada" | "Test Business - 20/03/2026 10:00" |
| AppointmentCompleted | "Tu cita ha sido completada" | "Test Business - 20/03/2026 10:00" |
| NoShow | "Tu cita ha sido no se presentó" | "Test Business - 20/03/2026 10:00" |

### Step 6: Verify Token Cleanup (Error Scenarios)

To test token cleanup on `InvalidRegistration`/`Unregistered`:

1. **Manually delete the FCM token from database:**
   ```sql
   DELETE FROM UserDeviceTokens WHERE Id = '<DEVICE_ID>';
   ```

2. **Trigger another appointment event** (e.g., create new appointment)

3. **Verify:** The notification is NOT sent (no matching device)

Or test with an expired token by revoking it in Firebase Console:
1. Firebase Console → Project → Messaging → Send first message
2. Register a test device
3. In Firebase Console, go to "Delivery" and find the token
4. Revoke the token
5. Trigger appointment event
6. Verify the stale token is deleted from `UserDeviceTokens` table

## Troubleshooting

### Notification not arriving

1. **Check backend logs** for:
   - `Token FCM registrado` — device registered
   - `Enviando notificación push a X dispositivos` — push attempted
   - `Notificación push enviada exitosamente` — FCM accepted
   - Any `FirebaseMessagingException` errors

2. **Check Firebase Console:**
   - Delivery reports show success/failure
   - Registration tokens can be invalidated

3. **Check Android device:**
   - Notifications enabled in OS settings
   - App has notification permission
   - Battery optimization not blocking app

4. **Common issues:**
   - Wrong `google-services.json` (check `package_name` matches)
   - Backend not reachable from device (ngrok not running)
   - Wrong API URL in mobile app

### Build fails

```bash
# Clean and rebuild
cd TurnoYaMovil
rm -rf android
npx cap sync android
npx cap open android
# In Android Studio: Build > Clean Project, then Build > Rebuild Project
```

## Acceptance Criteria

- [ ] Physical Android device receives push notification on `AppointmentCreated`
- [ ] Physical Android device receives push notification on `AppointmentConfirmed`
- [ ] Physical Android device receives push notification on `AppointmentCancelled`
- [ ] Notification disappears from `UserDeviceTokens` when token is revoked in Firebase
- [ ] Notification deep links to correct appointment in app
- [ ] No crashes or ANRs on the device
- [ ] Notification appears even when app is killed (background)

## Report Template

After completing E2E tests, document:

```
Date: <TEST_DATE>
Device: <ANDROID_VERSION> / <DEVICE_MODEL>
Backend: <NGROK_URL>
Firebase Project: <PROJECT_NAME>

Test Results:
- AppointmentCreated push: PASS/FAIL
- AppointmentConfirmed push: PASS/FAIL
- AppointmentCancelled push: PASS/FAIL
- Token cleanup on Unregistered: PASS/FAIL
- Deep link handling: PASS/FAIL

Logs attached: [paste relevant backend/FCM logs]
Screenshots: [notification screenshots from device]
```
