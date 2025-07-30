'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import useCategorias, { type Categoria } from '@/hooks/useCategorias'
import useBancos from '@/hooks/useBancos'
import useCartoes, { type CartaoUsuario } from '@/hooks/useCartoes'
import useContas, { type ContaBancaria, type CartaoCredito } from '@/hooks/useContas'
import { useTransacoes } from '@/hooks/useSupabaseData'
import { supabase, Transacao } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus, Edit, Save, X, Settings, User, CreditCard, Tags, Wallet, Building2, Home, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    categorias, 
    loading: loadingCategorias,
    atualizarCorCategoria
  } = useCategorias()
  const { bancos, bancosSelecionados, toggleBanco, loading: loadingBancos } = useBancos()
  const { 
    cartoes, 
    loading: loadingCartoes,
    adicionarCartao,
    atualizarCartao,
    excluirCartao,
    toggleCartaoAtivo,
    associarCartaoAConta,
    desassociarCartaoDaConta,
    getCartoesNaoAssociados,
    getCartoesDaConta
  } = useCartoes()
  const {
    contas,
    cartoes: cartoesContas,
    loading: loadingContas,
    adicionarConta,
    adicionarCartao: adicionarCartaoConta,
    atualizarConta,
    excluirConta,
    toggleContaAtiva,
    getCartoesPorConta
  } = useContas()
  const { transacoes } = useTransacoes()
  const [loading, setLoading] = useState(false)
  
  // Estados locais
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  
  // Estados para senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  
  // Estados para edição de cor das categorias
  const [editandoCorCategoria, setEditandoCorCategoria] = useState<number | null>(null)
  const [corSelecionada, setCorSelecionada] = useState('')

  // Estados para cartões independentes
  const [showCartaoDialog, setShowCartaoDialog] = useState(false)
  const [editandoCartao, setEditandoCartao] = useState<CartaoUsuario | null>(null)
  const [formCartao, setFormCartao] = useState({
    banco_id: '',
    final_cartao: '',
    data_fechamento: '',
    data_vencimento: '',
    limite: '',
    ativo: true
  })

  // Estados para contas bancárias
  const [showContaDialog, setShowContaDialog] = useState(false)
  const [editandoConta, setEditandoConta] = useState<ContaBancaria | null>(null)
  const [formConta, setFormConta] = useState({
    banco_id: '',
    nome_conta: '',
    tipo_conta: 'corrente' as 'corrente' | 'poupanca' | 'investimento',
    saldo_inicial: '',
    ativo: true
  })

  // Estados para cartões associados à conta
  const [showCartaoContaDialog, setShowCartaoContaDialog] = useState(false)
  const [showAssociarCartaoDialog, setShowAssociarCartaoDialog] = useState(false)
  const [contaSelecionada, setContaSelecionada] = useState<number | null>(null)
  const [formCartaoConta, setFormCartaoConta] = useState({
    conta_bancaria_id: '',
    final_cartao: '',
    data_fechamento: '',
    data_vencimento: '',
    limite_credito: ''
  })

  useEffect(() => {
    if (user) {
      carregarDadosUsuario()
    }
  }, [user])

  const carregarDadosUsuario = async () => {
    try {
      setEmail(user?.email || '')
      
      // Buscar dados adicionais do usuário
      const { data, error } = await supabase
        .from('usuarios')
        .select('nome')
        .eq('email', user?.email)
        .single()
      
      if (!error && data) {
        setNome(data.nome || '')
      }
      
      // Carregar telefone do localStorage se existir
      const telefoneLocal = localStorage.getItem(`telefone_${user?.id}`)
      if (telefoneLocal) {
        setTelefone(telefoneLocal)
      }
    } catch (error) {
      // Erro ao carregar dados do usuário
    }
  }

  const salvarDadosPessoais = async () => {
    setLoading(true)
    try {
      // Atualizar nome no banco
      const { error } = await supabase
        .from('usuarios')
        .update({ nome })
        .eq('email', user?.email)
      
      if (error) throw error
      
      // Salvar telefone no localStorage
      localStorage.setItem(`telefone_${user?.id}`, telefone)
      
      toast.success('Dados pessoais atualizados com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar dados pessoais')
    } finally {
      setLoading(false)
    }
  }

  const alterarSenha = async () => {
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }
    
    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      // Verificar senha atual
      const { data: usuarios, error: errorBusca } = await supabase
        .from('usuarios')
        .select('senha')
        .eq('email', user?.email)
        .single()
      
      if (errorBusca) throw errorBusca
      
      const senhaAtualHash = btoa(senhaAtual)
      if (usuarios.senha !== senhaAtual && usuarios.senha !== senhaAtualHash) {
        toast.error('Senha atual incorreta')
        return
      }
      
      // Atualizar senha
      const novaSenhaHash = btoa(novaSenha)
      const { error } = await supabase
        .from('usuarios')
        .update({ senha: novaSenhaHash })
        .eq('email', user?.email)
      
      if (error) throw error
      
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      
      toast.success('Senha alterada com sucesso!')
    } catch (error) {
      toast.error('Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBanco = async (bancoId: number) => {
    toggleBanco(bancoId)
    toast.success('Configuração de bancos atualizada!')
  }

  const handleEditarCorCategoria = (categoria: Categoria) => {
    setEditandoCorCategoria(categoria.id)
    setCorSelecionada(categoria.cor_usuario || categoria.cor_padrao)
  }

  const handleSalvarCorCategoria = async () => {
    if (editandoCorCategoria === null) return

    const sucesso = await atualizarCorCategoria(editandoCorCategoria, corSelecionada)
    if (sucesso) {
      setEditandoCorCategoria(null)
      setCorSelecionada('')
      toast.success('Cor da categoria atualizada!')
    }
  }

  const handleCancelarEdicaoCategoria = () => {
    setEditandoCorCategoria(null)
    setCorSelecionada('')
  }

  // Funções para cartões independentes
  const abrirModalCartao = (cartao?: CartaoUsuario) => {
    if (cartao) {
      setEditandoCartao(cartao)
      setFormCartao({
        banco_id: cartao.banco_id.toString(),
        final_cartao: cartao.final_cartao,
        data_fechamento: cartao.data_fechamento.toString(),
        data_vencimento: cartao.data_vencimento.toString(),
        limite: cartao.limite.toString(),
        ativo: cartao.ativo
      })
    } else {
      setEditandoCartao(null)
      setFormCartao({
        banco_id: '',
        final_cartao: '',
        data_fechamento: '',
        data_vencimento: '',
        limite: '',
        ativo: true
      })
    }
    setShowCartaoDialog(true)
  }

  const fecharModalCartao = () => {
    setShowCartaoDialog(false)
    setEditandoCartao(null)
    setFormCartao({
      banco_id: '',
      final_cartao: '',
      data_fechamento: '',
      data_vencimento: '',
      limite: '',
      ativo: true
    })
  }

  const handleSubmitCartao = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formCartao.banco_id || !formCartao.final_cartao || !formCartao.data_fechamento || 
          !formCartao.data_vencimento || !formCartao.limite) {
        toast.error('Todos os campos são obrigatórios')
        return
      }

      if (formCartao.final_cartao.length !== 4) {
        toast.error('O final do cartão deve ter 4 dígitos')
        return
      }

      const dataFechamento = parseInt(formCartao.data_fechamento)
      const dataVencimento = parseInt(formCartao.data_vencimento)
      
      if (dataFechamento < 1 || dataFechamento > 31) {
        toast.error('Data de fechamento deve estar entre 1 e 31')
        return
      }

      if (dataVencimento < 1 || dataVencimento > 31) {
        toast.error('Data de vencimento deve estar entre 1 e 31')
        return
      }

      const limite = parseFloat(formCartao.limite)
      if (limite <= 0) {
        toast.error('Limite deve ser maior que zero')
        return
      }

      const cartaoData = {
        banco_id: parseInt(formCartao.banco_id),
        final_cartao: formCartao.final_cartao,
        data_fechamento: dataFechamento,
        data_vencimento: dataVencimento,
        limite: limite,
        ativo: formCartao.ativo
      }

      let sucesso = false
      if (editandoCartao) {
        sucesso = await atualizarCartao(editandoCartao.id, cartaoData)
      } else {
        sucesso = await adicionarCartao(cartaoData)
      }

      if (sucesso) {
        fecharModalCartao()
      }
    } catch (error) {
      toast.error('Erro ao salvar cartão')
    } finally {
      setLoading(false)
    }
  }

  const handleExcluirCartao = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este cartão?')) {
      await excluirCartao(id)
    }
  }

  const handleToggleCartaoAtivo = async (id: number, ativo: boolean) => {
    await toggleCartaoAtivo(id, ativo)
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // Funções para gerenciar contas bancárias
  const abrirModalConta = (conta?: ContaBancaria) => {
    if (conta) {
      setEditandoConta(conta)
      setFormConta({
        banco_id: conta.banco_id.toString(),
        nome_conta: conta.nome_conta,
        tipo_conta: conta.tipo_conta,
        saldo_inicial: conta.saldo_inicial.toString(),
        ativo: conta.ativo
      })
    } else {
      setEditandoConta(null)
      setFormConta({
        banco_id: '',
        nome_conta: '',
        tipo_conta: 'corrente',
        saldo_inicial: '',
        ativo: true
      })
    }
    setShowContaDialog(true)
  }

  const fecharModalConta = () => {
    setShowContaDialog(false)
    setEditandoConta(null)
    setFormConta({
      banco_id: '',
      nome_conta: '',
      tipo_conta: 'corrente',
      saldo_inicial: '',
      ativo: true
    })
  }

  const handleSubmitConta = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formConta.banco_id || !formConta.nome_conta) {
        toast.error('Banco e nome da conta são obrigatórios')
        return
      }

      const saldoInicial = parseFloat(formConta.saldo_inicial) || 0

      const contaData = {
        banco_id: parseInt(formConta.banco_id),
        nome_conta: formConta.nome_conta,
        tipo_conta: formConta.tipo_conta,
        saldo_inicial: saldoInicial,
        ativo: formConta.ativo
      }

      let sucesso = false
      if (editandoConta) {
        sucesso = await atualizarConta(editandoConta.id, contaData)
      } else {
        sucesso = await adicionarConta(contaData)
      }

      if (sucesso) {
        fecharModalConta()
      }
    } catch (error) {
      toast.error('Erro ao salvar conta')
    } finally {
      setLoading(false)
    }
  }

  const handleExcluirConta = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta conta? Todos os cartões associados também serão excluídos.')) {
      await excluirConta(id)
    }
  }

  const handleToggleContaAtiva = async (id: number, ativo: boolean) => {
    await toggleContaAtiva(id, ativo)
  }

  // Funções para cartões associados às contas
  const abrirModalCartaoConta = (contaId: number) => {
    setContaSelecionada(contaId)
    setFormCartaoConta({
      conta_bancaria_id: contaId.toString(),
      final_cartao: '',
      data_fechamento: '',
      data_vencimento: '',
      limite_credito: ''
    })
    setShowCartaoContaDialog(true)
  }

  const fecharModalCartaoConta = () => {
    setShowCartaoContaDialog(false)
    setContaSelecionada(null)
    setFormCartaoConta({
      conta_bancaria_id: '',
      final_cartao: '',
      data_fechamento: '',
      data_vencimento: '',
      limite_credito: ''
    })
  }

  const handleSubmitCartaoConta = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formCartaoConta.conta_bancaria_id || !formCartaoConta.final_cartao || 
          !formCartaoConta.data_fechamento || !formCartaoConta.data_vencimento || 
          !formCartaoConta.limite_credito) {
        toast.error('Todos os campos são obrigatórios')
        return
      }

      if (formCartaoConta.final_cartao.length !== 4) {
        toast.error('O final do cartão deve ter 4 dígitos')
        return
      }

      const dataFechamento = parseInt(formCartaoConta.data_fechamento)
      const dataVencimento = parseInt(formCartaoConta.data_vencimento)
      
      if (dataFechamento < 1 || dataFechamento > 31) {
        toast.error('Data de fechamento deve estar entre 1 e 31')
        return
      }

      if (dataVencimento < 1 || dataVencimento > 31) {
        toast.error('Data de vencimento deve estar entre 1 e 31')
        return
      }

      const limite = parseFloat(formCartaoConta.limite_credito)
      if (limite <= 0) {
        toast.error('Limite deve ser maior que zero')
        return
      }

      const cartaoData = {
        conta_bancaria_id: parseInt(formCartaoConta.conta_bancaria_id),
        final_cartao: formCartaoConta.final_cartao,
        data_fechamento: dataFechamento,
        data_vencimento: dataVencimento,
        limite_credito: limite
      }

      const sucesso = await adicionarCartaoConta(cartaoData)

      if (sucesso) {
        fecharModalCartaoConta()
      }
    } catch (error) {
      toast.error('Erro ao salvar cartão')
    } finally {
      setLoading(false)
    }
  }

  // Funções para associar cartões existentes às contas
  const abrirModalAssociarCartao = (contaId: number) => {
    setContaSelecionada(contaId)
    setShowAssociarCartaoDialog(true)
  }

  const fecharModalAssociarCartao = () => {
    setShowAssociarCartaoDialog(false)
    setContaSelecionada(null)
  }

  const handleAssociarCartao = async (cartaoId: number) => {
    if (!contaSelecionada) return

    const sucesso = await associarCartaoAConta(cartaoId, contaSelecionada)
    if (sucesso) {
      fecharModalAssociarCartao()
    }
  }

  const handleDesassociarCartao = async (cartaoId: number) => {
    if (confirm('Tem certeza que deseja desassociar este cartão da conta?')) {
      await desassociarCartaoDaConta(cartaoId)
    }
  }

  const cores = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ]

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Faça login para acessar as configurações</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
        <div className="container mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-6 max-w-7xl">
          {/* Header com botão de voltar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 px-1 md:px-2">
            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="hover:bg-muted flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Voltar</span>
              </Button>
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <Settings className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground truncate">Configurações</h1>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                    Gerencie seus dados pessoais, contas e cartões
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6 max-w-7xl">
        <Tabs defaultValue="pessoais" className="space-y-4 md:space-y-6 px-1 md:px-2">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted p-1 rounded-lg h-auto">
            <TabsTrigger 
              value="pessoais" 
              className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground text-xs md:text-sm py-2 md:py-2.5"
            >
              <User className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Dados</span>
              <span className="xs:hidden">Dados</span>
            </TabsTrigger>
            <TabsTrigger 
              value="contas" 
              className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground text-xs md:text-sm py-2 md:py-2.5"
            >
              <Wallet className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Contas</span>
              <span className="xs:hidden">Contas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cartoes" 
              className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground text-xs md:text-sm py-2 md:py-2.5"
            >
              <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Cartões</span>
              <span className="xs:hidden">Cartões</span>
            </TabsTrigger>
            <TabsTrigger 
              value="categorias" 
              className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground text-xs md:text-sm py-2 md:py-2.5"
            >
              <Tags className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Categorias</span>
              <span className="xs:hidden">Categorias</span>
            </TabsTrigger>
          </TabsList>        <TabsContent value="pessoais" className="space-y-4 md:space-y-6 px-0 md:px-1">
          <Card>
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Informações Pessoais</CardTitle>
              <CardDescription className="text-sm">
                Atualize seus dados pessoais aqui
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted border-border text-muted-foreground cursor-not-allowed h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-sm font-medium">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <Button onClick={salvarDadosPessoais} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Dados'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Altere sua senha de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <Input
                  id="senhaAtual"
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <Input
                    id="novaSenha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={alterarSenha} disabled={loading}>
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contas" className="space-y-4 md:space-y-6 px-0 md:px-1">
          <Card>
            <CardHeader className="pb-4 md:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-lg md:text-xl">Gerenciar Contas Bancárias</CardTitle>
                  <CardDescription className="text-sm">
                    Cadastre suas contas bancárias e associe cartões de crédito a elas.
                  </CardDescription>
                </div>
                <Dialog open={showContaDialog} onOpenChange={setShowContaDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => abrirModalConta()} className="w-full sm:w-auto flex-shrink-0">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden xs:inline">Nova Conta</span>
                      <span className="xs:hidden">Nova</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="text-lg">
                      {editandoConta ? 'Editar Conta' : 'Nova Conta'}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      {editandoConta 
                        ? 'Edite as informações da conta abaixo.'
                        : 'Preencha as informações da sua nova conta bancária.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmitConta} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="banco" className="text-sm font-medium">Banco</Label>
                      <Select 
                        value={formConta.banco_id} 
                        onValueChange={(value) => setFormConta(prev => ({...prev, banco_id: value}))}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione o banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {bancos.map((banco) => (
                            <SelectItem key={banco.id} value={banco.id.toString()}>
                              {banco.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nome_conta">Nome da Conta</Label>
                      <Input
                        id="nome_conta"
                        value={formConta.nome_conta}
                        onChange={(e) => setFormConta(prev => ({
                          ...prev, 
                          nome_conta: e.target.value
                        }))}
                        placeholder="Conta Principal, Conta Investimentos..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo_conta">Tipo da Conta</Label>
                      <Select 
                        value={formConta.tipo_conta} 
                        onValueChange={(value: 'corrente' | 'poupanca' | 'investimento') => 
                          setFormConta(prev => ({...prev, tipo_conta: value}))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corrente">Conta Corrente</SelectItem>
                          <SelectItem value="poupanca">Conta Poupança</SelectItem>
                          <SelectItem value="investimento">Conta Investimento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="saldo_inicial">Saldo Inicial</Label>
                      <Input
                        id="saldo_inicial"
                        type="number"
                        step="0.01"
                        value={formConta.saldo_inicial}
                        onChange={(e) => setFormConta(prev => ({
                          ...prev, 
                          saldo_inicial: e.target.value
                        }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ativo"
                        checked={formConta.ativo}
                        onCheckedChange={(checked) => setFormConta(prev => ({
                          ...prev, 
                          ativo: checked
                        }))}
                      />
                      <Label htmlFor="ativo">Conta ativa</Label>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-0 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={fecharModalConta}
                        disabled={loading}
                        className="w-full sm:w-auto order-2 sm:order-1"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full sm:w-auto order-1 sm:order-2"
                      >
                        {loading 
                          ? 'Salvando...' 
                          : editandoConta 
                            ? 'Atualizar' 
                            : 'Adicionar'
                        }
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingContas ? (
                <div className="flex items-center justify-center py-8">
                  <p>Carregando contas...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contas.map((conta) => (
                    <div
                      key={conta.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        conta.ativo 
                          ? 'bg-card border-border' 
                          : 'bg-muted/50 border-border opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="font-semibold">
                              {conta.nome_conta}
                            </span>
                            <Badge variant="secondary">
                              {conta.tipo_conta.charAt(0).toUpperCase() + conta.tipo_conta.slice(1)}
                            </Badge>
                            {!conta.ativo && (
                              <Badge variant="secondary">Inativa</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Banco: {conta.banco?.nome || 'Banco não encontrado'}</p>
                            <p>Saldo Inicial: {formatarMoeda(conta.saldo_inicial)}</p>
                            <p className={`font-medium ${calcularSaldoAtual(conta.id, conta.saldo_inicial, transacoes) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Saldo Atual: {formatarMoeda(calcularSaldoAtual(conta.id, conta.saldo_inicial, transacoes))}
                            </p>
                          </div>
                          
                          {/* Cartões associados */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-medium">Cartões associados:</Label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => abrirModalAssociarCartao(conta.id)}
                                  disabled={getCartoesNaoAssociados().length === 0}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Associar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => abrirModalCartaoConta(conta.id)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Novo
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {/* Cartões da tabela cartoes_credito (sistema antigo) */}
                              {getCartoesPorConta(conta.id).map((cartao) => (
                                <div key={`credito-${cartao.id}`} className="flex items-center justify-between p-2 bg-muted/50 border border-border rounded">
                                  <div className="text-sm text-foreground">
                                    <span className="font-medium">Cartão **** {cartao.final_cartao}</span>
                                    <Badge variant="secondary" className="ml-2 text-xs">Sistema</Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Limite: {formatarMoeda(cartao.limite_credito)}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Cartões da tabela cartoes_usuario associados a esta conta */}
                              {getCartoesDaConta(conta.id).map((cartao) => (
                                <div key={`usuario-${cartao.id}`} className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                  <div className="text-sm">
                                    <span className="font-medium text-foreground">Cartão **** {cartao.final_cartao}</span>
                                    <Badge variant="default" className="ml-2 text-xs">Associado</Badge>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {cartao.banco?.nome}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs text-muted-foreground">
                                      Limite: {formatarMoeda(cartao.limite)}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDesassociarCartao(cartao.id)}
                                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-6 w-6 p-0"
                                      title="Desassociar cartão"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              
                              {getCartoesPorConta(conta.id).length === 0 && getCartoesDaConta(conta.id).length === 0 && (
                                <p className="text-sm text-muted-foreground">Nenhum cartão associado</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={conta.ativo}
                            onCheckedChange={(checked) => 
                              handleToggleContaAtiva(conta.id, checked)
                            }
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => abrirModalConta(conta)}
                            className="hover:bg-muted"
                            title="Editar conta"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExcluirConta(conta.id)}
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            title="Excluir conta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {contas.length === 0 && !loadingContas && (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conta cadastrada.</p>
                  <p className="text-sm mt-2">
                    Clique em "Nova Conta" para adicionar sua primeira conta bancária.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal para adicionar cartão à conta */}
          <Dialog open={showCartaoContaDialog} onOpenChange={setShowCartaoContaDialog}>
            <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-lg">Associar Cartão à Conta</DialogTitle>
                <DialogDescription className="text-sm">
                  Adicione um cartão de crédito a esta conta bancária.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmitCartaoConta} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="final_cartao_conta" className="text-sm font-medium">Final do Cartão</Label>
                  <Input
                    id="final_cartao_conta"
                    value={formCartaoConta.final_cartao}
                    onChange={(e) => setFormCartaoConta(prev => ({
                      ...prev, 
                      final_cartao: e.target.value.replace(/\D/g, '').slice(0, 4)
                    }))}
                    placeholder="1234"
                    maxLength={4}
                    required
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_fechamento_conta" className="text-sm font-medium">Dia Fechamento</Label>
                    <Input
                      id="data_fechamento_conta"
                      type="number"
                      min="1"
                      max="31"
                      value={formCartaoConta.data_fechamento}
                      onChange={(e) => setFormCartaoConta(prev => ({
                        ...prev, 
                        data_fechamento: e.target.value
                      }))}
                      placeholder="10"
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_vencimento_conta" className="text-sm font-medium">Dia Vencimento</Label>
                    <Input
                      id="data_vencimento_conta"
                      type="number"
                      min="1"
                      max="31"
                      value={formCartaoConta.data_vencimento}
                      onChange={(e) => setFormCartaoConta(prev => ({
                        ...prev, 
                        data_vencimento: e.target.value
                      }))}
                      placeholder="15"
                      required
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limite_conta">Limite de Crédito</Label>
                  <Input
                    id="limite_conta"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCartaoConta.limite_credito}
                    onChange={(e) => setFormCartaoConta(prev => ({
                      ...prev, 
                      limite_credito: e.target.value
                    }))}
                    placeholder="5000.00"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-0 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fecharModalCartaoConta}
                    disabled={loading}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    {loading ? 'Salvando...' : 'Adicionar Cartão'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Modal para associar cartão existente à conta */}
          <Dialog open={showAssociarCartaoDialog} onOpenChange={setShowAssociarCartaoDialog}>
            <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto mx-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-lg">Associar Cartão Existente</DialogTitle>
                <DialogDescription className="text-sm">
                  Selecione um cartão existente para associar a esta conta bancária.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {getCartoesNaoAssociados().length === 0 ? (
                  <div className="text-center py-6 md:py-8 text-muted-foreground">
                    <CreditCard className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
                    <p className="text-sm md:text-base">Nenhum cartão disponível para associação.</p>
                    <p className="text-xs md:text-sm mt-2">
                      Crie cartões na aba "Cartões" primeiro.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Cartões disponíveis:</Label>
                    {getCartoesNaoAssociados().map((cartao) => (
                      <div
                        key={cartao.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-foreground text-sm md:text-base">
                              Cartão **** {cartao.final_cartao}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground">
                              {cartao.banco?.nome} • Limite: {formatarMoeda(cartao.limite)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Fechamento: dia {cartao.data_fechamento} • Vencimento: dia {cartao.data_vencimento}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAssociarCartao(cartao.id)}
                          disabled={loading}
                          className="flex-shrink-0 w-full sm:w-auto"
                        >
                          Associar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fecharModalAssociarCartao}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="cartoes" className="space-y-4 md:space-y-6 px-0 md:px-1">
          <Card>
            <CardHeader className="pb-4 md:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-lg md:text-xl">Gerenciar Cartões Independentes</CardTitle>
                  <CardDescription className="text-sm">
                    Cadastre cartões de crédito que não estão vinculados a uma conta específica.
                  </CardDescription>
                </div>
                <Dialog open={showCartaoDialog} onOpenChange={setShowCartaoDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => abrirModalCartao()} className="w-full sm:w-auto flex-shrink-0">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden xs:inline">Novo Cartão</span>
                      <span className="xs:hidden">Novo</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="text-lg">
                      {editandoCartao ? 'Editar Cartão' : 'Novo Cartão'}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      {editandoCartao 
                        ? 'Edite as informações do cartão.'
                        : 'Preencha as informações do novo cartão de crédito.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmitCartao} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="banco_cartao" className="text-sm font-medium">Banco</Label>
                      <Select 
                        value={formCartao.banco_id} 
                        onValueChange={(value) => setFormCartao(prev => ({...prev, banco_id: value}))}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione o banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {bancos.map((banco) => (
                            <SelectItem key={banco.id} value={banco.id.toString()}>
                              {banco.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="final_cartao" className="text-sm font-medium">Final do Cartão</Label>
                      <Input
                        id="final_cartao"
                        value={formCartao.final_cartao}
                        onChange={(e) => setFormCartao(prev => ({
                          ...prev, 
                          final_cartao: e.target.value.replace(/\D/g, '').slice(0, 4)
                        }))}
                        placeholder="1234"
                        maxLength={4}
                        required
                        className="h-10"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="data_fechamento" className="text-sm font-medium">Dia Fechamento</Label>
                        <Input
                          id="data_fechamento"
                          type="number"
                          min="1"
                          max="31"
                          value={formCartao.data_fechamento}
                          onChange={(e) => setFormCartao(prev => ({
                            ...prev, 
                            data_fechamento: e.target.value
                          }))}
                          placeholder="10"
                          required
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="data_vencimento" className="text-sm font-medium">Dia Vencimento</Label>
                        <Input
                          id="data_vencimento"
                          type="number"
                          min="1"
                          max="31"
                          value={formCartao.data_vencimento}
                          onChange={(e) => setFormCartao(prev => ({
                            ...prev, 
                            data_vencimento: e.target.value
                          }))}
                          placeholder="15"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="limite">Limite</Label>
                      <Input
                        id="limite"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formCartao.limite}
                        onChange={(e) => setFormCartao(prev => ({
                          ...prev, 
                          limite: e.target.value
                        }))}
                        placeholder="5000.00"
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ativo"
                        checked={formCartao.ativo}
                        onCheckedChange={(checked) => setFormCartao(prev => ({
                          ...prev, 
                          ativo: checked
                        }))}
                      />
                      <Label htmlFor="ativo">Cartão ativo</Label>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-0 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={fecharModalCartao}
                        disabled={loading}
                        className="w-full sm:w-auto order-2 sm:order-1"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full sm:w-auto order-1 sm:order-2"
                      >
                        {loading 
                          ? 'Salvando...' 
                          : editandoCartao 
                            ? 'Atualizar' 
                            : 'Adicionar'
                        }
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingCartoes ? (
                <div className="flex items-center justify-center py-8">
                  <p>Carregando cartões...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartoes.map((cartao) => (
                    <div
                      key={cartao.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        cartao.ativo 
                          ? 'bg-card border-border' 
                          : 'bg-muted/50 border-border opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {cartao.banco?.nome || 'Banco não encontrado'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              **** {cartao.final_cartao}
                            </span>
                            {cartao.conta_bancaria_id && (
                              <Badge variant="default" className="text-xs">
                                Associado à Conta
                              </Badge>
                            )}
                            {!cartao.ativo && (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Fechamento: dia {cartao.data_fechamento}</p>
                            <p>Vencimento: dia {cartao.data_vencimento}</p>
                            <p>Limite: {formatarMoeda(cartao.limite)}</p>
                            {cartao.conta_bancaria_id && (
                              <p className="text-primary font-medium">
                                Associado à conta bancária (ID: {cartao.conta_bancaria_id})
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={cartao.ativo}
                            onCheckedChange={(checked) => 
                              handleToggleCartaoAtivo(cartao.id, checked)
                            }
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => abrirModalCartao(cartao)}
                            className="hover:bg-muted"
                            title="Editar cartão"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExcluirCartao(cartao.id)}
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            title="Excluir cartão"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {cartoes.length === 0 && !loadingCartoes && (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum cartão cadastrado.</p>
                  <p className="text-sm mt-2">
                    Clique em "Novo Cartão" para adicionar seu primeiro cartão.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4 md:space-y-6 px-0 md:px-1">
          <Card>
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Categorias Disponíveis</CardTitle>
              <CardDescription className="text-sm">
                Categorias disponíveis para suas transações. Você pode personalizar as cores de cada categoria.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {loadingCategorias ? (
                <div className="flex items-center justify-center py-6 md:py-8">
                  <p className="text-sm">Carregando categorias...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {categorias.map((categoria) => (
                    <div
                      key={categoria.id}
                      className="p-4 border rounded-lg"
                    >
                      {editandoCorCategoria === categoria.id ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: corSelecionada }}
                            />
                            <span className="font-medium">{categoria.nome}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm">Escolha uma cor:</Label>
                            <div className="flex flex-wrap gap-2">
                              {cores.map((cor) => (
                                <button
                                  key={cor}
                                  className={`w-8 h-8 rounded-full border-2 ${
                                    corSelecionada === cor ? 'border-gray-800' : 'border-gray-300'
                                  }`}
                                  style={{ backgroundColor: cor }}
                                  onClick={() => setCorSelecionada(cor)}
                                />
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSalvarCorCategoria}>
                              <Save className="h-3 w-3 mr-1" />
                              Salvar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={handleCancelarEdicaoCategoria}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: categoria.cor_usuario || categoria.cor_padrao }}
                            />
                            <span className="font-medium">{categoria.nome}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditarCorCategoria(categoria)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {categorias.length === 0 && !loadingCategorias && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma categoria encontrada.</p>
                  <p className="text-sm mt-2">
                    Execute o script SQL fornecido no seu banco Supabase para adicionar as categorias.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
