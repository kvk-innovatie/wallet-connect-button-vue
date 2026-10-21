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
    :service-id="'your-service-id'" 
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

- `serviceId: string` - The registration's identifier. NB Wallet Connect calls it a
  **service id**: one company registers a service per website or application.
- `clientId: string` - The original name for the same value, still fully supported.
  Give either one; `serviceId` wins when both are set.

With the `nbwallet` attribute the button talks to NB Wallet Connect, which has renamed
this identifier throughout its API (`service_id`, `/api/service/...`). Every other
variant still calls its host with `client_id`. That switch is automatic; you only
choose which prop name to write.
- `apiKey?: string` - Optional. API key for authentication
- `walletConnectHost?: string` - Optional. Custom wallet connect host URL (defaults to https://wallet-connect.eu)
- `label?: string` - Optional. Custom button text (defaults to 'Inloggen met NP Wallet')
- `lang?: string` - Optional. Language setting for the wallet button (defaults to 'nl')
- `returnUrl?: string` - Optional. Where the wallet app sends the user after a same-device
  disclosure; the verifier appends `session_token` to it. Defaults to the address of the page
  the button is on. Set it when the button lives in an iframe (see below).

### Events

- `success` - Emitted when wallet connection succeeds

### Embedding in an iframe

Cross-device (QR code) works in an iframe as is. Same-device needs two things, because the
wallet app returns the user to a page and the button inside the iframe cannot see the
address of the page around it:

1. Set `return-url` to the full address of the page that contains the iframe.
2. On that page, when it loads with `session_token` (and, if present, `nonce`) in its query
   string, hand them to the iframe. Either append them to the iframe's `src`, or post them in:

```javascript
const params = new URLSearchParams(window.location.search);
const sessionToken = params.get("session_token");
if (sessionToken) {
  const iframe = document.querySelector("iframe#wallet");
  iframe.addEventListener("load", () => {
    iframe.contentWindow.postMessage(
      { type: "wallet-connect-session", session_token: sessionToken, nonce: params.get("nonce") ?? undefined },
      new URL(iframe.src).origin,
    );
  });
  // Optional: drop the used token from the page's address so a reload doesn't retry it.
  params.delete("session_token");
  params.delete("nonce");
  history.replaceState({}, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
}
```

The button only accepts the message when it comes from the origin of `return-url`. It then
fetches the disclosed attributes and calls `onSuccess` inside the iframe, exactly as it does
when the token is in its own query string.

For further explanation and documentation, visit: https://wallet-connect.eu

## Changes

### 1.0.32
- New `returnUrl` prop: where the wallet returns the user after a same-device disclosure (defaults to the page's own address, as before).
- The button accepts a `wallet-connect-session` message with the `session_token` from the page named by `returnUrl`, so it works inside an iframe. See "Embedding in an iframe".

### 1.0.25
- Pass the `clientId` prop through to the embedded `<nl-wallet-button>` as `client-id`, so the "No app yet?" link under the QR code becomes `<help-base-url>?client_id=<clientId>` (employee onboarding hand-off).
- NB Wallet (`nbwallet`) issuance deep links now use the https universal link base `https://nbwallet.org/deeplink/...` instead of the custom `businesswalletdebuginteraction://` scheme. Business Wallet and NL Wallet links are unchanged.
