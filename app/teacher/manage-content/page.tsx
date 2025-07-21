"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModernHeader } from "@/components/modern-header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EnhancedCard } from "@/components/enhanced-card"
import { getCurrentUser, apiRequest } from "@/lib/api"
import { Trash2, Edit, Eye, Plus, BookOpen, Video, Music, Users, Calendar, Search, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ContentItem {
  id: string
  title: string
  description: string
  type: string
  url: string
  levels: string[]
  subjects: string[]
  quizzes: { id: string; title: string }[]
  created_at?: string
}

export default function ManageContentPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [contents, setContents] = useState<ContentItem[]>([])
  const [filteredContents, setFilteredContents] = useState<ContentItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterSubject, setFilterSubject] = useState("all")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: userData, error: userError } = await getCurrentUser()

      if (userError || !userData || userData.role !== "teacher") {
        router.push("/login")
        return
      }
      setUser(userData)

      const { data: contentsData, error: contentsError } = await apiRequest<ContentItem[]>("/api/teacher/content/")

      if (contentsError) {
        console.error("Error fetching teacher contents:", contentsError)
        setError("Impossible de charger vos contenus. Veuillez réessayer.")
      } else {
        setContents(contentsData || [])
        setFilteredContents(contentsData || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [router])

  useEffect(() => {
    let filtered = contents

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (content) =>
          content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          content.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrage par type
    if (filterType !== "all") {
      filtered = filtered.filter((content) => content.type === filterType)
    }

    // Filtrage par matière
    if (filterSubject !== "all") {
      filtered = filtered.filter((content) => content.subjects.includes(filterSubject))
    }

    setFilteredContents(filtered)
  }, [contents, searchTerm, filterType, filterSubject])

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce contenu et son quiz associé ?")) {
      return
    }
    setLoading(true)
    setError(null)
    const { error: deleteError } = await apiRequest(`/api/teacher/content/${contentId}/`, "DELETE")

    if (deleteError) {
      console.error("Error deleting content:", deleteError)
      setError(`Erreur lors de la suppression : ${deleteError}`)
    } else {
      setContents((prevContents) => prevContents.filter((content) => content.id !== contentId))
      alert("Contenu supprimé avec succès !")
    }
    setLoading(false)
  }

  const handleEditContent = (contentId: string) => {
    router.push(`/teacher/edit-content/${contentId}`)
  }

  const handleViewContent = (contentId: string) => {
    router.push(`/teacher/view-content/${contentId}`)
  }

  const subjects = [
    "Arabe",
    "Français",
    "Anglais",
    "Histoire-Géographie",
    "Philosophie",
    "Orientation scolaire et professionnelle",
    "soft-skills",
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <LoadingSpinner size="lg" text="Chargement de vos contenus..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <ModernHeader title="EduBus Enseignant" subtitle="Gestion de contenu" />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* En-tête de la page */}
        <div className="text-center space-y-4 mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full text-sm font-medium shadow-lg">
            <BookOpen className="w-4 h-4" />
            Gestion de contenu
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Gérer mes Contenus
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Visualisez, modifiez et organisez vos leçons et quiz. Créez du contenu éducatif de qualité pour vos
            étudiants.
          </p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <EnhancedCard className="text-center animate-fade-in" hover>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{contents.length}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Contenus Totaux</div>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard className="text-center animate-fade-in animation-delay-100" hover>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                  {contents.filter((c) => c.type === "video").length}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Vidéos</div>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard className="text-center animate-fade-in animation-delay-200" hover>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                <Music className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                  {contents.filter((c) => c.type === "audio").length}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Audios</div>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard className="text-center animate-fade-in animation-delay-300" hover>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                  {contents.reduce((acc, content) => acc + content.quizzes.length, 0)}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Quiz Créés</div>
              </div>
            </div>
          </EnhancedCard>
        </div>

        {/* Barre de recherche et filtres */}
        <EnhancedCard className="mb-8 animate-fade-in animation-delay-400" gradient>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <Input
                placeholder="Rechercher dans vos contenus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <div className="flex gap-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40 h-12">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="video">Vidéos</SelectItem>
                  <SelectItem value="audio">Audios</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-48 h-12">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Matière" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les matières</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </EnhancedCard>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 animate-fade-in">
            {error}
          </div>
        )}

        {/* Liste des contenus */}
        {filteredContents.length === 0 ? (
          <EnhancedCard className="text-center py-12 animate-fade-in animation-delay-500" gradient>
            <div className="space-y-6">
              <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                  {contents.length === 0 ? "Aucun contenu créé" : "Aucun résultat trouvé"}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  {contents.length === 0
                    ? "Vous n'avez pas encore créé de contenu. Commencez par ajouter votre première leçon !"
                    : "Essayez de modifier vos critères de recherche ou de filtrage."}
                </p>
                {contents.length === 0 && (
                  <Link href="/teacher/add-content">
                    <Button className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <Plus className="w-5 h-5 mr-2" />
                      Créer mon premier contenu
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </EnhancedCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContents.map((content, index) => (
              <Card
                key={content.id}
                className={cn(
                  "overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-0",
                  "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md animate-fade-in",
                  `animation-delay-${index * 100}`,
                )}
              >
                <CardHeader className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-secondary-600/20" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {content.type === "video" ? (
                          <>
                            <Video className="w-3 h-3 mr-1" /> Vidéo
                          </>
                        ) : (
                          <>
                            <Music className="w-3 h-3 mr-1" /> Audio
                          </>
                        )}
                      </Badge>
                      <div className="flex items-center gap-1 text-white/80 text-xs">
                        <Calendar className="w-3 h-3" />
                        {content.created_at ? new Date(content.created_at).toLocaleDateString() : "Récent"}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold line-clamp-2">{content.title}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                    {content.description || "Aucune description disponible."}
                  </p>

                  {/* Tags */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {content.levels.slice(0, 2).map((level) => (
                        <Badge
                          key={level}
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {level}
                        </Badge>
                      ))}
                      {content.levels.length > 2 && (
                        <Badge variant="outline" className="text-xs bg-neutral-50 text-neutral-600">
                          +{content.levels.length - 2}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {content.subjects.slice(0, 2).map((subject) => (
                        <Badge
                          key={subject}
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200"
                        >
                          {subject}
                        </Badge>
                      ))}
                      {content.subjects.length > 2 && (
                        <Badge variant="outline" className="text-xs bg-neutral-50 text-neutral-600">
                          +{content.subjects.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Quiz info */}
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <Users className="w-4 h-4" />
                    <span>
                      {content.quizzes.length} quiz associé{content.quizzes.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewContent(content.id)}
                      className="flex-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditContent(content.id)}
                      className="flex-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteContent(content.id)}
                      className="hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Bouton d'ajout flottant */}
        <Link href="/teacher/add-content">
          <Button
            className={cn(
              "fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl",
              "bg-gradient-to-r from-primary-500 to-secondary-500",
              "hover:from-primary-600 hover:to-secondary-600",
              "transform transition-all duration-300 hover:scale-110",
              "text-white z-50 animate-bounce-gentle",
            )}
          >
            <Plus className="w-8 h-8" />
          </Button>
        </Link>
      </main>
    </div>
  )
}
