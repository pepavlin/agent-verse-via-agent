import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthForm from '@/app/components/AuthForm'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

describe('AuthForm Component', () => {
  const mockPush = vi.fn()
  const mockRouter = {
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as Record<string, unknown>)
    vi.mocked(fetch).mockClear()
  })

  describe('Registration Mode', () => {
    it('should render registration form with all fields', () => {
      render(<AuthForm mode="register" />)

      expect(screen.getByText('Create Account')).toBeTruthy()
      expect(screen.getByLabelText('Name')).toBeTruthy()
      expect(screen.getByLabelText('Email')).toBeTruthy()
      expect(screen.getByLabelText('Password')).toBeTruthy()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeTruthy()
    })

    it('should show link to login page', () => {
      render(<AuthForm mode="register" />)

      const link = screen.getByRole('link', { name: /sign in/i })
      expect(link).toBeTruthy()
      expect(link.getAttribute('href')).toBe('/login')
    })

    it('should update input values when typing', async () => {
      const user = userEvent.setup()
      render(<AuthForm mode="register" />)

      const nameInput = screen.getByLabelText('Name') as HTMLInputElement
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement

      await user.type(nameInput, 'Test User')
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      expect(nameInput.value).toBe('Test User')
      expect(emailInput.value).toBe('test@example.com')
      expect(passwordInput.value).toBe('password123')
    })

    it('should handle successful registration', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '1', email: 'test@example.com' } }),
      } as Response)

      vi.mocked(signIn).mockResolvedValueOnce({
        ok: true,
        error: null,
        status: 200,
        url: null,
      } as Record<string, unknown>)

      const user = userEvent.setup()
      render(<AuthForm mode="register" />)

      await user.type(screen.getByLabelText('Name'), 'Test User')
      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      const submitButton = screen.getByRole('button', { name: /sign up/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
          }),
        })
      })

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        })
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should display error when registration fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Email already exists',
            field: 'email'
          }
        }),
      } as Response)

      const user = userEvent.setup()
      render(<AuthForm mode="register" />)

      await user.type(screen.getByLabelText('Email'), 'existing@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeTruthy()
      })
    })

    it('should show loading state during submission', async () => {
      vi.mocked(fetch).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ user: { id: '1' } }),
                } as Response),
              100
            )
          )
      )

      const user = userEvent.setup()
      render(<AuthForm mode="register" />)

      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      const submitButton = screen.getByRole('button', { name: /sign up/i })
      await user.click(submitButton)

      expect(screen.getByText('Processing...')).toBeTruthy()
      expect(submitButton).toHaveProperty('disabled', true)
    })

    it.skip('should clear error when submitting again', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid email format',
            field: 'email'
          }
        }),
      } as Response)

      const user = userEvent.setup()
      render(<AuthForm mode="register" />)

      await user.type(screen.getByLabelText('Email'), 'invalid')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Wait for error message to appear
      const errorElement = await screen.findByText('Invalid email format')
      expect(errorElement).toBeTruthy()

      // Submit again
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '1' } }),
      } as Response)

      vi.mocked(signIn).mockResolvedValueOnce({ ok: true } as Record<string, unknown>)

      await user.clear(screen.getByLabelText('Email'))
      await user.type(screen.getByLabelText('Email'), 'valid@example.com')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Wait for error message to disappear
      await waitFor(() => {
        expect(screen.queryByText('Invalid email format')).toBeNull()
      })
    })

    it('should submit form with Enter key', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '1' } }),
      } as Response)

      vi.mocked(signIn).mockResolvedValueOnce({ ok: true } as Record<string, unknown>)

      const user = userEvent.setup()
      render(<AuthForm mode="register" />)

      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })
    })
  })

  describe('Login Mode', () => {
    it('should render login form without name field', () => {
      render(<AuthForm mode="login" />)

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeTruthy()
      expect(screen.queryByLabelText('Name')).toBeNull()
      expect(screen.getByLabelText('Email')).toBeTruthy()
      expect(screen.getByLabelText('Password')).toBeTruthy()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy()
    })

    it('should show link to registration page', () => {
      render(<AuthForm mode="login" />)

      const link = screen.getByRole('link', { name: /sign up/i })
      expect(link).toBeTruthy()
      expect(link.getAttribute('href')).toBe('/register')
    })

    it('should handle successful login', async () => {
      vi.mocked(signIn).mockResolvedValueOnce({
        ok: true,
        error: null,
        status: 200,
        url: null,
      } as Record<string, unknown>)

      const user = userEvent.setup()
      render(<AuthForm mode="login" />)

      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        })
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it.skip('should display error for invalid credentials', async () => {
      vi.mocked(signIn).mockResolvedValueOnce({
        ok: false,
        error: 'Invalid credentials',
        status: 401,
        url: null,
      } as Record<string, unknown>)

      const user = userEvent.setup()
      render(<AuthForm mode="login" />)

      await user.type(screen.getByLabelText('Email'), 'wrong@example.com')
      await user.type(screen.getByLabelText('Password'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Wait for signIn to be called and error to be set
      await waitFor(() => {
        expect(vi.mocked(signIn)).toHaveBeenCalled()
      })

      // Wait for error message to appear
      const errorElement = await screen.findByText('Invalid credentials')
      expect(errorElement).toBeTruthy()
    })

    it('should not call register API in login mode', async () => {
      vi.mocked(signIn).mockResolvedValueOnce({ ok: true } as Record<string, unknown>)

      const user = userEvent.setup()
      render(<AuthForm mode="login" />)

      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(signIn).toHaveBeenCalled()
      })

      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<AuthForm mode="register" />)

      expect(screen.getByLabelText('Name')).toBeTruthy()
      expect(screen.getByLabelText('Email')).toBeTruthy()
      expect(screen.getByLabelText('Password')).toBeTruthy()
    })

    it('should mark email and password as required', () => {
      render(<AuthForm mode="register" />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput).toHaveProperty('required', true)
      expect(passwordInput).toHaveProperty('required', true)
    })

    it('should use correct input types', () => {
      render(<AuthForm mode="register" />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput.getAttribute('type')).toBe('email')
      expect(passwordInput.getAttribute('type')).toBe('password')
    })
  })
})
