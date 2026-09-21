# wallet-connect-button-vue

A Vue 3 component for NP Wallet integration.

## Installation

```bash
npm install wallet-connect-button-vue
```

## Usage

1. Import the component in your Vue app:

```typescript
import { WalletConnectButton } from 'wallet-connect-button-vue';
```

2. Use the component in your template:

```vue
<template>
  <WalletConnectButton 
    :client-id="'your-client-id'" 
    :api-key="'your-api-key'"
    :wallet-connect-host="'https://wallet-connect.eu'"
    :label="'Connect Wallet'"
    @success="onWalletSuccess" />
</template>
```

3. Handle the success event in your component:

```typescript
<script setup>
const onWalletSuccess = (attributes: any) => {
  console.log('Wallet connected successfully:', attributes);
}
</script>
```

## API

### Props

- `clientId: string` - Required. Your client ID for wallet connection
- `apiKey?: string` - Optional. API key for authentication
- `walletConnectHost?: string` - Optional. Custom wallet connect host URL (defaults to https://wallet-connect.eu)
- `label?: string` - Optional. Custom button text (defaults to 'Inloggen met NP Wallet')
- `lang?: string` - Optional. Language setting for the wallet button (defaults to 'nl')

### Events

- `success` - Emitted when wallet connection succeeds

For further explanation and documentation, visit: https://wallet-connect.eu

## Changes

### 1.0.25
- Pass the `clientId` prop through to the embedded `<nl-wallet-button>` as `client-id`, so the "No app yet?" link under the QR code becomes `<help-base-url>?client_id=<clientId>` (employee onboarding hand-off).
- NB Wallet (`nbwallet`) issuance deep links now use the https universal link base `https://nbwallet.org/deeplink/...` instead of the custom `businesswalletdebuginteraction://` scheme. Business Wallet and NL Wallet links are unchanged.
