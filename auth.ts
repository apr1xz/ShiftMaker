import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

declare module 'next-auth' {
  interface User {
    role: 'employee' | 'admin'
    dbId: number
    displayName: string
    employeeId?: string
  }
  interface Session {
    user: {
      role: 'employee' | 'admin'
      dbId: number
      displayName: string
      employeeId?: string
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: 'employee',
      name: 'Employee',
      credentials: {
        employee_id: { label: '社員番号', type: 'text' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        const employee_id = (credentials?.employee_id as string | undefined)?.trim()
        const password = (credentials?.password as string | undefined)?.trim()
        if (!employee_id || !password) return null

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, name, employee_id, password')
          .eq('employee_id', employee_id)
          .single()

        if (!user) return null
        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return null

        return {
          id: String(user.id),
          name: user.name,
          role: 'employee' as const,
          dbId: user.id,
          displayName: user.name,
          employeeId: user.employee_id,
        }
      },
    }),
    Credentials({
      id: 'admin',
      name: 'Admin',
      credentials: {
        username: { label: 'ユーザー名', type: 'text' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        const username = (credentials?.username as string | undefined)?.trim()
        const password = (credentials?.password as string | undefined)?.trim()
        if (!username || !password) return null

        const { data: admin } = await supabaseAdmin
          .from('admins')
          .select('id, username, password')
          .eq('username', username)
          .single()

        if (!admin) return null
        const ok = await bcrypt.compare(password, admin.password)
        if (!ok) return null

        return {
          id: `admin-${admin.id}`,
          name: admin.username,
          role: 'admin' as const,
          dbId: admin.id,
          displayName: admin.username,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.dbId = user.dbId
        token.displayName = user.displayName
        token.employeeId = user.employeeId
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as 'employee' | 'admin'
      session.user.dbId = token.dbId as number
      session.user.displayName = token.displayName as string
      session.user.employeeId = token.employeeId as string | undefined
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: { strategy: 'jwt' },
})
