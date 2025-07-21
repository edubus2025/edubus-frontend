"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModernHeader } from "@/components/modern-header"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EnhancedCard } from "@/components/enhanced-card"
import { getCurrentUser, apiRequest, isAuthenticated } from "@/lib/api"
import {
  Users,
  TrendingUp,
  Award,
  BookOpen,
  Search,
  Filter,
  Calendar,
  ArrowLeft,
  BarChart3,
  Target,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StudentProgressItem {
  id: string
  user: {
    id: string
    username: string
    email: string
  }
  content: {
    id: string
    title: string
  }
  quiz: {
    id: string
    title: string
  }
  score: number
  completed_at: string
}

export default function StudentProgressPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState<StudentProgressItem[]>([])
  const [filteredData, setFilteredData] = useState<StudentProgressItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [scoreFilter, setScoreFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [authError, setAuthError] = useState<boolean>(false)

  const fetchProgressData = async () => {
    console.log("🔍 === FETCHING PROGRESS DATA ===")

    if (!isAuthenticated()) {
      console.error("❌ User not authenticated, redirecting to login")
      router.push("/login")
      return
    }

    const { data: userData, error: userError } = await getCurrentUser()

    if (userError || !userData) {
      console.error("❌ Failed to get current user:", userError)
      setAuthError(true)
      setError("Erreur d'authentification. Veuillez vous reconnecter.")
      return
    }

    if (userData.role !== "teacher" && userData.role !== "admin") {
      console.error("❌ Insufficient permissions:", userData.role)
      router.push("/login")
      return
    }

    console.log("✅ User authenticated:", userData.username, userData.role)
    setUser(userData)
    setAuthError(false)

    console.log("🔍 Fetching progress data...")
    const { data: progress, error: progressError } = await apiRequest<StudentProgressItem[]>("/api/progress/")

    if (progressError) {
      console.error("❌ Error fetching progress:", progressError)
      if (progressError.includes("401") || progressError.includes("Unauthorized")) {
        setAuthError(true)
        setError("Session expirée. Veuillez vous reconnecter.")
      } else {
        setError(`Impossible de charger la progression des élèves: ${progressError}`)
      }
    } else {
      console.log("✅ Progress data loaded:", progress?.length || 0, "items")
      setProgressData(progress || [])
      setFilteredData(progress || [])
      setError(null)
    }
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      await fetchProgressData()
      setLoading(false)
    }
    fetchData()
  }, [router])

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    setAuthError(false)
    await fetchProgressData()
    setLoading(false)
  }

  const handleRelogin = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    router.push("/login")
  }

  useEffect(() => {
    let filtered = progressData

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.content?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.quiz?.title?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (scoreFilter !== "all") {
      switch (scoreFilter) {
        case "excellent":
          filtered = filtered.filter((item) => item.score >= 90)
          break
        case "good":
          filtered = filtered.filter((item) => item.score >= 70 && item.score < 90)
          break
        case "average":
          filtered = filtered.filter((item) => item.score >= 50 && item.score < 70)
          break
        case "poor":
          filtered = filtered.filter((item) => item.score < 50)
          break
      }
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.score - a.score
        case "student":
          return a.user?.username?.localeCompare(b.user?.username || "") || 0
        case "date":
        default:
          return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      }
    })

    setFilteredData(filtered)
  }, [progressData, searchTerm, scoreFilter, sortBy])

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (score >= 70) return <Badge className="bg-blue-100 text-blue-800">Bien</Badge>
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Moyen</Badge>
    return <Badge className="bg-red-100 text-red-800">Faible</Badge>
  }

  const getStats = () => {
    if (progressData.length === 0) return { average: 0, excellent: 0, totalStudents: 0 }

    const average = progressData.reduce((sum, item) => sum + item.score, 0) / progressData.length
    const excellent = progressData.filter((item) => item.score >= 90).length
    const uniqueStudents = new Set(progressData.map((item) => item.user?.id).filter(Boolean)).size

    return { average: Math.round(average), excellent, totalStudents: uniqueStudents }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <LoadingSpinner size="lg" text="Chargement de la progression des élèves..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <ModernHeader title="EduBus Enseignant" subtitle="Progression des élèves" />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <Button variant="outline" asChild className="bg-white/80 backdrop-blur-sm">
            <Link href="/teacher/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Suivi des performances</span>
          </div>
        </div>

        <div className="text-center space-y-4 mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full text-sm font-medium shadow-lg">
            <BarChart3 className="w-4 h-4" />
            Progression des élèves
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Suivi des Performances
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Visualisez les scores et les activités de vos élèves pour mieux comprendre leur progression.
          </p>
        </div>

        {authError && (
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg text-orange-700 dark:text-orange-300 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Problème d'authentification</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
                <Button variant="default" size="sm" onClick={handleRelogin}>
                  Se reconnecter
                </Button>
              </div>
            </div>
            <div className="mt-2 text-sm">Votre session a peut-être expiré. Essayez de vous reconnecter.</div>
          </div>
        )}

        {error && !authError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                {error}
              </div>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <EnhancedCard className="text-center animate-fade-in" hover>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{stats.totalStudents}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Élèves Actifs</div>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard className="text-center animate-fade-in animation-delay-100" hover>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{stats.average}%</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Score Moyen</div>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard className="text-center animate-fade-in animation-delay-200" hover>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{stats.excellent}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Scores Excellents</div>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard className="text-center animate-fade-in animation-delay-300" hover>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{progressData.length}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Quiz Complétés</div>
              </div>
            </div>
          </EnhancedCard>
        </div>

        <EnhancedCard className="mb-8 animate-fade-in animation-delay-400" gradient>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <Input
                placeholder="Rechercher par élève, contenu ou quiz..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <div className="flex gap-3">
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-40 h-12">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les scores</SelectItem>
                  <SelectItem value="excellent">Excellent (90%+)</SelectItem>
                  <SelectItem value="good">Bien (70-89%)</SelectItem>
                  <SelectItem value="average">Moyen (50-69%)</SelectItem>
                  <SelectItem value="poor">Faible (&lt;50%)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 h-12">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date récente</SelectItem>
                  <SelectItem value="score">Score élevé</SelectItem>
                  <SelectItem value="student">Nom élève</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </EnhancedCard>

        {filteredData.length === 0 ? (
          <EnhancedCard className="text-center py-12 animate-fade-in animation-delay-500" gradient>
            <div className="space-y-6">
              <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                  {progressData.length === 0 ? "Aucune progression trouvée" : "Aucun résultat"}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  {progressData.length === 0
                    ? "Aucune progression d'élève n'a été enregistrée pour le moment."
                    : "Essayez de modifier vos critères de recherche ou de filtrage."}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/teacher/dashboard">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour au tableau de bord
                    </Link>
                  </Button>
                  {error && (
                    <Button onClick={handleRetry}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Réessayer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </EnhancedCard>
        ) : (
          <EnhancedCard className="animate-fade-in animation-delay-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Détails de la Progression ({filteredData.length} résultats)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Élève</TableHead>
                      <TableHead>Contenu</TableHead>
                      <TableHead>Quiz</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800">
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{item.user?.username || "N/A"}</div>
                            <div className="text-sm text-neutral-500">{item.user?.email || ""}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium truncate">{item.content?.title || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium truncate">{item.quiz?.title || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-lg font-bold",
                                item.score >= 90
                                  ? "text-green-600"
                                  : item.score >= 70
                                    ? "text-blue-600"
                                    : item.score >= 50
                                      ? "text-yellow-600"
                                      : "text-red-600",
                              )}
                            >
                              {item.score}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getScoreBadge(item.score)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(item.completed_at).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                            <div className="text-xs text-neutral-500">
                              {new Date(item.completed_at).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </EnhancedCard>
        )}
      </main>
    </div>
  )
}
