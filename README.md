# wallet-connect-button-vue

A Vue 3 component for NL Wallet integration.

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
- `label?: string` - Optional. Custom button text (defaults to 'Inloggen met NL Wallet')
- `lang?: string` - Optional. Language setting for the wallet button (defaults to 'nl')

### Events

- `success` - Emitted when wallet connection succeeds

For further explanation and documentation, visit: https://wallet-connect.eu