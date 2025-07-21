"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { BookOpen, Play, TrendingUp, Brain, CheckCircle, ArrowRight, GraduationCap, Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { loginUser, getCurrentUser } from "@/lib/api"

export default function LandingPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    async function checkAuth() {
      const { data: user } = await getCurrentUser()
      if (user) {
        if (user.role === "teacher") {
          router.push("/teacher/dashboard")
        } else if (user.role === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/")
        }
      }
    }
    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: loginError } = await loginUser({ username, password })

    if (loginError) {
      setError(loginError)
    } else {
      const { data: userData } = await getCurrentUser()
      if (userData?.role === "teacher") {
        router.push("/teacher/dashboard")
      } else if (userData?.role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/")
      }
    }
    setLoading(false)
  }

  const features = [
    {
      icon: <Play className="w-8 h-8" />,
      title: "Cours Multimédia",
      description: "Vidéos et audios pédagogiques pour un apprentissage moderne",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Quiz Interactifs",
      description: "Tests et exercices variés pour valider vos acquis",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "6 Matières",
      description: "Arabe, Français, Anglais, Histoire-Géo, Philosophie, Soft-skills",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Suivi des Progrès",
      description: "Tableaux de bord personnalisés et badges de réussite",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ]

  const benefits = [
    "Apprentissage adapté à votre niveau",
    "Contenu pédagogique de qualité",
    "Suivi personnalisé de vos progrès",
    "Interface moderne et intuitive",
    "Accès 24h/24 depuis n'importe où",
    "Badges et récompenses motivantes",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      {/* Header avec logo et navigation */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Image
                  src="/images/edubus-logo.png"
                  alt="EduBus Logo"
                  width={60}
                  height={60}
                  className="rounded-full bg-white p-1 shadow-lg"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">EduBus</h1>
                <p className="text-blue-100 text-sm">Plateforme éducative moderne</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Connexion Enseignant
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center text-white space-y-6 py-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Transformez vos trajets en moments d'apprentissage
            </div>
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">Apprenez à votre rythme avec EduBus</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Accédez à des contenus pédagogiques de qualité, suivez vos progrès et développez vos compétences avec
              notre plateforme éducative innovante.
            </p>
          </div>
        </div>

        {/* Vagues décoratives */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" className="w-full h-12 fill-neutral-50 dark:fill-neutral-900">
            <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 space-y-20">
        {/* Section Pourquoi choisir EduBus */}
        <section className="text-center space-y-12">
          <div className="space-y-4">
            <h3 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">Pourquoi choisir EduBus ?</h3>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Découvrez les fonctionnalités qui font d'EduBus la plateforme d'apprentissage de référence pour les
              étudiants marocains.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className={cn(
                  "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in",
                  feature.bgColor,
                  `animation-delay-${index * 150}`,
                )}
              >
                <CardHeader className="text-center space-y-4">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-gradient-to-r text-white shadow-lg",
                      feature.color,
                    )}
                  >
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section Connexion Élève */}
        <section className="max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                  Connexion Élève
                </CardTitle>
                <CardDescription className="text-neutral-600 dark:text-neutral-400">
                  Entrez vos identifiants pour accéder à vos cours
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Nom d'utilisateur
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Entrez votre nom d'utilisateur"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 border-2 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-2 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Connexion...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Se connecter
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Pas encore de compte ?{" "}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Contactez votre enseignant
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section Avantages */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-3xl p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h3 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">
                Une expérience d'apprentissage unique
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                EduBus révolutionne l'éducation en rendant l'apprentissage accessible, interactif et adapté aux besoins
                de chaque élève.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className={cn("flex items-center gap-4 animate-fade-in", `animation-delay-${index * 100}`)}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300 font-medium">{benefit}</p>
                  </div>
                ))}
              </div>

              <div className="relative">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-800 dark:text-neutral-200">Témoignage</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Élève de 1ère Bac</p>
                    </div>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 italic">
                    "EduBus m'a permis d'améliorer mes notes en français et en philosophie. Les quiz interactifs rendent
                    l'apprentissage vraiment amusant !"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-800 dark:bg-neutral-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/edubus-logo.png"
                  alt="EduBus Logo"
                  width={40}
                  height={40}
                  className="rounded-full bg-white p-1"
                />
                <h4 className="text-xl font-bold">EduBus</h4>
              </div>
              <p className="text-neutral-400">
                Transformez vos trajets en moments d'apprentissage avec notre plateforme éducative innovante.
              </p>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-lg">Matières</h5>
              <ul className="space-y-2 text-neutral-400">
                <li>Arabe</li>
                <li>Français</li>
                <li>Anglais</li>
                <li>Histoire-Géographie</li>
                <li>Philosophie</li>
                <li>Soft-skills</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-lg">Contact</h5>
              <div className="space-y-2 text-neutral-400">
                <p>📧 contact@edubus.ma</p>
                <p>📱 +212 6XX XXX XXX</p>
                <p>📍 Maroc</p>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-700 mt-8 pt-8 text-center text-neutral-400">
            <p>&copy; 2024 EduBus. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
