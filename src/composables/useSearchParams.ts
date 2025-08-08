import { ref, onMounted, onUnmounted } from 'vue';

export function useSearchParams() {
  const searchParams = ref(new URLSearchParams(window.location.search));

  const setSearchParams = (params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    window.history.replaceState({}, '', url.toString());
    searchParams.value = new URLSearchParams(url.search);
  };

  const removeSearchParam = (paramName: string) => {
    const url = new URL(window.location.href);
    url.searchParams.delete(paramName);
    window.history.replaceState({}, '', url.toString());
    searchParams.value = new URLSearchParams(url.search);
  };

  const handlePopState = () => {
    searchParams.value = new URLSearchParams(window.location.search);
  };

  onMounted(() => {
    window.addEventListener('popstate', handlePopState);
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState);
  });

  return { searchParams, setSearchParams, removeSearchParam };
}