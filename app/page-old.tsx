"use client"

import { useState, useEffect } from "react"
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, TrendingUpIcon, WalletIcon, FilterIcon, XIcon, EyeIcon, EyeOffIcon, LogOutIcon, MessageCircleIcon, SunIcon, MoonIcon, PlusIcon, EditIcon, TrashIcon, SettingsIcon, MenuIcon, CreditCardIcon, FileTextIcon, ClockIcon, AlertTriangleIcon } from "lucide-react"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// Importações do Supabase
import { useAuth } from "@/hooks/useAuth"
import { useTransacoes, useInvestimentos, useMetas, useDespesas, useEntradas, useContasAPagar, useCategorias, useContasBancarias, useCartoesCredito, useTiposPagamento } from "@/hooks/useSupabaseData"
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
  const { metas, loading: metasLoading, error: metasError } = useMetas()
  const { despesas, loading: despesasLoading, error: despesasError } = useDespesas()
  const { entradas, loading: entradasLoading, error: entradasError } = useEntradas()
  const { contas: contasAPagar, loading: contasLoading, error: contasError } = useContasAPagar()
  const { categorias, loading: categoriasLoading, error: categoriasError } = useCategorias()
  
  // Novos hooks para dados de referência
  const { contas: contasBancarias, loading: contasBancariasLoading, error: contasBancariasError } = useContasBancarias()
  const { cartoes: cartoesCredito, loading: cartoesCreditoLoading, error: cartoesCreditoError } = useCartoesCredito()
  const { tipos: tiposPagamento, loading: tiposPagamentoLoading, error: tiposPagamentoError } = useTiposPagamento()
  
  // Debug logs
  useEffect(() => {
  }, [contasBancarias, cartoesCredito, tiposPagamento, user])
  
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
  
  // Debug logs
  useEffect(() => {
  }, [contasBancarias, cartoesCredito, tiposPagamento, tiposPagamentoParaUsar, user])
  
  // Estados locais
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [nomeUsuario, setNomeUsuario] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    senha: ""
  })

  // Estados do dashboard
  const [filtroTransacao, setFiltroTransacao] = useState("todas")
  const [periodoSelecionado, setPeriodoSelecionado] = useState("mes-atual")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
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

  // Executar inicialização
  useEffect(() => {
    // Componente inicializado
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

  // Funções do modal de transação
  const abrirModalTransacao = (transacao?: Transacao) => {
    setError("") // Limpar erros anteriores
    
    if (transacao) {
      setTransacaoEditando(transacao)
      const categoria = categoriasParaUsar.find(c => c.id === transacao.categoria_id)
      
      setFormTransacao({
        descricao: transacao.descricao,
        categoria: transacao.tipo === 'transferencia' ? '13' : (categoria?.nome || ""),
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
      setFormTransacao({
        descricao: "",
        categoria: "",
        valor: "",
        data: new Date().toISOString().split('T')[0],
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

  // Usar dados diretos do banco de dados Supabase
  const transacoesExibir = transacoes
  const investimentosExibir = investimentos
  const metasExibir = metas

  // Filtrar transações baseado no filtro selecionado
  const transacoesFiltradas = transacoesExibir.filter((transacao: Transacao) => {
    if (filtroTransacao === "todas") return true
    return transacao.tipo === filtroTransacao
  })

  // Calcular totais para os cards (usando todas as transações)
  const totalEntradas = transacoes
    .filter((t: Transacao) => t.tipo === "entrada")
    .reduce((sum: number, t: Transacao) => sum + t.valor, 0)
  
  const totalSaidas = Math.abs(transacoes
    .filter((t: Transacao) => t.tipo === "despesa")
    .reduce((sum: number, t: Transacao) => sum + t.valor, 0))
  
  const totalInvestimentos = Math.abs(transacoes
    .filter((t: Transacao) => t.tipo === "investimento")
    .reduce((sum: number, t: Transacao) => sum + t.valor, 0))
  
  const saldoAtual = totalEntradas - totalSaidas - totalInvestimentos

  // Debug dos totais

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

  if (transacoesLoading || investimentosLoading || metasLoading || despesasLoading || entradasLoading || contasLoading || contasBancariasLoading || cartoesCreditoLoading || tiposPagamentoLoading) {
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
              Dashboard MeuChatFinanceiro
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
            {/* Botão de Contas a Pagar */}
            <Link href="/dashboard/contas-a-pagar">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <AlertTriangleIcon className="h-4 w-4" />
                <span>Contas a Pagar</span>
              </Button>
            </Link>
            
            {/* Botão de Configuração */}
            <Link href="/dashboard/configuracoes">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Configurações</span>
              </Button>
            </Link>
            
            {/* Botão WhatsApp */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppRedirect}
              className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:border-green-700 dark:text-green-300"
            >
              <MessageCircleIcon className="h-4 w-4" />
              <span>Fale com o Fin</span>
            </Button>
            
            {/* Toggle de tema */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center space-x-2"
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
            >
              <MessageCircleIcon className="h-4 w-4" />
              <span className="hidden xs:inline">Fin</span>
            </Button>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <MenuIcon className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] md:w-[360px] lg:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Botão de Contas a Pagar */}
                  <Link href="/dashboard/contas-a-pagar" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full justify-start flex items-center space-x-2"
                    >
                      <AlertTriangleIcon className="h-4 w-4" />
                      <span>Contas a Pagar</span>
                    </Button>
                  </Link>
                  
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
              <p className="text-gray-600 dark:text-gray-300 mt-1">Visão geral das suas finanças pessoais</p>
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
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Saldo Atual */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                <WalletIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatarMoeda(saldoAtual)}</div>
                <p className="text-xs text-muted-foreground">
                  Balanço geral
                </p>
              </CardContent>
            </Card>

            {/* Despesas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                <ArrowDownIcon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatarMoeda(totalSaidas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transacoes.filter(t => t.tipo === 'despesa').length} registros
                </p>
              </CardContent>
            </Card>

            {/* Entradas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entradas</CardTitle>
                <ArrowUpIcon className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatarMoeda(totalEntradas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transacoes.filter(t => t.tipo === 'entrada').length} registros
                </p>
              </CardContent>
            </Card>

            {/* Transações */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transações</CardTitle>
                <FileTextIcon className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {transacoes.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de movimentações
                </p>
              </CardContent>
            </Card>

            {/* Investimentos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatarMoeda(totalInvestimentos)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transacoes.filter(t => t.tipo === 'investimento').length} transações
                </p>
              </CardContent>
            </Card>

            {/* Contas a Pagar */}
            <Link href="/dashboard/contas-a-pagar">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
                  <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatarMoeda(contasAPagar.filter(c => !c.quitado).reduce((total, conta) => {
                      const parcelasRestantes = conta.qtd_parcelas - conta.parcela_atual + 1
                      return total + (conta.valor_parcela * parcelasRestantes)
                    }, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {contasAPagar.filter(c => !c.quitado).length} pendentes
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Segunda linha de cards - Parcelas/Cotas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Contas a Pagar */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
                <ClockIcon className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {formatarMoeda(contasAPagar.filter(c => !c.quitado).reduce((total, conta) => {
                    const parcelasRestantes = conta.qtd_parcelas - conta.parcela_atual + 1
                    return total + (conta.valor_parcela * parcelasRestantes)
                  }, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {contasAPagar.filter(c => !c.quitado).length} contas em aberto
                </p>
              </CardContent>
            </Card>

            {/* Vencidas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
                <AlertTriangleIcon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {contasAPagar.filter(c => {
                    const hoje = new Date()
                    const vencimento = new Date(c.data_vencimento)
                    return !c.quitado && vencimento < hoje
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Contas vencidas
                </p>
              </CardContent>
            </Card>

            {/* Próximos Vencimentos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximos 7 dias</CardTitle>
                <CalendarIcon className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {(() => {
                    const hoje = new Date()
                    const proximos7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)
                    const contasProximas = contasAPagar.filter(c => {
                      const vencimento = new Date(c.data_vencimento)
                      return vencimento >= hoje && vencimento <= proximos7Dias && !c.quitado
                    })
                    return contasProximas.length
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  A vencer em breve
                </p>
              </CardContent>
            </Card>

            {/* Total Pago */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                <CreditCardIcon className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatarMoeda(
                    contasAPagar.filter(c => c.quitado).reduce((total, conta) => {
                      return total + (conta.valor_parcela * conta.parcela_atual)
                    }, 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Este mês
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transações Recentes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Transações Recentes</CardTitle>
                  <CardDescription>
                    Suas últimas movimentações financeiras
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
                        Nenhuma transação encontrada. Adicione   para visualizá-las aqui.
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
            {/* Investimentos */}
            <Card>
              <CardHeader>
                <CardTitle>Meus Investimentos</CardTitle>
                <CardDescription>
                  Portfolio de investimentos atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investimentosExibir.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>Nenhum investimento encontrado.</p>
                      <p className="text-sm">Adicione investimentos ao seu banco de dados para visualizá-los aqui.</p>
                    </div>
                  ) : (
                    investimentosExibir.map((investimento: Investimento, index: number) => (
                      <div key={`${investimento.usuario_id}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{investimento.nome_investimento}</p>
                          <p className="text-sm text-muted-foreground">{investimento.tipo}</p>
                          <p className="text-sm text-blue-600">Rendimento: {investimento.rendimento}%</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatarMoeda(investimento.valor_investimento)}</p>
                          <p className="text-xs text-muted-foreground">
                            Aplicado em: {new Date(investimento.data_aplicacao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))
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
                            <span>Prazo: {new Date(meta.prazo).toLocaleDateString('pt-BR')}</span>
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

      {/* Modal de Transação */}
      <Dialog open={modalTransacaoAberto} onOpenChange={setModalTransacaoAberto}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
              {formTransacao.tipo && formTransacao.tipo !== 'transferencia' && (
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
    </div>
  )
}

