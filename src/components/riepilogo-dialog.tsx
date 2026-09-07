import { useState } from "react"
import { Check, Copy, Mail } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { buildMailtoLink, formatRiepilogo } from "@/lib/riepilogo"
import { CATEGORIE, type Pensiero } from "@/types"

interface RiepilogoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pensieri: Pensiero[]
}

export function RiepilogoDialog({ open, onOpenChange, pensieri }: RiepilogoDialogProps) {
  const [copiato, setCopiato] = useState(false)

  const gruppi = CATEGORIE.map((cat) => ({
    ...cat,
    voci: pensieri.filter((p) => p.categoria === cat.key),
  })).filter((g) => g.voci.length > 0)

  async function handleCopia() {
    try {
      await navigator.clipboard.writeText(formatRiepilogo(pensieri))
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2000)
    } catch {
      // Se il clipboard non è disponibile, non blocchiamo l'utente.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mente Leggera</DialogTitle>
          <DialogDescription>
            Ecco fatto. I tuoi pensieri sono organizzati e al sicuro qui, pronti per domani.
            Ora la tua mente ha il permesso di riposare e ricaricarsi. Buona notte.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-64 flex-col gap-4 overflow-y-auto pr-1">
          {gruppi.map((g) => (
            <div key={g.key} className="flex flex-col gap-1.5">
              <Badge variant={g.variant} className="w-fit">
                {g.label}
              </Badge>
              <ul className="flex flex-col gap-1 pl-1">
                {g.voci.map((p) => (
                  <li key={p.id} className="text-sm leading-relaxed text-foreground/80">
                    {p.testo}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="soft" onClick={handleCopia}>
            {copiato ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copiato ? "Copiato!" : "Copia Riepilogo"}
          </Button>
          <Button variant="soft" asChild>
            <a href={buildMailtoLink(pensieri)}>
              <Mail className="size-4" />
              Invia via Email
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
