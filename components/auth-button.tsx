"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { logoutUser, getCurrentUser, getAuthToken, setAuthToken } from "@/lib/api" // Importez les fonctions API

export default function AuthButton() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      setLoading(true)
      const token = getAuthToken()
      if (token) {
        const { data, error } = await getCurrentUser()
        if (error) {
          console.error("Error fetching user:", error)
          setAuthToken(null) // Clear invalid token
          setUser(null)
        } else {
          setUser(data)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  const handleSignOut = async () => {
    setLoading(true)
    const { error } = await logoutUser()
    if (error) {
      console.error("Error logging out:", error)
    }
    setUser(null)
    setLoading(false)
    router.push("/login")
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>
  }

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.username}!
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="py-2 px-4 rounded-md no-underline bg-btn-background hover:bg-btn-background-hover"
        disabled={loading}
      >
        Déconnexion
      </Button>
    </div>
  ) : (
    <Link href="/login">
      <Button
        variant="outline"
        className="py-2 px-4 rounded-md no-underline bg-btn-background hover:bg-btn-background-hover"
      >
        Connexion
      </Button>
    </Link>
  )
}
