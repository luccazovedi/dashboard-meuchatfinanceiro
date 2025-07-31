import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not set');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos atualizados para a tabela de transações
export interface Transacao {
  id: number
  usuario_id: number // Alterado para inteiro
  categoria_id: number
  conta_bancaria_id?: number
  cartao_credito_id?: number
  tipo_pagamento_id?: number
  
  // Campos específicos para transferências
  conta_origem_id?: number
  conta_destino_id?: number
  
  // Campos básicos obrigatórios
  descricao: string
  valor: number
  data_transacao: string
  tipo: string // 'entrada', 'saida', 'investimento', 'transferencia'
  
  // Timestamps
  data_criacao?: string
  data_atualizacao?: string
}

export interface Investimento {
  usuario_id: string
  nome_investimento: string
  tipo: string
  valor_investimento: number
  rendimento: number
  data_aplicacao: string
  data_criacao: string
  data_atualizacao: string
}

export interface Meta {
  id: number
  titulo: string
  descricao?: string
  valor_meta: number
  valor_atual: number
  categoria: string
  prazo?: string
  status: 'ativa' | 'concluida' | 'pausada' | 'cancelada'
  usuario_id?: number
  created_at?: string
  updated_at?: string
}

// Novas interfaces atualizadas para as tabelas adicionais
export interface Despesa {
  id: number
  usuario_id: string
  categoria_id: number
  descricao: string
  valor: number
  data_despesa: string
  data_criacao: string
  data_atualizacao: string
}

export interface Entrada {
  id: number
  usuario_id: string
  categoria_id: number
  descricao: string
  valor: number
  data_despesa: string // Mantendo o nome da coluna original
  data_criacao: string
  data_atualizacao: string
}

export interface ContaAPagar {
  id?: number
  usuario_id: number
  conta_bancaria_id: number
  descricao: string
  valor_total: number
  qtd_parcelas: number
  parcela_atual: number
  valor_parcela: number
  data_vencimento: string
  quitado: boolean
  created_at?: string
  updated_at?: string
}

export interface ParcelaCota {
  id?: number
  cota_id?: number
  numero_parcela: number
  valor_parcela: number
  data_vencimento: string
  data_pagamento?: string
  quitado: boolean
  observacao?: string
  data_criacao?: string
  data_atualizacao?: string
}

// Interface para categorias do banco externo
export interface Categoria {
  id: number
  nome: string
  cor_padrao: string
  created_at: string
  updated_at: string
}

// Configuração de autenticação
export interface User {
  id: string
  email: string
  name?: string
  created_at?: string
}

// Interface para a tabela usuario personalizada
export interface Usuario {
  id: number
  email: string
  senha: string
  nome?: string
  created_at?: string
  updated_at?: string
}

// Interface para a tabela de categorias personalizadas
export interface CategoriaUsuario {
  id: number
  user_id: string
  nome: string
  cor: string
  created_at?: string
  updated_at?: string
}

// Interface para bancos
export interface Banco {
  id: number
  nome: string
  codigo: string
  created_at?: string
}

// Interface para configurações do usuário
export interface ConfiguracaoUsuario {
  id: number
  user_id: string
  configuracoes: {
    nome?: string
    telefone?: string
    bancos_selecionados: number[]
    categorias: Array<{
      id: string
      nome: string
      cor: string
    }>
  }
  created_at?: string
  updated_at?: string
}

// Interfaces para tabelas de referência
export interface ContaBancaria {
  id: number
  usuario_id: number
  banco_id: number
  nome_conta: string
  tipo_conta: string // 'corrente', 'poupanca', 'investimento'
  saldo_inicial?: number
  ativo: boolean
  data_criacao?: string
  data_atualizacao?: string
}

export interface CartaoCredito {
  id: number
  usuario_id: number
  nome_cartao: string
  bandeira: string // 'visa', 'mastercard', 'elo', 'amex'
  ultimos_digitos?: string
  limite?: number
  vencimento_fatura?: number // Dia do mês (1-31)
  ativo: boolean
  created_at?: string
  updated_at?: string
}

// Interface específica para a tabela cartoes_usuario
export interface CartaoUsuario {
  id: number
  user_id: number
  banco_id: number
  final_cartao: string
  data_fechamento: string
  data_vencimento: string
  limite: number
  ativo: boolean
  created_at?: string
  updated_at?: string
  conta_bancaria_id: number
}

export interface TipoPagamento {
  id: number
  nome: string
  descricao?: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}
