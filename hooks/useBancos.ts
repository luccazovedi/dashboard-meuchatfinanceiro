import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

export interface Banco {
  id: number
  nome: string
  codigo: string
}

export function useBancos() {
  const { user } = useAuth()
  const [bancos, setBancos] = useState<Banco[]>([])
  const [bancosSelecionados, setBancosSelecionados] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      carregarBancos()
      carregarBancosSelecionados()
    }
  }, [user])

  const carregarBancos = async () => {
    try {
      const { data, error } = await supabase
        .from('bancos')
        .select('*')
        .order('nome')
      
      if (!error && data) {
        setBancos(data)
      }
    } catch (error) {
      
    } finally {
      setLoading(false)
    }
  }

  const carregarBancosSelecionados = () => {
    if (user) {
      const bancosSalvos = localStorage.getItem(`bancos_${user.id}`)
      if (bancosSalvos) {
        setBancosSelecionados(JSON.parse(bancosSalvos))
      }
    }
  }

  const salvarBancosSelecionados = (novosBancos: number[]) => {
    if (user) {
      localStorage.setItem(`bancos_${user.id}`, JSON.stringify(novosBancos))
      setBancosSelecionados(novosBancos)
    }
  }

  const toggleBanco = (bancoId: number) => {
    const novosBancos = bancosSelecionados.includes(bancoId)
      ? bancosSelecionados.filter(id => id !== bancoId)
      : [...bancosSelecionados, bancoId]
    
    salvarBancosSelecionados(novosBancos)
    return novosBancos
  }

  const adicionarBanco = (bancoId: number) => {
    if (!bancosSelecionados.includes(bancoId)) {
      const novosBancos = [...bancosSelecionados, bancoId]
      salvarBancosSelecionados(novosBancos)
      return true
    }
    return false
  }

  const removerBanco = (bancoId: number) => {
    if (bancosSelecionados.includes(bancoId)) {
      const novosBancos = bancosSelecionados.filter(id => id !== bancoId)
      salvarBancosSelecionados(novosBancos)
      return true
    }
    return false
  }

  const buscarBancoPorId = (id: number): Banco | undefined => {
    return bancos.find(banco => banco.id === id)
  }

  const buscarBancoPorNome = (nome: string): Banco | undefined => {
    return bancos.find(banco => 
      banco.nome.toLowerCase().includes(nome.toLowerCase())
    )
  }

  const buscarBancoPorCodigo = (codigo: string): Banco | undefined => {
    return bancos.find(banco => banco.codigo === codigo)
  }

  const getBancosSelecionadosDetalhes = (): Banco[] => {
    return bancos.filter(banco => bancosSelecionados.includes(banco.id))
  }

  const isBancoSelecionado = (bancoId: number): boolean => {
    return bancosSelecionados.includes(bancoId)
  }

  return {
    bancos,
    bancosSelecionados,
    loading,
    toggleBanco,
    adicionarBanco,
    removerBanco,
    buscarBancoPorId,
    buscarBancoPorNome,
    buscarBancoPorCodigo,
    getBancosSelecionadosDetalhes,
    isBancoSelecionado,
    salvarBancosSelecionados
  }
}

export default useBancos
