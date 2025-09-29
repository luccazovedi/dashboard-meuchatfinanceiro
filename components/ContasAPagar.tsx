'use client'

import { useState, useEffect } from 'react'
import { useContasAPagar, useContasBancarias } from '@/hooks/useSupabaseData'
import { ContaAPagar, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Edit, DollarSign, Calendar, AlertTriangle, CheckCircle, Plus } from 'lucide-react'

export default function ContasAPagar() {
  const { 
    contas: contasAPagar, 
    loading, 
    error, 
    addContaAPagar, 
    updateContaAPagar, 
    deleteContaAPagar, 
    quitarContaAPagar,
    getContasVencendo,
    getContasVencidas,
    getTotalPendente
  } = useContasAPagar()

  const { 
    contas: contasBancarias, 
    loading: loadingContas 
  } = useContasBancarias()

  // Estados do componente
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingConta, setEditingConta] = useState<ContaAPagar | null>(null)
  const [filtroContas, setFiltroContas] = useState('todas')

  // Formulário para Contas a Pagar
  const [formContaData, setFormContaData] = useState({
    descricao: '',
    valor_total: '',
    qtd_parcelas: '1',
    parcela_atual: '1',
    valor_parcela: '',
    data_vencimento: '',
    conta_bancaria_id: ''
  })

  // Função para calcular automaticamente o valor da parcela
  const calcularValorParcela = (valorTotal: string, qtdParcelas: string) => {
    const total = parseFloat(valorTotal) || 0
    const qtd = parseInt(qtdParcelas) || 1
    
    if (total > 0 && qtd > 0) {
      const valorParcela = (total / qtd).toFixed(2)
      setFormContaData(prev => ({ ...prev, valor_parcela: valorParcela }))
    }
  }

  const resetForm = () => {
    setFormContaData({
      descricao: '',
      valor_total: '',
      qtd_parcelas: '1',
      parcela_atual: '1',
      valor_parcela: '',
      data_vencimento: '',
      conta_bancaria_id: ''
    })
  }

  // Funções para Contas a Pagar
  const handleSubmitConta = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Validações básicas
      if (!formContaData.descricao.trim()) {
        // alert removido para segurança
        return
      }
      
      if (!formContaData.valor_total || parseFloat(formContaData.valor_total) <= 0) {
        // alert removido para segurança
        return
      }
      
      if (!formContaData.data_vencimento) {
        // alert removido para segurança
        return
      }

      // Calcular valor da parcela automaticamente se não foi preenchido
      const valorTotal = parseFloat(formContaData.valor_total)
      const qtdParcelas = parseInt(formContaData.qtd_parcelas)
      const valorParcela = formContaData.valor_parcela 
        ? parseFloat(formContaData.valor_parcela)
        : valorTotal / qtdParcelas

      const contaData = {
        usuario_id: 1, // Substitua pelo ID do usuário logado
        descricao: formContaData.descricao,
        valor_total: valorTotal,
        qtd_parcelas: qtdParcelas,
        parcela_atual: parseInt(formContaData.parcela_atual),
        valor_parcela: valorParcela,
        data_vencimento: formContaData.data_vencimento,
        conta_bancaria_id: formContaData.conta_bancaria_id && formContaData.conta_bancaria_id !== '' ? parseInt(formContaData.conta_bancaria_id) : null,
        quitado: false
      }

      if (editingConta) {
        await updateContaAPagar(editingConta.id!, contaData)
        setEditingConta(null)
      } else {
        await addContaAPagar(contaData)
        setShowAddDialog(false)
      }

      resetForm()
    } catch (error) {
      
      // alert removido para segurança
    }
  }

  const handleEditConta = (conta: ContaAPagar) => {
    setFormContaData({
      descricao: conta.descricao,
      valor_total: conta.valor_total.toString(),
      qtd_parcelas: conta.qtd_parcelas.toString(),
      parcela_atual: conta.parcela_atual.toString(),
      valor_parcela: conta.valor_parcela.toString(),
      data_vencimento: conta.data_vencimento,
      conta_bancaria_id: conta.conta_bancaria_id ? conta.conta_bancaria_id.toString() : ''
    })
    setEditingConta(conta)
    setShowAddDialog(true)
  }

  const handleDeleteConta = async (conta: ContaAPagar) => {
    if (confirm(`Tem certeza que deseja excluir a conta "${conta.descricao}"?`)) {
      try {
        await deleteContaAPagar(conta.id!)
      } catch (error) {
        
        // alert removido para segurança
      }
    }
  }

  const handleQuitarParcela = async (conta: ContaAPagar) => {
    try {
      const novaParcelaAtual = conta.parcela_atual + 1
      await quitarContaAPagar(conta.id!, novaParcelaAtual)
    } catch (error) {
      
      // alert removido para segurança
    }
  }

  const getStatusBadge = (conta: ContaAPagar) => {
    if (conta.quitado) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Quitado</Badge>
    }
    
    const hoje = new Date()
    const vencimento = new Date(conta.data_vencimento)
    
    if (vencimento < hoje) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    
    const diffTime = vencimento.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 7) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Vence em {diffDays} dias</Badge>
    }
    
    return <Badge variant="outline">Pendente</Badge>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getContasFiltradas = () => {
    switch (filtroContas) {
      case 'pendentes':
        return contasAPagar.filter(conta => !conta.quitado)
      case 'quitadas':
        return contasAPagar.filter(conta => conta.quitado)
      case 'vencidas':
        return getContasVencidas()
      default:
        return contasAPagar
    }
  }

  const getNomeContaBancaria = (contaBancariaId?: number | null) => {
    if (!contaBancariaId) return 'Não informado'
    const conta = contasBancarias.find(c => c.id === contaBancariaId)
    return conta ? conta.nome_conta : 'Conta não encontrada'
  }

  if (loading || loadingContas) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando contas...</p>
        </div>
      </div>
    )
  }

  const contasVencidas = getContasVencidas()
  const contasVencendo = getContasVencendo()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-gray-600 mt-2">Gerencie suas contas e parcelas</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm()
              setEditingConta(null)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingConta ? 'Editar Conta' : 'Adicionar Nova Conta'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da conta a pagar
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmitConta} className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formContaData.descricao}
                  onChange={(e) => setFormContaData({ ...formContaData, descricao: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="conta_bancaria">Conta Bancária</Label>
                <div className="flex gap-2">
                  <Select
                    value={formContaData.conta_bancaria_id || undefined}
                    onValueChange={(value) => setFormContaData({ ...formContaData, conta_bancaria_id: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma conta (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {contasBancarias.map((conta) => (
                        <SelectItem key={conta.id} value={conta.id.toString()}>
                          {conta.nome_conta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formContaData.conta_bancaria_id && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormContaData({ ...formContaData, conta_bancaria_id: '' })}
                      className="px-3"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor_total">Valor Total</Label>
                  <Input
                    id="valor_total"
                    type="number"
                    step="0.01"
                    value={formContaData.valor_total}
                    onChange={(e) => {
                      setFormContaData({ ...formContaData, valor_total: e.target.value })
                      calcularValorParcela(e.target.value, formContaData.qtd_parcelas)
                    }}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="qtd_parcelas">Qtd. Parcelas</Label>
                  <Input
                    id="qtd_parcelas"
                    type="number"
                    min="1"
                    value={formContaData.qtd_parcelas}
                    onChange={(e) => {
                      setFormContaData({ ...formContaData, qtd_parcelas: e.target.value })
                      calcularValorParcela(formContaData.valor_total, e.target.value)
                    }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parcela_atual">Parcela Atual</Label>
                  <Input
                    id="parcela_atual"
                    type="number"
                    min="1"
                    value={formContaData.parcela_atual}
                    onChange={(e) => setFormContaData({ ...formContaData, parcela_atual: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="valor_parcela">Valor da Parcela (Calculado)</Label>
                  <Input
                    id="valor_parcela"
                    type="number"
                    step="0.01"
                    value={formContaData.valor_parcela}
                    readOnly
                    className="bg-gray-50 text-gray-600"
                    placeholder="Será calculado automaticamente"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formContaData.data_vencimento}
                  onChange={(e) => setFormContaData({ ...formContaData, data_vencimento: e.target.value })}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingConta ? 'Atualizar' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(getTotalPendente())}
            </div>
            <p className="text-xs text-muted-foreground">
              {contasAPagar.filter(c => !c.quitado).length} contas pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {contasVencidas.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Contas em atraso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em 7 dias</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {contasVencendo.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Atenção necessária
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quitadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contasAPagar.filter(c => c.quitado).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {contasVencidas.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Você tem {contasVencidas.length} conta(s) vencida(s) que precisa(m) de atenção.
          </AlertDescription>
        </Alert>
      )}

      {contasVencendo.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Calendar className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {contasVencendo.length} conta(s) vence(m) nos próximos 7 dias.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        {['todas', 'pendentes', 'quitadas', 'vencidas'].map((filtro) => (
          <Button
            key={filtro}
            variant={filtroContas === filtro ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroContas(filtro)}
          >
            {filtro.charAt(0).toUpperCase() + filtro.slice(1)}
          </Button>
        ))}
      </div>

      {/* Lista de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Pagar</CardTitle>
          <CardDescription>
            {getContasFiltradas().length} conta(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {getContasFiltradas().map((conta) => (
              <div key={conta.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{conta.descricao}</h3>
                    {getStatusBadge(conta)}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Conta: {getNomeContaBancaria(conta.conta_bancaria_id)}</div>
                    <div>Parcela {conta.parcela_atual} de {conta.qtd_parcelas}</div>
                    <div>Vencimento: {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
                
                <div className="text-right mr-4">
                  <div className="font-medium">{formatCurrency(conta.valor_parcela)}</div>
                  <div className="text-sm text-gray-500">
                    Total: {formatCurrency(conta.valor_total)}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!conta.quitado && conta.parcela_atual <= conta.qtd_parcelas && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuitarParcela(conta)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditConta(conta)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteConta(conta)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {getContasFiltradas().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma conta encontrada para o filtro selecionado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
