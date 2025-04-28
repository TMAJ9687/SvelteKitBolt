import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		sourcemap: true
	},
	ssr: {
		noExternal: ['svelte-french-toast', 'lucide-svelte']
	}
});