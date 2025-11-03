<template>
  <div v-if="loading" class="attributes">
    <div class="verification-card">
      <h2>Checking attributes...</h2>
      <p>Please wait while we verify your attributes.</p>
    </div>
  </div>

  <div v-else-if="error" class="attributes">
    <div class="verification-card">
      <h2>Error</h2>
      <p>An error occurred while verifying your attributes: {{ error }}</p>
    </div>
  </div>

  <nl-wallet-button
    v-else
    ref="buttonRef"
    :text="props.label"
    :usecase="props.issuance ? '' : clientId"
    :start-url="startUrl"
    :lang="props.lang"
    :help-base-url="props.helpBaseUrl"
    :same-device-ul="sameDeviceUl"
    :cross-device-ul="crossDeviceUl"
  ></nl-wallet-button>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useSearchParams } from './composables/useSearchParams';
import axios from 'axios';

// Types for credentials functionality
const credentialsCache = new Map();

const props = defineProps({
  label: { type: String, required: false, default: 'Inloggen met NL Wallet' },
  clientId: { type: String, required: true },
  onSuccess: { type: Function, required: false },
  apiKey: { type: String, required: false },
  useLocalWcServer: { type: Boolean, required: false, default: false },
  business: { type: Boolean, required: false, default: false },
  lang: { type: String, required: false, default: 'nl' },
  helpBaseUrl: { type: String, required: false },
  issuance: { type: Boolean, required: false }
});

const { searchParams, setSearchParams, removeSearchParam } = useSearchParams();
const loading = ref(false);
const error = ref(null);
const buttonRef = ref(null);

const getDefaultHost = () => {
  // If useLocalWcServer is set, use local server
  if (props.useLocalWcServer) {
    if (props.business) {
      return props.issuance ? 'http://localhost:4007' : 'http://bw.localhost:3021';
    }

    return props.issuance ? 'http://localhost:3007' : 'http://localhost:3021';
  }

  // Otherwise use remote servers
  if (props.business) {
    return props.issuance ? 'https://bw.issuance.wallet-connect.eu' : 'https://bw.wallet-connect.eu';
  }

  return props.issuance ? 'https://issuance.wallet-connect.eu' : 'https://wallet-connect.eu';
};

const startUrl = computed(() => {
  const baseUrl = getDefaultHost();
  const returnUrl = typeof window !== 'undefined' ? window.location.href : '';
  return `${baseUrl}/api/create-session?lang=en&return_url=${encodeURIComponent(returnUrl)}`;
});

const constructURI = (session_type) => {
  const request_uri = `${getDefaultHost()}/disclosure/${props.clientId}/request_uri?session_type=${session_type}`;
  const request_uri_method = "post";
  const client_id_uri = `${props.clientId}.example.com`;

  const deepLinkScheme = props.business
    ? 'businesswalletdebuginteraction://wallet.kvk.rijksoverheid.nl'
    : 'walletdebuginteraction://wallet.edi.rijksoverheid.nl';

  return `${deepLinkScheme}/disclosure_based_issuance?request_uri=${encodeURIComponent(
    request_uri
  )}&request_uri_method=${request_uri_method}&client_id=${client_id_uri}`;
};

const sameDeviceUl = computed(() => constructURI("same_device"));
const crossDeviceUl = computed(() => constructURI("cross_device"));

const fetchRequestedCredentials = async () => {
  if (!props.apiKey || !props.clientId) return [];

  const cacheKey = `${props.clientId}-${getDefaultHost()}`;

  // Check if we already have data in cache
  const cached = credentialsCache.get(cacheKey);
  if (cached?.data) {
    return cached.data;
  }

  // Check if there's already a request in progress
  if (cached?.promise) {
    return await cached.promise;
  }

  const fetchPromise = (async () => {
    try {
      const baseUrl = getDefaultHost();
      const url = `${baseUrl}/api/client/${props.clientId}/requested-credentials`;
      const headers = { 'Authorization': `Bearer ${props.apiKey}` };

      const response = await axios.get(url, { headers });

      // Extract credentials from the response
      const credentials = response.data?.data?.requestedCredentials || [];

      // Cache the result
      credentialsCache.set(cacheKey, { data: credentials });
      return credentials;
    } catch (error) {
      // Remove failed request from cache
      credentialsCache.delete(cacheKey);
      throw error;
    }
  })();

  // Cache the promise to prevent duplicate requests
  credentialsCache.set(cacheKey, { promise: fetchPromise });

  return await fetchPromise;
};

