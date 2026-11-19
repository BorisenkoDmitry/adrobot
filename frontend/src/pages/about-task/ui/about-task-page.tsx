import { useI18n } from '@/shared/i18n'

import { aboutCopy } from '../model/copy'
import {
  adrobotApi, architecture, backendFiles, database, features, frontendFiles, keitaroApi,
  publishExample, runCommands, type ReportRow,
} from '../model/report'
import './about-task-page.css'

const sectionIds = ['overview', 'database', 'api', 'backend', 'frontend', 'run'] as const

type ReportRows = { rows: readonly ReportRow[]; languageColumn: 1 | 2 }

function CodeList({ rows, languageColumn }: ReportRows) {
  return (
    <dl className="about-code-list">
      {rows.map((row) => (
        <div key={row[0]}>
          <dt><code>{row[0]}</code></dt>
          <dd>{row[languageColumn]}</dd>
        </div>
      ))}
    </dl>
  )
}

function ApiTable({ title, prefix, headings, rows, languageColumn }: ReportRows & {
  title: string
  prefix: string
  headings: [request: string, purpose: string]
}) {
  return (
    <div className="about-api-panel">
      <table className="about-api-table">
        <caption>{title} <code>{prefix}</code></caption>
        <thead>
          <tr><th scope="col">{headings[0]}</th><th scope="col">{headings[1]}</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              <th scope="row"><code>{row[0]}</code></th>
              <td>{row[languageColumn]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AboutTaskPage() {
  const { locale, t } = useI18n()
  const copy = aboutCopy[locale]
  const languageColumn = locale === 'ru' ? 1 : 2
  const apiHeadings: [string, string] = [copy.request, copy.purpose]

  return (
    <article className="work-page about-task">
      <header className="page-heading">
        <div>
          <h1>{t('nav.about')}</h1>
          <p>{copy.intro}</p>
        </div>
      </header>

      <div className="about-layout">
        <nav className="about-contents" aria-label={copy.contents}>
          <p>{copy.contents}</p>
          <ul>
            {sectionIds.map((id) => <li key={id}><a href={`#${id}`}>{copy[id]}</a></li>)}
          </ul>
        </nav>

        <div className="about-sections">
          <section id="overview" className="about-section" aria-labelledby="about-overview">
            <h2 id="about-overview">{copy.overview}</h2>
            <ol className="about-architecture">
              {architecture.map((row) => (
                <li key={row[0]}>
                  <strong>{row[0]}</strong>
                  <p>{row[languageColumn]}</p>
                </li>
              ))}
            </ol>
            <ul className="about-features">
              {features.map((row) => <li key={row[0]}>{row[languageColumn]}</li>)}
            </ul>
            <aside className="about-note">
              <h3>{copy.historyHeading}</h3>
              <p>{copy.historyNote}</p>
            </aside>
          </section>

          <section id="database" className="about-section" aria-labelledby="about-database">
            <h2 id="about-database">{copy.database}</h2>
            <div className="about-database">
              {database.map(({ name, purpose, columns }) => (
                <section className="about-card" key={name}>
                  <h3><code>{name}</code></h3>
                  <p>{purpose[locale === 'ru' ? 0 : 1]}</p>
                  <CodeList rows={columns} languageColumn={languageColumn} />
                </section>
              ))}
            </div>
            <aside className="about-note">
              <h3>{copy.relationHeading}</h3>
              <p>{copy.relationBefore} <code>(campaign_id, stream_id)</code>. {copy.relationAfter}</p>
              <p>{copy.indexBefore} <code>ix_stream_publications_campaign_id_id</code> {copy.indexAfter}</p>
            </aside>
          </section>

          <section id="api" className="about-section" aria-labelledby="about-api">
            <h2 id="about-api">{copy.api}</h2>
            <ApiTable title="Adrobot" prefix="/api/v1" headings={apiHeadings} rows={adrobotApi} languageColumn={languageColumn} />
            <ApiTable title="Keitaro" prefix="/admin_api/v1" headings={apiHeadings} rows={keitaroApi} languageColumn={languageColumn} />
            <p>{copy.apiNote}</p>
            <details className="about-example">
              <summary>{copy.publishExample}</summary>
              <pre><code>{publishExample}</code></pre>
            </details>
          </section>

          <section id="backend" className="about-section" aria-labelledby="about-backend">
            <h2 id="about-backend">{copy.backend}</h2>
            <p>{copy.pathsFrom} <code>backend/</code></p>
            <CodeList rows={backendFiles} languageColumn={languageColumn} />
          </section>

          <section id="frontend" className="about-section" aria-labelledby="about-frontend">
            <h2 id="about-frontend">{copy.frontend}</h2>
            <p>{copy.pathsFrom} <code>frontend/src/</code></p>
            <CodeList rows={frontendFiles} languageColumn={languageColumn} />
          </section>

          <section id="run" className="about-section" aria-labelledby="about-run">
            <h2 id="about-run">{copy.run}</h2>
            <p>{copy.runSetup}</p>
            <pre><code>{runCommands}</code></pre>
            <p>{copy.runNote}</p>
          </section>
        </div>
      </div>
    </article>
  )
}
