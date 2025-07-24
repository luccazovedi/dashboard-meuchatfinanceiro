"use client"

import { useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, TrendingUpIcon, WalletIcon, FilterIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Dados mockados para demonstração
const transacoesRecentes = [
  {
    id: 1,
    descricao: "Salário",
    categoria: "Receita",
    valor: 5000,
    data: "2024-01-15",
    tipo: "entrada",
  },
  {
    id: 2,
    descricao: "Supermercado",
    categoria: "Alimentação",
    valor: -350,
    data: "2024-01-14",
    tipo: "saida",
  },
  {
    id: 3,
    descricao: "Investimento CDB",
    categoria: "Investimento",
    valor: -1000,
    data: "2024-01-13",
    tipo: "investimento",
  },
  {
    id: 4,
    descricao: "Conta de Luz",
    categoria: "Utilidades",
    valor: -120,
    data: "2024-01-12",
    tipo: "saida",
  },
  {
    id: 5,
    descricao: "Freelance",
    categoria: "Receita Extra",
    valor: 800,
    data: "2024-01-11",
    tipo: "entrada",
  },
]

const dadosGraficos = {
  semanal: [
    { periodo: "Seg", valor: 120 },
    { periodo: "Ter", valor: 80 },
    { periodo: "Qua", valor: 200 },
    { periodo: "Qui", valor: 150 },
    { periodo: "Sex", valor: 300 },
    { periodo: "Sáb", valor: 250 },
    { periodo: "Dom", valor: 100 },
  ],
  mensal: [
    { periodo: "Jan", valor: 2500 },
    { periodo: "Fev", valor: 2200 },
    { periodo: "Mar", valor: 2800 },
    { periodo: "Abr", valor: 2400 },
    { periodo: "Mai", valor: 3000 },
    { periodo: "Jun", valor: 2700 },
  ],
  anual: [
    { periodo: "2020", valor: 28000 },
    { periodo: "2021", valor: 32000 },
    { periodo: "2022", valor: 35000 },
    { periodo: "2023", valor: 38000 },
    { periodo: "2024", valor: 15000 },
  ],
}

export default function FinanceDashboard() {
  const [periodoGrafico, setPeriodoGrafico] = useState("mensal")
  const [filtroCategoria, setFiltroCategoria] = useState("todas")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroData, setFiltroData] = useState("")

  const totalReceitas = transacoesRecentes.filter((t) => t.tipo === "entrada").reduce((acc, t) => acc + t.valor, 0)

  const totalDespesas = Math.abs(
    transacoesRecentes.filter((t) => t.tipo === "saida").reduce((acc, t) => acc + t.valor, 0),
  )

  const totalInvestimentos = Math.abs(
    transacoesRecentes.filter((t) => t.tipo === "investimento").reduce((acc, t) => acc + t.valor, 0),
  )

  const saldoTotal = totalReceitas - totalDespesas - totalInvestimentos

  // Obter categorias únicas
  const categoriasUnicas = [...new Set(transacoesRecentes.map((t) => t.categoria))]

  // Filtrar transações
  const transacoesFiltradas = transacoesRecentes.filter((transacao) => {
    const matchCategoria = filtroCategoria === "todas" || transacao.categoria === filtroCategoria
    const matchTipo = filtroTipo === "todos" || transacao.tipo === filtroTipo
    const matchData = !filtroData || transacao.data.includes(filtroData)

    return matchCategoria && matchTipo && matchData
  })

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltroCategoria("todas")
    setFiltroTipo("todos")
    setFiltroData("")
  }

  const dadosAtivos = dadosGraficos[periodoGrafico as keyof typeof dadosGraficos]
  const maxValor = Math.max(...dadosAtivos.map((d) => d.valor))

  return (
    <>
    {/* <a href="#" className="whatsapp fixed bottom-2 right-2 z-100">
      <img src="whats.webp" width={80} alt="" />
    </a> */}

    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Olá usuário</h1>
            <p className="text-gray-600">Bem vindo ao seu financeiro inteligente</p>
          </div>
          

          <a href="#" className="whatsapp flex items-center gap-1 px-3 py-2 rounded-md">
            Chat Financeiro <img src="whatsapp.png" className="whatsimg" width={30} alt="" />
          </a>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <WalletIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {saldoTotal.toLocaleString("pt-BR")}</div>
              <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <ArrowUpIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {totalReceitas.toLocaleString("pt-BR")}</div>
              <p className="text-xs text-muted-foreground">+8% em relação ao mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <ArrowDownIcon className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">R$ {totalDespesas.toLocaleString("pt-BR")}</div>
              <p className="text-xs text-muted-foreground">-3% em relação ao mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">R$ {totalInvestimentos.toLocaleString("pt-BR")}</div>
              <p className="text-xs text-muted-foreground">+25% em relação ao mês anterior</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Gráfico de Gastos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gastos por Período</CardTitle>
                  <CardDescription>Visualize seus gastos ao longo do tempo</CardDescription>
                </div>
                <Select value={periodoGrafico} onValueChange={setPeriodoGrafico}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dadosAtivos.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium">{item.periodo}</div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${(item.valor / maxValor) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-sm font-medium text-right">R$ {item.valor.toLocaleString("pt-BR")}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumo Rápido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Mês</CardTitle>
              <CardDescription>Janeiro 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Meta de Economia</span>
                <span className="font-medium">R$ 2.000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Economizado</span>
                <span className="font-medium text-green-600">R$ 1.530</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: "76.5%" }} />
              </div>
              <p className="text-xs text-gray-600">76.5% da meta alcançada</p>

              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Maior Gasto</span>
                  <span className="font-medium">Supermercado</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Categoria Top</span>
                  <span className="font-medium">Alimentação</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transações Recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>Suas últimas movimentações financeiras</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FilterIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
                {(filtroCategoria !== "todas" || filtroTipo !== "todos" || filtroData) && (
                  <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-6 px-2 text-xs">
                    <XIcon className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Filtro por Categoria */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Categoria</label>
                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as categorias</SelectItem>
                      {categoriasUnicas.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Tipo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="entrada">
                        <div className="flex items-center gap-2">
                          <ArrowUpIcon className="h-4 w-4 text-green-600" />
                          Entradas
                        </div>
                      </SelectItem>
                      <SelectItem value="saida">
                        <div className="flex items-center gap-2">
                          <ArrowDownIcon className="h-4 w-4 text-red-600" />
                          Saídas
                        </div>
                      </SelectItem>
                      <SelectItem value="investimento">
                        <div className="flex items-center gap-2">
                          <TrendingUpIcon className="h-4 w-4 text-blue-600" />
                          Investimentos
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Data */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Data</label>
                  <input
                    type="date"
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Contador de resultados */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  {transacoesFiltradas.length} de {transacoesRecentes.length} transações
                </span>
                {transacoesFiltradas.length === 0 && (
                  <span className="text-amber-600">Nenhuma transação encontrada com os filtros aplicados</span>
                )}
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacoesFiltradas.length > 0 ? (
                  transacoesFiltradas.map((transacao) => (
                    <TableRow key={transacao.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {transacao.tipo === "entrada" && <ArrowUpIcon className="h-4 w-4 text-green-600" />}
                          {transacao.tipo === "saida" && <ArrowDownIcon className="h-4 w-4 text-red-600" />}
                          {transacao.tipo === "investimento" && <TrendingUpIcon className="h-4 w-4 text-blue-600" />}
                          {transacao.descricao}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{transacao.categoria}</Badge>
                      </TableCell>
                      <TableCell>{new Date(transacao.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-medium ${
                            transacao.tipo === "entrada"
                              ? "text-green-600"
                              : transacao.tipo === "investimento"
                                ? "text-blue-600"
                                : "text-red-600"
                          }`}
                        >
                          {transacao.tipo === "entrada" ? "+" : ""}
                          R$ {Math.abs(transacao.valor).toLocaleString("pt-BR")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FilterIcon className="h-8 w-8 text-gray-300" />
                        <p>Nenhuma transação encontrada</p>
                        <p className="text-sm">Tente ajustar os filtros para ver mais resultados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
