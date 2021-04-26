import { createI18n } from 'vue-i18n';
import { RequestError } from '@/api';

import availableLanguages from './available-languages.yaml';

import enUSBase from './translations/en-US.yaml';
import dateFormats from './date-formats.yaml';

export const i18n = createI18n({
	legacy: false,
	locale: 'en-US',
	fallbackLocale: 'en-US',
	messages: {
		'en-US': enUSBase,
	},
	dateTimeFormats: dateFormats,
	silentTranslationWarn: true,
});

export type Language = keyof typeof availableLanguages;

export const loadedLanguages: Language[] = ['en-US'];

export function translateAPIError(error: RequestError | string) {
	const defaultMsg = i18n.t('unexpected_error');

	let code = error;

	if (typeof error === 'object') {
		code = error?.response?.data?.errors?.[0]?.extensions?.code;
	}

	if (!error) return defaultMsg;
	if (!code === undefined) return defaultMsg;
	const key = `errors.${code}`;

	const exists = i18n.te(key);
	if (exists === false) return defaultMsg;
	return i18n.t(key);
}
