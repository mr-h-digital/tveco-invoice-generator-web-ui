/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
	readonly VITE_NOTIFICATION_WEBHOOK_URL?: string;
	readonly VITE_NOTIFICATION_WEBHOOK_SECRET?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
