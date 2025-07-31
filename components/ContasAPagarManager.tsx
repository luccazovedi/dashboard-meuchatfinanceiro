'use client'

import { useState } from 'react'
import { useContasAPagar, useParcelaCotas } from '@/hooks/useSupabaseData'
import { ContaAPagar, ParcelaCota } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { CalendarIcon, PlusIcon, EditIcon, TrashIcon, CheckIcon, AlertTriangleIcon, CreditCardIcon, FileTextIcon } from 'lucide-react'

export function ContasAPagarManager() {
  // Hooks para Contas a Pagar
  const {
    contas,
    loading: contasLoading,
    error: contasError,
    addContaAPagar,
    updateContaAPagar,
    deleteContaAPagar,
    quitarParcela,
    getContasVencendo,
    getContasVencidas,
    getTotalPendente
  } = useContasAPagar()

  // Hooks para Parcelas/Cotas
  const {
    parcelas,
    loading: parcelasLoading,
    error: parcelasError,
    addParcelaCota,
    updateParcelaCota,
    deleteParcelaCota,
    quitarParcelaCota,
    getParcelasVencendo,
    getParcelasVencidas,
    getTotalPendenteParcelas
  } = useParcelaCotas()

  // Estados do componente
  const [activeTab, setActiveTab] = useState('contas')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingConta, setEditingConta] = useState<ContaAPagar | null>(null)
  const [editingParcela, setEditingParcela] = useState<ParcelaCota | null>(null)

  // Formulário para Contas a Pagar
  const [formContaData, setFormContaData] = useState({
    descricao: '',
    valor_total: '',
    qtd_parcelas: '1',
    parcela_atual: '1',
    valor_parcela: '',
    data_vencimento: ''
  })

  // Formulário para Parcelas/Cotas
  const [formParcelaData, setFormParcelaData] = useState({
    cota_id: '',
    numero_parcela: '1',
    valor_parcela: '',
    data_vencimento: '',
    observacao: ''
  })

  const resetForms = () => {
    setFormContaData({
      descricao: '',
      valor_total: '',
      qtd_parcelas: '1',
      parcela_atual: '1',
      valor_parcela: '',
      data_vencimento: ''
    })
    setFormParcelaData({
      cota_id: '',
      numero_parcela: '1',
      valor_parcela: '',
      data_vencimento: '',
      observacao: ''
    })
  }

  // Funções para Contas a Pagar
  const handleSubmitConta = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const contaData = {
        usuario_id: 1, // Substitua pelo ID do usuário logado
        descricao: formContaData.descricao,
        valor_total: parseFloat(formContaData.valor_total),
        qtd_parcelas: parseInt(formContaData.qtd_parcelas),
        parcela_atual: parseInt(formContaData.parcela_atual),
        valor_parcela: parseFloat(formContaData.valor_parcela),
        data_vencimento: formContaData.data_vencimento,
        quitado: false
      }

      if (editingConta) {
        await updateContaAPagar(editingConta.id!, contaData)
        setEditingConta(null)
      } else {
        await addContaAPagar(contaData)
        setShowAddDialog(false)
      }

      resetForms()
    } catch (error) {
      
    }
  }

  // Funções para Parcelas/Cotas
  const handleSubmitParcela = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const parcelaData = {
        cota_id: formParcelaData.cota_id ? parseInt(formParcelaData.cota_id) : undefined,
        numero_parcela: parseInt(formParcelaData.numero_parcela),
        valor_parcela: parseFloat(formParcelaData.valor_parcela),
        data_vencimento: formParcelaData.data_vencimento,
        observacao: formParcelaData.observacao || undefined,
        quitado: false
      }

      if (editingParcela) {
        await updateParcelaCota(editingParcela.id!, parcelaData)
        setEditingParcela(null)
      } else {
        await addParcelaCota(parcelaData)
        setShowAddDialog(false)
      }

      resetForms()
    } catch (error) {
      
    }
  }

  const handleEditConta = (conta: ContaAPagar) => {
    setEditingConta(conta)
    setFormContaData({
      descricao: conta.descricao,
      valor_total: conta.valor_total.toString(),
      qtd_parcelas: conta.qtd_parcelas.toString(),
      parcela_atual: conta.parcela_atual.toString(),
      valor_parcela: conta.valor_parcela.toString(),
      data_vencimento: conta.data_vencimento
    })
  }

  const handleEditParcela = (parcela: ParcelaCota) => {
    setEditingParcela(parcela)
    setFormParcelaData({
      cota_id: parcela.cota_id?.toString() || '',
      numero_parcela: parcela.numero_parcela.toString(),
      valor_parcela: parcela.valor_parcela.toString(),
      data_vencimento: parcela.data_vencimento,
      observacao: parcela.observacao || ''
    })
  }

  const handleDeleteConta = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await deleteContaAPagar(id)
      } catch (error) {
        
      }
    }
  }

  const handleDeleteParcela = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta parcela?')) {
      try {
        await deleteParcelaCota(id)
      } catch (error) {
        
      }
    }
  }

  const handleQuitarParcela = async (conta: ContaAPagar) => {
    try {
      await quitarParcela(conta.id!, conta.parcela_atual + 1)
    } catch (error) {
      
    }
  }

  const handleQuitarParcelaCota = async (parcela: ParcelaCota) => {
    try {
      await quitarParcelaCota(parcela.id!)
    } catch (error) {
      
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (item: ContaAPagar | ParcelaCota) => {
    const isQuitado = 'quitado' in item ? item.quitado : item.quitado
    
    if (isQuitado) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Quitado</Badge>
    }
    
    const hoje = new Date()
    const vencimento = new Date(item.data_vencimento)
    
    if (vencimento < hoje) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    
    const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    if (diasRestantes <= 7) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Vence em {diasRestantes} dias</Badge>
    }
    
    return <Badge variant="outline">Pendente</Badge>
  }

  if (contasLoading || parcelasLoading) {
    return <div className="flex justify-center p-8">Carregando dados...</div>
  }

  // Calcular totais combinados
  const contasVencendo = getContasVencendo()
  const contasVencidas = getContasVencidas()
  const parcelasVencendo = getParcelasVencendo()
  const parcelasVencidas = getParcelasVencidas()
  const totalPendente = getTotalPendente()
  const totalPendenteParcelas = getTotalPendenteParcelas()

  return (
    <div className="space-y-6">
      {/* Alertas Combinados */}
      {(contasVencidas.length > 0 || parcelasVencidas.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            Você tem {contasVencidas.length + parcelasVencidas.length} item(s) vencido(s) 
            ({contasVencidas.length} contas, {parcelasVencidas.length} parcelas)
          </AlertDescription>
        </Alert>
      )}

      {(contasVencendo.length > 0 || parcelasVencendo.length > 0) && (
        <Alert>
          <CalendarIcon className="h-4 w-4" />
          <AlertDescription>
            {contasVencendo.length + parcelasVencendo.length} item(s) vencem nos próximos 7 dias
            ({contasVencendo.length} contas, {parcelasVencendo.length} parcelas)
          </AlertDescription>
        </Alert>
      )}

      {/* Resumo Combinado */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Contas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contas.length}</div>
            <p className="text-xs text-muted-foreground">
              Contas a pagar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Parcelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parcelas.length}</div>
            <p className="text-xs text-muted-foreground">
              Parcelas/Cotas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendente Contas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalPendente)}
            </div>
            <p className="text-xs text-muted-foreground">
              {contas.filter(c => !c.quitado).length} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendente Parcelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalPendenteParcelas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {parcelas.filter(p => !p.quitado).length} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para separar Contas e Parcelas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="contas" className="flex items-center space-x-2">
              <CreditCardIcon className="w-4 h-4" />
              <span>Contas a Pagar</span>
            </TabsTrigger>
            <TabsTrigger value="parcelas" className="flex items-center space-x-2">
              <FileTextIcon className="w-4 h-4" />
              <span>Parcelas/Cotas</span>
            </TabsTrigger>
          </TabsList>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForms(); setEditingConta(null); setEditingParcela(null) }}>
                <PlusIcon className="w-4 h-4 mr-2" />
                {activeTab === 'contas' ? 'Adicionar Conta' : 'Adicionar Parcela'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {activeTab === 'contas' 
                    ? (editingConta ? 'Editar Conta' : 'Nova Conta a Pagar')
                    : (editingParcela ? 'Editar Parcela' : 'Nova Parcela/Cota')
                  }
                </DialogTitle>
                <DialogDescription>
                  {activeTab === 'contas' 
                    ? 'Preencha os dados da conta a pagar'
                    : 'Preencha os dados da parcela/cota'
                  }
                </DialogDescription>
              </DialogHeader>
              
              {activeTab === 'contas' ? (
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="valor_total">Valor Total</Label>
                      <Input
                        id="valor_total"
                        type="number"
                        step="0.01"
                        value={formContaData.valor_total}
                        onChange={(e) => setFormContaData({ ...formContaData, valor_total: e.target.value })}
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
                        onChange={(e) => setFormContaData({ ...formContaData, qtd_parcelas: e.target.value })}
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
                      <Label htmlFor="valor_parcela">Valor da Parcela</Label>
                      <Input
                        id="valor_parcela"
                        type="number"
                        step="0.01"
                        value={formContaData.valor_parcela}
                        onChange={(e) => setFormContaData({ ...formContaData, valor_parcela: e.target.value })}
                        required
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

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDialog(false)
                        setEditingConta(null)
                        resetForms()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingConta ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmitParcela} className="space-y-4">
                  <div>
                    <Label htmlFor="cota_id">ID da Cota (opcional)</Label>
                    <Input
                      id="cota_id"
                      type="number"
                      value={formParcelaData.cota_id}
                      onChange={(e) => setFormParcelaData({ ...formParcelaData, cota_id: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numero_parcela">Número da Parcela</Label>
                      <Input
                        id="numero_parcela"
                        type="number"
                        min="1"
                        value={formParcelaData.numero_parcela}
                        onChange={(e) => setFormParcelaData({ ...formParcelaData, numero_parcela: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="valor_parcela_cota">Valor da Parcela</Label>
                      <Input
                        id="valor_parcela_cota"
                        type="number"
                        step="0.01"
                        value={formParcelaData.valor_parcela}
                        onChange={(e) => setFormParcelaData({ ...formParcelaData, valor_parcela: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="data_vencimento_parcela">Data de Vencimento</Label>
                    <Input
                      id="data_vencimento_parcela"
                      type="date"
                      value={formParcelaData.data_vencimento}
                      onChange={(e) => setFormParcelaData({ ...formParcelaData, data_vencimento: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="observacao">Observação</Label>
                    <Textarea
                      id="observacao"
                      value={formParcelaData.observacao}
                      onChange={(e) => setFormParcelaData({ ...formParcelaData, observacao: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDialog(false)
                        setEditingParcela(null)
                        resetForms()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingParcela ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Conteúdo das Tabs */}
        <TabsContent value="contas" className="space-y-4">
          {contasError && (
            <Alert variant="destructive">
              <AlertDescription>{contasError}</AlertDescription>
            </Alert>
          )}

          {contas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">Nenhuma conta a pagar encontrada</p>
                <Button onClick={() => { setActiveTab('contas'); setShowAddDialog(true) }}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Adicionar primeira conta
                </Button>
              </CardContent>
            </Card>
          ) : (
            contas.map((conta) => (
              <Card key={conta.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{conta.descricao}</h4>
                        {getStatusBadge(conta)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor Total:</span>
                          <div className="font-medium">{formatCurrency(conta.valor_total)}</div>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Parcelas:</span>
                          <div className="font-medium">{conta.parcela_atual}/{conta.qtd_parcelas}</div>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Valor Parcela:</span>
                          <div className="font-medium">{formatCurrency(conta.valor_parcela)}</div>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Vencimento:</span>
                          <div className="font-medium">{formatDate(conta.data_vencimento)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {!conta.quitado && conta.parcela_atual <= conta.qtd_parcelas && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuitarParcela(conta)}
                        >
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Quitar Parcela
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditConta(conta)}
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteConta(conta.id!)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="parcelas" className="space-y-4">
          {parcelasError && (
            <Alert variant="destructive">
              <AlertDescription>{parcelasError}</AlertDescription>
            </Alert>
          )}

          {parcelas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">Nenhuma parcela/cota encontrada</p>
                <Button onClick={() => { setActiveTab('parcelas'); setShowAddDialog(true) }}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Adicionar primeira parcela
                </Button>
              </CardContent>
            </Card>
          ) : (
            parcelas.map((parcela) => (
              <Card key={parcela.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">
                          Parcela {parcela.numero_parcela}
                          {parcela.cota_id && ` - Cota ${parcela.cota_id}`}
                        </h4>
                        {getStatusBadge(parcela)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor:</span>
                          <div className="font-medium">{formatCurrency(parcela.valor_parcela)}</div>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Vencimento:</span>
                          <div className="font-medium">{formatDate(parcela.data_vencimento)}</div>
                        </div>
                        
                        {parcela.data_pagamento && (
                          <div>
                            <span className="text-muted-foreground">Pagamento:</span>
                            <div className="font-medium">{formatDate(parcela.data_pagamento)}</div>
                          </div>
                        )}
                      </div>

                      {parcela.observacao && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Observação:</span>
                          <div className="font-medium">{parcela.observacao}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {!parcela.quitado && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuitarParcelaCota(parcela)}
                        >
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Quitar
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditParcela(parcela)}
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteParcela(parcela.id!)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
      {/* Alertas */}
      {contasVencidas.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            Você tem {contasVencidas.length} conta(s) vencida(s)
          </AlertDescription>
        </Alert>
      )}

      {contasVencendo.length > 0 && (
        <Alert>
          <CalendarIcon className="h-4 w-4" />
          <AlertDescription>
            {contasVencendo.length} conta(s) vencem nos próximos 7 dias
          </AlertDescription>
        </Alert>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Contas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalPendente)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Quitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contas.filter(c => c.quitado).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header com botão de adicionar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Contas a Pagar</h3>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingConta(null) }}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Adicionar Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingConta ? 'Editar Conta' : 'Nova Conta a Pagar'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da conta a pagar
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor_total">Valor Total</Label>
                  <Input
                    id="valor_total"
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="qtd_parcelas">Qtd. Parcelas</Label>
                  <Input
                    id="qtd_parcelas"
                    type="number"
                    min="1"
                    value={formData.qtd_parcelas}
                    onChange={(e) => setFormData({ ...formData, qtd_parcelas: e.target.value })}
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
                    value={formData.parcela_atual}
                    onChange={(e) => setFormData({ ...formData, parcela_atual: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="valor_parcela">Valor da Parcela</Label>
                  <Input
                    id="valor_parcela"
                    type="number"
                    step="0.01"
                    value={formData.valor_parcela}
                    onChange={(e) => setFormData({ ...formData, valor_parcela: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false)
                    setEditingConta(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingConta ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de contas */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {contas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground mb-4">Nenhuma conta a pagar encontrada</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Adicionar primeira conta
              </Button>
            </CardContent>
          </Card>
        ) : (
          contas.map((conta) => (
            <Card key={conta.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{conta.descricao}</h4>
                      {getStatusBadge(conta)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Valor Total:</span>
                        <div className="font-medium">{formatCurrency(conta.valor_total)}</div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Parcelas:</span>
                        <div className="font-medium">{conta.parcela_atual}/{conta.qtd_parcelas}</div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Valor Parcela:</span>
                        <div className="font-medium">{formatCurrency(conta.valor_parcela)}</div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Vencimento:</span>
                        <div className="font-medium">{formatDate(conta.data_vencimento)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {!conta.quitado && conta.parcela_atual <= conta.qtd_parcelas && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuitarParcela(conta)}
                      >
                        <CheckIcon className="w-4 h-4 mr-1" />
                        Quitar Parcela
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(conta)}
                    >
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(conta.id!)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de edição */}
      {editingConta && (
        <Dialog open={!!editingConta} onOpenChange={() => setEditingConta(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Conta a Pagar</DialogTitle>
              <DialogDescription>
                Edite os dados da conta a pagar
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit_descricao">Descrição</Label>
                <Input
                  id="edit_descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_valor_total">Valor Total</Label>
                  <Input
                    id="edit_valor_total"
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_qtd_parcelas">Qtd. Parcelas</Label>
                  <Input
                    id="edit_qtd_parcelas"
                    type="number"
                    min="1"
                    value={formData.qtd_parcelas}
                    onChange={(e) => setFormData({ ...formData, qtd_parcelas: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_parcela_atual">Parcela Atual</Label>
                  <Input
                    id="edit_parcela_atual"
                    type="number"
                    min="1"
                    value={formData.parcela_atual}
                    onChange={(e) => setFormData({ ...formData, parcela_atual: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_valor_parcela">Valor da Parcela</Label>
                  <Input
                    id="edit_valor_parcela"
                    type="number"
                    step="0.01"
                    value={formData.valor_parcela}
                    onChange={(e) => setFormData({ ...formData, valor_parcela: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_data_vencimento">Data de Vencimento</Label>
                <Input
                  id="edit_data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditingConta(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Atualizar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
