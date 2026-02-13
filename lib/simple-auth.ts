'use client'

export interface SimpleUser {
  username: string
  loginTime: string
}

export const simpleAuth = {
  login: (username: string): void => {
    if (typeof window !== 'undefined') {
      const user: SimpleUser = {
        username: username.trim(),
        loginTime: new Date().toISOString()
      }
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
  },

  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser')
    }
  },

  getUser: (): SimpleUser | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('currentUser')
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch {
          return null
        }
      }
    }
    return null
  },

  isLoggedIn: (): boolean => {
    return simpleAuth.getUser() !== null
  }
}
