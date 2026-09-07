import { useRef, useState } from "react"
import { Moon } from "lucide-react"

import { RiepilogoDialog } from "@/components/riepilogo-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CATEGORIE, type Categoria, type Pensiero } from "@/types"

let nextId = 1

export function SvuotaMenteSerale() {
  const [pensieri, setPensieri] = useState<Pensiero[]>([])
  const [valore, setValore] = useState("")
  const [errore, setErrore] = useState(false)
  const [dialogAperto, setDialogAperto] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const pensieroInAttesa = pensieri.find((p) => p.stato === "da_categorizzare") ?? null
  const ciSonoCategorizzati = pensieri.some((p) => p.stato === "categorizzato")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const testo = valore.trim()

    if (!testo) {
      setErrore(true)
      setTimeout(() => setErrore(false), 400)
      return
    }

    setPensieri((prev) => [
      ...prev,
      { id: nextId++, testo, categoria: null, stato: "da_categorizzare" },
    ])
    setValore("")
  }

  function categorizza(categoria: Categoria) {
    if (!pensieroInAttesa) return
    setPensieri((prev) =>
      prev.map((p) =>
        p.id === pensieroInAttesa.id ? { ...p, categoria, stato: "categorizzato" } : p
      )
    )
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function handleReset() {
    setDialogAperto(false)
    setPensieri([])
    setValore("")
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const gruppi = CATEGORIE.map((cat) => ({
    ...cat,
    voci: pensieri.filter((p) => p.categoria === cat.key),
  }))
  const totaleCategorizzati = gruppi.reduce((acc, g) => acc + g.voci.length, 0)

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col px-5 pb-5 pt-8 sm:pt-10">
      <header className="mb-5 flex flex-col items-center gap-1.5 text-center">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Moon className="size-4.5" />
        </span>
        <h1 className="font-serif text-2xl font-medium text-foreground">
          Svuota Mente Serale
        </h1>
        <p className="text-sm text-foreground/60">
          Libera la testa dai pensieri prima di dormire.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          value={valore}
          onChange={(e) => setValore(e.target.value)}
          placeholder="Scrivi qui un pensiero, una preoccupazione, un'idea..."
          disabled={!!pensieroInAttesa}
          autoFocus
          className={cn(
            "transition-[border-color,box-shadow]",
            errore && "animate-shake border-red-300 ring-4 ring-red-100"
          )}
          aria-label="Scrivi un pensiero"
        />

        {pensieroInAttesa && (
          <div className="flex flex-col gap-2 rounded-2xl bg-primary/8 p-3">
            <p className="px-1 text-xs text-foreground/60">
              “{pensieroInAttesa.testo}” — che cos'è?
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIE.map((cat) => (
                <Button
                  key={cat.key}
                  type="button"
                  variant="soft"
                  size="sm"
                  onClick={() => categorizza(cat.key)}
                >
                  {cat.domanda}
                </Button>
              ))}
            </div>
          </div>
        )}
      </form>

      <div className="mt-5 flex-1 overflow-y-auto">
        {pensieri.length === 0 ? (
          <p className="mt-10 text-center text-sm leading-relaxed text-foreground/40">
            Inizia a scrivere il primo pensiero che ti pesa per vederlo apparire qui.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {gruppi
              .filter((g) => g.voci.length > 0)
              .map((g) => (
                <Card key={g.key}>
                  <CardHeader>
                    <Badge variant={g.variant}>{g.label}</Badge>
                    <CardTitle className="ml-auto">{g.voci.length}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {g.voci.map((p) => (
                      <p key={p.id} className="text-sm leading-relaxed text-foreground/80">
                        {p.testo}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      <Button
        size="lg"
        className="mt-5 w-full"
        disabled={!ciSonoCategorizzati}
        onClick={() => setDialogAperto(true)}
      >
        Ho Finito, Mente Leggera
      </Button>

      <RiepilogoDialog
        open={dialogAperto}
        onOpenChange={(open) => {
          if (!open) handleReset()
          else setDialogAperto(open)
        }}
        pensieri={pensieri}
      />

      <span className="sr-only" aria-live="polite">
        {totaleCategorizzati} pensieri organizzati
      </span>
    </div>
  )
}
