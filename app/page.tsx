"use client"

import { useState, useEffect } from "react"
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, TrendingUpIcon, WalletIcon, FilterIcon, XIcon, EyeIcon, EyeOffIcon, LogOutIcon, MessageCircleIcon, SunIcon, MoonIcon, PlusIcon, EditIcon, TrashIcon, SettingsIcon } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Importações do Supabase
import { useAuth } from "@/hooks/useAuth"
import { useTransacoes, useInvestimentos, useMetas } from "@/hooks/useSupabaseData"
import { supabase, Transacao, Investimento, Meta } from "@/lib/supabase"

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
  
  // Estados do modal de transação
  const [modalTransacaoAberto, setModalTransacaoAberto] = useState(false)
  const [transacaoEditando, setTransacaoEditando] = useState<Transacao | null>(null)
  const [formTransacao, setFormTransacao] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    data: "",
    tipo: "entrada" as "entrada" | "saida" | "investimento"
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

  // Funções do modal de transação
  const abrirModalTransacao = (transacao?: Transacao) => {
    setError("") // Limpar erros anteriores
    
    if (transacao) {
      setTransacaoEditando(transacao)
      setFormTransacao({
        descricao: transacao.descricao,
        categoria: transacao.categoria,
        valor: Math.abs(transacao.valor).toString(), // Mostrar valor absoluto
        data: transacao.data,
        tipo: transacao.tipo
      })
    } else {
      setTransacaoEditando(null)
      setFormTransacao({
        descricao: "",
        categoria: "",
        valor: "",
        data: new Date().toISOString().split('T')[0],
        tipo: "entrada"
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
      tipo: "entrada"
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
      if (formTransacao.tipo === 'saida' || formTransacao.tipo === 'investimento') {
        valor = Math.abs(valor) * -1 // Garantir que seja negativo
      } else if (formTransacao.tipo === 'entrada') {
        valor = Math.abs(valor) // Garantir que seja positivo
      }

      const transacaoData = {
        descricao: formTransacao.descricao,
        categoria: formTransacao.categoria,
        valor: valor,
        data: formTransacao.data,
        tipo: formTransacao.tipo,
        user_id: user?.id
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

  // Calcular totais
  const totalEntradas = transacoesExibir
    .filter((t: Transacao) => t.tipo === "entrada")
    .reduce((sum: number, t: Transacao) => sum + t.valor, 0)
  
  const totalSaidas = Math.abs(transacoesExibir
    .filter((t: Transacao) => t.tipo === "saida")
    .reduce((sum: number, t: Transacao) => sum + t.valor, 0))
  
  const totalInvestimentos = Math.abs(transacoesExibir
    .filter((t: Transacao) => t.tipo === "investimento")
    .reduce((sum: number, t: Transacao) => sum + t.valor, 0))
  
  const saldoAtual = totalEntradas - totalSaidas - totalInvestimentos

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
  if (authLoading || transacoesLoading || investimentosLoading || metasLoading) {
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
              <div className="bg-blue-600 p-3 rounded-full">
                <WalletIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              Dashboard Financeiro
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
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Bem-vindo,</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{nomeUsuario || user?.email}</span>
          </div>
          <div className="flex items-center space-x-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                <WalletIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatarMoeda(saldoAtual)}</div>
                <p className="text-xs text-muted-foreground">
                  +2.5% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                <ArrowUpIcon className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatarMoeda(totalEntradas)}</div>
                <p className="text-xs text-muted-foreground">
                  +15% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                <ArrowDownIcon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatarMoeda(totalSaidas)}</div>
                <p className="text-xs text-muted-foreground">
                  -3% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatarMoeda(totalInvestimentos)}</div>
                <p className="text-xs text-muted-foreground">
                  Rendimento médio: 12% a.a.
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
                      <SelectItem value="saida">Saídas</SelectItem>
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
                        Nenhuma transação encontrada. Adicione transações ao seu banco de dados para visualizá-las aqui.
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
                            transacao.tipo === "saida" ? "destructive" :
                            "secondary"
                          }>
                            {transacao.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(transacao.data).toLocaleDateString('pt-BR')}
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
                    investimentosExibir.map((investimento: Investimento) => (
                      <div key={investimento.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{investimento.nome}</p>
                          <p className="text-sm text-muted-foreground">{investimento.tipo}</p>
                          <p className="text-sm text-blue-600">{investimento.rentabilidade}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatarMoeda(investimento.valor)}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {investimento.vencimento === "Sem vencimento" ? 
                              investimento.vencimento : 
                              new Date(investimento.vencimento).toLocaleDateString('pt-BR')}
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
        <DialogContent className="sm:max-w-[425px]">
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
          
          <form onSubmit={handleSubmitTransacao} className="space-y-4">
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
              <Input
                id="categoria"
                name="categoria"
                value={formTransacao.categoria}
                onChange={handleInputTransacaoChange}
                placeholder="Ex: Alimentação, Receita..."
                required
                disabled={isLoading}
              />
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
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={formTransacao.tipo}
                  onValueChange={(value) => handleSelectTransacaoChange('tipo', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
