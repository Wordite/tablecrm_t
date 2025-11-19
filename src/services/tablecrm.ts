import { buildTokenizedPath, tableCrmClient } from '../lib/apiClient.ts'
import type {
  Contragent,
  Organization,
  Paybox,
  PriceType,
  Product,
  Warehouse,
} from '../types/tablecrm.ts'

export interface PaginatedResponse<T> {
  results: T[]
  total?: number
}

const endpoints = {
  contragents: '/contragents/',
  warehouses: '/warehouses/',
  payboxes: '/payboxes/',
  organizations: '/organizations/',
  priceTypes: '/price_types/',
  nomenclature: '/nomenclature/',
  docsSales: '/docs_sales/',
}

const extractResults = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) {
    return data
  }
  if (data && typeof data === 'object') {
    if ('result' in data) {
      const result = (data as { result: unknown }).result
      return Array.isArray(result) ? result : []
    }
    if ('results' in data) {
      const results = (data as { results: unknown }).results
      return Array.isArray(results) ? results : []
    }
  }
  return []
}

export const fetchContragents = async (token: string, phone?: string) => {
  const params = new URLSearchParams()
  if (phone) params.append('phone', phone)
  const path = `${endpoints.contragents}?${params.toString()}`
  const { data } = await tableCrmClient.get<PaginatedResponse<Contragent> | Contragent[]>(
    buildTokenizedPath(path, token),
  )
  return extractResults<Contragent>(data)
}

export const fetchWarehouses = async (token: string) => {
  const { data } = await tableCrmClient.get<PaginatedResponse<Warehouse> | Warehouse[]>(
    buildTokenizedPath(endpoints.warehouses, token),
  )
  return extractResults<Warehouse>(data)
}

export const fetchPayboxes = async (token: string) => {
  const { data } = await tableCrmClient.get<PaginatedResponse<Paybox> | Paybox[]>(
    buildTokenizedPath(endpoints.payboxes, token),
  )
  return extractResults<Paybox>(data)
}

export const fetchOrganizations = async (token: string) => {
  const { data } = await tableCrmClient.get<PaginatedResponse<Organization> | Organization[]>(
    buildTokenizedPath(endpoints.organizations, token),
  )
  return extractResults<Organization>(data)
}

export const fetchPriceTypes = async (token: string) => {
  const { data } = await tableCrmClient.get<PaginatedResponse<PriceType> | PriceType[]>(
    buildTokenizedPath(endpoints.priceTypes, token),
  )
  return extractResults<PriceType>(data)
}

export const fetchProducts = async (
  token: string,
  search?: string,
  limit = 50,
) => {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  params.append('limit', limit.toString())
  const path = `${endpoints.nomenclature}?${params.toString()}`
  const { data } = await tableCrmClient.get<PaginatedResponse<Product> | Product[]>(
    buildTokenizedPath(path, token),
  )
  return extractResults<Product>(data)
}

export interface SaleGood {
  price_type?: number
  price: number
  quantity: number
  unit?: number
  unit_name?: string
  tax?: number
  discount?: number
  sum_discounted?: number
  status?: string
  nomenclature: number
  nomenclature_name?: string
}

export interface SaleSettings {
  repeatability_period?: string
  repeatability_value?: number
  date_next_created?: number
  transfer_from_weekends?: boolean
  skip_current_month?: boolean
  repeatability_count?: number
  default_payment_status?: boolean
  repeatability_tags?: boolean
  repeatability_status?: boolean
}

export interface CreateSalePayload {
  number?: string
  dated: number
  operation: string
  tags?: string
  parent_docs_sales?: number
  comment?: string
  client?: number
  contragent: number
  contract?: number
  organization: number
  loyality_card_id?: number
  warehouse: number
  paybox: number
  tax_included?: boolean
  tax_active?: boolean
  settings?: SaleSettings
  sales_manager?: number
  paid_rubles?: number
  paid_lt?: number
  status: boolean
  tech_card_operation_uuid?: string
  goods: SaleGood[]
  priority?: number
  is_marketplace_order?: boolean
}

export const createSale = async (
  token: string,
  payload: CreateSalePayload,
) => {
  const path = buildTokenizedPath(endpoints.docsSales, token)
  const { data } = await tableCrmClient.post(path, [payload])
  return data
}

