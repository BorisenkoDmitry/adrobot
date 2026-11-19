import { Link } from 'react-router'

import { Button } from '@/shared/ui/button'

export function NotFoundPage() {
  return (
    <section className="work-page justify-items-start">
      <header className="page-heading"><h1>Страница не найдена</h1></header>
      <Button asChild variant="outline"><Link to="/">На главную</Link></Button>
    </section>
  )
}
