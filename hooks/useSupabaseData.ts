import { useState, useEffect } from 'react'
import { supabase, Transacao, Investimento, Meta } from '@/lib/supabase'

// Hook para transações
export function useTransacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransacoes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .order('data', { ascending: false })

      if (error) throw error
      setTransacoes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }

  const addTransacao = async (transacao: Omit<Transacao, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .insert([transacao])
        .select()
        .single()

      if (error) throw error
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

// Hook para investimentos
export function useInvestimentos() {
  const [investimentos, setInvestimentos] = useState<Investimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvestimentos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('investimentos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvestimentos(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar investimentos')
    } finally {
      setLoading(false)
    }
  }

  const addInvestimento = async (investimento: Omit<Investimento, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('investimentos')
        .insert([investimento])
        .select()
        .single()

      if (error) throw error
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

  const fetchMetas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMetas(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar metas')
    } finally {
      setLoading(false)
    }
  }

  const addMeta = async (meta: Omit<Meta, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('metas')
        .insert([meta])
        .select()
        .single()

      if (error) throw error
      setMetas(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar meta')
      throw err
    }
  }

  const updateMeta = async (id: number, updates: Partial<Meta>) => {
    try {
      const { data, error } = await supabase
        .from('metas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setMetas(prev => prev.map(m => m.id === id ? data : m))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar meta')
      throw err
    }
  }

  useEffect(() => {
    fetchMetas()
  }, [])

  return {
    metas,
    loading,
    error,
    refetch: fetchMetas,
    addMeta,
    updateMeta
  }
}
