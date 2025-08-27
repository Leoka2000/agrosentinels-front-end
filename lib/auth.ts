import { useEffect } from "react";
import { useRouter } from "next/navigation";
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export async function fetchCurrentUser() {
  const token = getToken()

  if (!token) {
    throw new Error("No auth token found")
  }

  const res = await fetch(`${API_BASE_URL}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch user")
  }

  return res.json()
}

export const getToken = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export const setToken = (token: string) => {
  localStorage.setItem("token", token)
}

export const clearToken = () => {
  localStorage.removeItem("token")
}

export const isAuthenticated = () => {
  return !!getToken()
}


export const logout = () => {
  localStorage.removeItem("token")
  window.location.href = "/" // redirect to homepage
}

export function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
    }
  }, [router]);
}