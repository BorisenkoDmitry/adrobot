import { Link } from 'react-router'

import { useI18n } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'

export function NotFoundPage() {
  const { t } = useI18n()

  return (
    <section className="work-page justify-items-start">
      <header className="page-heading"><h1>{t('notFound.title')}</h1></header>
      <Button asChild variant="outline"><Link to="/">{t('notFound.home')}</Link></Button>
    </section>
  )
}
