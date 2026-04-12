// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://ronancodes.github.io',
	base: '/llm-wiki',
	outDir: '../../docs',
	build: {
		assets: '_assets',
	},
});
