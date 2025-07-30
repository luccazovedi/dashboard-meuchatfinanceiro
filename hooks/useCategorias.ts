import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface Categoria {
  id: number
  nome: string
  cor_padrao: string
  cor_usuario?: string // Cor personalizada salva como JSON no banco
  created_at?: string
  updated_at?: string
}

export function useCategorias() {
  const { user } = useAuth()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarCategorias()
  }, [user])

  const carregarCategorias = async () => {
    try {
      setLoading(true)
      
      // Buscar categorias da tabela global
      const { data: categoriasGlobais, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome')

      if (error) {
        throw error
      }

      if (!categoriasGlobais || categoriasGlobais.length === 0) {
        setCategorias([])
        return
      }

      // Carregar cores personalizadas do localStorage se usuário estiver logado
      let coresPersonalizadas: Record<number, string> = {}
      
      if (user) {
        try {
          const coresStorage = localStorage.getItem(`categorias_cores_${user.id}`)
          if (coresStorage) {
            coresPersonalizadas = JSON.parse(coresStorage)
          }
        } catch (err) {
          // Erro silencioso no localStorage
        }
      }

      // Combinar categorias com cores personalizadas ou padrão
      const categoriasComCores = categoriasGlobais.map(categoria => ({
        ...categoria,
        cor_usuario: coresPersonalizadas[categoria.id] || categoria.cor_padrao
      }))

      setCategorias(categoriasComCores)
      
    } catch (error) {
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const buscarCategoriaPorNome = (nome: string): Categoria | undefined => {
    return categorias.find(cat => 
      cat.nome.toLowerCase() === nome.toLowerCase()
    )
  }

  const buscarCategoriaPorId = (id: number): Categoria | undefined => {
    return categorias.find(cat => cat.id === id)
  }

  const atualizarCorCategoria = async (id: number, cor: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado')
      return false
    }

    try {
      // Carregar cores existentes do localStorage
      const storageKey = `categorias_cores_${user.id}`
      let coresPersonalizadas: Record<number, string> = {}
      
      try {
        const coresStorage = localStorage.getItem(storageKey)
        if (coresStorage) {
          coresPersonalizadas = JSON.parse(coresStorage)
        }
      } catch (err) {
        // Erro silencioso no localStorage
      }

      // Atualizar a cor da categoria específica
      coresPersonalizadas[id] = cor
      
      // Salvar no localStorage
      localStorage.setItem(storageKey, JSON.stringify(coresPersonalizadas))

      // Atualizar o estado local
      setCategorias(prev => 
        prev.map(cat => cat.id === id ? { ...cat, cor_usuario: cor } : cat)
      )
      
      toast.success('Cor da categoria atualizada!')
      return true
    } catch (error) {
      toast.error('Erro ao atualizar cor da categoria')
      return false
    }
  }

  return {
    categorias,
    loading,
    buscarCategoriaPorNome,
    buscarCategoriaPorId,
    carregarCategorias,
    atualizarCorCategoria
  }
}

export default useCategorias
