import { useState, useEffect } from 'react'
import { supabase, Transacao, Investimento, Meta, Despesa, Entrada, ContaAPagar, Categoria, ContaBancaria, CartaoUsuario, TipoPagamento } from '@/lib/supabase'
import { useAuth } from './useAuth'

// Alias para compatibilidade
type CartaoCredito = CartaoUsuario

// Hook para transações (atualizado)
export function useTransacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransacoes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .order('data_transacao', { ascending: false })

      if (error) {
        // Silenciar erros de tabela não encontrada
        if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
          setTransacoes([])
          setError(null)
        } else {
          setError('Erro ao carregar transações')
        }
      } else {
        setTransacoes(data || [])
      }
    } catch (err) {
      setError('Erro de conexão')
      setTransacoes([])
    } finally {
      setLoading(false)
    }
  }

  const addTransacao = async (transacao: Omit<Transacao, 'id' | 'data_criacao' | 'data_atualizacao'>) => {
    try {
      // Preparar dados para inserção na nova estrutura
      const transacaoParaInserir = {
        usuario_id: transacao.usuario_id,
        categoria_id: transacao.categoria_id,
        conta_bancaria_id: transacao.conta_bancaria_id || null,
        cartao_credito_id: transacao.cartao_credito_id || null,
        tipo_pagamento_id: transacao.tipo_pagamento_id || null,
        descricao: transacao.descricao,
        valor: transacao.valor,
        data_transacao: transacao.data_transacao,
        tipo: transacao.tipo
      }
      
      // Validação básica
      if (!transacaoParaInserir.usuario_id) {
        throw new Error('ID do usuário é obrigatório')
      }
      if (!transacaoParaInserir.categoria_id) {
        throw new Error('ID da categoria é obrigatório')
      }
      if (!transacaoParaInserir.valor || transacaoParaInserir.valor === 0) {
        throw new Error('Valor da transação é obrigatório')
      }
      if (!transacaoParaInserir.descricao?.trim()) {
        throw new Error('Descrição é obrigatória')
      }
      if (!transacaoParaInserir.tipo) {
        throw new Error('Tipo da transação é obrigatório')
      }
      if (!transacaoParaInserir.data_transacao) {
        throw new Error('Data da transação é obrigatória')
      }
      
      const { data, error } = await supabase
        .from('transacoes')
        .insert([transacaoParaInserir])
        .select()
        .single()

      if (error) {
        throw error
      }

      setTransacoes(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar transação')
      throw err
    }
  }

  const updateTransacao = async (id: number, updates: Partial<Transacao>) => {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setTransacoes(prev => prev.map(t => t.id === id ? data : t))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar transação')
      throw err
    }
  }

  const deleteTransacao = async (id: number) => {
    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTransacoes(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar transação')
      throw err
    }
  }

  useEffect(() => {
    fetchTransacoes()
  }, [])

  return {
    transacoes,
    loading,
    error,
    refetch: fetchTransacoes,
    addTransacao,
    updateTransacao,
    deleteTransacao
  }
}

