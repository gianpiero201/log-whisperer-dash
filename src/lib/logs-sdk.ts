// Lightweight SDK to send logs to this project's Supabase
// Copy this file to other JS/TS projects or import directly if you publish it.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

export type LogLevel = Database['public']['Enums']['log_level'] | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export type LogEntryInput = {
  level: LogLevel
  message?: string
  service?: string
  source?: string
  meta?: Record<string, any>
  endpoint_id?: string
  timestamp?: string // ISO; optional (defaults to now on DB)
}

export type LogsSDKOptions = {
  supabaseClient?: SupabaseClient<Database>
  supabaseUrl?: string
  supabaseAnonKey?: string
  defaultService?: string
  defaultSource?: string
}

export class LogsSDK {
  private supabase: SupabaseClient<Database>
  private defaults: { service?: string; source?: string }

  constructor(opts: LogsSDKOptions) {
    const { supabaseClient, supabaseUrl, supabaseAnonKey, defaultService, defaultSource } = opts
    if (!supabaseClient) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Provide supabaseClient or supabaseUrl + supabaseAnonKey')
      }
      this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    } else {
      this.supabase = supabaseClient
    }
    this.defaults = { service: defaultService, source: defaultSource }
  }

  private async getUserId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser()
    if (error || !data?.user) {
      throw new Error('Usuário não autenticado no Supabase. Faça login antes de enviar logs.')
    }
    return data.user.id
  }

  private normalize(entry: LogEntryInput): Required<Omit<LogEntryInput, 'endpoint_id' | 'timestamp'>> & Pick<LogEntryInput, 'endpoint_id' | 'timestamp'> {
    const level = (entry.level || 'INFO').toUpperCase() as LogLevel
    if (!['DEBUG', 'INFO', 'WARN', 'ERROR'].includes(level)) {
      throw new Error(`Nível de log inválido: ${entry.level}`)
    }
    return {
      level,
      message: entry.message ?? '',
      service: entry.service ?? this.defaults.service ?? 'external-app',
      source: entry.source ?? this.defaults.source ?? 'sdk',
      meta: (entry.meta ?? {}) as Record<string, any>,
      endpoint_id: entry.endpoint_id,
      timestamp: entry.timestamp,
    }
  }

  async log(entry: LogEntryInput) {
    const userId = await this.getUserId()
    const e = this.normalize(entry)

    const { error } = await this.supabase.from('logs').insert({
      level: e.level as Database['public']['Enums']['log_level'],
      message: e.message || null,
      service: e.service || null,
      source: e.source || null,
      meta: e.meta as any,
      endpoint_id: e.endpoint_id || null,
      user_id: userId,
      // timestamp uses default now() if not provided
      ...(e.timestamp ? { timestamp: e.timestamp } : {}),
    })

    if (error) throw error
  }

  async batch(entries: LogEntryInput[]) {
    if (!entries?.length) return
    const userId = await this.getUserId()
    const rows = entries.map((entry) => {
      const e = this.normalize(entry)
      return {
        level: e.level as Database['public']['Enums']['log_level'],
        message: e.message || null,
        service: e.service || null,
        source: e.source || null,
        meta: e.meta as any,
        endpoint_id: e.endpoint_id || null,
        user_id: userId,
        ...(e.timestamp ? { timestamp: e.timestamp } : {}),
      }
    })

    const { error } = await this.supabase.from('logs').insert(rows)
    if (error) throw error
  }

  // Sugar helpers
  async debug(message: string, extra?: Omit<LogEntryInput, 'level' | 'message'>) {
    return this.log({ level: 'DEBUG', message, ...extra })
  }
  async info(message: string, extra?: Omit<LogEntryInput, 'level' | 'message'>) {
    return this.log({ level: 'INFO', message, ...extra })
  }
  async warn(message: string, extra?: Omit<LogEntryInput, 'level' | 'message'>) {
    return this.log({ level: 'WARN', message, ...extra })
  }
  async error(message: string, extra?: Omit<LogEntryInput, 'level' | 'message'>) {
    return this.log({ level: 'ERROR', message, ...extra })
  }
}

// Quick usage examples (to copy in other projects):
// Browser (com sessão do Supabase ativa):
// import { createClient } from '@supabase/supabase-js'
// import { LogsSDK } from './logs-sdk'
// const supabase = createClient('https://eypbmnritdshiiketlgq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
// const logger = new LogsSDK({ supabaseClient: supabase, defaultService: 'minha-web', defaultSource: 'frontend' })
// await logger.info('Página carregada', { meta: { path: location.pathname } })

// Node (server) com Supabase auth por usuário (ex.: token passado do front):
// const supabase = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${userAccessToken}` } } })
// const logger = new LogsSDK({ supabaseClient: supabase, defaultService: 'api', defaultSource: 'backend' })
// await logger.error('Falha ao processar pedido', { meta: { orderId: 123 } })
