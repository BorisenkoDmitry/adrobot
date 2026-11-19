import { AlertCircle, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n'

import { Button } from './button'

const englishDetails = new Map([
  ['Введите корректный ключ API Keitaro.', 'Enter a valid Keitaro API key.'],
  ['Шифрование ключей не настроено на сервере.', 'Key encryption is not configured on the server.'],
  ['Сохранённый ключ не удалось расшифровать.', 'The saved key could not be decrypted.'],
  ['Сохранённого ключа Keitaro нет.', 'There is no saved Keitaro key.'],
  ['Подключение к Keitaro не настроено.', 'The Keitaro connection is not configured.'],
  ['Keitaro отклонил запрос. Проверьте права ключа.', 'Keitaro denied the request. Check the key permissions.'],
  ['Keitaro не ответил вовремя.', 'Keitaro did not respond in time.'],
  ['Keitaro ограничил частоту запросов.', 'Keitaro rate-limited this request.'],
  ['Keitaro не принял параметры операции.', 'Keitaro rejected the request parameters.'],
  ['Keitaro вернул данные в неожиданном формате.', 'Keitaro returned data in an unexpected format.'],
  ['Keitaro не подтвердил новые доли. Черновик сохранён.', 'Keitaro did not confirm the shares. Your draft was kept.'],
  ['Снимите закрепление с оффера, чтобы освободить долю для перерасчёта.', 'Unpin an offer to free up a share for recalculation.'],
  ['Снимите закрепление хотя бы с одного оффера для перерасчёта долей.', 'Unpin at least one offer to recalculate the shares.'],
  ['Поток изменился. Обновите список потоков и повторите действие.', 'The stream changed. Refresh the streams and try again.'],
  ['Поток изменился в Keitaro. Обновите список потоков и повторите действие.', 'The stream changed in Keitaro. Refresh the streams and try again.'],
  ['Поток изменился в Keitaro. Обновите список и отмените черновик.', 'The stream changed in Keitaro. Refresh the streams and discard the draft.'],
  ['Сумма долей активных офферов должна быть равна 100%.', 'Active offer shares must add up to 100%.'],
])

const englishStatuses: Record<number, string | undefined> = {
  0: 'Could not connect to Adrobot. Try again.',
  400: 'Check the information you entered.',
  401: 'Sign in to continue.',
  403: 'You do not have access to this action.',
  404: 'The requested item was not found.',
  409: 'The data changed. Refresh it and try again.',
  422: 'Check the information you entered.',
  502: 'The Keitaro request failed. Try again later.',
  503: 'The service is temporarily unavailable.',
  504: 'The request timed out. Try again.',
}

export function LoadingState({ children }: { children: ReactNode }) {
  return <div className="section-state" role="status"><LoaderCircle className="size-5 animate-spin" aria-hidden="true" />{children}</div>
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { locale, t } = useI18n()
  let message = error instanceof Error ? error.message : t('error.generic')
  if (locale === 'en' && error instanceof ApiError && /\p{Script=Cyrillic}/u.test(message)) {
    message = englishDetails.get(message) ?? englishStatuses[error.status] ?? t('error.generic')
  }

  return (
    <div className="error-state" role="alert">
      <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
      {onRetry && <Button className="ml-auto" onClick={onRetry} variant="outline">{t('common.retry')}</Button>}
    </div>
  )
}
