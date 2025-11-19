export interface Contragent {
  id: number
  name: string
  phone?: string
  balance?: number
}

export interface Paybox {
  id: number
  name: string
  currency?: string
}

export interface Organization {
  id: number
  type?: string
  short_name?: string
  full_name?: string
  work_name?: string | null
  prefix?: string | null
  inn?: string | null
  kpp?: string | null
}

export const getOrganizationName = (org: Organization): string => {
  return org.work_name || org.short_name || org.full_name || `Организация #${org.id}`
}

export interface Warehouse {
  id: number
  name: string
  address?: string
}

export interface PriceType {
  id: number
  name: string
  currency?: string
}

export interface Product {
  id: number
  name: string
  article?: string
  price?: number
  unit?: string
  stock?: number
}

export interface OrderItem {
  product: Product
  quantity: number
  price: number
  discount?: number
  comment?: string
}

export interface OrderPayload {
  contragent_id: number
  paybox_id: number
  organization_id: number
  warehouse_id: number
  price_type_id: number
  comment?: string
  positions: Array<{
    nomenclature_id: number
    quantity: number
    price: number
    discount?: number
  }>
  phone?: string
  draft?: boolean
}

