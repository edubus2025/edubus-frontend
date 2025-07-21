"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { apiRequest, getCurrentUser } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Play, Filter, Sparkles, TrendingUp, Search, X, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { ModernHeader } from "@/components/modern-header"
import { ProgressDashboard } from "@/components/progress-dashboard"
import { ContentPlayer } from "@/components/content-player"
import { QuizComponent } from "@/components/quiz-component"
import { MobileNav } from "@/components/mobile-nav"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EnhancedCard } from "@/components/enhanced-card"

interface ContentItem {
  id: string
  title: string
  description: string
  type: string
  url: string
  levels: string[]
  subjects: string[]
  quizzes: { id: string; title: string }[]
}

const schoolLevels = [
  "Tous les niveaux",
  "1ère année collégial",
  "2ème année collégial",
  "3ème année collégial",
  "Tronc commun",
  "1ère année bac",
  "2ème année bac",
]

const subjects = [
  "Toutes les matières",
  "Arabe",
  "Français",
  "Anglais",
  "Histoire-Géographie",
  "Philosophie",
  "Orientation scolaire et professionnelle",
  "Soft-skills",
]

export default function EduBusApp() {
  const [activeTab, setActiveTab] = useState("content")
  const [lessonsCompleted, setLessonsCompleted] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [totalLessons, setTotalLessons] = useState(0)
  const [contents, setContents] = useState<ContentItem[]>([])
  const [filteredContents, setFilteredContents] = useState<ContentItem[]>([])
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("Tous les niveaux")
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("Toutes les matières")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  // Fonction pour récupérer les contenus avec les filtres
  const fetchContents = async (levelFilter: string, subjectFilter: string) => {
    let url = "/api/student/content/"
    const queryParams = new URLSearchParams()

    if (levelFilter !== "Tous les niveaux") {
      queryParams.append("level", levelFilter)
    }
    if (subjectFilter !== "Toutes les matières") {
      queryParams.append("subject", subjectFilter)
    }

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`
    }

    const { data: contentsData, error: contentsError } = await apiRequest<ContentItem[]>(url)

    if (contentsError) {
      console.error("Error fetching contents:", contentsError)
      setContents([])
      setFilteredContents([])
    } else {
      setContents(contentsData || [])
      setFilteredContents(contentsData || [])
      setTotalLessons(contentsData?.length || 0)
    }
  }

  // Fonction pour filtrer par recherche
  const filterContentsBySearch = (query: string) => {
    if (!query.trim()) {
      setFilteredContents(contents)
      return
    }

    const filtered = contents.filter(
      (content) =>
        content.title.toLowerCase().includes(query.toLowerCase()) ||
        content.description.toLowerCase().includes(query.toLowerCase()) ||
        content.levels.some((level) => level.toLowerCase().includes(query.toLowerCase())) ||
        content.subjects.some((subject) => subject.toLowerCase().includes(query.toLowerCase())),
    )
    setFilteredContents(filtered)
  }

  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true)
      const { data: user, error: userError } = await getCurrentUser()

      if (userError || !user) {
        router.push("/login")
        setLoading(false)
        return
      }

      const role = user.role || "student"
      setUserRole(role)

      // Redirection immédiate pour les enseignants et admins - AVANT de charger le contenu
      if (role === "teacher") {
        setIsRedirecting(true)
        router.push("/teacher/dashboard")
        return
      }

      if (role === "admin") {
        setIsRedirecting(true)
        router.push("/admin/dashboard")
        return
      }

      // Continuer le chargement seulement pour les étudiants
      await fetchContents(selectedLevelFilter, selectedSubjectFilter)

      const { data: progressData, error: progressError } = await apiRequest<any[]>("/api/progress/")

      if (progressError) {
        console.error("Error fetching progress:", progressError)
      } else {
        const completedCount = progressData?.length || 0
        const points = progressData?.reduce((sum, p) => sum + (p.score || 0), 0) || 0
        setLessonsCompleted(completedCount)
        setTotalPoints(points)
      }
      setLoading(false)
    }

    fetchInitialData()
  }, [router, selectedLevelFilter, selectedSubjectFilter])

  // Effet pour la recherche - seulement pour les étudiants
  useEffect(() => {
    if (userRole === "student") {
      filterContentsBySearch(searchQuery)
    }
  }, [searchQuery, contents, userRole])

  const handleContentSelect = (content: ContentItem) => {
    setSelectedContent(content)
    setSelectedQuizId(content.quizzes[0]?.id || null)
    setActiveTab("content-player")
  }

  const handleQuizStart = () => {
    if (selectedQuizId) {
      setActiveTab("quiz")
    } else {
      setLessonsCompleted((prev) => prev + 1)
      setActiveTab("progression")
    }
  }

  const handleQuizComplete = async (score: number) => {
    if (selectedContent && selectedQuizId) {
      const { data: user, error: userError } = await getCurrentUser()
      if (user && !userError) {
        const { error: submitError } = await apiRequest("/api/progress/submit_quiz_answer/", "POST", {
          content_id: selectedContent.id,
          quiz_id: selectedQuizId,
          score: score,
        })

        if (submitError) {
          console.error("Error recording progress:", submitError)
        } else {
          setLessonsCompleted((prev) => prev + 1)
          setTotalPoints((prev) => prev + score)
        }
      }
    }
    setActiveTab("progression")
  }

  const clearAllFilters = () => {
    setSelectedLevelFilter("Tous les niveaux")
    setSelectedSubjectFilter("Toutes les matières")
    setSearchQuery("")
  }

  const hasActiveFilters =
    selectedLevelFilter !== "Tous les niveaux" ||
    selectedSubjectFilter !== "Toutes les matières" ||
    searchQuery.trim() !== ""

  // Affichage du loading pendant le chargement initial ou la redirection
  if (loading || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <LoadingSpinner
          size="lg"
          text={isRedirecting ? "Redirection en cours..." : "Chargement de votre espace d'apprentissage..."}
        />
      </div>
    )
  }

  // Ne pas afficher le contenu si l'utilisateur n'est pas un étudiant
  if (userRole !== "student") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <LoadingSpinner size="lg" text="Redirection en cours..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <ModernHeader subtitle="Votre plateforme d'apprentissage personnalisée" />

      <main className="flex-1 overflow-auto pb-16">
        {/* Onglet Contenu */}
        {activeTab === "content" && (
          <div className="p-4 space-y-6 animate-fade-in">
            {/* En-tête avec statistiques */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full text-sm font-medium shadow-lg">
                <Sparkles className="w-4 h-4" />
                Découvrez de nouveaux contenus
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Contenus Disponibles
              </h2>

              {/* Statistiques rapides */}
              <div className="flex justify-center gap-6 text-sm text-neutral-600">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-primary-500" />
                  {totalLessons} leçons
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-secondary-500" />
                  {lessonsCompleted} complétées
                </div>
              </div>
            </div>

            {/* Zone de recherche et filtres stylisés */}
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Barre de recherche principale */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Rechercher des leçons, matières, niveaux..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-12 h-12 text-lg bg-white/80 backdrop-blur-sm border-2 border-neutral-200 focus:border-primary-500 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Bouton pour afficher/masquer les filtres */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-full border-2 transition-all duration-300",
                    showFilters
                      ? "bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900 dark:border-primary-700"
                      : "bg-white/80 border-neutral-200 hover:border-primary-300 hover:bg-primary-50",
                  )}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtres avancés
                  {hasActiveFilters && (
                    <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                      {
                        [
                          selectedLevelFilter !== "Tous les niveaux",
                          selectedSubjectFilter !== "Toutes les matières",
                          searchQuery.trim() !== "",
                        ].filter(Boolean).length
                      }
                    </span>
                  )}
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={clearAllFilters}
                    className="text-neutral-500 hover:text-neutral-700 text-sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Effacer tout
                  </Button>
                )}
              </div>

              {/* Filtres déroulants avec animation */}
              {showFilters && (
                <div className="animate-fade-in">
                  <Card className="p-6 bg-gradient-to-br from-white to-primary-50 dark:from-neutral-900 dark:to-primary-950">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-primary-600" />
                        <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-200">
                          Filtres de recherche
                        </h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Filtre par niveau */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            Niveau scolaire
                          </Label>
                          <Select value={selectedLevelFilter} onValueChange={setSelectedLevelFilter}>
                            <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-2 border-neutral-200 focus:border-primary-500 rounded-xl transition-all duration-300">
                              <SelectValue placeholder="Sélectionner un niveau" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2">
                              {schoolLevels.map((level) => (
                                <SelectItem key={level} value={level} className="rounded-lg">
                                  <div className="flex items-center gap-2">
                                    {level === selectedLevelFilter && (
                                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                    )}
                                    {level}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Filtre par matière */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                            <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                            Matière
                          </Label>
                          <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
                            <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-2 border-neutral-200 focus:border-secondary-500 rounded-xl transition-all duration-300">
                              <SelectValue placeholder="Sélectionner une matière" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2">
                              {subjects.map((subject) => (
                                <SelectItem key={subject} value={subject} className="rounded-lg">
                                  <div className="flex items-center gap-2">
                                    {subject === selectedSubjectFilter && (
                                      <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                                    )}
                                    {subject}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Résumé des filtres actifs */}
                      {hasActiveFilters && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 rounded-xl border border-primary-200 dark:border-primary-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Filter className="w-4 h-4 text-primary-600" />
                            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                              Filtres actifs :
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedLevelFilter !== "Tous les niveaux" && (
                              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full border border-primary-200">
                                📚 {selectedLevelFilter}
                              </span>
                            )}
                            {selectedSubjectFilter !== "Toutes les matières" && (
                              <span className="px-3 py-1 bg-secondary-100 text-secondary-700 text-sm rounded-full border border-secondary-200">
                                🎯 {selectedSubjectFilter}
                              </span>
                            )}
                            {searchQuery.trim() && (
                              <span className="px-3 py-1 bg-accent-100 text-accent-700 text-sm rounded-full border border-accent-200">
                                🔍 "{searchQuery}"
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* Résultats de recherche */}
            <div className="max-w-6xl mx-auto">
              {filteredContents.length === 0 ? (
                <EnhancedCard className="text-center py-12">
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-full flex items-center justify-center mx-auto">
                      <Search className="w-10 h-10 text-neutral-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                        Aucun contenu trouvé
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        {searchQuery.trim()
                          ? `Aucun résultat pour "${searchQuery}"`
                          : "Aucun contenu disponible avec ces filtres"}
                      </p>
                      <Button onClick={clearAllFilters} variant="outline" className="mt-4 bg-transparent">
                        <X className="w-4 h-4 mr-2" />
                        Réinitialiser les filtres
                      </Button>
                    </div>
                  </div>
                </EnhancedCard>
              ) : (
                <div className="space-y-4">
                  {/* Compteur de résultats */}
                  <div className="text-center">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {filteredContents.length} résultat{filteredContents.length > 1 ? "s" : ""} trouvé
                      {filteredContents.length > 1 ? "s" : ""}
                      {searchQuery.trim() && ` pour "${searchQuery}"`}
                    </p>
                  </div>

                  {/* Grille des contenus */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredContents.map((content, index) => (
                      <EnhancedCard
                        key={content.id}
                        hover
                        icon={
                          content.type === "video" ? (
                            <Play className="w-5 h-5 text-primary-600" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-primary-600" />
                          )
                        }
                        badge={content.type === "video" ? "Vidéo" : "Audio"}
                        onClick={() => handleContentSelect(content)}
                        className={cn("animate-fade-in", `animation-delay-${index * 100}`)}
                      >
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-200 line-clamp-2">
                            {content.title}
                          </h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                            {content.description}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {content.levels.slice(0, 2).map((level) => (
                              <span
                                key={level}
                                className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium"
                              >
                                {level}
                              </span>
                            ))}
                            {content.subjects.slice(0, 2).map((subject) => (
                              <span
                                key={subject}
                                className="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded-full font-medium"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>

                          <Button className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg transition-all duration-300">
                            <Play className="w-4 h-4 mr-2" />
                            Commencer la leçon
                          </Button>
                        </div>
                      </EnhancedCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onglet Lecteur de contenu */}
        {activeTab === "content-player" && selectedContent && (
          <div className="animate-fade-in">
            <ContentPlayer content={selectedContent} onQuizStart={handleQuizStart} />
          </div>
        )}

        {/* Onglet Quiz */}
        {activeTab === "quiz" && (
          <div className="p-4 space-y-6 animate-fade-in">
            {selectedContent && selectedQuizId ? (
              <QuizComponent
                contentId={selectedContent.id}
                quizId={selectedQuizId}
                onQuizComplete={handleQuizComplete}
              />
            ) : (
              <EnhancedCard className="max-w-md mx-auto text-center">
                <div className="py-8">
                  <Sparkles className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Veuillez sélectionner un contenu avec un quiz pour commencer.
                  </p>
                </div>
              </EnhancedCard>
            )}
          </div>
        )}

        {/* Onglet Progression */}
        {activeTab === "progression" && (
          <div className="p-4 animate-fade-in">
            <ProgressDashboard
              lessonsCompleted={lessonsCompleted}
              totalLessons={totalLessons}
              totalPoints={totalPoints}
            />
          </div>
        )}
      </main>

      {/* Navigation par onglets - compacte et optimisée */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
