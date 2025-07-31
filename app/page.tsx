"use client"

import { useState, useEffect } from "react"
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, TrendingUpIcon, WalletIcon, FilterIcon, XIcon, EyeIcon, EyeOffIcon, LogOutIcon, MessageCircleIcon, SunIcon, MoonIcon, PlusIcon, EditIcon, TrashIcon, SettingsIcon, MenuIcon, CreditCardIcon, FileTextIcon, ClockIcon, AlertTriangleIcon, Target, Building, DollarSign } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// Importações do Supabase
import { useAuth } from "@/hooks/useAuth"
import { useTransacoes, useInvestimentos, useMetas, useDespesas, useEntradas, useCategorias, useContasBancarias, useCartoesCredito, useTiposPagamento } from "@/hooks/useSupabaseData"
import { useContasAPagarV2 } from "@/hooks/useContasAPagarV2"
import { supabase, Transacao, Investimento, Meta, Categoria } from "@/lib/supabase"

// Função para calcular saldo atual de uma conta baseado nas transações
const calcularSaldoAtual = (contaId: number, saldoInicial: number, transacoes: Transacao[]): number => {
  const transacoesDaConta = transacoes.filter(transacao => 
    transacao.conta_bancaria_id === contaId ||
    transacao.conta_origem_id === contaId ||
    transacao.conta_destino_id === contaId
  )

  let saldoAtual = saldoInicial

  transacoesDaConta.forEach(transacao => {
    if (transacao.conta_bancaria_id === contaId) {
      // Transação normal (entrada/saída/investimento)
      saldoAtual += transacao.valor
    } else if (transacao.tipo === 'transferencia') {
      if (transacao.conta_origem_id === contaId) {
        // Saída da conta origem (débito)
        saldoAtual -= Math.abs(transacao.valor)
      } else if (transacao.conta_destino_id === contaId) {
        // Entrada na conta destino (crédito)
        saldoAtual += Math.abs(transacao.valor)
      }
    }
  })

  return saldoAtual
}

