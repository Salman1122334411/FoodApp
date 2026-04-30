import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ru from './locales/ru.json';
import tr from './locales/tr.json';
import az from './locales/az.json';
import ar from './locales/ar.json';

const resources = {
    en: { translation: en },
    ru: { translation: ru },
    tr: { translation: tr },
    az: { translation: az },
    ar: { translation: ar },
};

const LANGUAGE_KEY = 'user-language';

// Initialize i18n SYNCHRONOUSLY so useTranslation works immediately
i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

// Then asynchronously detect the saved/system language and switch if needed
const loadSavedLanguage = async () => {
    try {
        let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

        if (!savedLanguage) {
            const locales = Localization.getLocales();
            if (locales && locales.length > 0) {
                const systemLanguage = locales[0].languageCode;
                if (systemLanguage && resources.hasOwnProperty(systemLanguage)) {
                    savedLanguage = systemLanguage;
                }
            }
        }

        if (savedLanguage && savedLanguage !== 'en') {
            await i18n.changeLanguage(savedLanguage);
        }
    } catch (error) {
        // Silently fall back to English
    }
};

loadSavedLanguage();

export default i18n;
export { LANGUAGE_KEY };
