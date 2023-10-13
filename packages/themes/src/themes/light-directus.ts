import type { Theme } from '../schema.js';

export const theme: Theme = {
	name: 'Light (Directus)',
	appearance: 'light',
	fonts: [],
	rules: {
		foreground: '#4f5464',
		foregroundAccent: '#172940',
		foregroundSubdued: '#a2b5cd',

		background: '#fff',

		primary: 'var(--project-color)',
		primaryBackground: 'color-mix(var(--theme--background), var(--project-color), 10%)',
		primarySubdued: 'color-mix(var(--theme--background), var(--project-color), 25%)',
		primaryAccent: 'color-mix(var(--project-color), var(--theme--foreground), 25%)',

		secondary: '#ff99dd',
		success: '#2ecda7',
		warning: '#ffa439',
		danger: '#e35169',

		navigation: {
			background: '#f0f4f9',

			project: {
				background: '#e4eaf1',
				foreground: 'var(--theme--foreground-accent)',
			},

			modules: {
				background: '#18222f',
				button: {
					foreground: '#8196b1',
					foregroundHover: '#fff',
					foregroundActive: 'var(--theme--foreground-accent)',

					background: 'transparent',
					backgroundHover: 'transparent',
					backgroundActive: '#f0f4f9',
				},
			},

			list: {
				icon: {
					foreground: 'var(--project-color)',
					foregroundHover: 'var(--theme--navigation--list--icon--foreground)',
					foregroundActive: 'var(--theme--navigation--list--icon--foreground)',
				},

				foreground: 'var(--theme--foreground-accent)',
				foregroundHover: 'var(--theme--navigation--list--foreground)',
				foregroundActive: 'var(--theme--navigation--list--foreground)',

				background: 'transparent',
				backgroundHover: '#e4eaf1',
				backgroundActive: '#e4eaf1',
			},
		},

		header: {
			background: 'var(--theme--background)',
			headline: {
				foreground: 'var(--theme--foreground-subdued)',
			},
			title: {
				foreground: 'var(--theme--foreground-accent)',
			},
		},

		sidebar: {
			background: '#f0f4f9',
			foreground: 'var(--theme--foreground-subdued)',

			section: {
				toggle: {
					icon: {
						foreground: 'var(--theme--foreground-accent)',
						foregroundHover: 'var(--theme--sidebar--section--toggle--icon--foreground)',
						foregroundActive: 'var(--theme--sidebar--section--toggle--icon--foreground)',
					},

					foreground: 'var(--theme--foreground-accent)',
					foregroundHover: 'var(--theme--sidebar--section--toggle--foreground)',
					foregroundActive: 'var(--theme--sidebar--section--toggle--foreground)',

					background: '#e4eaf1',
					backgroundHover: 'var(--theme--sidebar--section--toggle--background)',
					backgroundActive: 'var(--theme--sidebar--section--toggle--background)',
				},
			},
		},
	},
};