// Hook para investimentos (atualizado)
export function useInvestimentos() {
  const [investimentos, setInvestimentos] = useState<Investimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvestimentos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('investimentos')
        .select('*')
        .order('data_criacao', { ascending: false })

      if (error) {
        if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
          // Table doesn't exist, return empty array and no error
          setInvestimentos([])
          setError(null)
        } else {
          setError('Erro ao carregar investimentos')
        }
      } else {
        setInvestimentos(data || [])
      }
    } catch (err) {
      // If there's a connection error, still return empty array to prevent crashes
      console.warn('Tabela investimentos não encontrada, usando dados das transações')
      setInvestimentos([])
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  const addInvestimento = async (investimento: Omit<Investimento, 'data_criacao' | 'data_atualizacao'>) => {
    try {
      const { data, error } = await supabase
        .from('investimentos')
        .insert([{
          ...investimento,
          data_criacao: new Date().toISOString(),
          data_atualizacao: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Tabela de investimentos não encontrada. Use o formulário de transações para registrar investimentos.')
        }
        throw error
      }
      setInvestimentos(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar investimento')
      throw err
    }
  }

  useEffect(() => {
    fetchInvestimentos()
  }, [])

  return {
    investimentos,
    loading,
    error,
    refetch: fetchInvestimentos,
    addInvestimento
  }
}

// Hook para metas
export function useMetas() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchMetas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!user?.id) {
        setMetas([])
        return
      }
      
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('usuario_id', parseInt(user.id))
        .order('created_at', { ascending: false })

      if (error) {
        // Handle table not found errors (404, PGRST116, etc.)
        if (error.message?.includes('does not exist') || 
            error.code === 'PGRST116' || 
            error.message?.includes('404') ||
            error.message?.includes('Not Found')) {
          console.warn('Tabela metas não encontrada no banco de dados')
          setMetas([])
          setError(null)
        } else {
          console.error('Erro ao carregar metas:', error)
          setError('Erro ao carregar metas')
          setMetas([]) // Still set empty array to prevent crashes
        }
      } else {
        setMetas(data || [])
      }
    } catch (err: any) {
      // Handle network errors and other exceptions
      console.warn('Erro de conexão ou tabela metas não encontrada:', err?.message || err)
      setMetas([])
      setError(null) // Don't show error to user for missing table
    } finally {
      setLoading(false)
    }
  }

  const addMeta = async (metaData: Omit<Meta, 'id' | 'created_at' | 'updated_at' | 'usuario_id'>) => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      const meta = {
        ...metaData,
        usuario_id: parseInt(user.id),
        status: metaData.status || 'ativa' as const
      }

      const { data, error } = await supabase
        .from('metas')
        .insert([meta])
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116' || 
            error.message?.includes('does not exist') ||
            error.message?.includes('404') ||
            error.message?.includes('Not Found')) {
          throw new Error('Tabela de metas não encontrada. Entre em contato com o suporte.')
        }
        throw error
      }
      setMetas(prev => [data, ...prev])
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar meta'
      setError(errorMessage)
      throw err
    }
  }

  const updateMeta = async (id: number, updates: Partial<Omit<Meta, 'id' | 'created_at' | 'updated_at' | 'usuario_id'>>) => {
    try {
      const { data, error } = await supabase
        .from('metas')
        .update(updates)
        .eq('id', id)
        .eq('usuario_id', parseInt(user?.id || '0'))
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116' || 
            error.message?.includes('does not exist') ||
            error.message?.includes('404') ||
            error.message?.includes('Not Found')) {
          throw new Error('Tabela de metas não encontrada. Entre em contato com o suporte.')
        }
        throw error
      }
      setMetas(prev => prev.map(m => m.id === id ? data : m))
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar meta'
      setError(errorMessage)
      throw err
    }
  }

  const deleteMeta = async (id: number) => {
    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', id)
        .eq('usuario_id', parseInt(user?.id || '0'))

      if (error) {
        if (error.code === 'PGRST116' || 
            error.message?.includes('does not exist') ||
            error.message?.includes('404') ||
            error.message?.includes('Not Found')) {
          throw new Error('Tabela de metas não encontrada. Entre em contato com o suporte.')
        }
        throw error
      }
      setMetas(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar meta'
      setError(errorMessage)
      throw err
    }
  }

  const updateValorAtual = async (id: number, novoValor: number) => {
    try {
      const meta = metas.find(m => m.id === id)
      if (!meta) {
        throw new Error('Meta não encontrada')
      }

      const updates: Partial<Meta> = {
        valor_atual: novoValor
      }

      // Se atingiu a meta, marcar como concluída
      if (novoValor >= meta.valor_meta && meta.status === 'ativa') {
        updates.status = 'concluida'
      } else if (novoValor < meta.valor_meta && meta.status === 'concluida') {
        // Se estava concluída e agora não atingiu mais, voltar para ativa
        updates.status = 'ativa'
      }

      return await updateMeta(id, updates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar valor da meta'
      setError(errorMessage)
      throw err
    }
  }

  const getMetasPorStatus = (status?: Meta['status']) => {
    if (!status) return metas
    return metas.filter(meta => meta.status === status)
  }

  const getProgressoMeta = (meta: Meta) => {
    return Math.min((meta.valor_atual / meta.valor_meta) * 100, 100)
  }

  const getMetasProximasVencimento = (dias: number = 30) => {
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() + dias)
    
    return metas.filter(meta => {
      if (!meta.prazo || meta.status !== 'ativa') return false
      const prazoDaMeta = new Date(meta.prazo)
      return prazoDaMeta <= dataLimite && prazoDaMeta >= new Date()
    })
  }

  const getTotalEconomizado = () => {
    return metas.reduce((total, meta) => total + meta.valor_atual, 0)
  }

  const getTotalObjetivo = () => {
    return metas.filter(meta => meta.status === 'ativa')
                .reduce((total, meta) => total + meta.valor_meta, 0)
  }

  useEffect(() => {
    if (user?.id) {
      fetchMetas()
    }
  }, [user?.id])

  return {
    metas,
    loading,
    error,
    refetch: fetchMetas,
    addMeta,
    updateMeta,
    deleteMeta,
    updateValorAtual,
    getMetasPorStatus,
    getProgressoMeta,
    getMetasProximasVencimento,
    getTotalEconomizado,
    getTotalObjetivo
  }
}

