'use client'

import { useState } from 'react'
import { Plus, Target, Calendar, TrendingUp, Edit, Trash2, DollarSign, CheckCircle, Clock, Pause, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { useMetas } from '@/hooks/useSupabaseData'
import { Meta } from '@/lib/supabase'

interface MetasManagerProps {
  className?: string
}

const categoriasMetas = [
  'Emergência',
  'Viagem',
  'Casa Própria',
  'Carro',
  'Educação',
  'Aposentadoria',
  'Investimento',
  'Outros'
]

const statusColors = {
  ativa: 'bg-blue-500',
  concluida: 'bg-green-500', 
  pausada: 'bg-yellow-500',
  cancelada: 'bg-red-500'
}

const statusLabels = {
  ativa: 'Ativa',
  concluida: 'Concluída',
  pausada: 'Pausada', 
  cancelada: 'Cancelada'
}

export function MetasManager({ className }: MetasManagerProps) {
  const { 
    metas, 
    loading, 
    error, 
    addMeta, 
    updateMeta, 
    deleteMeta, 
    updateValorAtual,
    getProgressoMeta,
    getMetasProximasVencimento,
    getTotalEconomizado,
    getTotalObjetivo
  } = useMetas()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUpdateValueDialogOpen, setIsUpdateValueDialogOpen] = useState(false)
  const [selectedMeta, setSelectedMeta] = useState<Meta | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<'todas' | Meta['status']>('todas')

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    valor_meta: '',
    valor_atual: '',
    categoria: '',
    prazo: '',
    status: 'ativa' as Meta['status']
  })

  const [novoValor, setNovoValor] = useState('')

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      valor_meta: '',
      valor_atual: '',
      categoria: '',
      prazo: '',
      status: 'ativa'
    })
  }

  const handleAddMeta = async () => {
    try {
      if (!formData.titulo || !formData.valor_meta || !formData.categoria) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      await addMeta({
        titulo: formData.titulo,
        descricao: formData.descricao,
        valor_meta: parseFloat(formData.valor_meta),
        valor_atual: parseFloat(formData.valor_atual) || 0,
        categoria: formData.categoria,
        prazo: formData.prazo || undefined,
        status: formData.status
      })

      toast({
        title: "Sucesso",
        description: "Meta adicionada com sucesso!"
      })

      setIsAddDialogOpen(false)
      resetForm()
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar meta",
        variant: "destructive"
      })
    }
  }

  const handleEditMeta = async () => {
    try {
      if (!selectedMeta || !formData.titulo || !formData.valor_meta || !formData.categoria) {
        toast({
          title: "Erro", 
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      await updateMeta(selectedMeta.id, {
        titulo: formData.titulo,
        descricao: formData.descricao,
        valor_meta: parseFloat(formData.valor_meta),
        categoria: formData.categoria,
        prazo: formData.prazo || undefined,
        status: formData.status
      })

      toast({
        title: "Sucesso",
        description: "Meta atualizada com sucesso!"
      })

      setIsEditDialogOpen(false)
      setSelectedMeta(null)
      resetForm()
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar meta",
        variant: "destructive"
      })
    }
  }

  const handleDeleteMeta = async () => {
    try {
      if (!selectedMeta) return

      await deleteMeta(selectedMeta.id)

      toast({
        title: "Sucesso",
        description: "Meta removida com sucesso!"
      })

      setIsDeleteDialogOpen(false)
      setSelectedMeta(null)
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao remover meta",
        variant: "destructive"
      })
    }
  }

  const handleUpdateValue = async () => {
    try {
      if (!selectedMeta || !novoValor) {
        toast({
          title: "Erro",
          description: "Digite um valor válido",
          variant: "destructive"
        })
        return
      }

      await updateValorAtual(selectedMeta.id, parseFloat(novoValor))

      toast({
        title: "Sucesso", 
        description: "Valor atualizado com sucesso!"
      })

      setIsUpdateValueDialogOpen(false)
      setSelectedMeta(null)
      setNovoValor('')
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar valor",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (meta: Meta) => {
    setSelectedMeta(meta)
    setFormData({
      titulo: meta.titulo,
      descricao: meta.descricao || '',
      valor_meta: meta.valor_meta.toString(),
      valor_atual: meta.valor_atual.toString(),
      categoria: meta.categoria,
      prazo: meta.prazo || '',
      status: meta.status
    })
    setIsEditDialogOpen(true)
  }

  const openUpdateValueDialog = (meta: Meta) => {
    setSelectedMeta(meta)
    setNovoValor(meta.valor_atual.toString())
    setIsUpdateValueDialogOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const metasFiltradas = filtroStatus === 'todas' 
    ? metas 
    : metas.filter(meta => meta.status === filtroStatus)

  const metasProximasVencimento = getMetasProximasVencimento(30)
  const totalEconomizado = getTotalEconomizado()
  const totalObjetivo = getTotalObjetivo()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Economizado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalEconomizado)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objetivo Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalObjetivo)}
            </div>
            {totalObjetivo > 0 && (
              <p className="text-xs text-muted-foreground">
                {((totalEconomizado / totalObjetivo) * 100).toFixed(1)}% concluído
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas ao Vencimento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metasProximasVencimento.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Nos próximos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header com filtros e botão adicionar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Minhas Metas</h2>
          <p className="text-muted-foreground">
            Gerencie suas metas financeiras e acompanhe seu progresso
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={filtroStatus} onValueChange={(value: any) => setFiltroStatus(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="ativa">Ativas</SelectItem>
              <SelectItem value="concluida">Concluídas</SelectItem>
              <SelectItem value="pausada">Pausadas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Lista de metas */}
      <div className="grid gap-4">
        {metasFiltradas.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma meta encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {filtroStatus === 'todas' 
                ? 'Comece criando sua primeira meta financeira'
                : `Nenhuma meta ${statusLabels[filtroStatus as keyof typeof statusLabels].toLowerCase()} encontrada`
              }
            </p>
            {filtroStatus === 'todas' && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Meta
              </Button>
            )}
          </Card>
        ) : (
          metasFiltradas.map((meta) => {
            const progresso = getProgressoMeta(meta)
            const diasRestantes = meta.prazo 
              ? Math.ceil((new Date(meta.prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <Card key={meta.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {meta.titulo}
                        <Badge 
                          variant="secondary"
                          className={`${statusColors[meta.status]} text-white`}
                        >
                          {statusLabels[meta.status]}
                        </Badge>
                      </CardTitle>
                      {meta.descricao && (
                        <CardDescription>{meta.descricao}</CardDescription>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openUpdateValueDialog(meta)}
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(meta)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedMeta(meta)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progresso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-medium">{progresso.toFixed(1)}%</span>
                    </div>
                    <Progress value={progresso} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatCurrency(meta.valor_atual)}</span>
                      <span>{formatCurrency(meta.valor_meta)}</span>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Categoria:</span>
                      <p className="font-medium">{meta.categoria}</p>
                    </div>
                    {meta.prazo && (
                      <div>
                        <span className="text-muted-foreground">Prazo:</span>
                        <p className="font-medium">
                          {formatDate(meta.prazo)}
                          {diasRestantes !== null && (
                            <span className={`ml-2 ${diasRestantes <= 30 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                              ({diasRestantes > 0 ? `${diasRestantes} dias` : 'Vencida'})
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Dialog para adicionar meta */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Meta</DialogTitle>
            <DialogDescription>
              Crie uma nova meta financeira para acompanhar seu progresso
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                placeholder="Ex: Viagem para Europa"
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descreva sua meta..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor_meta">Valor Objetivo *</Label>
                <Input
                  id="valor_meta"
                  type="number"
                  step="0.01"
                  value={formData.valor_meta}
                  onChange={(e) => setFormData({...formData, valor_meta: e.target.value})}
                  placeholder="0,00"
                />
              </div>

              <div>
                <Label htmlFor="valor_atual">Valor Atual</Label>
                <Input
                  id="valor_atual"
                  type="number"
                  step="0.01"
                  value={formData.valor_atual}
                  onChange={(e) => setFormData({...formData, valor_atual: e.target.value})}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasMetas.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prazo">Prazo</Label>
              <Input
                id="prazo"
                type="date"
                value={formData.prazo}
                onChange={(e) => setFormData({...formData, prazo: e.target.value})}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleAddMeta} className="flex-1">
                Criar Meta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar meta */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
            <DialogDescription>
              Atualize as informações da sua meta
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-titulo">Título *</Label>
              <Input
                id="edit-titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-valor_meta">Valor Objetivo *</Label>
              <Input
                id="edit-valor_meta"
                type="number"
                step="0.01"
                value={formData.valor_meta}
                onChange={(e) => setFormData({...formData, valor_meta: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-categoria">Categoria *</Label>
              <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoriasMetas.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-prazo">Prazo</Label>
              <Input
                id="edit-prazo"
                type="date"
                value={formData.prazo}
                onChange={(e) => setFormData({...formData, prazo: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: Meta['status']) => setFormData({...formData, status: value})}>
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

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleEditMeta} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para atualizar valor */}
      <Dialog open={isUpdateValueDialogOpen} onOpenChange={setIsUpdateValueDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Atualizar Progresso</DialogTitle>
            <DialogDescription>
              Atualize o valor atual da meta "{selectedMeta?.titulo}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="novo-valor">Novo Valor</Label>
              <Input
                id="novo-valor"
                type="number"
                step="0.01"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsUpdateValueDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleUpdateValue} className="flex-1">
                Atualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para deletar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{selectedMeta?.titulo}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeta} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
