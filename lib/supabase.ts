import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not set');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para as tabelas do banco
export interface Transacao {
  id: number
  descricao: string
  categoria: string
  valor: number
  data: string
  tipo: 'entrada' | 'saida' | 'investimento'
  user_id?: string
  created_at?: string
  updated_at?: string
}

export interface Investimento {
  id: number
  nome: string
  tipo: string
  valor: number
  rentabilidade: string
  vencimento: string
  user_id?: string
  created_at?: string
  updated_at?: string
}

export interface Meta {
  id: number
  titulo: string
  valor_atual: number
  valor_meta: number
  categoria: string
  prazo: string
  user_id?: string
  created_at?: string
  updated_at?: string
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