// Hook para despesas (atualizado para usar tabela transacoes)
export function useDespesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDespesas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('tipo', 'despesa')
        .order('data_transacao', { ascending: false })

      if (error) {
        if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
          setDespesas([])
          setError(null)
        } else {
          setError('Erro ao carregar despesas')
        }
      } else {
        // Mapear os dados da tabela transacoes para o formato da interface Despesa
        const despesasMapeadas = (data || []).map(transacao => ({
          id: transacao.id,
          usuario_id: transacao.usuario_id?.toString() || '',
          categoria_id: transacao.categoria_id,
          descricao: transacao.descricao,
          valor: Math.abs(transacao.valor), // Garantir que despesas sejam positivas
          data_despesa: transacao.data_transacao, // Mapear data_transacao para data_despesa
          data_criacao: transacao.data_criacao || new Date().toISOString(),
          data_atualizacao: transacao.data_atualizacao || new Date().toISOString()
        }))
        setDespesas(despesasMapeadas)
      }
    } catch (err) {
      setError('Erro de conexão')
      setDespesas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDespesas()
  }, [])

  return {
    despesas,
    loading,
    error,
    refetch: fetchDespesas
  }
}

// Hook para entradas (atualizado para usar tabela transacoes)
export function useEntradas() {
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntradas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('tipo', 'entrada')
        .order('data_transacao', { ascending: false })

      if (error) {
        if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
          setEntradas([])
          setError(null)
        } else {
          setError('Erro ao carregar entradas')
        }
      } else {
        // Mapear os dados da tabela transacoes para o formato da interface Entrada
        const entradasMapeadas = (data || []).map(transacao => ({
          id: transacao.id,
          usuario_id: transacao.usuario_id?.toString() || '',
          categoria_id: transacao.categoria_id,
          descricao: transacao.descricao,
          valor: transacao.valor,
          data_despesa: transacao.data_transacao, // Mapear data_transacao para data_despesa
          data_criacao: transacao.data_criacao || new Date().toISOString(),
          data_atualizacao: transacao.data_atualizacao || new Date().toISOString()
        }))
        setEntradas(entradasMapeadas)
      }
    } catch (err) {
      setError('Erro de conexão')
      setEntradas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntradas()
  }, [])

  return {
    entradas,
    loading,
    error,
    refetch: fetchEntradas
  }
}

