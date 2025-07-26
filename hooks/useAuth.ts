import { useState, useEffect } from 'react'
import { supabase, type User, type Usuario } from '@/lib/supabase'

const hashPassword = (password: string): string => {
  return btoa(password) // Base64 encoding
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // Buscar usuário na tabela personalizada
      const { data: usuarios, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('email', email)
        .limit(1)
      
      if (error) {
        throw new Error('Erro ao conectar com o banco de dados')
      }

      if (!usuarios || usuarios.length === 0) {
        throw new Error('Email não encontrado')
      }

      const usuario = usuarios[0] as Usuario

      // Verificar senha - testando múltiplas possibilidades
      const senhaHash = hashPassword(password)
      
      let senhaValida = false
      
      // Teste 1: Senha em texto plano
      if (usuario.senha === password) {
        senhaValida = true
      }
      // Teste 2: Senha com hash base64
      else if (usuario.senha === senhaHash) {
        senhaValida = true
      }
      // Teste 3: Comparação case-insensitive
      else if (usuario.senha?.toLowerCase() === password.toLowerCase()) {
        senhaValida = true
      }
      
      if (!senhaValida) {
        throw new Error('Senha incorreta')
      }

      // Criar objeto de usuário logado
      const userLogado: User = {
        id: usuario.id.toString(),
        email: usuario.email,
        name: usuario.nome,
        created_at: usuario.created_at
      }

      setUser(userLogado)
      localStorage.setItem('currentUser', JSON.stringify(userLogado))
      
      return { user: userLogado }

    } catch (err) {
      throw err
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('usuario')
        .select('email')
        .eq('email', email)
        .limit(1)

      if (existingUser && existingUser.length > 0) {
        throw new Error('Email já cadastrado')
      }

      // Criar novo usuário na tabela personalizada
      const senhaHash = hashPassword(password)
      const { data, error } = await supabase
        .from('usuario')
        .insert([
          {
            email,
            senha: senhaHash, // ou apenas password se não usar hash
            nome: name
          }
        ])
        .select()

      if (error) throw error
      
      return { user: data?.[0] }

    } catch (err) {
      throw err
    }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  const resetPassword = async (email: string) => {
    // Para implementar reset de senha com tabela personalizada
    // você precisaria criar uma lógica própria (envio de email, etc.)
    throw new Error('Reset de senha não implementado para tabela personalizada')
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
}
