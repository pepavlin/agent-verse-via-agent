'use client'

export interface SimpleUser {
  nickname: string
  loginTime: string
}

export const simpleAuth = {
  login: (nickname: string): void => {
    if (typeof window !== 'undefined') {
      const user: SimpleUser = {
        nickname: nickname.trim(),
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
  },

  getNickname: (): string => {
    const user = simpleAuth.getUser()
    return user?.nickname || 'Guest'
  }
}
