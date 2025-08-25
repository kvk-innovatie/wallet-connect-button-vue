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

const props = defineProps({
  label: { type: String, required: false, default: 'Inloggen met NL Wallet' },
  clientId: { type: String, required: true },
  onSuccess: { type: Function, required: false },
  apiKey: { type: String, required: false },
  walletConnectHost: { type: String, required: false },
  lang: { type: String, required: false, default: 'nl' },
  helpBaseUrl: { type: String, required: false },
  issuance: { type: Boolean, required: false }
});

const { searchParams, setSearchParams, removeSearchParam } = useSearchParams();
const loading = ref(false);
const error = ref(null);
const buttonRef = ref(null);

const startUrl = computed(() => {
  const baseUrl = props.walletConnectHost || 'https://wallet-connect.eu';
  const returnUrl = typeof window !== 'undefined' ? window.location.href : '';
  return `${baseUrl}/api/create-session?lang=en&return_url=${encodeURIComponent(returnUrl)}`;
});

const constructURI = (session_type) => {
  const request_uri = `https://issuance.wallet-connect.eu/disclosure/${props.clientId}/request_uri?session_type=${session_type}`;
  const request_uri_method = "post";
  const client_id_uri = `${props.clientId}.example.com`;
  
  return `walletdebuginteraction://wallet.edi.rijksoverheid.nl/disclosure_based_issuance?request_uri=${encodeURIComponent(request_uri)}&request_uri_method=${request_uri_method}&client_id=${client_id_uri}`;
};

const sameDeviceUl = computed(() => constructURI("same_device"));
const crossDeviceUl = computed(() => constructURI("cross_device"));

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
  const baseUrl = props.apiKey ? (props.walletConnectHost || "https://wallet-connect.eu") : "";
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
  }
});

watch(searchParams, fetchDisclosedAttributes, { deep: true });
</script>