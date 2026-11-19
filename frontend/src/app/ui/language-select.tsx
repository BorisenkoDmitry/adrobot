import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, Languages } from 'lucide-react'

import { useI18n, type Locale } from '@/shared/i18n'

import { localeChanged } from '../model/preferences'
import { useAppDispatch } from '../model/store'

const languageNames = {
  ru: 'Русский',
  en: 'English',
} satisfies Record<Locale, string>

export function LanguageSelect() {
  const dispatch = useAppDispatch()
  const { locale, t } = useI18n()

  return (
    <Select.Root value={locale} onValueChange={(value) => {
      if (value === 'ru' || value === 'en') dispatch(localeChanged(value))
    }}>
      <Select.Trigger className="language-trigger" aria-label={t('nav.language')}>
        <Languages className="language-symbol" aria-hidden="true" />
        <Select.Value lang={locale}>{languageNames[locale]}</Select.Value>
        <Select.Icon asChild>
          <ChevronDown className="language-chevron" aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="language-menu" position="popper" side="top" sideOffset={6}
          align="start" collisionPadding={8}>
          <Select.Viewport className="language-options">
            {Object.entries(languageNames).map(([language, label]) => (
              <Select.Item className="language-option" key={language} value={language} lang={language}>
                <Select.ItemText>{label}</Select.ItemText>
                <Select.ItemIndicator className="language-check">
                  <Check aria-hidden="true" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
