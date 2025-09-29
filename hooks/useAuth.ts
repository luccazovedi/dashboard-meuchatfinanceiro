import { useState, useEffect } from 'react'
import { supabase, type User, type Usuario } from '@/lib/supabase'

const hashPassword = (password: string): string => {
  return btoa(password) // Base64 encoding
}

const validatePasswordAndLogin = async (usuario: Usuario, password: string, setUser: (user: User | null) => void) => {
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

  const signIn = async (identifier: string, password: string) => {
    try {
      let usuarios: Usuario[] | null = null
      let error: any = null

      // Verificar se é email (contém @)
      if (identifier.includes('@')) {
        const result = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', identifier)
          .limit(1)
        usuarios = result.data
        error = result.error
      }
      // Verificar se é telefone (só números, parênteses, espaços e hífens)
      else if (/^[\d\s\(\)\-\+]+$/.test(identifier)) {
        // Normalizar o telefone removendo caracteres especiais para a busca
        const telefoneNormalizado = identifier.replace(/[\s\(\)\-]/g, '')
        
        const result = await supabase
          .from('usuarios')
          .select('*')
          .or(`telefone.eq.${identifier},telefone.eq.${telefoneNormalizado}`)
          .limit(1)
        
        usuarios = result.data
        error = result.error
      }
      // Caso contrário, assumir que é nome de usuário
      else {
        const result = await supabase
          .from('usuarios')
          .select('*')
          .eq('usuario', identifier)
          .limit(1)
        
        usuarios = result.data
        error = result.error
      }

      if (error) {
        throw new Error(`Erro ao conectar com o banco de dados: ${error.message}`)
      }

      if (!usuarios || usuarios.length === 0) {
        if (identifier.includes('@')) {
          throw new Error('Email não encontrado')
        } else if (/^[\d\s\(\)\-\+]+$/.test(identifier)) {
          throw new Error('Telefone não encontrado')
        } else {
          throw new Error('Usuário não encontrado')
        }
      }

      const usuario = usuarios[0] as Usuario
      return await validatePasswordAndLogin(usuario, password, setUser)

    } catch (err) {
      throw err
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', email)
        .limit(1)

      if (existingUser && existingUser.length > 0) {
        throw new Error('Email já cadastrado')
      }

      // Criar novo usuário na tabela personalizada
      const senhaHash = hashPassword(password)
      const { data, error } = await supabase
        .from('usuarios')
        .insert([
          {
            email,
            senha: senhaHash,
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

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }
}
