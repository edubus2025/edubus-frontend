interface ContentItem {
  id: string
  title: string
  description: string
  type: string
  url: string
  levels: string[]
  subjects: string[]
  quizzes: { id: string; title: string }[]
  views?: number // Ajouté pour les statistiques
  created_at?: string // Ajouté pour la date de création
}

export type { ContentItem }
