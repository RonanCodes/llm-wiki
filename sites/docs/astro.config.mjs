// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const LANDING_URL = 'https://ronancodes.github.io/llm-wiki/';

export default defineConfig({
	site: 'https://ronancodes.github.io',
	base: '/llm-wiki/docs',
	outDir: '../../docs/docs',
	integrations: [
		starlight({
			title: 'LLM Wiki Docs',
			head: [
				{
					tag: 'script',
					content: `document.addEventListener('DOMContentLoaded', () => {
						var landing = 'https://ronancodes.github.io/llm-wiki/';
						if (location.hostname === 'localhost') landing = 'http://localhost:4321/llm-wiki/';
						// Title link stays at docs home (default behavior) — don't override it
						var s = document.querySelector('.social-icons');
						if (s) {
							var a = document.createElement('a');
							a.href = landing;
							a.title = 'Home';
							a.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
							a.style.cssText = 'display:flex;align-items:center;color:var(--sl-color-text);opacity:0.65;';
							a.onmouseover = function(){this.style.opacity='1'};
							a.onmouseout = function(){this.style.opacity='0.65'};
							s.prepend(a);
						}
					});`,
				},
			],
			description: 'A compounding knowledge base built by LLMs. Claude Code writes your wiki. Obsidian is where you read it.',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/RonanCodes/llm-wiki' },
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
						{ label: 'Web Clipper', slug: 'getting-started/web-clipper' },
						{ label: 'Daily Workflow', slug: 'getting-started/workflow' },
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
						{ label: 'Vision', slug: 'research/vision' },
						{ label: 'Decisions', slug: 'research/decisions' },
						{ label: 'Karpathy\'s Pattern', slug: 'research/karpathy' },
						{ label: 'Ralph Loop', slug: 'research/ralph-loop' },
						{ label: 'Roadmap', slug: 'research/roadmap' },
					],
				},
			],
		}),
	],
});