// Hook para contas a pagar (CRUD completo)
export function useContasAPagar() {
  const [contas, setContas] = useState<ContaAPagar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContasAPagar = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .select('*')
        .order('data_vencimento', { ascending: true })

      if (error) {
        if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
          setContas([])
          setError('Tabela contas_a_pagar não encontrada no banco de dados')
        } else {
          setError('Erro ao carregar contas a pagar')
        }
      } else {
        setContas(data || [])
      }
    } catch (err) {
      setError('Erro de conexão')
      setContas([])
    } finally {
      setLoading(false)
    }
  }

  const addContaAPagar = async (conta: Omit<ContaAPagar, 'id' | 'data_criacao' | 'data_atualizacao'>) => {
    try {
      // Validar dados antes de enviar
      if (!conta.descricao || conta.descricao.trim() === '') {
        throw new Error('Descrição é obrigatória')
      }
      
      if (!conta.valor_total || conta.valor_total <= 0) {
        throw new Error('Valor total deve ser maior que zero')
      }
      
      if (!conta.valor_parcela || conta.valor_parcela <= 0 || isNaN(conta.valor_parcela)) {
        throw new Error('Valor da parcela deve ser maior que zero')
      }
      
      if (!conta.data_vencimento) {
        throw new Error('Data de vencimento é obrigatória')
      }

      // Teste de conectividade com o Supabase
      const { data: testData, error: testError } = await supabase
        .from('contas_a_pagar')
        .select('count', { count: 'exact', head: true })

      if (testError) {
        throw new Error(`Erro de conexão com o banco: ${testError.message}`)
      }

      const { data, error } = await supabase
        .from('contas_a_pagar')
        .insert([conta])
        .select()

      if (error) {
        // Verificar tipos específicos de erro
        if (error.code === 'PGRST116') {
          throw new Error('Tabela "contas_a_pagar" não encontrada. Verifique se existe no banco.')
        } else if (error.code === '23502') {
          throw new Error('Campo obrigatório não preenchido.')
        } else if (error.code === '23505') {
          throw new Error('Registro duplicado.')
        } else {
          throw new Error(`Erro do banco de dados: ${error.message || 'Erro desconhecido'}`)
        }
      }

      if (!data || data.length === 0) {
        throw new Error('Nenhum dado foi retornado após inserção')
      }

      await fetchContasAPagar() // Recarregar a lista
      return data[0]
    } catch (error) {
      throw error
    }
  }

  const updateContaAPagar = async (id: number, contaData: Partial<ContaAPagar>) => {
    try {
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .update(contaData)
        .eq('id', id)
        .select()

      if (error) {
        throw error
      }

      await fetchContasAPagar() // Recarregar a lista
      return data[0]
    } catch (error) {
      throw error
    }
  }

  const deleteContaAPagar = async (id: number) => {
    try {
      const { error } = await supabase
        .from('contas_a_pagar')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      await fetchContasAPagar() // Recarregar a lista
    } catch (error) {
      throw error
    }
  }

  const quitarParcela = async (id: number, novaParcelaAtual: number) => {
    try {
      // Se a nova parcela atual é maior que a quantidade de parcelas, marcar como quitado
      const conta = contas.find(c => c.id === id)
      if (!conta) throw new Error('Conta não encontrada')
      
      const quitado = novaParcelaAtual > conta.qtd_parcelas
      
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .update({ 
          parcela_atual: novaParcelaAtual,
          quitado: quitado 
        })
        .eq('id', id)
        .select()

      if (error) {
        throw error
      }

      await fetchContasAPagar() // Recarregar a lista
      return data[0]
    } catch (error) {
      throw error
    }
  }

  const getContasVencendo = (diasAntecedencia: number = 7) => {
    const hoje = new Date()
    const dataLimite = new Date()
    dataLimite.setDate(hoje.getDate() + diasAntecedencia)
    
    return contas.filter(conta => {
      if (conta.quitado) return false
      
      const dataVencimento = new Date(conta.data_vencimento)
      return dataVencimento <= dataLimite && dataVencimento >= hoje
    })
  }

  const getContasVencidas = () => {
    const hoje = new Date()
    
    return contas.filter(conta => {
      if (conta.quitado) return false
      
      const dataVencimento = new Date(conta.data_vencimento)
      return dataVencimento < hoje
    })
  }

  const getTotalPendente = () => {
    return contas
      .filter(conta => !conta.quitado)
      .reduce((total, conta) => {
        const parcelasRestantes = conta.qtd_parcelas - conta.parcela_atual + 1
        return total + (conta.valor_parcela * parcelasRestantes)
      }, 0)
  }

  useEffect(() => {
    fetchContasAPagar()
  }, [])

  return {
    contas,
    loading,
    error,
    addContaAPagar,
    updateContaAPagar,
    deleteContaAPagar,
    quitarContaAPagar: quitarParcela,
    getContasVencendo,
    getContasVencidas,
    getTotalPendente,
    refetch: fetchContasAPagar
  }
}

