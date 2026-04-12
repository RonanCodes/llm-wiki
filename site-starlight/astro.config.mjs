// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const LANDING_URL = 'https://ronancodes.github.io/llm-wiki/';

export default defineConfig({
	site: 'https://ronancodes.github.io',
	base: '/llm-wiki/docs',
	outDir: '../docs/docs',
	integrations: [
		starlight({
			title: 'LLM Wiki Docs',
			head: [
				{ tag: 'script', content: `document.addEventListener('DOMContentLoaded', () => { const a = document.querySelector('.site-title'); if (a) a.href = 'https://ronancodes.github.io/llm-wiki/'; });` },
			],
			description: 'A compounding knowledge base built by LLMs. Claude Code writes your wiki. Obsidian is where you read it.',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/RonanCodes/llm-wiki' },
				{ icon: 'external', label: 'Home', href: LANDING_URL },
			],
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{ label: 'Back to Home', link: LANDING_URL },
				{ label: 'Docs Home', slug: '' },
				{
					label: 'Getting Started',
					items: [
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Installation', slug: 'getting-started/installation' },
					],
				},
				{
					label: 'Features',
					items: [
						{ label: 'Overview', slug: 'features/overview' },
						{ label: 'Ingest', slug: 'features/ingest' },
						{ label: 'Query', slug: 'features/query' },
						{ label: 'Lint', slug: 'features/lint' },
						{ label: 'Promote', slug: 'features/promote' },
						{ label: 'Search & Slides', slug: 'features/search-slides' },
					],
				},
				{
					label: 'Architecture',
					items: [
						{ label: 'How It Works', slug: 'architecture/how-it-works' },
						{ label: 'Vault Structure', slug: 'architecture/vault-structure' },
						{ label: 'Obsidian Integration', slug: 'architecture/obsidian' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'All Commands', slug: 'reference/commands' },
						{ label: 'Source Types', slug: 'reference/source-types' },
						{ label: 'Page Templates', slug: 'reference/page-templates' },
						{ label: 'Dataview Queries', slug: 'reference/dataview' },
						{ label: 'Dependencies', slug: 'reference/dependencies' },
					],
				},
				{
					label: 'Research',
					collapsed: true,
					items: [
						{ label: 'Karpathy\'s Pattern', slug: 'research/karpathy' },
						{ label: 'Ralph Loop', slug: 'research/ralph-loop' },
						{ label: 'Roadmap', slug: 'research/roadmap' },
					],
				},
			],
		}),
	],
});
