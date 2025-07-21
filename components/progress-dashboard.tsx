"use client"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Target, TrendingUp, Award, Zap } from "lucide-react"
import { EnhancedCard } from "@/components/enhanced-card"
import { cn } from "@/lib/utils"

interface ProgressDashboardProps {
  lessonsCompleted: number
  totalLessons: number
  totalPoints: number
}

export function ProgressDashboard({ lessonsCompleted, totalLessons, totalPoints }: ProgressDashboardProps) {
  const progressPercentage = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0
  const level = Math.floor(totalPoints / 100) + 1
  const pointsToNextLevel = 100 - (totalPoints % 100)
  const levelProgress = totalPoints % 100

  const achievements = [
    {
      id: 1,
      name: "Premier Pas",
      description: "Complétez votre première leçon",
      icon: <Target className="w-6 h-6" />,
      unlocked: lessonsCompleted >= 1,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 2,
      name: "Apprenti",
      description: "Gagnez 50 points",
      icon: <Star className="w-6 h-6" />,
      unlocked: totalPoints >= 50,
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: 3,
      name: "Expert",
      description: "Gagnez 100 points",
      icon: <Trophy className="w-6 h-6" />,
      unlocked: totalPoints >= 100,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: 4,
      name: "Maître",
      description: "Complétez 10 leçons",
      icon: <Award className="w-6 h-6" />,
      unlocked: lessonsCompleted >= 10,
      color: "from-green-500 to-emerald-500",
    },
  ]

  const stats = [
    {
      label: "Leçons Complétées",
      value: lessonsCompleted,
      total: totalLessons,
      icon: <Target className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      label: "Points Totaux",
      value: totalPoints,
      icon: <Star className="w-5 h-5" />,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
    },
    {
      label: "Niveau Actuel",
      value: level,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      label: "Badges Obtenus",
      value: achievements.filter((a) => a.unlocked).length,
      total: achievements.length,
      icon: <Trophy className="w-5 h-5" />,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* En-tête avec niveau */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl shadow-lg">
          <Zap className="w-6 h-6" />
          <div>
            <div className="font-bold text-lg">Niveau {level}</div>
            <div className="text-sm opacity-90">{pointsToNextLevel} points pour le niveau suivant</div>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <EnhancedCard
            key={stat.label}
            className={cn("text-center animate-fade-in", `animation-delay-${index * 100}`)}
            hover
          >
            <div className="space-y-3">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto", stat.bgColor)}>
                <div className={stat.color}>{stat.icon}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                  {stat.value}
                  {stat.total && <span className="text-sm text-neutral-500">/{stat.total}</span>}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">{stat.label}</div>
              </div>
            </div>
          </EnhancedCard>
        ))}
      </div>

      {/* Progression générale */}
      <EnhancedCard title="Votre Progression" icon={<TrendingUp className="w-5 h-5 text-primary-600" />} gradient>
        <div className="space-y-6">
          {/* Progression des leçons */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">Leçons Complétées</h3>
              <span className="text-sm font-medium text-primary-600">{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="relative">
              <Progress value={progressPercentage} className="h-3" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-full" />
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {lessonsCompleted} sur {totalLessons} leçons terminées
            </p>
          </div>

          {/* Progression du niveau */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">Progression du Niveau</h3>
              <span className="text-sm font-medium text-secondary-600">{levelProgress}%</span>
            </div>
            <div className="relative">
              <Progress value={levelProgress} className="h-3" />
              <div className="absolute inset-0 bg-gradient-to-r from-secondary-500/20 to-accent-500/20 rounded-full" />
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {pointsToNextLevel} points pour atteindre le niveau {level + 1}
            </p>
          </div>
        </div>
      </EnhancedCard>

      {/* Badges et réalisations */}
      <EnhancedCard title="Vos Réalisations" icon={<Trophy className="w-5 h-5 text-accent-600" />} gradient>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement, index) => (
            <div
              key={achievement.id}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-300 animate-fade-in",
                `animation-delay-${index * 150}`,
                achievement.unlocked
                  ? "border-transparent bg-gradient-to-br " +
                      achievement.color +
                      " text-white shadow-lg hover:scale-105"
                  : "border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-400",
              )}
            >
              {achievement.unlocked && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                </div>
              )}
              <div className="text-center space-y-2">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mx-auto transition-all duration-300",
                    achievement.unlocked ? "bg-white/20 backdrop-blur-sm" : "bg-neutral-200 dark:bg-neutral-700",
                  )}
                >
                  <div className={achievement.unlocked ? "text-white" : "text-neutral-400"}>{achievement.icon}</div>
                </div>
                <div>
                  <h4
                    className={cn(
                      "font-semibold text-sm",
                      achievement.unlocked ? "text-white" : "text-neutral-600 dark:text-neutral-400",
                    )}
                  >
                    {achievement.name}
                  </h4>
                  <p
                    className={cn(
                      "text-xs",
                      achievement.unlocked ? "text-white/80" : "text-neutral-500 dark:text-neutral-500",
                    )}
                  >
                    {achievement.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {achievements.filter((a) => !a.unlocked).length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 rounded-xl border border-primary-200 dark:border-primary-800">
            <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
              <Zap className="w-4 h-4 inline mr-1 text-accent-500" />
              Continuez à apprendre pour débloquer plus de badges !
            </p>
          </div>
        )}
      </EnhancedCard>
    </div>
  )
}