// Hook para categorias
export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true })

      if (error) {
        if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
          setCategorias([])
          setError(null)
        } else {
          setError('Erro ao carregar categorias: ' + error.message)
        }
      } else {
        setCategorias(data || [])
      }
    } catch (err) {
      setError('Erro de conexão')
      setCategorias([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  return {
    categorias,
    loading,
    error,
    refetch: fetchCategorias
  }
}

// Hook para contas bancárias
export function useContasBancarias() {
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchContas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!user?.id) {
        setContas([])
        return
      }
      
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('usuario_id', parseInt(user.id))
        .eq('ativo', true)
        .order('nome_conta', { ascending: true })

      if (error) {
        if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
          setContas([])
          setError(null)
        } else {
          setError('Erro ao carregar contas bancárias')
        }
      } else {
        setContas(data || [])
      }
    } catch (err) {
      setError('Erro de conexão')
      setContas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchContas()
    }
  }, [user?.id])

  return {
    contas,
    loading,
    error,
    refetch: fetchContas
  }
}

// Hook para cartões de crédito
export function useCartoesCredito() {
  const [cartoes, setCartoes] = useState<CartaoUsuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchCartoes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!user?.id) {
        setCartoes([])
        return
      }
      
      const { data, error } = await supabase
        .from('cartoes_usuario')
        .select('*')
        .eq('user_id', parseInt(user.id))
        .eq('ativo', true)
        .order('final_cartao', { ascending: true })

      if (error) {
        if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
          setCartoes([])
          setError(null)
        } else {
          setError('Erro ao carregar cartões de crédito')
        }
      } else {
        setCartoes(data || [])
      }
    } catch (err) {
      setError('Erro de conexão')
      setCartoes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchCartoes()
    }
  }, [user?.id])

  return {
    cartoes,
    loading,
    error,
    refetch: fetchCartoes
  }
}

// Hook para tipos de pagamento
export function useTiposPagamento() {
  const [tipos, setTipos] = useState<TipoPagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTipos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('tipos_pagamento')
        .select('*')
        .order('nome', { ascending: true })

      if (error) {
        // Se a tabela não existir ou houver erro de estrutura, usar dados de fallback
        if (error.message?.includes('does not exist') || 
            error.code === 'PGRST116' || 
            error.message?.includes('column') ||
            error.code === '42P01' ||
            error.code === '42703') {
          setTipos([])
          setError(null)
        } else {
          setError('Erro ao carregar tipos de pagamento')
        }
      } else {
        // Como a coluna 'ativo' não existe, usar todos os tipos retornados
        setTipos(data || [])
      }
    } catch (err) {
      setError(null) // Não mostrar erro, usar fallback
      setTipos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTipos()
  }, [])

  return {
    tipos,
    loading,
    error,
    refetch: fetchTipos
  }
}

