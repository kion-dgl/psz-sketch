// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: vercel(),
	session: {
		// Redis for session storage (configured via environment variables)
		// Falls back to in-memory storage in development if REDIS_URL not set
		driver: 'redis',
	},
	integrations: [
		react(),
		starlight({
			title: 'psz-sketch',
			head: [
				{
					tag: 'script',
					attrs: {
						src: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js',
					},
				},
				{
					tag: 'script',
					content: 'mermaid.initialize({ startOnLoad: true, theme: "default" });',
				},
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			sidebar: [
				{
					label: 'Architecture',
					items: [
						{ label: 'Overview', slug: 'architecture/overview' },
						{ label: 'User Flow', slug: 'architecture/user-flow' },
						{ label: 'API Contracts', slug: 'architecture/api-contracts' },
						{ label: 'System Architecture', slug: 'architecture/system-architecture' },
						{ label: 'Data Flow', slug: 'architecture/data-flow' },
					],
				},
				{
					label: 'Screens',
					items: [
						{ label: 'Title Screen', slug: 'screens/title-screen' },
						{ label: 'Sync', slug: 'screens/sync' },
						{ label: 'Character Select', slug: 'screens/character-select' },
						{ label: 'Character Create', slug: 'screens/character-create' },
						{ label: 'Mode Select', slug: 'screens/mode-select' },
						{
							label: 'City',
							items: [
								{ label: 'Overview', slug: 'screens/city' },
								{ label: 'Quest Counter', slug: 'screens/quest-counter' },
								{ label: 'Storage Counter', slug: 'screens/storage-counter' },
								{ label: 'Item Shop', slug: 'screens/item-shop' },
								{ label: 'Custom Shop', slug: 'screens/custom-shop' },
								{ label: 'Weapon Shop', slug: 'screens/weapon-shop' },
							],
						},
					],
				},
				{
					label: 'Mechanics',
					items: [
						{ label: 'Weapons', slug: 'mechanics/weapons' },
						{ label: 'Armor', slug: 'mechanics/armor' },
						{ label: 'Units', slug: 'mechanics/units' },
						{ label: 'Items', slug: 'mechanics/items' },
						{ label: 'Mags', slug: 'mechanics/mags' },
						{ label: 'Photon Blasts', slug: 'mechanics/photon-blasts' },
						{ label: 'Inventory', slug: 'mechanics/inventory' },
						{ label: 'Storage', slug: 'mechanics/storage' },
					],
				},
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
