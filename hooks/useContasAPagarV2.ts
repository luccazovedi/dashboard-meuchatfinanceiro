import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ContaAPagar } from '../lib/supabase'
import { useAuth } from './useAuth'

// Hook para contas a pagar (CRUD completo e reconstruído)
export function useContasAPagarV2() {
  const [contas, setContas] = useState<ContaAPagar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchContasAPagar = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!user?.id) {
        setContas([])
        return
      }

      
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .select('*')
        .eq('usuario_id', parseInt(user.id))
        .order('data_vencimento', { ascending: true })

      if (error) {
        setError('Erro ao carregar contas a pagar')
        return
      }

      setContas(data || [])
      return data
    } catch (error) {
      setError('Erro ao carregar contas a pagar')
      setContas([])
    } finally {
      setLoading(false)
    }
  }

  const addContaAPagar = async (conta: Omit<ContaAPagar, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }


      // Calcular o valor da parcela automaticamente dividindo o valor total pelas parcelas
      const valorParcela = conta.valor_total / conta.qtd_parcelas

      // Preparar dados para inserção
      const contaParaInserir = {
        ...conta,
        valor_parcela: Number(valorParcela.toFixed(2)), // Arredondar para 2 casas decimais
        usuario_id: parseInt(user.id),
        // Os campos created_at e updated_at são preenchidos automaticamente pelo banco
      }


      const { data, error } = await supabase
        .from('contas_a_pagar')
        .insert([contaParaInserir])
        .select('*')
        .single()

      if (error) {
        throw error
      }

      
      // Atualizar lista local
      setContas(prev => [...prev, data])
      
      return data
    } catch (error) {
      throw error
    }
  }

  const updateContaAPagar = async (id: number, updates: Partial<Omit<ContaAPagar, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>>) => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      if (!id) {
        throw new Error('ID da conta é obrigatório para atualização')
      }


      // Se valor_total ou qtd_parcelas foram alterados, recalcular valor_parcela
      let dadosParaAtualizar = { ...updates }
      
      if (updates.valor_total !== undefined || updates.qtd_parcelas !== undefined) {
        // Buscar os dados atuais da conta para ter os valores completos
        const contaAtual = contas.find(c => c.id === id)
        
        const valorTotal = updates.valor_total !== undefined ? updates.valor_total : contaAtual?.valor_total || 0
        const qtdParcelas = updates.qtd_parcelas !== undefined ? updates.qtd_parcelas : contaAtual?.qtd_parcelas || 1
        
        // Recalcular valor da parcela
        const valorParcela = valorTotal / qtdParcelas
        dadosParaAtualizar.valor_parcela = Number(valorParcela.toFixed(2))
        
      }


      const { data, error } = await supabase
        .from('contas_a_pagar')
        .update(dadosParaAtualizar)
        .eq('id', id)
        .eq('usuario_id', parseInt(user.id))
        .select('*')
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('Conta não encontrada ou você não tem permissão para atualizá-la')
      }

      
      // Atualizar lista local
      setContas(prev => prev.map(conta => 
        conta.id === id ? data : conta
      ))
      
      return data
    } catch (error) {
      throw error
    }
  }

  const deleteContaAPagar = async (id: number) => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      if (!id) {
        throw new Error('ID da conta é obrigatório para exclusão')
      }


      const { error } = await supabase
        .from('contas_a_pagar')
        .delete()
        .eq('id', id)
        .eq('usuario_id', parseInt(user.id))

      if (error) {
        throw error
      }

      
      // Atualizar lista local
      setContas(prev => prev.filter(conta => conta.id !== id))
      
      return true
    } catch (error) {
      throw error
    }
  }

  const quitarParcela = async (id: number) => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }


      // Buscar a conta atual para calcular a próxima parcela
      const contaAtual = contas.find(c => c.id === id)
      if (!contaAtual) {
        throw new Error('Conta não encontrada')
      }

      const novaParcelaAtual = contaAtual.parcela_atual + 1
      const quitado = novaParcelaAtual > contaAtual.qtd_parcelas


      const { data, error } = await supabase
        .from('contas_a_pagar')
        .update({ 
          parcela_atual: novaParcelaAtual,
          quitado: quitado
        })
        .eq('id', id)
        .eq('usuario_id', parseInt(user.id))
        .select('*')
        .single()

      if (error) {
        throw error
      }

      
      // Atualizar lista local
      setContas(prev => prev.map(conta => 
        conta.id === id ? data : conta
      ))
      
      return data
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
    if (user?.id) {
      fetchContasAPagar()
    }
  }, [user?.id])

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
