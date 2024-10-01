// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
	ssr: true,
	compatibilityDate: '2024-04-03',
	devtools: {
		enabled: true,

		timeline: {
			enabled: true
		}
	},
	modules: ['vuetify-nuxt-module', '@vueuse/nuxt'],
	vuetify: {
		moduleOptions: {
			/* module specific options */
			styles: { configFile: 'styles/settings.scss' }
		},
		vuetifyOptions: {
			display: {
				mobileBreakpoint: 'sm'
			},
			// blueprint: md3,
			theme: {
				themes: {
					light: {
						colors: {
							success: '#41e42f',
							'success-darken-2': '#12510b',
							'success-darken-1': '#23a215',
							'success-lighten-1': '#8cef81',
							'success-lighten-2': '#d4f9d0',
							'success-lighten-3': '#defadb',
							'success-lighten-4': '#e6fbe4',
							'success-lighten-5': '#effded',
							'success-lighten-6': '#f7fef6',
							error: '#e93040',
							'error-darken-2': '#55090f',
							'error-darken-1': '#aa121e',
							'error-lighten-1': '#f2858e',
							'error-lighten-2': '#fbd9dc',
							'error-lighten-3': '#fce1e4',
							'error-lighten-4': '#fde9ea',
							'error-lighten-5': '#fdf0f1',
							'error-lighten-6': '#fef8f8',
							accent: '#ffffcc',
							'accent-darken-4': '#5c5c00',
							'accent-darken-3': '#b8b800',
							'accent-darken-2': '#ffff14',
							'accent-darken-1': '#ffff70',
							'accent-lighten-1': '#ffffd6',
							'accent-lighten-2': '#ffffe0',
							'accent-lighten-3': '#ffffeb',
							'accent-lighten-4': '#fffff5',
							primary: '#337ab7',
							'primary-darken-4': '#0a1825',
							'primary-darken-3': '#153149',
							'primary-darken-2': '#1f496e',
							'primary-darken-1': '#296192',
							'primary-lighten-1': '#5395cf',
							'primary-lighten-2': '#7eafdb',
							'primary-lighten-3': '#a9cae7',
							'primary-lighten-4': '#d4e4f3',
							secondary: '#44b6ae',
							'secondary-darken-4': '#0d2423',
							'secondary-darken-3': '#1b4946',
							'secondary-darken-2': '#286d69',
							'secondary-darken-1': '#36928c',
							'secondary-lighten-1': '#67c7c0',
							'secondary-lighten-2': '#8dd5d0',
							'secondary-lighten-3': '#b3e3e0',
							'secondary-lighten-4': '#d9f1ef'
						}
					}
				}
			},
			defaults: {
				VSelect: {
					variant: 'outlined'
				},
				VTextField: {
					variant: 'outlined'
				},
				VTextarea: {
					variant: 'outlined'
				},
				VButton: {
					variant: 'outlined'
				}
			}
		}
	}
})
