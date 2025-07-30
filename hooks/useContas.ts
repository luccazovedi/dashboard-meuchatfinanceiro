import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface ContaBancaria {
  id: number
  usuario_id: number
  banco_id: number
  banco?: {
    id: number
    nome: string
  }
  nome_conta: string
  tipo_conta: 'corrente' | 'poupanca' | 'investimento'
  saldo_inicial: number
  ativo: boolean
  data_criacao?: string
  data_atualizacao?: string
}

export interface CartaoCredito {
  id: number
  usuario_id: number
  conta_bancaria_id: number
  final_cartao: string
  data_fechamento: number
  data_vencimento: number
  limite_credito: number
  data_criacao?: string
  data_atualizacao?: string
}

// Função utilitária para verificar se é erro de tabela não existir
const isTableNotExistsError = (error: any, tableName: string): boolean => {
  if (!error) return false;
  
  const errorObj = error as any;
  const message = errorObj?.message || String(error);
  const code = errorObj?.code;
  const details = errorObj?.details;
  
  return (
    code === 'PGRST116' ||
    code === '42P01' ||
    message.includes('relation "' + tableName + '" does not exist') ||
    message.includes('table "' + tableName + '" does not exist') ||
    (message.includes(tableName) && message.includes('does not exist')) ||
    details?.includes(tableName)
  );
};

export function useContas() {
  const { user } = useAuth()
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      carregarContas()
      carregarCartoes()
    }
  }, [user])

  const carregarContas = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*, banco:bancos(id, nome)')
        .eq('usuario_id', parseInt(user.id))
        .order('data_criacao', { ascending: false })

      if (error) {
        if (isTableNotExistsError(error, 'contas_bancarias')) {
          setContas([])
          return
        }
        throw error
      }

      setContas(data || [])
    } catch (error) {
      if (isTableNotExistsError(error, 'contas_bancarias')) {
        if (typeof window !== 'undefined' && !(window as any)._contasTableWarning) {
          (window as any)._contasTableWarning = true;
          toast.error('Tabela de contas não configurada. Execute o script SQL no Supabase.');
        }
        setContas([]);
      } else {
        toast.error('Erro ao carregar contas');
      }
    } finally {
      setLoading(false)
    }
  }

  const carregarCartoes = async () => {
    if (!user) {
      return
    }

    try {
      const { data, error } = await supabase
        .from('cartoes_credito')
        .select('*')
        .eq('usuario_id', parseInt(user.id))
        .order('data_criacao', { ascending: false })

      if (error) {
        if (isTableNotExistsError(error, 'cartoes_credito')) {
          setCartoes([])
          return
        }
        throw error
      }

      setCartoes(data || [])
    } catch (error) {
      if (!isTableNotExistsError(error, 'cartoes_credito')) {
        // Erro ao carregar cartões
      }
    }
  }

  const adicionarConta = async (contaData: Omit<ContaBancaria, 'id' | 'usuario_id' | 'data_criacao' | 'data_atualizacao' | 'banco'>): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não está logado');
      return false;
    }

    try {
      // Converter user.id para número (já que vem como string do localStorage)
      const usuarioId = parseInt(user.id);
      if (isNaN(usuarioId)) {
        toast.error('Erro de autenticação - ID de usuário inválido');
        return false;
      }

      // Log dos dados que serão enviados para debug
      const dadosParaInserir = {
        ...contaData,
        usuario_id: usuarioId
      };
      
      const { data, error } = await supabase
        .from('contas_bancarias')
        .insert(dadosParaInserir)
        .select('*, banco:bancos(id, nome)')
        .single()

      if (error) {
        if (isTableNotExistsError(error, 'contas_bancarias')) {
          if (typeof window !== 'undefined' && !(window as any)._contasTableWarning) {
            (window as any)._contasTableWarning = true;
            toast.error('Tabela de contas não configurada. Execute o script SQL no Supabase.');
          }
          return false
        }
        throw error
      }

      setContas(prev => [data, ...prev])
      toast.success('Conta adicionada com sucesso!')
      return true
    } catch (error) {
      if (!isTableNotExistsError(error, 'contas_bancarias')) {
        // Mostrar erro mais específico para o usuário
        const errorObj = error as any;
        const errorMessage = errorObj?.message || 'Erro desconhecido';
        toast.error(`Erro ao adicionar conta: ${errorMessage}`);
      }
      return false
    }
  }

  const adicionarCartao = async (cartaoData: Omit<CartaoCredito, 'id' | 'usuario_id' | 'data_criacao' | 'data_atualizacao'>): Promise<boolean> => {
    if (!user) return false

    try {
      // Log dos dados que serão inseridos
      const dadosCartao = {
        ...cartaoData,
        usuario_id: parseInt(user.id)
      };
      
      const { data, error } = await supabase
        .from('cartoes_credito')
        .insert(dadosCartao)
        .select('*')
        .single()

      if (error) {
        if (isTableNotExistsError(error, 'cartoes_credito')) {
          if (typeof window !== 'undefined' && !(window as any)._cartoesTableWarning) {
            (window as any)._cartoesTableWarning = true;
            toast.error('Tabela de cartões não configurada. Execute o script SQL no Supabase.');
          }
          return false
        }
        throw error
      }

      setCartoes(prev => [data, ...prev])
      toast.success('Cartão de crédito adicionado com sucesso!')
      return true
    } catch (error) {
      if (!isTableNotExistsError(error, 'cartoes_credito')) {
        // Mostrar erro mais específico para o usuário
        const errorObj = error as any;
        const errorMessage = errorObj?.message || 'Erro desconhecido';
        toast.error(`Erro ao adicionar cartão: ${errorMessage}`);
      }
      return false
    }
  }

  const atualizarConta = async (id: number, contaData: Partial<ContaBancaria>): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .update(contaData)
        .eq('id', id)
        .eq('usuario_id', parseInt(user.id))
        .select('*, banco:bancos(id, nome)')
        .single()

      if (error) {
        if (isTableNotExistsError(error, 'contas_bancarias')) {
          return false
        }
        throw error
      }

      setContas(prev => 
        prev.map(conta => conta.id === id ? data : conta)
      )
      toast.success('Conta atualizada com sucesso!')
      return true
    } catch (error) {
      if (!isTableNotExistsError(error, 'contas_bancarias')) {
        toast.error('Erro ao atualizar conta');
      }
      return false
    }
  }

  const excluirConta = async (id: number): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('contas_bancarias')
        .delete()
        .eq('id', id)
        .eq('usuario_id', parseInt(user.id))

      if (error) {
        if (isTableNotExistsError(error, 'contas_bancarias')) {
          return false
        }
        throw error
      }

      setContas(prev => prev.filter(conta => conta.id !== id))
      toast.success('Conta excluída com sucesso!')
      return true
    } catch (error) {
      if (!isTableNotExistsError(error, 'contas_bancarias')) {
        toast.error('Erro ao excluir conta');
      }
      return false
    }
  }

  const toggleContaAtiva = async (id: number, ativo: boolean): Promise<boolean> => {
    return await atualizarConta(id, { ativo })
  }

  const getCartoesPorConta = (contaId: number): CartaoCredito[] => {
    const cartoesEncontrados = cartoes.filter(cartao => cartao.conta_bancaria_id === contaId)
    return cartoesEncontrados
  }

  return {
    contas,
    cartoes,
    loading,
    carregarContas,
    carregarCartoes,
    adicionarConta,
    adicionarCartao,
    atualizarConta,
    excluirConta,
    toggleContaAtiva,
    getCartoesPorConta
  }
}

export default useContas
