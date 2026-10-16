import { useEffect, useMemo, useState } from 'react'
import { COUNCIL_DIRECTORY, PROVINCE_ORDER, HEAD_OF_ADMINISTRATION_TITLE } from '../data/councilDirectory'
import { fetchCouncils } from '../lib/officerApi'

const LEGAL_FRAMEWORK = [
  {
    title: 'Municipal Councils Ordinance (1947)',
    body: 'The founding statute for Municipal Councils, the largest and most urbanised tier of local authority. Sets out how a council is constituted, the office of Mayor, and the office of Municipal Commissioner as chief administrative officer.',
  },
  {
    title: 'Urban Councils Ordinance No. 61 of 1939',
    body: 'Governs Urban Councils, the second tier of local authority (semi-urban areas). Several Urban Councils were upgraded to Municipal Council status after the 2025 local government elections.',
  },
  {
    title: 'Pradeshiya Sabhas Act No. 15 of 1987',
    body: 'Governs Pradeshiya Sabhas, the third tier of local authority (rural areas). Introduced as part of the 1987 devolution reforms alongside the Provincial Councils system.',
  },
  {
    title: 'Thirteenth Amendment to the Constitution (1987)',
    body: 'Established the Provincial Council system, the tier this platform\'s Provincial Officer role represents oversight for, devolving specified subjects, including local government, to the provincial level.',
  },
]

const HIERARCHY_STEPS = [
  {
    title: 'Ministry (national)',
    body: 'Sets local government policy and legislation nationally. Does not handle day to day complaints.',
  },
  {
    title: 'Provincial Officer (one per province)',
    body: 'Stands in for the Commissioner of Local Government for that province. Oversees every council in the province and handles escalations when a council falls behind its response targets.',
  },
  {
    title: 'Municipal Officer (one per council)',
    body: 'Stands in for the Municipal Commissioner, the chief administrative officer of the council. Triages and resolves issues reported within that council only.',
  },
  {
    title: 'Citizen',
    body: 'Reports an issue with no account needed, and can check its status at any time.',
  },
]

export function CouncilDirectory() {
  const [liveNames, setLiveNames] = useState<Set<string>>(new Set())

  useEffect(() => {
    void fetchCouncils().then((councils) => setLiveNames(new Set(councils.map((c) => c.name))))
  }, [])

  const grouped = useMemo(() => {
    const byProvince = new Map<string, typeof COUNCIL_DIRECTORY>()
    for (const council of COUNCIL_DIRECTORY) {
      const list = byProvince.get(council.province) ?? []
      list.push(council)
      byProvince.set(council.province, list)
    }
    return PROVINCE_ORDER.map((province) => ({ province, councils: byProvince.get(province) ?? [] })).filter(
      (group) => group.councils.length > 0
    )
  }, [])

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-bark sm:text-4xl">
            Council Directory and Governance
          </h1>
          <p className="mt-3 text-bark/60">
            How local government responsibility actually flows in Sri Lanka, and every Municipal
            Council currently in the directory.
          </p>
        </div>

        <div className="mt-14">
          <h2 className="text-xl font-bold text-bark">How oversight works</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {HIERARCHY_STEPS.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-bark/10 bg-white p-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pumpkin/15 text-xs font-bold text-pumpkin">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-sm font-bold text-bark">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-bark/60">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <h2 className="text-xl font-bold text-bark">Legal framework</h2>
          <p className="mt-2 max-w-2xl text-sm text-bark/60">
            The statutes that actually define these roles and this hierarchy, not an invented
            structure.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {LEGAL_FRAMEWORK.map((item) => (
              <div key={item.title} className="rounded-2xl border border-bark/10 bg-white p-5">
                <h3 className="text-sm font-bold text-bark">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-bark/60">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-bark/40">
            Sources:{' '}
            <a
              href="https://www.srilankalaw.lk/revised-statutes/alphabetical-list-of-statutes/1576-municipal-councils-ordinance.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-pumpkin"
            >
              Laws of Sri Lanka, Municipal Councils Ordinance
            </a>
            {', '}
            <a
              href="https://www.clgf.org.uk/regions/clgf-asia/sri-lanka/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-pumpkin"
            >
              Commonwealth Local Government Forum, Sri Lanka country profile
            </a>
            .
          </p>
        </div>

        <div className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-bark">Every Municipal Council</h2>
            <span className="rounded-full bg-fern/10 px-3 py-1 text-xs font-semibold text-fern">
              {liveNames.size} live in this pilot
            </span>
          </div>

          <div className="mt-6 space-y-8">
            {grouped.map((group) => (
              <div key={group.province}>
                <h3 className="text-sm font-bold uppercase tracking-wide text-bark/50">{group.province}</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {group.councils.map((council) => (
                    <div
                      key={council.name}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-bark/10 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-semibold text-bark">{council.name}</p>
                        <p className="text-xs text-bark/50">{council.district} District</p>
                        <p className="mt-1 text-xs text-bark/50">
                          Head of administration: {HEAD_OF_ADMINISTRATION_TITLE}
                          {council.contactPhone ? (
                            <>
                              {' '}
                              <a href={`tel:${council.contactPhone.replace(/\s+/g, '')}`} className="font-medium text-pumpkin hover:underline">
                                {council.contactPhone}
                              </a>
                            </>
                          ) : (
                            <span className="italic"> (contact number not yet verified, check the council&apos;s own website)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-row gap-1 sm:flex-col sm:items-end">
                        {liveNames.has(council.name) && (
                          <span className="rounded-full bg-fern/10 px-2 py-0.5 text-[11px] font-semibold text-fern">
                            Live in this pilot
                          </span>
                        )}
                        {council.newSince2025 && (
                          <span className="rounded-full bg-golden/15 px-2 py-0.5 text-[11px] font-semibold text-bark/70">
                            Upgraded from Urban Council, 2025
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 rounded-xl bg-bark/5 px-4 py-3 text-xs leading-relaxed text-bark/50">
            Compiled from public sources as of this build, including Wikipedia and the Ministry of
            Provincial Councils and Local Government. Sources vary between 27 and 29 councils
            depending on the exact cutoff date around the 2025 local government elections. Verify
            against the Department of Local Government&apos;s official gazette before relying on this
            list for official purposes.
          </p>
        </div>
      </div>
    </section>
  )
}