const injectCredentialsIntoShadowDOM = (credentials, retryCount = 0) => {
  const maxRetries = 10;
  const walletButton = buttonRef.value;
  
  if (!walletButton || !walletButton.shadowRoot) {
    return;
  }

  // Remove any existing credential info
  const existingCredentials = walletButton.shadowRoot.querySelector('.required-credentials');
  if (existingCredentials) {
    existingCredentials.remove();
  }

  if (credentials.length === 0) return;

  // Look for the modal and website section
  const modal = walletButton.shadowRoot.querySelector('.modal');
  if (!modal) {
    // Retry if modal not found yet
    if (retryCount < maxRetries) {
      setTimeout(() => {
        injectCredentialsIntoShadowDOM(credentials, retryCount + 1);
      }, 200);
      return;
    }
    return;
  }

  const websiteSection = modal.querySelector('.website');

  // Determine language and translations
  const isNL = props.lang === 'nl';
  const headerText = isNL ? 'Benodigde Attestaties:' : 'Required Credentials:';
  const getLinkText = isNL ? '→ Verkrijg attestatie' : '→ Get credential';

  // Create credential info element
  const credentialsDiv = document.createElement('div');
  credentialsDiv.className = 'required-credentials';
  credentialsDiv.innerHTML = `
    <div style="
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 12px;
      font-family: inherit;
      font-size: 13px;
      line-height: 1.4;
    ">
      <div style="margin: 0 0 8px 0; color: #212529; font-size: 14px; font-weight: 600;">${headerText}</div>
      ${credentials.map(credential => {
        const credentialName = isNL ? credential.credentialName.nl : credential.credentialName.en;
        return `
          <div style="margin-bottom: 6px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span style="color: #495057; font-weight: 500;">${credentialName}</span>
            ${credential.websiteUrl ? `
              <a href="${credential.websiteUrl}" target="_blank" rel="noopener noreferrer" style="
                color: #0066cc;
                text-decoration: none;
                font-size: 12px;
                white-space: nowrap;
              ">${getLinkText}</a>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Insert the credentials div after the website section
  if (websiteSection) {
    websiteSection.insertAdjacentElement('afterend', credentialsDiv);
  } else {
    // Fallback: insert at the beginning of modal
    modal.insertBefore(credentialsDiv, modal.firstChild);
  }
};

const handleButtonClick = async (_event) => {
  try {
    const credentials = await fetchRequestedCredentials();
    
    if (credentials && credentials.length > 0) {
      // Inject credentials into the shadow DOM with multiple attempts
      setTimeout(() => {
        injectCredentialsIntoShadowDOM(credentials);
      }, 100);
    }
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
  }
};

const handleSuccess = (e) => {
  const customEvent = e;
  if (customEvent.detail && customEvent.detail.length > 1) {
    const session_token = customEvent.detail[0];
    const session_type = customEvent.detail[1];

    if (session_type === "cross_device") {
      setSearchParams({ session_token });
    }
  }
  console.log("Success event received:", customEvent.detail);
};

const handleFailed = (e) => {
  const customEvent = e;
  console.log("Failed event received:", customEvent.detail);
};

const loadWebComponent = async () => {
  try {
    await import("./nl-wallet-web.js");
    const button = buttonRef.value;

    if (button) {
      button.addEventListener("success", handleSuccess);
      button.addEventListener("failed", handleFailed);
      button.addEventListener("click", handleButtonClick);
    }
  } catch (error) {
    console.warn('Could not load nl-wallet-web.js:', error);
  }
};

const fetchDisclosedAttributes = async () => {
  const session_token = searchParams.value.get("session_token");
  const nonce = searchParams.value.get("nonce");

  if (!session_token) return;

  loading.value = true;
  const baseUrl = props.apiKey ? getDefaultHost() : "";
  let url = baseUrl + `/api/disclosed-attributes?session_token=${session_token}&client_id=${props.clientId}`;
  if (nonce) url = `${url}&nonce=${nonce}`;

  const headers = props.apiKey ? { 'Authorization': `Bearer ${props.apiKey}` } : {};

  try {
    const { data } = await axios.get(url, { headers });
    console.log("Disclosed attributes:", data);
    if (props.onSuccess) {
      props.onSuccess(data);
    }
    removeSearchParam('session_token');
    if (nonce) removeSearchParam('nonce');
    loading.value = false;
  } catch (err) {
    console.log(err.message);
    error.value = err.message;
    removeSearchParam('session_token');
    if (nonce) removeSearchParam('nonce');
    loading.value = false;
  }
};

onMounted(() => {
  loadWebComponent();
  fetchDisclosedAttributes();
});

onUnmounted(() => {
  const button = buttonRef.value;
  if (button) {
    button.removeEventListener("success", handleSuccess);
    button.removeEventListener("failed", handleFailed);
    button.removeEventListener("click", handleButtonClick);
  }
});

watch(searchParams, fetchDisclosedAttributes, { deep: true });
</script>