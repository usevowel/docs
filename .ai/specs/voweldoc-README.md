# voweldoc - Voice Configuration Modal

## Overview

The voweldoc feature adds a modal dialog to the VitePress documentation site that allows users to configure the voice agent using either:

1. **Hosted (SaaS) Mode**: URL + App ID from vowel.to
2. **Self-Hosted Mode**: JWT token from a self-hosted vowel instance

## Usage

### For End Users

1. Click the **Voice** button in the top navigation bar
2. Select your configuration mode:
   - **Hosted**: Enter your Realtime URL and App ID from vowel.to
   - **Self-Hosted**: Enter your JWT token (and optionally a custom URL)
3. Click **Save & Enable Voice**
4. The voice agent will initialize and you can start using voice commands

Credentials are stored locally in the browser's localStorage.

### Environment Variables (Optional)

You can pre-configure defaults using environment variables:

```bash
# For hosted mode
VITE_VOWEL_APP_ID=your-app-id
VITE_VOWEL_REALTIME_URL=wss://realtime.vowel.to/v1

# For self-hosted mode (JWT token)
VITE_VOWEL_JWT_TOKEN=your-jwt-token
VITE_VOWEL_SELFHOSTED_URL=wss://your-instance.com/realtime
```

## Components

- `VoiceConfigModal.vue` - The modal dialog for credential input
- `VoiceLayout.vue` - Updated layout with the Voice button and modal integration
- `voice-client.ts` - Updated client to support localStorage credentials

## Technical Details

### LocalStorage Schema

Credentials are stored as:

```json
{
  "mode": "hosted" | "selfhosted",
  "hosted": {
    "url": "wss://realtime.vowel.to/v1",
    "appId": "your-app-id"
  },
  "selfHosted": {
    "jwt": "eyJhbGciOiJIUzI1NiIs...",
    "url": "wss://your-instance.com/realtime"
  },
  "timestamp": 1234567890
}
```

### Configuration Priority

1. LocalStorage credentials (if present)
2. Environment variables (for defaults/pre-filling)
3. Modal dialog (for user input)

### Cross-Tab Sync

The configuration automatically syncs across browser tabs using the `storage` event.
