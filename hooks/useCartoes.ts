import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface CartaoUsuario {
  id: number
  user_id: string
  banco_id: number
  conta_bancaria_id?: number | null // Opcional: permite associar o cartão a uma conta
  banco?: {
    id: number
    nome: string
  }
  final_cartao: string
  data_fechamento: number // Dia do mês (1-31)
  data_vencimento: number // Dia do mês (1-31)
  limite: number
  ativo: boolean
  created_at?: string
  updated_at?: string
}

// Função utilitária para verificar se é erro de tabela não existir
const isTableNotExistsError = (error: any): boolean => {
  if (!error) return false;
  
  const errorObj = error as any;
  const message = errorObj?.message || String(error);
  const code = errorObj?.code;
  const details = errorObj?.details;
  
  return (
    code === 'PGRST116' ||
    code === '42P01' ||
    message.includes('relation "cartoes_usuario" does not exist') ||
    message.includes('table "cartoes_usuario" does not exist') ||
    (message.includes('cartoes_usuario') && message.includes('does not exist')) ||
    details?.includes('cartoes_usuario')
  );
};

export function useCartoes() {
  const { user } = useAuth()
  const [cartoes, setCartoes] = useState<CartaoUsuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      carregarCartoes()
    }
  }, [user])

  const carregarCartoes = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('cartoes_usuario')
        .select(`
          *,
          banco:bancos(id, nome)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        // Se a tabela não existe, não é um erro crítico
        if (error.code === 'PGRST116' || error.message?.includes('relation "cartoes_usuario" does not exist')) {
          
          setCartoes([])
          return
        }
        throw error
      }

      setCartoes(data || [])
    } catch (error) {
      if (isTableNotExistsError(error)) {
        // Não loga erro, apenas avisa uma vez por sessão
        if (typeof window !== 'undefined' && !(window as any)._cartoesTableWarning) {
          (window as any)._cartoesTableWarning = true;
          toast.error('Tabela de cartões não configurada. Execute o script SQL no Supabase.');
        }
        setCartoes([]);
      } else {
        // Só loga erros reais que não sejam de configuração
        toast.error('Erro ao carregar cartões');
      }
    } finally {
      setLoading(false)
    }
  }

  const adicionarCartao = async (cartaoData: Omit<CartaoUsuario, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'banco'>): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('cartoes_usuario')
        .insert({
          ...cartaoData,
          user_id: user.id
        })
        .select(`
          *,
          banco:bancos(id, nome)
        `)
        .single()

      if (error) {
        if (isTableNotExistsError(error)) {
          if (typeof window !== 'undefined' && !(window as any)._cartoesTableWarning) {
            (window as any)._cartoesTableWarning = true;
            
            toast.error('Tabela de cartões não configurada. Execute o script SQL no Supabase.');
          }
          return false
        }
        throw error
      }

      setCartoes(prev => [data, ...prev])
      toast.success('Cartão adicionado com sucesso!')
      return true
    } catch (error) {
      if (isTableNotExistsError(error)) {
        // Já tratado acima, não faz nada
      } else {
        
        toast.error('Erro ao adicionar cartão');
      }
      return false
    }
  }

  const atualizarCartao = async (id: number, cartaoData: Partial<CartaoUsuario>): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('cartoes_usuario')
        .update(cartaoData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          banco:bancos(id, nome)
        `)
        .single()

      if (error) {
        if (isTableNotExistsError(error)) {
          if (typeof window !== 'undefined' && !(window as any)._cartoesTableWarning) {
            (window as any)._cartoesTableWarning = true;
            
            toast.error('Tabela de cartões não configurada. Execute o script SQL no Supabase.');
          }
          return false
        }
        throw error
      }

      setCartoes(prev => 
        prev.map(cartao => cartao.id === id ? data : cartao)
      )
      toast.success('Cartão atualizado com sucesso!')
      return true
    } catch (error) {
      if (isTableNotExistsError(error)) {
        // Já tratado acima
      } else {
        
        toast.error('Erro ao atualizar cartão');
      }
      return false
    }
  }

  const excluirCartao = async (id: number): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('cartoes_usuario')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        if (isTableNotExistsError(error)) {
          if (typeof window !== 'undefined' && !(window as any)._cartoesTableWarning) {
            (window as any)._cartoesTableWarning = true;
            
            toast.error('Tabela de cartões não configurada. Execute o script SQL no Supabase.');
          }
          return false
        }
        throw error
      }

      setCartoes(prev => prev.filter(cartao => cartao.id !== id))
      toast.success('Cartão excluído com sucesso!')
      return true
    } catch (error) {
      if (isTableNotExistsError(error)) {
        // Já tratado acima
      } else {
        
        toast.error('Erro ao excluir cartão');
      }
      return false
    }
  }

  const toggleCartaoAtivo = async (id: number, ativo: boolean): Promise<boolean> => {
    return await atualizarCartao(id, { ativo })
  }

  const associarCartaoAConta = async (cartaoId: number, contaId: number): Promise<boolean> => {
    return await atualizarCartao(cartaoId, { conta_bancaria_id: contaId })
  }

  const desassociarCartaoDaConta = async (cartaoId: number): Promise<boolean> => {
    return await atualizarCartao(cartaoId, { conta_bancaria_id: null })
  }

  const getCartoesNaoAssociados = () => {
    return cartoes.filter(cartao => !cartao.conta_bancaria_id)
  }

  const getCartoesDaConta = (contaId: number) => {
    return cartoes.filter(cartao => cartao.conta_bancaria_id === contaId)
  }

  return {
    cartoes,
    loading,
    carregarCartoes,
    adicionarCartao,
    atualizarCartao,
    excluirCartao,
    toggleCartaoAtivo,
    associarCartaoAConta,
    desassociarCartaoDaConta,
    getCartoesNaoAssociados,
    getCartoesDaConta
  }
}

export default useCartoes
