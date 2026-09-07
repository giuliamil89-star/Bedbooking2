import { CATEGORIE, type Pensiero } from "@/types"

const INTRO =
  "Ecco fatto. I tuoi pensieri sono organizzati e al sicuro qui, pronti per domani. Ora la tua mente ha il permesso di riposare e ricaricarsi. Buona notte."

export function formatRiepilogo(pensieri: Pensiero[]): string {
  const blocchi = CATEGORIE.map(({ key, label }) => {
    const voci = pensieri.filter((p) => p.categoria === key)
    if (voci.length === 0) return null
    const righe = voci.map((p) => `- ${p.testo}`).join("\n")
    return `# ${label}\n${righe}`
  }).filter((blocco): blocco is string => blocco !== null)

  return [INTRO, "", ...blocchi].join("\n").trim()
}

export function buildMailtoLink(pensieri: Pensiero[]): string {
  const subject = encodeURIComponent("Svuota Mente Serale – Il mio riepilogo")
  const body = encodeURIComponent(formatRiepilogo(pensieri))
  return `mailto:?subject=${subject}&body=${body}`
}
