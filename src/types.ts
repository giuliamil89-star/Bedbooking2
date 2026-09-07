export type Categoria = "da_fare" | "preoccupazione" | "idea"

export type StatoPensiero = "da_categorizzare" | "categorizzato"

export interface Pensiero {
  id: number
  testo: string
  categoria: Categoria | null
  stato: StatoPensiero
}

export interface CategoriaConfig {
  key: Categoria
  label: string
  domanda: string
  variant: "todo" | "worry" | "idea"
}

export const CATEGORIE: CategoriaConfig[] = [
  { key: "da_fare", label: "Da Fare", domanda: "È una cosa da fare?", variant: "todo" },
  {
    key: "preoccupazione",
    label: "Preoccupazione",
    domanda: "È una preoccupazione?",
    variant: "worry",
  },
  { key: "idea", label: "Idea", domanda: "È solo un'idea?", variant: "idea" },
]