export default function HomePage() {
  const { theme, setTheme } = useTheme()
  
  // Hooks do Supabase
  const { user, loading: authLoading, signIn, signOut } = useAuth()
  const { 
    transacoes, 
    loading: transacoesLoading, 
    error: transacoesError,
    addTransacao,
    updateTransacao,
    deleteTransacao
  } = useTransacoes()
  const { investimentos, loading: investimentosLoading, error: investimentosError } = useInvestimentos()
  const { 
    metas, 
    loading: metasLoading, 
    error: metasError,
    addMeta,
    updateMeta,
    deleteMeta,
    updateValorAtual,
    getProgressoMeta,
    getMetasProximasVencimento,
    getTotalEconomizado,
    getTotalObjetivo
  } = useMetas()
  const { despesas, loading: despesasLoading, error: despesasError } = useDespesas()
  const { entradas, loading: entradasLoading, error: entradasError } = useEntradas()
  const { contas: contasAPagar, loading: contasLoading, error: contasError, addContaAPagar, updateContaAPagar, deleteContaAPagar, refetch: refetchContasAPagar } = useContasAPagarV2()
  const { categorias, loading: categoriasLoading, error: categoriasError } = useCategorias()
  
  // Novos hooks para dados de referência
  const { contas: contasBancarias, loading: contasBancariasLoading, error: contasBancariasError } = useContasBancarias()
  const { cartoes: cartoesCredito, loading: cartoesCreditoLoading, error: cartoesCreditoError } = useCartoesCredito()
  const { tipos: tiposPagamento, loading: tiposPagamentoLoading, error: tiposPagamentoError } = useTiposPagamento()
  
  // Categorias de fallback caso não carregue do banco
  const categoriasFallback = [
    { id: 1, nome: 'Alimentação', cor_padrao: '#ef4444', created_at: '', updated_at: '' },
    { id: 2, nome: 'Transporte', cor_padrao: '#3b82f6', created_at: '', updated_at: '' },
    { id: 3, nome: 'Saúde', cor_padrao: '#10b981', created_at: '', updated_at: '' },
    { id: 4, nome: 'Lazer', cor_padrao: '#ec4899', created_at: '', updated_at: '' },
    { id: 5, nome: 'Educação', cor_padrao: '#8b5cf6', created_at: '', updated_at: '' },
    { id: 6, nome: 'Casa', cor_padrao: '#f59e0b', created_at: '', updated_at: '' },
    { id: 7, nome: 'Mercado', cor_padrao: '#22c55e', created_at: '', updated_at: '' },
    { id: 8, nome: 'Outros', cor_padrao: '#64748b', created_at: '', updated_at: '' }
  ]
  
  // Tipos de pagamento globais de fallback
  const tiposPagamentoFallback = [
    { id: 1, nome: 'PIX', descricao: 'Pagamento instantâneo', ativo: true, created_at: '', updated_at: '' },
    { id: 2, nome: 'Cartão de Débito', descricao: 'Débito em conta', ativo: true, created_at: '', updated_at: '' },
    { id: 3, nome: 'Cartão de Crédito', descricao: 'Crédito parcelado', ativo: true, created_at: '', updated_at: '' },
    { id: 4, nome: 'Dinheiro', descricao: 'Pagamento em espécie', ativo: true, created_at: '', updated_at: '' },
    { id: 5, nome: 'Transferência', descricao: 'TED/DOC bancário', ativo: true, created_at: '', updated_at: '' },
    { id: 6, nome: 'Boleto', descricao: 'Boleto bancário', ativo: true, created_at: '', updated_at: '' }
  ]
  
  // Usar categorias do banco ou fallback
  const categoriasParaUsar = categorias.length > 0 ? categorias : categoriasFallback
  
  // Usar tipos de pagamento do banco ou fallback (sempre exibir)
  const tiposPagamentoParaUsar = tiposPagamento.length > 0 ? tiposPagamento : tiposPagamentoFallback
  
  // Estados locais
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [nomeUsuario, setNomeUsuario] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    senha: ""
  })

  // Estados do dashboard
  const [filtroTransacao, setFiltroTransacao] = useState("todas")
  const [periodoSelecionado, setPeriodoSelecionado] = useState("mes-atual")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Estados da sidebar detalhada
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [tipoSidebarAtivo, setTipoSidebarAtivo] = useState<string>("")
  
  // Estados para metas
  const [modalMetaAberto, setModalMetaAberto] = useState(false)
  const [metaEditando, setMetaEditando] = useState<Meta | null>(null)
  const [modalUpdateValueAberto, setModalUpdateValueAberto] = useState(false)
  const [metaParaAtualizar, setMetaParaAtualizar] = useState<Meta | null>(null)
  const [novoValorMeta, setNovoValorMeta] = useState("")
  const [formMeta, setFormMeta] = useState({
    titulo: "",
    descricao: "",
    valor_meta: "",
    valor_atual: "",
    categoria: "",
    prazo: "",
    status: "ativa" as Meta['status']
  })
  
  // Estados para contas a pagar
  const [modalContaAberto, setModalContaAberto] = useState(false)
  const [contaEditando, setContaEditando] = useState<any | null>(null)
  const [formConta, setFormConta] = useState({
    descricao: "",
    valor_total: "",
    qtd_parcelas: "",
    data_vencimento: "",
    conta_bancaria_id: "",
    quitado: false
  })
  
  // Estados do modal de transação
  const [modalTransacaoAberto, setModalTransacaoAberto] = useState(false)
  const [transacaoEditando, setTransacaoEditando] = useState<Transacao | null>(null)
  const [formTransacao, setFormTransacao] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    data: "",
    tipo: "entrada" as string,
    // IDs de referência (opcionais)
    conta_bancaria_id: "",
    cartao_credito_id: "",
    tipo_pagamento_id: "",
    // Campos específicos para transferência
    conta_origem_id: "",
    conta_destino_id: ""
  })

  // Estado de timeout de segurança para evitar loading infinito
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Executar inicialização
  useEffect(() => {
    // Componente inicializado
  }, [])

  // Timeout de segurança para evitar loading infinito
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true)
    }, 10000) // 10 segundos

    return () => clearTimeout(timer)
  }, [])

  // Carregar nome do usuário do banco de dados
  useEffect(() => {
    const carregarNomeUsuario = async () => {
      if (user && user.email) {
        try {
          const { data, error } = await supabase
            .from('usuarios')
            .select('nome')
            .eq('email', user.email)
            .single()
          
          if (!error && data) {
            setNomeUsuario(data.nome || user.email)
          } else {
            setNomeUsuario(user.email)
          }
        } catch (err) {
          setNomeUsuario(user.email)
        }
      }
    }

    carregarNomeUsuario()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const data = await signIn(formData.email, formData.senha)

      if (data.user) {
        setFormData({ email: "", senha: "" })
        setError("")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao fazer login. Tente novamente."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      setFormData({ email: "", senha: "" })
      setError("")
    } catch (err) {
      // Silenciar erro de logout
    }
  }

  const handleWhatsAppRedirect = () => {
    const phoneNumber = "5511912537684"
    const message = "Olá!"
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Função para abrir sidebar com detalhes específicos
  const abrirSidebar = (tipo: string) => {
    setTipoSidebarAtivo(tipo)
    setSidebarAberta(true)
  }

  const fecharSidebar = () => {
    setSidebarAberta(false)
    setTipoSidebarAtivo("")
  }

  // Função para filtrar categorias baseada no tipo selecionado
  const getCategoriasPorTipo = (tipo: string) => {
    switch (tipo) {
      case 'despesa': // Despesas - categorias ID 1 a 9
        return categoriasParaUsar.filter(cat => cat.id >= 1 && cat.id <= 9)
      case 'entrada': // Entradas - categorias ID 9 a 11
        return categoriasParaUsar.filter(cat => cat.id >= 9 && cat.id <= 11)
      case 'investimento': // Investimentos - categoria ID 12
        return categoriasParaUsar.filter(cat => cat.id === 12)
      case 'transferencia': // Transferências - usando categorias de entrada
        return categoriasParaUsar.filter(cat => cat.id >= 9 && cat.id <= 11)
      default:
        return categoriasParaUsar
    }
  }

  // Função para filtrar transações por período
  const filtrarTransacoesPorPeriodo = (transacoes: Transacao[]) => {
    const hoje = new Date()
    
    switch (periodoSelecionado) {
      case 'mes-atual':
        const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const fimMesAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)
        return transacoes.filter(t => {
          const dataTransacao = new Date(t.data_transacao)
          return dataTransacao >= inicioMesAtual && dataTransacao <= fimMesAtual
        })
      
      case 'mes-anterior':
        const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
        const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59)
        return transacoes.filter(t => {
          const dataTransacao = new Date(t.data_transacao)
          return dataTransacao >= inicioMesAnterior && dataTransacao <= fimMesAnterior
        })
      
      case 'trimestre':
        const inicioTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1)
        const fimTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)
        return transacoes.filter(t => {
          const dataTransacao = new Date(t.data_transacao)
          return dataTransacao >= inicioTrimestre && dataTransacao <= fimTrimestre
        })
      
      case 'ano':
        const inicioAno = new Date(hoje.getFullYear(), 0, 1)
        const fimAno = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59)
        return transacoes.filter(t => {
          const dataTransacao = new Date(t.data_transacao)
          return dataTransacao >= inicioAno && dataTransacao <= fimAno
        })
      
      case 'futuras':
        // Para transações futuras (caso existam), a partir de amanhã
        const amanha = new Date(hoje)
        amanha.setDate(hoje.getDate() + 1)
        amanha.setHours(0, 0, 0, 0)
        return transacoes.filter(t => {
          const dataTransacao = new Date(t.data_transacao)
          return dataTransacao >= amanha
        })
      
      default:
        return transacoes
    }
  }

  // Função para filtrar contas a pagar por período (mesmo que transações)
  const filtrarContasPorPeriodo = (contas: any[]) => {
    if (!contas) return []
    
    const hoje = new Date()
    
    switch (periodoSelecionado) {
      case 'mes-atual':
        const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const fimMesAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)
        return contas.filter(conta => {
          const dataVencimento = new Date(conta.data_vencimento)
          return dataVencimento >= inicioMesAtual && dataVencimento <= fimMesAtual
        })
      
      case 'mes-anterior':
        const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
        const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59)
        return contas.filter(conta => {
          const dataVencimento = new Date(conta.data_vencimento)
          return dataVencimento >= inicioMesAnterior && dataVencimento <= fimMesAnterior
        })
      
      case 'trimestre':
        const inicioTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1)
        const fimTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)
        return contas.filter(conta => {
          const dataVencimento = new Date(conta.data_vencimento)
          return dataVencimento >= inicioTrimestre && dataVencimento <= fimTrimestre
        })
      
      case 'ano':
        const inicioAno = new Date(hoje.getFullYear(), 0, 1)
        const fimAno = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59)
        return contas.filter(conta => {
          const dataVencimento = new Date(conta.data_vencimento)
          return dataVencimento >= inicioAno && dataVencimento <= fimAno
        })
      
      case 'futuras':
        // Contas futuras: a partir de amanhã em diante
        const amanha = new Date(hoje)
        amanha.setDate(hoje.getDate() + 1)
        amanha.setHours(0, 0, 0, 0)
        return contas.filter(conta => {
          const dataVencimento = new Date(conta.data_vencimento)
          return dataVencimento >= amanha
        })
      
      default:
        return contas
    }
  }

  // Função para obter o nome do período selecionado
  const getNomePeriodo = () => {
    switch (periodoSelecionado) {
      case 'mes-atual': return 'Este mês'
      case 'mes-anterior': return 'Mês anterior'
      case 'trimestre': return 'Último trimestre'
      case 'ano': return 'Este ano'
      case 'futuras': return 'Contas futuras'
      default: return 'Período'
    }
  }

  // Funções do modal de transação
  const abrirModalTransacao = (transacao?: Transacao, tipoPreSelecionado?: string) => {
    setError("") // Limpar erros anteriores
    
    if (transacao) {
      setTransacaoEditando(transacao)
      const categoria = categoriasParaUsar.find(c => c.id === transacao.categoria_id)
      
      setFormTransacao({
        descricao: transacao.descricao,
        categoria: transacao.tipo === 'transferencia' ? '13' : 
                  transacao.tipo === 'investimento' ? '12' : 
                  (categoria?.nome || ""),
        valor: Math.abs(transacao.valor).toString(), // Mostrar valor absoluto
        data: transacao.data_transacao,
        tipo: transacao.tipo,
        // IDs de referência (opcionais)
        conta_bancaria_id: transacao.conta_bancaria_id?.toString() || "",
        cartao_credito_id: transacao.cartao_credito_id?.toString() || "",
        tipo_pagamento_id: transacao.tipo_pagamento_id?.toString() || "",
        // Campos específicos para transferência
        conta_origem_id: "",
        conta_destino_id: ""
      })
    } else {
      setTransacaoEditando(null)
      
      // Configurar categoria baseada no tipo pré-selecionado
      let categoriaInicial = ""
      if (tipoPreSelecionado === 'transferencia') {
        categoriaInicial = '13'
      } else if (tipoPreSelecionado === 'investimento') {
        categoriaInicial = '12'
      }
      
      setFormTransacao({
        descricao: "",
        categoria: categoriaInicial,
        valor: "",
        data: new Date().toISOString().split('T')[0],
        tipo: tipoPreSelecionado || "entrada",
        // IDs de referência (opcionais)
        conta_bancaria_id: "",
        cartao_credito_id: "",
        tipo_pagamento_id: "",
        // Campos específicos para transferência
        conta_origem_id: "",
        conta_destino_id: ""
      })
    }
    setModalTransacaoAberto(true)
  }

  const fecharModalTransacao = () => {
    setModalTransacaoAberto(false)
    setTransacaoEditando(null)
    setError("") // Limpar erros
    setFormTransacao({
      descricao: "",
      categoria: "",
      valor: "",
      data: "",
      tipo: "entrada",
      // IDs de referência (opcionais)
      conta_bancaria_id: "",
      cartao_credito_id: "",
      tipo_pagamento_id: "",
      // Campos específicos para transferência
      conta_origem_id: "",
      conta_destino_id: ""
    })
  }

  const handleInputTransacaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormTransacao(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectTransacaoChange = (name: string, value: string) => {
    setFormTransacao(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmitTransacao = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let valor = parseFloat(formTransacao.valor)
      
      // Ajustar sinal do valor baseado no tipo
      if (formTransacao.tipo === 'despesa' || formTransacao.tipo === 'investimento') {
        valor = Math.abs(valor) * -1 // Garantir que seja negativo
      } else if (formTransacao.tipo === 'entrada' || formTransacao.tipo === 'transferencia') {
        valor = Math.abs(valor) // Garantir que seja positivo
      }

      // Encontrar categoria_id baseado no tipo de transação
      let categoria_id: number
      
      if (formTransacao.tipo === 'transferencia') {
        // Para transferências, usar categoria fixa ID 13
        categoria_id = 13
      } else if (formTransacao.tipo === 'investimento') {
        // Para investimentos, usar categoria fixa ID 12
        categoria_id = 12
      } else {
        // Para outros tipos, buscar categoria baseada no nome selecionado
        const categoriasFiltradas = getCategoriasPorTipo(formTransacao.tipo)
        const categoria = categoriasFiltradas.find(c => c.nome === formTransacao.categoria)
        
        if (!categoria) {
          setError('Categoria não encontrada')
          return
        }
        categoria_id = categoria.id
      }

      const transacaoData = {
        usuario_id: parseInt(user?.id || '0'),
        categoria_id: categoria_id,
        tipo: formTransacao.tipo,
        descricao: formTransacao.descricao,
        valor: valor,
        data_transacao: formTransacao.data,
        // IDs de referência (opcionais) - tratar string vazia como undefined
        conta_bancaria_id: formTransacao.conta_bancaria_id ? parseInt(formTransacao.conta_bancaria_id) : undefined,
        cartao_credito_id: formTransacao.cartao_credito_id ? parseInt(formTransacao.cartao_credito_id) : undefined,
        tipo_pagamento_id: formTransacao.tipo_pagamento_id ? parseInt(formTransacao.tipo_pagamento_id) : undefined
      }

      if (transacaoEditando) {
        await updateTransacao(transacaoEditando.id, transacaoData)
      } else {
        await addTransacao(transacaoData)
      }

      fecharModalTransacao()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar transação')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTransacao = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await deleteTransacao(id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir transação')
      }
    }
  }

  // Funções para gerenciar metas
  const resetFormMeta = () => {
    setFormMeta({
      titulo: "",
      descricao: "",
      valor_meta: "",
      valor_atual: "",
      categoria: "",
      prazo: "",
      status: "ativa"
    })
  }

  const abrirModalMeta = (meta?: Meta) => {
    if (meta) {
      setMetaEditando(meta)
      setFormMeta({
        titulo: meta.titulo,
        descricao: meta.descricao || "",
        valor_meta: meta.valor_meta.toString(),
        valor_atual: meta.valor_atual.toString(),
        categoria: meta.categoria,
        prazo: meta.prazo || "",
        status: meta.status
      })
    } else {
      setMetaEditando(null)
      resetFormMeta()
    }
    setModalMetaAberto(true)
  }

  const fecharModalMeta = () => {
    setModalMetaAberto(false)
    setMetaEditando(null)
    resetFormMeta()
  }

  const handleSubmitMeta = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const metaData = {
        titulo: formMeta.titulo,
        descricao: formMeta.descricao,
        valor_meta: parseFloat(formMeta.valor_meta),
        valor_atual: parseFloat(formMeta.valor_atual) || 0,
        categoria: formMeta.categoria,
        prazo: formMeta.prazo || undefined,
        status: formMeta.status
      }

      if (metaEditando) {
        await updateMeta(metaEditando.id, metaData)
      } else {
        await addMeta(metaData)
      }

      fecharModalMeta()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar meta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMeta = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      try {
        await deleteMeta(id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir meta')
      }
    }
  }

  const abrirModalUpdateValue = (meta: Meta) => {
    setMetaParaAtualizar(meta)
    setNovoValorMeta(meta.valor_atual.toString())
    setModalUpdateValueAberto(true)
  }

  const fecharModalUpdateValue = () => {
    setModalUpdateValueAberto(false)
    setMetaParaAtualizar(null)
    setNovoValorMeta("")
  }

  const handleUpdateValueMeta = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!metaParaAtualizar) return

      await updateValorAtual(metaParaAtualizar.id, parseFloat(novoValorMeta))
      fecharModalUpdateValue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar valor da meta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputMetaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormMeta(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectMetaChange = (name: string, value: string) => {
    setFormMeta(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Funções para contas a pagar
  const handleInputContaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormConta(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmitConta = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const valorTotal = parseFloat(formConta.valor_total)
      const qtdParcelas = parseInt(formConta.qtd_parcelas)
      
      // Validações básicas
      if (isNaN(valorTotal) || valorTotal <= 0) {
        throw new Error('Valor total deve ser um número válido maior que zero')
      }
      
      if (isNaN(qtdParcelas) || qtdParcelas <= 0) {
        throw new Error('Quantidade de parcelas deve ser um número válido maior que zero')
      }
      
      if (!formConta.descricao?.trim()) {
        throw new Error('Descrição é obrigatória')
      }
      
      if (!formConta.data_vencimento) {
        throw new Error('Data de vencimento é obrigatória')
      }
      
      // Calcular valor da parcela automaticamente
      const valorParcela = valorTotal / qtdParcelas

      const contaData = {
        descricao: formConta.descricao.trim(),
        valor_parcela: Number(valorParcela.toFixed(2)), // Será calculado automaticamente no backend também
        qtd_parcelas: qtdParcelas,
        valor_total: valorTotal,
        data_vencimento: formConta.data_vencimento,
        conta_bancaria_id: formConta.conta_bancaria_id && formConta.conta_bancaria_id !== '' ? parseInt(formConta.conta_bancaria_id) : null,
        quitado: formConta.quitado || false,
        parcela_atual: 1
      }

      if (contaEditando) {
        // Enviar apenas os campos específicos para update
        const dadosParaUpdate = {
          descricao: contaData.descricao,
          qtd_parcelas: contaData.qtd_parcelas,
          valor_total: contaData.valor_total,
          data_vencimento: contaData.data_vencimento,
          conta_bancaria_id: contaData.conta_bancaria_id,
          quitado: contaData.quitado,
          parcela_atual: contaData.parcela_atual
        }
        
        if (!contaEditando.id) {
          throw new Error('ID da conta não encontrado para atualização')
        }
        
        await updateContaAPagar(contaEditando.id, dadosParaUpdate)
        setSuccess('Conta atualizada com sucesso!')
      } else {
        await addContaAPagar(contaData)
        setSuccess('Conta adicionada com sucesso!')
      }

      fecharModalConta()
      refetchContasAPagar()
    } catch (error) {
      let errorMessage = 'Erro ao salvar conta. Tente novamente.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        if ('message' in error) {
          errorMessage = (error as any).message
        } else if ('error' in error) {
          errorMessage = (error as any).error
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const abrirModalConta = (conta?: any) => {
    if (conta) {
      setContaEditando(conta)
      setFormConta({
        descricao: conta.descricao || '',
        valor_total: conta.valor_total?.toString() || '',
        qtd_parcelas: conta.qtd_parcelas?.toString() || '',
        data_vencimento: conta.data_vencimento || '',
        conta_bancaria_id: conta.conta_bancaria_id?.toString() || '',
        quitado: conta.quitado || false
      })
    } else {
      setContaEditando(null)
      setFormConta({
        descricao: "",
        valor_total: "",
        qtd_parcelas: "",
        data_vencimento: "",
        conta_bancaria_id: "",
        quitado: false
      })
    }
    setModalContaAberto(true)
  }

  const fecharModalConta = () => {
    setModalContaAberto(false)
    setContaEditando(null)
    setError('')
    setSuccess('')
    setFormConta({
      descricao: "",
      valor_total: "",
      qtd_parcelas: "",
      data_vencimento: "",
      conta_bancaria_id: "",
      quitado: false
    })
  }

  const handleDeleteConta = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await deleteContaAPagar(id)
        setSuccess('Conta excluída com sucesso!')
        refetchContasAPagar()
      } catch (error) {
        setError('Erro ao excluir conta. Tente novamente.')
      }
    }
  }

  // Usar dados diretos do banco de dados Supabase com fallbacks
  const transacoesExibir = transacoes || []
  const investimentosExibir = investimentos || []
  const metasExibir = metas || []

  // Aplicar filtro de período às transações
  const transacoesFiltradaPorPeriodo = filtrarTransacoesPorPeriodo(transacoesExibir)

  // Filtrar transações baseado no filtro selecionado (tipo + período)
  const transacoesFiltradas = transacoesFiltradaPorPeriodo.filter((transacao: Transacao) => {
    if (filtroTransacao === "todas") return true
    return transacao.tipo === filtroTransacao
  })

  // Calcular totais para os cards (usando transações do período selecionado)
  const totalEntradas = (transacoesFiltradaPorPeriodo || [])
    .filter((t: Transacao) => t.tipo === "entrada")
    .reduce((sum: number, t: Transacao) => sum + (t.valor || 0), 0)
  
  const totalDespesas = Math.abs((transacoesFiltradaPorPeriodo || [])
    .filter((t: Transacao) => t.tipo === "despesa")
    .reduce((sum: number, t: Transacao) => sum + (t.valor || 0), 0))
  
  const totalInvestimentosTransacoes = Math.abs((transacoesFiltradaPorPeriodo || [])
    .filter((t: Transacao) => t.tipo === "investimento")
    .reduce((sum: number, t: Transacao) => sum + (t.valor || 0), 0))
  
  // Total de investimentos reais (da tabela investimentos)
  const totalInvestimentosReais = (investimentos || [])
    .reduce((sum: number, inv: Investimento) => sum + (inv.valor_investimento || 0), 0)
  
  // Usar investimentos reais se existirem, senão usar das transações do período
  const totalInvestimentos = totalInvestimentosReais > 0 ? totalInvestimentosReais : totalInvestimentosTransacoes
  
  const saldoAtual = totalEntradas - totalDespesas - totalInvestimentosTransacoes

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const calcularProgresso = (atual: number, meta: number) => {
    return Math.min((atual / meta) * 100, 100)
  }

  // Loading inicial ou de dados
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Simplificar loading - apenas verificar os hooks principais
  if ((transacoesLoading || contasLoading) && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando dados...</p>
        </div>
      </div>
    )
  }

  // Modal de Login
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full">
                <img src="/logo1.png" alt="Logo" className="h-25 w-20" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              Dashboard financeiro
            </CardTitle>
            <CardDescription className="text-center">
              Entre com seu email, usuário ou telefone para acessar o dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email, Usuário ou Telefone</Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="email@exemplo.com, usuario ou (11) 99999-9999"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    name="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dashboard Principal
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header com logout e botões extras */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-800/95 dark:supports-[backdrop-filter]:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Bem-vindo,</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{nomeUsuario || user?.email}</span>
          </div>
          
          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-2">
             {/* Botão WhatsApp */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppRedirect}
              className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:border-green-700 dark:text-green-300"
              aria-label="Falar com o Fin via WhatsApp"
            >
              <img src="/whatsapp.png" alt="WhatsApp" className="h-4 w-4" />
              <span>Fale com o Fin</span>
            </Button>
            {/* Botão de Configuração */}
            <Link href="/dashboard/configuracoes">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
                aria-label="Abrir configurações"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </Link>
            
            {/* Toggle de tema */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center space-x-2"
              aria-label={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
            >
              {theme === 'dark' ? (
                <SunIcon className="h-4 w-4" />
              ) : (
                <MoonIcon className="h-4 w-4" />
              )}
              <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
            </Button>
            
            {/* Botão de logout */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
              aria-label="Fazer logout da aplicação"
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Botão WhatsApp - Visível em mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppRedirect}
              className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:border-green-700 dark:text-green-300"
              aria-label="Falar com o Fin via WhatsApp"
            >
              <img src="/whatsapp.png" alt="WhatsApp" className="h-4 w-4" />
              <span className="hidden xs:inline">Fin</span>
            </Button>
            
            <Sheet 
              open={mobileMenuOpen} 
              onOpenChange={setMobileMenuOpen}
              modal={true}
            >
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Abrir menu">
                  <MenuIcon className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[280px] sm:w-[320px] md:w-[360px] lg:w-[400px]"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                aria-describedby={undefined}
              >
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Botão de Configuração */}
                  <Link href="/dashboard/configuracoes" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full justify-start flex items-center space-x-2"
                    >
                      <SettingsIcon className="h-4 w-4" />
                      <span>Configurações</span>
                    </Button>
                  </Link>
                  
                  {/* Toggle de tema */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      toggleTheme()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full justify-start flex items-center space-x-2"
                  >
                    {theme === 'dark' ? (
                      <SunIcon className="h-4 w-4" />
                    ) : (
                      <MoonIcon className="h-4 w-4" />
                    )}
                    <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
                  </Button>
                  
                  {/* Botão de logout */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full justify-start flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    <LogOutIcon className="h-4 w-4" />
                    <span>Sair</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard Financeiro</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Visão geral das suas finanças pessoais - {getNomePeriodo()}
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                <SelectTrigger className="w-[180px]">
                  <CalendarIcon className="w-4 h-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes-atual">Este mês</SelectItem>
                  <SelectItem value="mes-anterior">Mês anterior</SelectItem>
                  <SelectItem value="trimestre">Último trimestre</SelectItem>
                  <SelectItem value="ano">Este ano</SelectItem>
                  <SelectItem value="futuras">Contas futuras</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cards de Resumo Financeiro - Organizados por Importância */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Saldo Atual - Card Principal */}
            <Card 
              className="md:col-span-2 lg:col-span-1 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
              onClick={() => abrirSidebar('saldo-atual')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Saldo Atual</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Balanço geral</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                  <WalletIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold mb-2 ${saldoAtual >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatarMoeda(saldoAtual)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                    Entradas: {formatarMoeda(totalEntradas)}
                  </span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                    Saídas: {formatarMoeda(totalDespesas + totalInvestimentosTransacoes)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Entradas */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Entradas</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(transacoes || []).filter(t => t.tipo === 'entrada').length} transações
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      abrirModalTransacao(undefined, 'entrada')
                    }}
                    className="h-7 w-7 p-0 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <PlusIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </Button>
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                    <ArrowUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent onClick={() => abrirSidebar('entradas')}>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {formatarMoeda(totalEntradas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receitas no período
                </p>
              </CardContent>
            </Card>

            {/* Despesas */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Despesas</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(transacoes || []).filter(t => t.tipo === 'despesa').length} transações
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      abrirModalTransacao(undefined, 'despesa')
                    }}
                    className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <PlusIcon className="h-3 w-3 text-red-600 dark:text-red-400" />
                  </Button>
                  <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded-lg">
                    <ArrowDownIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent onClick={() => abrirSidebar('despesas')}>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                  {formatarMoeda(totalDespesas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gastos no período
                </p>
              </CardContent>
            </Card>

            {/* Investimentos */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Investimentos</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {investimentos.length > 0 
                      ? `${investimentos.length} aplicações` 
                      : `${(transacoes || []).filter(t => t.tipo === 'investimento').length} transações`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      abrirModalTransacao(undefined, 'investimento')
                    }}
                    className="h-7 w-7 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <PlusIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  </Button>
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
                    <TrendingUpIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent onClick={() => abrirSidebar('investimentos')}>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {formatarMoeda(totalInvestimentos)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Capital investido
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cards Secundários - Estatísticas e Controles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Transações */}
            <Card className="cursor-pointer hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      abrirModalTransacao()
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </Button>
                  <FileTextIcon className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent onClick={() => abrirSidebar('transacoes')}>
                <div className="text-2xl font-bold text-blue-600">
                  {(transacoes || []).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Movimentações
                </p>
              </CardContent>
            </Card>

            {/* Contas a Pagar */}
            <Card className="cursor-pointer hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      setModalContaAberto(true)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </Button>
                  <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent onClick={() => abrirSidebar('contas-a-pagar')}>
                <div className="text-2xl font-bold text-orange-600">
                  {formatarMoeda(filtrarContasPorPeriodo(contasAPagar || []).filter(c => !c.quitado).reduce((total, conta) => {
                    const parcelasRestantes = conta.qtd_parcelas - conta.parcela_atual + 1
                    return total + (conta.valor_parcela * parcelasRestantes)
                  }, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filtrarContasPorPeriodo(contasAPagar || []).filter(c => !c.quitado).length} pendentes
                </p>
              </CardContent>
            </Card>

            {/* Contas Vencidas */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => abrirSidebar('contas-vencidas')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
                <AlertTriangleIcon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {filtrarContasPorPeriodo(contasAPagar || []).filter(c => {
                    const hoje = new Date()
                    const vencimento = new Date(c.data_vencimento)
                    return !c.quitado && vencimento < hoje
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Em atraso
                </p>
              </CardContent>
            </Card>

            {/* Próximos Vencimentos */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => abrirSidebar('proximos-vencimentos')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximos 7 dias</CardTitle>
                <CalendarIcon className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {(() => {
                    const hoje = new Date()
                    const proximos7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)
                    const contasProximas = filtrarContasPorPeriodo(contasAPagar || []).filter(c => {
                      const vencimento = new Date(c.data_vencimento)
                      return vencimento >= hoje && vencimento <= proximos7Dias && !c.quitado
                    })
                    return contasProximas.length
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  A vencer
                </p>
              </CardContent>
            </Card>

            {/* Contas Quitadas */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => abrirSidebar('contas-quitadas')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quitadas</CardTitle>
                <CreditCardIcon className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(contasAPagar || []).filter(c => c.quitado).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pagas
                </p>
              </CardContent>
            </Card>

            {/* Metas */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => abrirSidebar('metas')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metas</CardTitle>
                <Target className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {(metas || []).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Objetivos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transações Recentes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Transações - {getNomePeriodo()}</CardTitle>
                  <CardDescription>
                    Movimentações financeiras do período selecionado
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => abrirModalTransacao()}
                    className="flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Adicionar</span>
                  </Button>
                  <Select value={filtroTransacao} onValueChange={setFiltroTransacao}>
                    <SelectTrigger className="w-[140px]">
                      <FilterIcon className="w-4 h-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="despesa">Saídas</SelectItem>
                      <SelectItem value="investimento">Investimentos</SelectItem>
                    </SelectContent>
                  </Select>
                  {filtroTransacao !== "todas" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFiltroTransacao("todas")}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Nenhuma transação encontrada. Adicione transações para visualizá-las aqui.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transacoesFiltradas.map((transacao: Transacao) => (
                      <TableRow key={transacao.id}>
                        <TableCell className="font-medium">
                          {transacao.descricao}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            transacao.tipo === "entrada" ? "default" :
                            transacao.tipo === "despesa" ? "destructive" :
                            "secondary"
                          }>
                            {categoriasParaUsar.find(c => c.id === transacao.categoria_id)?.nome || 'Categoria não encontrada'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(transacao.data_transacao).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          transacao.valor > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatarMoeda(transacao.valor)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalTransacao(transacao)}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTransacao(transacao.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carteira de Investimentos */}
            <Card>
              <CardHeader>
                <CardTitle>Carteira de Investimentos</CardTitle>
                <CardDescription>
                  Visão detalhada dos seus investimentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transacoesFiltradaPorPeriodo.filter(t => t.tipo === 'investimento').length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>Nenhum investimento encontrado no período selecionado.</p>
                      <p className="text-sm">Adicione investimentos para visualizá-los aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Resumo Total */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">Total Investido</h3>
                            <p className="text-sm text-muted-foreground">No período: {getNomePeriodo()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {formatarMoeda(totalInvestimentos)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transacoesFiltradaPorPeriodo.filter(t => t.tipo === 'investimento').length} investimentos
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Investimentos */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          Investimentos Recentes
                        </h4>
                        {transacoesFiltradaPorPeriodo
                          .filter(t => t.tipo === 'investimento')
                          .slice(0, 5)
                          .map((investimento) => (
                            <div key={investimento.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              <div className="flex-1">
                                <p className="font-medium">{investimento.descricao}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(investimento.data_transacao).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600 dark:text-green-400">
                                  {formatarMoeda(investimento.valor)}
                                </p>
                              </div>
                            </div>
                          ))
                        }
                        
                        {transacoesFiltradaPorPeriodo.filter(t => t.tipo === 'investimento').length > 5 && (
                          <div className="text-center pt-2">
                            <p className="text-sm text-muted-foreground">
                              +{transacoesFiltradaPorPeriodo.filter(t => t.tipo === 'investimento').length - 5} investimentos adicionais
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metas Financeiras */}
            <Card>
              <CardHeader>
                <CardTitle>Metas Financeiras</CardTitle>
                <CardDescription>
                  Progresso das suas metas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metasExibir.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>Nenhuma meta financeira encontrada.</p>
                      <p className="text-sm">Adicione metas ao seu banco de dados para visualizá-las aqui.</p>
                    </div>
                  ) : (
                    metasExibir.map((meta: Meta) => {
                      const progresso = calcularProgresso(
                        meta.valor_atual, 
                        meta.valor_meta
                      )
                      return (
                        <div key={meta.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{meta.titulo}</p>
                              <p className="text-sm text-muted-foreground">{meta.categoria}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatarMoeda(meta.valor_atual)}</p>
                              <p className="text-xs text-muted-foreground">
                                de {formatarMoeda(meta.valor_meta)}
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progresso}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{progresso.toFixed(1)}% concluído</span>
                            <span>Prazo: {meta.prazo ? new Date(meta.prazo).toLocaleDateString('pt-BR') : 'Não definido'}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Seção de Gráficos - Análise de Despesas */}
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Análise de Despesas</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Visualização detalhada das suas despesas - {getNomePeriodo()}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza - Despesas por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>
                  Distribuição percentual das suas despesas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {(() => {
                    const despesas = transacoesFiltradaPorPeriodo.filter(t => t.tipo === 'despesa')
                    if (despesas.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                          <div className="text-center">
                            <p className="text-lg font-medium">Nenhuma despesa encontrada</p>
                            <p className="text-sm">No período: {getNomePeriodo()}</p>
                          </div>
                        </div>
                      )
                    }
                    
                    const despesasPorCategoria = despesas.reduce((acc, transacao) => {
                      const categoria = categorias.find(c => c.id === transacao.categoria_id)
                      const nomeCategoria = categoria?.nome || 'Sem categoria'
                      acc[nomeCategoria] = (acc[nomeCategoria] || 0) + transacao.valor
                      return acc
                    }, {} as Record<string, number>)
                    
                    const cores = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#84CC16']
                    const dados = Object.entries(despesasPorCategoria)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                    
                    const total = dados.reduce((sum, [,valor]) => sum + valor, 0)
                    
                    // Função para criar os arcos do gráfico de pizza
                    const criarArcosPizza = (dados: [string, number][], total: number) => {
                      let anguloAcumulado = 0
                      return dados.map(([categoria, valor], index) => {
                        const percentual = valor / total
                        const angulo = percentual * 360
                        const anguloInicial = anguloAcumulado
                        const anguloFinal = anguloAcumulado + angulo
                        anguloAcumulado += angulo
                        
                        // Converter ângulos para radianos
                        const inicialRad = (anguloInicial * Math.PI) / 180
                        const finalRad = (anguloFinal * Math.PI) / 180
                        
                        // Calcular pontos do arco
                        const raio = 80
                        const centroX = 100
                        const centroY = 100
                        
                        const x1 = centroX + raio * Math.cos(inicialRad)
                        const y1 = centroY + raio * Math.sin(inicialRad)
                        const x2 = centroX + raio * Math.cos(finalRad)
                        const y2 = centroY + raio * Math.sin(finalRad)
                        
                        const arcoGrande = angulo > 180 ? 1 : 0
                        
                        const path = [
                          `M ${centroX} ${centroY}`,
                          `L ${x1} ${y1}`,
                          `A ${raio} ${raio} 0 ${arcoGrande} 1 ${x2} ${y2}`,
                          'Z'
                        ].join(' ')
                        
                        return {
                          path,
                          cor: cores[index],
                          categoria,
                          valor,
                          percentual: (percentual * 100).toFixed(1)
                        }
                      })
                    }
                    
                    const arcos = criarArcosPizza(dados, total)
                    
                    return (
                      <div className="h-full flex flex-col">
                        {/* Resumo total */}
                        <div className="text-center mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-muted-foreground">Total em Despesas</p>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {formatarMoeda(total)}
                          </p>
                        </div>
                        
                        <div className="flex-1 flex gap-6">
                          {/* Gráfico de Pizza SVG */}
                          <div className="flex-shrink-0">
                            <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-sm">
                              {arcos.map((arco, index) => (
                                <g key={arco.categoria}>
                                  <path
                                    d={arco.path}
                                    fill={arco.cor}
                                    stroke="white"
                                    strokeWidth="2"
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                    style={{ 
                                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                    }}
                                  />
                                </g>
                              ))}
                              {/* Círculo central para dar efeito de donut */}
                              <circle
                                cx="100"
                                cy="100"
                                r="25"
                                fill="white"
                                className="dark:fill-gray-800"
                              />
                              <text
                                x="100"
                                y="95"
                                textAnchor="middle"
                                className="text-xs font-medium fill-gray-600 dark:fill-gray-300"
                              >
                                Despesas
                              </text>
                              <text
                                x="100"
                                y="110"
                                textAnchor="middle"
                                className="text-xs font-bold fill-gray-800 dark:fill-gray-200"
                              >
                                {dados.length}
                              </text>
                            </svg>
                          </div>
                          
                          {/* Legenda */}
                          <div className="flex-1 space-y-2 max-h-64 overflow-y-auto">
                            {arcos.map((arco, index) => (
                              <div key={arco.categoria} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div 
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: arco.cor }}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm truncate">{arco.categoria}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {arco.percentual}% do total
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-bold text-sm">{formatarMoeda(arco.valor)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Coluna - Despesas Recorrentes */}
            <Card>
              <CardHeader>
                <CardTitle>Despesas Recorrentes</CardTitle>
                <CardDescription>
                  Despesas que se repetem com maior frequência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {(() => {
                    const despesas = transacoesFiltradaPorPeriodo.filter(t => t.tipo === 'despesa')
                    if (despesas.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                          <div className="text-center">
                            <p className="text-lg font-medium">Nenhuma despesa encontrada</p>
                            <p className="text-sm">No período: {getNomePeriodo()}</p>
                          </div>
                        </div>
                      )
                    }
                    
                    // Contar frequência por descrição (despesas similares)
                    const despesasRecorrentes = despesas.reduce((acc, transacao) => {
                      const chave = transacao.descricao.toLowerCase().trim()
                      if (!acc[chave]) {
                        acc[chave] = { 
                          descricao: transacao.descricao, 
                          count: 0, 
                          valorTotal: 0,
                          categoria: categorias.find(c => c.id === transacao.categoria_id)?.nome || 'Sem categoria'
                        }
                      }
                      acc[chave].count++
                      acc[chave].valorTotal += transacao.valor
                      return acc
                    }, {} as Record<string, { descricao: string, count: number, valorTotal: number, categoria: string }>)
                    
                    // Filtrar apenas recorrentes (aparecem mais de 1 vez) e ordenar
                    const recorrentes = Object.values(despesasRecorrentes)
                      .filter(item => item.count > 1)
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 6)
                    
                    if (recorrentes.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                          <div className="text-center">
                            <p className="text-lg font-medium">Nenhuma despesa recorrente</p>
                            <p className="text-sm">Despesas que aparecem apenas uma vez no período</p>
                          </div>
                        </div>
                      )
                    }
                    
                    const maxCount = recorrentes[0]?.count || 1
                    
                    return (
                      <div className="h-full flex flex-col">
                        {/* Título da análise */}
                        <div className="text-center mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <p className="text-sm text-muted-foreground">Despesas que mais se repetem</p>
                          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {recorrentes.length} despesas recorrentes
                          </p>
                        </div>
                        
                        {/* Gráfico de barras */}
                        <div className="space-y-3 flex-1">
                          {recorrentes.map((item, index) => {
                            const altura = Math.max((item.count / maxCount) * 100, 15)
                            const valorMedio = item.valorTotal / item.count
                            
                            return (
                              <div key={item.descricao} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate" title={item.descricao}>
                                      {item.descricao}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.categoria}
                                    </p>
                                  </div>
                                  <div className="text-right ml-2">
                                    <p className="font-bold text-sm">{item.count}x</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatarMoeda(valorMedio)}/vez
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-end gap-2">
                                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                                    <div 
                                      className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                      style={{ width: `${altura}%` }}
                                    >
                                      <span className="text-white text-xs font-medium">
                                        {item.count}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground min-w-fit">
                                    Total: {formatarMoeda(item.valorTotal)}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Transação */}
      <Dialog 
        open={modalTransacaoAberto} 
        onOpenChange={setModalTransacaoAberto}
        modal={true}
      >
        <DialogContent 
          className="!fixed !inset-0 !left-0 !top-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !translate-x-0 !translate-y-0 !rounded-none !border-0 overflow-y-auto z-50"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>
              {transacaoEditando ? 'Editar Transação' : 'Nova Transação'}
            </DialogTitle>
            <DialogDescription>
              {transacaoEditando 
                ? 'Edite os dados da transação abaixo.'
                : 'Preencha os dados para adicionar uma nova transação.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitTransacao} className="space-y-4 pb-4">
            {/* TIPO - Primeiro campo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo da Transação</Label>
              <Select
                value={formTransacao.tipo}
                onValueChange={(value) => {
                  handleSelectTransacaoChange('tipo', value)
                  
                  if (value === 'transferencia') {
                    // Para transferências, definir categoria automaticamente (ID 13)
                    setFormTransacao(prev => ({ 
                      ...prev, 
                      categoria: '13', // ID 13 para transferências
                      tipo: value as any 
                    }))
                  } else if (value === 'investimento') {
                    // Para investimentos, definir categoria automaticamente (ID 12)
                    setFormTransacao(prev => ({ 
                      ...prev, 
                      categoria: '12', // ID 12 para investimentos
                      tipo: value as any 
                    }))
                  } else {
                    // Para outros tipos, limpar categoria para seleção manual
                    setFormTransacao(prev => ({ 
                      ...prev, 
                      categoria: '', 
                      tipo: value as any 
                    }))
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">💰 Entrada</SelectItem>
                  <SelectItem value="despesa">💸 Despesa</SelectItem>
                  <SelectItem value="transferencia">🔄 Transferência</SelectItem>
                  <SelectItem value="investimento">📈 Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                name="descricao"
                value={formTransacao.descricao}
                onChange={handleInputTransacaoChange}
                placeholder="Ex: Supermercado, Salário..."
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              {formTransacao.tipo === 'transferencia' ? (
                // Para transferências, categoria é automática (ID 13)
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Transferência 
                      </span>
                    </div>
                  </div>
                </div>
              ) : formTransacao.tipo === 'investimento' ? (
                // Para investimentos, categoria é automática (ID 12)
                <div className="space-y-2">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Investimento
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Para outros tipos, seleção manual
                <Select
                  value={formTransacao.categoria}
                  onValueChange={(value) => setFormTransacao(prev => ({ ...prev, categoria: value }))}
                  disabled={isLoading || !formTransacao.tipo}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formTransacao.tipo 
                        ? "Primeiro selecione o tipo" 
                        : "Selecione uma categoria"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {!formTransacao.tipo ? (
                      <SelectItem value="disabled" disabled>
                        Selecione o tipo primeiro
                      </SelectItem>
                    ) : getCategoriasPorTipo(formTransacao.tipo).length === 0 ? (
                      <SelectItem value="sem-categoria" disabled>
                        Nenhuma categoria disponível para este tipo
                      </SelectItem>
                    ) : (
                      getCategoriasPorTipo(formTransacao.tipo).map(categoria => (
                        <SelectItem key={categoria.id} value={categoria.nome}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: categoria.cor_padrao }}
                            ></div>
                            {categoria.nome}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {formTransacao.tipo && formTransacao.tipo !== 'transferencia' && formTransacao.tipo !== 'investimento' && (
                <p className="text-sm text-muted-foreground">
                </p>
              )}
            </div>

            {/* Campos de referência dinâmicos baseados no tipo de transação */}
            <div className="space-y-4">

              {/* Transferência - Exibir apenas se o TIPO DE TRANSAÇÃO for transferência */}
              {formTransacao.tipo === 'transferencia' ? (
                <div className="space-y-4">
                  {/* Conta de Origem */}
                  <div className="space-y-2">
                    <Label htmlFor="conta_origem_id">Conta de Origem</Label>
                    <Select
                      value={formTransacao.conta_origem_id}
                      onValueChange={(value) => setFormTransacao(prev => ({ ...prev, conta_origem_id: value }))}
                      disabled={isLoading || contasBancariasLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          contasBancariasLoading 
                            ? "Carregando..." 
                            : contasBancarias.length === 0
                              ? "Nenhuma conta cadastrada"
                              : "Selecione a conta de origem"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {contasBancarias
                          .filter(conta => conta.id.toString() !== formTransacao.conta_destino_id)
                          .map(conta => {
                            const saldoAtual = calcularSaldoAtual(conta.id, conta.saldo_inicial || 0, transacoes)
                            return (
                              <SelectItem key={conta.id} value={conta.id.toString()}>
                                <div className="grid grid-cols-[1fr,auto] gap-3 items-center w-full min-w-0">
                                  <div className="truncate">
                                    <span className="font-medium text-sm">{conta.nome_conta}</span>
                                  </div>
                                  <div className="flex flex-col items-end text-right">
                                    <span className="text-xs text-muted-foreground leading-tight">
                                      {conta.tipo_conta.charAt(0).toUpperCase() + conta.tipo_conta.slice(1)}
                                    </span>
                                    <span className={`text-xs font-medium leading-tight ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatarMoeda(saldoAtual)}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conta de Destino */}
                  <div className="space-y-2">
                    <Label htmlFor="conta_destino_id">Conta de Destino</Label>
                    <Select
                      value={formTransacao.conta_destino_id}
                      onValueChange={(value) => setFormTransacao(prev => ({ ...prev, conta_destino_id: value }))}
                      disabled={isLoading || contasBancariasLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          contasBancariasLoading 
                            ? "Carregando..." 
                            : contasBancarias.length === 0
                              ? "Nenhuma conta cadastrada"
                              : "Selecione a conta de destino"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {contasBancarias
                          .filter(conta => conta.id.toString() !== formTransacao.conta_origem_id)
                          .map(conta => {
                            const saldoAtual = calcularSaldoAtual(conta.id, conta.saldo_inicial || 0, transacoes)
                            return (
                              <SelectItem key={conta.id} value={conta.id.toString()}>
                                <div className="grid grid-cols-[1fr,auto] gap-3 items-center w-full min-w-0">
                                  <div className="truncate">
                                    <span className="font-medium text-sm">{conta.nome_conta}</span>
                                  </div>
                                  <div className="flex flex-col items-end text-right">
                                    <span className="text-xs text-muted-foreground leading-tight">
                                      {conta.tipo_conta.charAt(0).toUpperCase() + conta.tipo_conta.slice(1)}
                                    </span>
                                    <span className={`text-xs font-medium leading-tight ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatarMoeda(saldoAtual)}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                // Para todos os outros tipos de transação (entrada, saida, investimento)
                <div className="space-y-4">
                  
                  {/* Tipo de Pagamento */}
                  <div className="space-y-2">
                    <Label htmlFor="tipo_pagamento_id">Tipo de Pagamento</Label>
                    <Select
                      value={formTransacao.tipo_pagamento_id}
                      onValueChange={(value) => {
                        // Verificar tipos de pagamento selecionados
                        const tipoPagamentoSelecionado = tiposPagamentoParaUsar.find(
                          tipo => tipo.id.toString() === value
                        )
                        const isCartaoCredito = tipoPagamentoSelecionado?.nome === 'Cartão de Crédito'
                        
                        setFormTransacao(prev => ({ 
                          ...prev, 
                          tipo_pagamento_id: value,
                          // Limpar cartão de crédito se não for cartão de crédito
                          cartao_credito_id: isCartaoCredito ? prev.cartao_credito_id : ""
                        }))
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposPagamentoParaUsar.map(tipo => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{tipo.nome}</span>
                              {tipo.descricao && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  {tipo.descricao}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {tiposPagamentoError && (
                      <p className="text-sm text-red-500">Erro: {tiposPagamentoError}</p>
                    )}
                  </div>

                  {/* Conta Bancária - Para todos os tipos exceto transferência */}
                  <div className="space-y-2">
                    <Label htmlFor="conta_bancaria_id">Conta Bancária</Label>
                    <Select
                      value={formTransacao.conta_bancaria_id}  
                      onValueChange={(value) => setFormTransacao(prev => ({ ...prev, conta_bancaria_id: value }))}
                      disabled={isLoading || contasBancariasLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          contasBancariasLoading 
                            ? "Carregando..." 
                            : contasBancarias.length === 0
                              ? "Nenhuma conta cadastrada"
                              : "Selecione a conta bancária"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {contasBancarias.map(conta => {
                          const saldoAtual = calcularSaldoAtual(conta.id, conta.saldo_inicial || 0, transacoes)
                          return (
                            <SelectItem key={conta.id} value={conta.id.toString()}>
                              <div className="grid grid-cols-[1fr,auto] gap-3 items-center w-full min-w-0">
                                <div className="truncate">
                                  <span className="font-medium text-sm">{conta.nome_conta}</span>
                                </div>
                                <div className="flex flex-col items-end text-right">
                                  <span className="text-xs text-muted-foreground leading-tight">
                                    {conta.tipo_conta.charAt(0).toUpperCase() + conta.tipo_conta.slice(1)}
                                  </span>
                                  <span className={`text-xs font-medium leading-tight ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatarMoeda(saldoAtual)}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {contasBancariasError && (
                      <p className="text-sm text-red-500">Erro: {contasBancariasError}</p>
                    )}
                  </div>

                  {/* Cartão de Crédito - Exibir apenas se selecionado como forma de pagamento */}
                  {(() => {
                    // Verificar se o tipo de pagamento selecionado é "Cartão de Crédito"
                    const tipoPagamentoSelecionado = tiposPagamentoParaUsar.find(
                      tipo => tipo.id.toString() === formTransacao.tipo_pagamento_id
                    )
                    const isCartaoCredito = tipoPagamentoSelecionado?.nome === 'Cartão de Crédito'
                    
                    return isCartaoCredito ? (
                      <div className="space-y-2">
                        <Label htmlFor="cartao_credito_id">Cartão de Crédito</Label>
                        <Select
                          value={formTransacao.cartao_credito_id}
                          onValueChange={(value) => setFormTransacao(prev => ({ ...prev, cartao_credito_id: value }))}
                          disabled={isLoading || cartoesCreditoLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              cartoesCreditoLoading 
                                ? "Carregando..." 
                                : cartoesCredito.length === 0
                                  ? "Nenhum cartão cadastrado"
                                  : "Selecione o cartão de crédito"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {cartoesCredito.map(cartao => (
                              <SelectItem key={cartao.id} value={cartao.id.toString()}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">Cartão ****{cartao.final_cartao}</span>
                                  <div className="flex flex-col items-end">
                                    <span className="text-xs text-muted-foreground">
                                      Vencimento: {cartao.data_vencimento}
                                    </span>
                                    {cartao.limite && (
                                      <span className="text-xs text-green-600">
                                        Limite: {formatarMoeda(cartao.limite)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {cartoesCreditoError && (
                          <p className="text-sm text-red-500">Erro: {cartoesCreditoError}</p>
                        )}
                      </div>
                    ) : null
                  })()}

                </div>
              )}

            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  value={formTransacao.valor}
                  onChange={handleInputTransacaoChange}
                  placeholder="0,00"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  name="data"
                  type="date"
                  value={formTransacao.data}
                  onChange={handleInputTransacaoChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={fecharModalTransacao}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? 'Salvando...' 
                  : transacaoEditando 
                    ? 'Atualizar' 
                    : 'Adicionar'
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sidebar de Detalhes */}
      <Sheet 
        open={sidebarAberta} 
        onOpenChange={setSidebarAberta}
        modal={true}
      >
        <SheetContent 
          side="right" 
          className="!fixed !inset-0 !left-0 !top-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !translate-x-0 !translate-y-0 !rounded-none !border-0 overflow-y-auto z-50"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <SheetHeader>
            <SheetTitle>
              {tipoSidebarAtivo === 'saldo-atual' && 'Detalhes do Saldo Atual'}
              {tipoSidebarAtivo === 'entradas' && 'Detalhes das Entradas'}
              {tipoSidebarAtivo === 'despesas' && 'Detalhes das Despesas'}
              {tipoSidebarAtivo === 'investimentos' && 'Detalhes dos Investimentos'}
              {tipoSidebarAtivo === 'transacoes' && 'Todas as Transações'}
              {tipoSidebarAtivo === 'contas-a-pagar' && 'Contas a Pagar'}
              {tipoSidebarAtivo === 'contas-vencidas' && 'Contas Vencidas'}
              {tipoSidebarAtivo === 'proximos-vencimentos' && 'Próximos Vencimentos'}
              {tipoSidebarAtivo === 'contas-quitadas' && 'Contas Quitadas'}
              {tipoSidebarAtivo === 'metas' && 'Metas Financeiras'}
              {tipoSidebarAtivo === 'categorias' && 'Categorias'}
              {tipoSidebarAtivo === 'contas-bancarias' && 'Contas Bancárias'}
            </SheetTitle>
            <SheetDescription>
              {tipoSidebarAtivo === 'saldo-atual' && 'Visão detalhada do seu balanço financeiro atual'}
              {tipoSidebarAtivo === 'entradas' && 'Todas as suas receitas e ganhos registrados'}
              {tipoSidebarAtivo === 'despesas' && 'Todas as suas despesas e gastos registrados'}
              {tipoSidebarAtivo === 'investimentos' && 'Portfolio completo dos seus investimentos'}
              {tipoSidebarAtivo === 'transacoes' && 'Histórico completo de todas as movimentações'}
              {tipoSidebarAtivo === 'contas-a-pagar' && 'Gestão completa das suas contas pendentes'}
              {tipoSidebarAtivo === 'contas-vencidas' && 'Contas que já passaram do vencimento'}
              {tipoSidebarAtivo === 'proximos-vencimentos' && 'Contas que vencem nos próximos 7 dias'}
              {tipoSidebarAtivo === 'contas-quitadas' && 'Histórico de contas já pagas'}
              {tipoSidebarAtivo === 'metas' && 'Acompanhe o progresso dos seus objetivos financeiros'}
              {tipoSidebarAtivo === 'categorias' && 'Gestão das categorias de transações'}
              {tipoSidebarAtivo === 'contas-bancarias' && 'Gerenciamento das suas contas bancárias'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Conteúdo dinâmico baseado no tipo selecionado */}
            
            {/* Saldo Atual */}
            {tipoSidebarAtivo === 'saldo-atual' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-600">Total de Entradas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">{formatarMoeda(totalEntradas)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-600">Total de Despesas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600">{formatarMoeda(totalDespesas)}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo por Conta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {contasBancarias.map(conta => {
                        const saldoConta = calcularSaldoAtual(conta.id, conta.saldo_inicial || 0, transacoes)
                        return (
                          <div key={conta.id} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <p className="font-medium">{conta.nome_conta}</p>
                              <p className="text-sm text-muted-foreground">{conta.tipo_conta}</p>
                            </div>
                            <p className={`font-bold ${saldoConta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatarMoeda(saldoConta)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Entradas */}
            {tipoSidebarAtivo === 'entradas' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Receitas Registradas</h3>
                  <Button onClick={() => abrirModalTransacao(undefined, 'entrada')}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {transacoesFiltradaPorPeriodo
                    .filter(t => t.tipo === 'entrada')
                    .sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime())
                    .map(transacao => (
                      <Card key={transacao.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{transacao.descricao}</p>
                            <p className="text-sm text-muted-foreground">
                              {categoriasParaUsar.find(c => c.id === transacao.categoria_id)?.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transacao.data_transacao).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatarMoeda(transacao.valor)}</p>
                            <div className="flex gap-1 mt-2">
                              <Button size="sm" variant="outline" onClick={() => abrirModalTransacao(transacao)}>
                                <EditIcon className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteTransacao(transacao.id)}>
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Despesas */}
            {tipoSidebarAtivo === 'despesas' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Despesas Registradas</h3>
                  <Button onClick={() => abrirModalTransacao(undefined, 'despesa')}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {transacoesFiltradaPorPeriodo
                    .filter(t => t.tipo === 'despesa')
                    .sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime())
                    .map(transacao => (
                      <Card key={transacao.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{transacao.descricao}</p>
                            <p className="text-sm text-muted-foreground">
                              {categoriasParaUsar.find(c => c.id === transacao.categoria_id)?.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transacao.data_transacao).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{formatarMoeda(Math.abs(transacao.valor))}</p>
                            <div className="flex gap-1 mt-2">
                              <Button size="sm" variant="outline" onClick={() => abrirModalTransacao(transacao)}>
                                <EditIcon className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteTransacao(transacao.id)}>
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Investimentos */}
            {tipoSidebarAtivo === 'investimentos' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Portfolio de Investimentos</h3>
                
                {investimentos.length > 0 ? (
                  <div className="space-y-3">
                    {investimentos.map((investimento, index) => (
                      <Card key={`${investimento.usuario_id}-${index}`} className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{investimento.nome_investimento}</p>
                              <p className="text-sm text-muted-foreground">{investimento.tipo}</p>
                            </div>
                            <p className="font-bold text-purple-600">
                              {formatarMoeda(investimento.valor_investimento)}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Rendimento</p>
                              <p className="font-medium text-green-600">{investimento.rendimento}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Data Aplicação</p>
                              <p className="font-medium">
                                {new Date(investimento.data_aplicacao).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Nenhum investimento encontrado</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Adicione investimentos ao banco de dados para visualizá-los aqui
                    </p>
                  </Card>
                )}
              </div>
            )}

            {/* Metas */}
            {tipoSidebarAtivo === 'metas' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Metas Financeiras</h3>
                  <Button 
                    onClick={() => abrirModalMeta()}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Nova Meta
                  </Button>
                </div>

                {/* Estatísticas das Metas */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {formatarMoeda(getTotalEconomizado())}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Economizado</p>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatarMoeda(getTotalObjetivo())}
                      </p>
                      <p className="text-xs text-muted-foreground">Objetivo Total</p>
                    </div>
                  </Card>
                </div>

                {metas.length > 0 ? (
                  <div className="space-y-4">
                    {metas.map(meta => {
                      const progresso = getProgressoMeta(meta)
                      const diasRestantes = meta.prazo 
                        ? Math.ceil((new Date(meta.prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : null

                      return (
                        <Card key={meta.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{meta.titulo}</p>
                                  <Badge 
                                    variant={meta.status === 'ativa' ? 'default' : 
                                           meta.status === 'concluida' ? 'secondary' : 
                                           meta.status === 'pausada' ? 'outline' : 'destructive'}
                                    className={`text-xs ${
                                      meta.status === 'ativa' ? 'bg-blue-500' :
                                      meta.status === 'concluida' ? 'bg-green-500' :
                                      meta.status === 'pausada' ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    } text-white`}
                                  >
                                    {meta.status === 'ativa' ? 'Ativa' :
                                     meta.status === 'concluida' ? 'Concluída' :
                                     meta.status === 'pausada' ? 'Pausada' : 'Cancelada'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{meta.categoria}</p>
                                {meta.descricao && (
                                  <p className="text-xs text-muted-foreground mt-1">{meta.descricao}</p>
                                )}
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => abrirModalUpdateValue(meta)}
                                  className="p-1 h-7 w-7"
                                >
                                  <DollarSign className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => abrirModalMeta(meta)}
                                  className="p-1 h-7 w-7"
                                >
                                  <EditIcon className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteMeta(meta.id)}
                                  className="p-1 h-7 w-7 text-red-600 hover:text-red-700"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progresso</span>
                                <span className="font-medium">{progresso.toFixed(1)}%</span>
                              </div>
                              <Progress value={progresso} className="h-2" />
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{formatarMoeda(meta.valor_atual)}</span>
                                <span>{formatarMoeda(meta.valor_meta)}</span>
                              </div>
                            </div>

                            {meta.prazo && (
                              <div className="text-sm text-muted-foreground">
                                <span>Prazo: {new Date(meta.prazo).toLocaleDateString('pt-BR')}</span>
                                {diasRestantes !== null && (
                                  <span className={`ml-2 ${diasRestantes <= 30 ? 'text-orange-600' : ''}`}>
                                    ({diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Vencida'})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      )
                    })}

                    {/* Metas próximas ao vencimento */}
                    {getMetasProximasVencimento(30).length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold text-orange-600 mb-3">
                          ⚠️ Próximas ao Vencimento (30 dias)
                        </h4>
                        <div className="space-y-2">
                          {getMetasProximasVencimento(30).map(meta => (
                            <div key={`proximo-${meta.id}`} className="text-sm p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-700">
                              <div className="flex justify-between">
                                <span className="font-medium">{meta.titulo}</span>
                                <span className="text-orange-600">
                                  {meta.prazo ? Math.ceil((new Date(meta.prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0} dias
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Nenhuma meta encontrada</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comece criando sua primeira meta financeira
                    </p>
                    <Button onClick={() => abrirModalMeta()}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Criar Meta
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {/* Contas a Pagar */}
            {tipoSidebarAtivo === 'contas-a-pagar' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Contas a Pagar</h3>
                  <div className="flex gap-2">
                    <Button onClick={() => abrirModalConta()}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  
                  {contasLoading ? (
                    <Card className="p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Carregando contas...
                      </p>
                    </Card>
                  ) : contasError ? (
                    <Card className="p-8 text-center">
                      <p className="text-red-500">
                        Erro: {contasError}
                      </p>
                    </Card>
                  ) : filtrarContasPorPeriodo(contasAPagar || []).length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Nenhuma conta a pagar encontrada para {getNomePeriodo().toLowerCase()}.
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Tente alterar o período ou adicionar uma nova conta.
                      </p>
                    </Card>
                  ) : (
                    filtrarContasPorPeriodo(contasAPagar || [])
                      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
                      .map(conta => {
                        const hoje = new Date()
                        const vencimento = new Date(conta.data_vencimento)
                        const isVencida = vencimento < hoje && !conta.quitado
                        const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                        
                        return (
                          <Card key={conta.id} className={`p-4 ${
                            conta.quitado 
                              ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
                              : isVencida 
                                ? 'border-red-200 bg-red-50 dark:bg-red-900/20' 
                                : ''
                          }`}>
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">{conta.descricao}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Parcela {conta.parcela_atual} de {conta.qtd_parcelas}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Vencimento: {vencimento.toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-orange-600">
                                    {formatarMoeda(conta.valor_parcela)}
                                  </p>
                                  {conta.quitado ? (
                                    <Badge variant="default" className="text-xs bg-green-600">
                                      Quitada
                                    </Badge>
                                  ) : isVencida ? (
                                    <Badge variant="destructive" className="text-xs">
                                      Vencida
                                    </Badge>
                                  ) : diasRestantes <= 7 ? (
                                    <Badge variant="secondary" className="text-xs">
                                      {diasRestantes} dias
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex gap-1 pt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => abrirModalConta(conta)}
                                  className="flex-1"
                                >
                                  <EditIcon className="h-3 w-3 mr-1" />
                                  Editar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => conta.id && handleDeleteConta(conta.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )
                      })
                  )}
                </div>
              </div>
            )}

            {/* Adicionar outros tipos conforme necessário */}
            {tipoSidebarAtivo === 'transacoes' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Todas as Transações</h3>
                  <Button onClick={() => abrirModalTransacao()}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {transacoesFiltradaPorPeriodo
                    .sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime())
                    .map(transacao => (
                      <Card key={transacao.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{transacao.descricao}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={
                                transacao.tipo === "entrada" ? "default" :
                                transacao.tipo === "despesa" ? "destructive" :
                                "secondary"
                              } className="text-xs">
                                {transacao.tipo}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {categoriasParaUsar.find(c => c.id === transacao.categoria_id)?.nome}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(transacao.data_transacao).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              transacao.valor > 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              {formatarMoeda(transacao.valor)}
                            </p>
                            <div className="flex gap-1 mt-2">
                              <Button size="sm" variant="outline" onClick={() => abrirModalTransacao(transacao)}>
                                <EditIcon className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteTransacao(transacao.id)}>
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Contas Vencidas */}
            {tipoSidebarAtivo === 'contas-vencidas' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-600">Contas em Atraso</h3>
                
                <div className="space-y-3">
                  {contasAPagar
                    .filter(c => {
                      const hoje = new Date()
                      const vencimento = new Date(c.data_vencimento)
                      return !c.quitado && vencimento < hoje
                    })
                    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
                    .map(conta => {
                      const hoje = new Date()
                      const vencimento = new Date(conta.data_vencimento)
                      const diasAtraso = Math.ceil((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24))
                      
                      return (
                        <Card key={conta.id} className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{conta.descricao}</p>
                                <p className="text-sm text-muted-foreground">
                                  Parcela {conta.parcela_atual} de {conta.qtd_parcelas}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-red-600">
                                  {formatarMoeda(conta.valor_parcela)}
                                </p>
                                <Badge variant="destructive" className="text-xs">
                                  {diasAtraso} dias atraso
                                </Badge>
                              </div>
                            </div>
                            <div className="text-sm text-red-600">
                              Venceu em: {vencimento.toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                </div>
                
                {contasAPagar.filter(c => {
                  const hoje = new Date()
                  const vencimento = new Date(c.data_vencimento)
                  return !c.quitado && vencimento < hoje
                }).length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-green-600 font-medium">🎉 Nenhuma conta vencida!</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Suas contas estão em dia
                    </p>
                  </Card>
                )}
              </div>
            )}

            {/* Próximos Vencimentos */}
            {tipoSidebarAtivo === 'proximos-vencimentos' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-yellow-600">Próximos 7 Dias</h3>
                
                <div className="space-y-3">
                  {(() => {
                    const hoje = new Date()
                    const proximos7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)
                    
                    return contasAPagar
                      .filter(c => {
                        const vencimento = new Date(c.data_vencimento)
                        return vencimento >= hoje && vencimento <= proximos7Dias && !c.quitado
                      })
                      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
                      .map(conta => {
                        const hoje = new Date()
                        const vencimento = new Date(conta.data_vencimento)
                        const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                        
                        return (
                          <Card key={conta.id} className="p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{conta.descricao}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Parcela {conta.parcela_atual} de {conta.qtd_parcelas}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-orange-600">
                                    {formatarMoeda(conta.valor_parcela)}
                                  </p>
                                  <Badge variant="secondary" className="text-xs">
                                    {diasRestantes === 0 ? 'Hoje' : `${diasRestantes} dias`}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                Vence em: {vencimento.toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </Card>
                        )
                      })
                  })()}
                </div>
              </div>
            )}

            {/* Contas Quitadas */}
            {tipoSidebarAtivo === 'contas-quitadas' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-600">Contas Pagas</h3>
                
                <div className="space-y-3">
                  {contasAPagar
                    .filter(c => c.quitado)
                    .sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime())
                    .map(conta => (
                      <Card key={conta.id} className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{conta.descricao}</p>
                              <p className="text-sm text-muted-foreground">
                                Parcela {conta.parcela_atual} de {conta.qtd_parcelas}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {formatarMoeda(conta.valor_parcela)}
                              </p>
                              <Badge variant="default" className="text-xs bg-green-600">
                                Quitada
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            Vencimento: {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Categorias */}
            {tipoSidebarAtivo === 'categorias' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gestão de Categorias</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {categoriasParaUsar.map(categoria => {
                    const transacoesCategoria = transacoes.filter(t => t.categoria_id === categoria.id)
                    const totalTransacoes = transacoesCategoria.length
                    const valorTotal = transacoesCategoria.reduce((sum, t) => sum + Math.abs(t.valor), 0)
                    
                    return (
                      <Card key={categoria.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: categoria.cor_padrao }}
                            />
                            <div>
                              <p className="font-medium">{categoria.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {totalTransacoes} transações
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatarMoeda(valorTotal)}</p>
                            <p className="text-xs text-muted-foreground">
                              Total movimentado
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Contas Bancárias */}
            {tipoSidebarAtivo === 'contas-bancarias' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contas Bancárias</h3>
                
                <div className="space-y-3">
                  {contasBancarias.map(conta => {
                    const saldoAtual = calcularSaldoAtual(conta.id, conta.saldo_inicial || 0, transacoes)
                    const transacoesConta = transacoes.filter(t => 
                      t.conta_bancaria_id === conta.id || 
                      t.conta_origem_id === conta.id || 
                      t.conta_destino_id === conta.id
                    )
                    
                    return (
                      <Card key={conta.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{conta.nome_conta}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {conta.tipo_conta}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-lg ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatarMoeda(saldoAtual)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Saldo atual
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Saldo Inicial</p>
                              <p className="font-medium">{formatarMoeda(conta.saldo_inicial || 0)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Transações</p>
                              <p className="font-medium">{transacoesConta.length}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
                
                {contasBancarias.length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Nenhuma conta bancária encontrada</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Adicione contas bancárias ao banco de dados para visualizá-las aqui
                    </p>
                  </Card>
                )}
              </div>
            )}

          </div>
        </SheetContent>
      </Sheet>

      {/* Modal para adicionar/editar meta */}
      <Dialog open={modalMetaAberto} onOpenChange={setModalMetaAberto}>
        <DialogContent 
          className="!fixed !inset-0 !left-0 !top-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !translate-x-0 !translate-y-0 !rounded-none !border-0 overflow-y-auto flex flex-col z-50"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{metaEditando ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
            <DialogDescription>
              {metaEditando ? 'Atualize as informações da sua meta' : 'Crie uma nova meta financeira'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <form onSubmit={handleSubmitMeta} className="space-y-4 pb-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                name="titulo"
                value={formMeta.titulo}
                onChange={handleInputMetaChange}
                placeholder="Ex: Viagem para Europa"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                value={formMeta.descricao}
                onChange={handleInputMetaChange}
                placeholder="Descreva sua meta..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor_meta">Valor Objetivo *</Label>
                <Input
                  id="valor_meta"
                  name="valor_meta"
                  type="number"
                  step="0.01"
                  value={formMeta.valor_meta}
                  onChange={handleInputMetaChange}
                  placeholder="0,00"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="valor_atual">Valor Atual</Label>
                <Input
                  id="valor_atual"
                  name="valor_atual"
                  type="number"
                  step="0.01"
                  value={formMeta.valor_atual}
                  onChange={handleInputMetaChange}
                  placeholder="0,00"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={formMeta.categoria} onValueChange={(value) => handleSelectMetaChange('categoria', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emergência">Emergência</SelectItem>
                  <SelectItem value="Viagem">Viagem</SelectItem>
                  <SelectItem value="Casa Própria">Casa Própria</SelectItem>
                  <SelectItem value="Carro">Carro</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
                  <SelectItem value="Aposentadoria">Aposentadoria</SelectItem>
                  <SelectItem value="Investimento">Investimento</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prazo">Prazo</Label>
              <Input
                id="prazo"
                name="prazo"
                type="date"
                value={formMeta.prazo}
                onChange={handleInputMetaChange}
                disabled={isLoading}
              />
            </div>

            {metaEditando && (
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formMeta.status} onValueChange={(value: Meta['status']) => handleSelectMetaChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            </form>
          </div>

          <div className="flex gap-2 pt-4 border-t mt-4 flex-shrink-0">
            <Button variant="outline" onClick={fecharModalMeta} className="flex-1" disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitMeta} className="flex-1" disabled={isLoading}>
              {isLoading ? 'Salvando...' : metaEditando ? 'Salvar' : 'Criar Meta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para atualizar valor da meta */}
      <Dialog open={modalUpdateValueAberto} onOpenChange={setModalUpdateValueAberto}>
        <DialogContent 
          className="!fixed !inset-0 !left-0 !top-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !translate-x-0 !translate-y-0 !rounded-none !border-0 overflow-y-auto z-50"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Atualizar Progresso</DialogTitle>
            <DialogDescription>
              Atualize o valor atual da meta "{metaParaAtualizar?.titulo}"
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateValueMeta} className="space-y-4">
            <div>
              <Label htmlFor="novo-valor">Novo Valor</Label>
              <Input
                id="novo-valor"
                type="number"
                step="0.01"
                value={novoValorMeta}
                onChange={(e) => setNovoValorMeta(e.target.value)}
                placeholder="0,00"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={fecharModalUpdateValue} className="flex-1" disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Contas a Pagar */}
      <Dialog 
        open={modalContaAberto} 
        onOpenChange={setModalContaAberto}
        modal={true}
      >
        <DialogContent 
          className="!fixed !inset-0 !left-0 !top-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !translate-x-0 !translate-y-0 !rounded-none !border-0 overflow-y-auto z-50"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>
              {contaEditando ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
            </DialogTitle>
            <DialogDescription>
              {contaEditando 
                ? 'Edite os dados da conta abaixo.'
                : 'Preencha os dados para adicionar uma nova conta a pagar.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitConta} className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                name="descricao"
                value={formConta.descricao}
                onChange={handleInputContaChange}
                placeholder="Ex: Financiamento do carro, Cartão de crédito..."
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta_bancaria_id">Conta Bancária (Opcional)</Label>
              <Select
                value={formConta.conta_bancaria_id}
                onValueChange={(value) => setFormConta(prev => ({ ...prev, conta_bancaria_id: value }))}
                disabled={isLoading || contasBancariasLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    contasBancariasLoading 
                      ? "Carregando..." 
                      : contasBancarias.length === 0
                        ? "Nenhuma conta cadastrada"
                        : "Selecione uma conta (opcional)"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias.map(conta => (
                    <SelectItem key={conta.id} value={conta.id.toString()}>
                      {conta.nome_conta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vincule esta conta a pagar a uma conta bancária específica (opcional)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_total">Valor Total (R$)</Label>
                <Input
                  id="valor_total"
                  name="valor_total"
                  type="number"
                  step="0.01"
                  value={formConta.valor_total}
                  onChange={handleInputContaChange}
                  placeholder="0,00"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qtd_parcelas">Quantidade de Parcelas</Label>
                <Input
                  id="qtd_parcelas"
                  name="qtd_parcelas"
                  type="number"
                  value={formConta.qtd_parcelas}
                  onChange={handleInputContaChange}
                  placeholder="12"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data de Vencimento</Label>
              <Input
                id="data_vencimento"
                name="data_vencimento"
                type="date"
                value={formConta.data_vencimento}
                onChange={handleInputContaChange}
                required
                disabled={isLoading}
              />
            </div>

            {contaEditando && (
              <div className="flex items-center space-x-2">
                <input
                  id="quitado"
                  name="quitado"
                  type="checkbox"
                  checked={formConta.quitado}
                  onChange={handleInputContaChange}
                  disabled={isLoading}
                  className="rounded"
                />
                <Label htmlFor="quitado">Conta quitada</Label>
              </div>
            )}

            {formConta.valor_total && formConta.qtd_parcelas && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Valor por parcela: <span className="font-semibold">
                    {formatarMoeda(parseFloat(formConta.valor_total || '0') / parseInt(formConta.qtd_parcelas || '1'))}
                  </span>
                </p>
              </div>
            )}

            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={fecharModalConta}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? 'Salvando...' 
                  : contaEditando 
                    ? 'Atualizar' 
                    : 'Adicionar'
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}