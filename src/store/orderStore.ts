import { create } from 'zustand'
import type { OrderItem, Product } from '../types/tablecrm.ts'

interface OrderStoreState {
  tokenInput: string
  token: string
  phone: string
  contragentId?: number
  payboxId?: number
  organizationId?: number
  warehouseId?: number
  priceTypeId?: number
  comment: string
  productSearch: string
  items: OrderItem[]
}

interface OrderStoreActions {
  setTokenInput: (value: string) => void
  applyToken: () => void
  setToken: (value: string) => void
  setPhone: (value: string) => void
  setContragentId: (id?: number) => void
  setPayboxId: (id?: number) => void
  setOrganizationId: (id?: number) => void
  setWarehouseId: (id?: number) => void
  setPriceTypeId: (id?: number) => void
  setComment: (value: string) => void
  setProductSearch: (value: string) => void
  setItems: (items: OrderItem[]) => void
  addProduct: (product: Product) => void
  updateItem: (productId: number, field: keyof OrderItem, value: number) => void
  removeItem: (productId: number) => void
  resetForm: () => void
}

const initialState: OrderStoreState = {
  tokenInput: '',
  token: '',
  phone: '',
  contragentId: undefined,
  payboxId: undefined,
  organizationId: undefined,
  warehouseId: undefined,
  priceTypeId: undefined,
  comment: '',
  productSearch: '',
  items: [],
}

export const useOrderStore = create<OrderStoreState & OrderStoreActions>((set, get) => ({
  ...initialState,
  setTokenInput: (value) => set({ tokenInput: value }),
  setToken: (value) => set({ token: value }),
  applyToken: () => {
    const { tokenInput } = get()
    set({ token: tokenInput.trim() })
  },
  setPhone: (value) => set({ phone: value }),
  setContragentId: (id) => set({ contragentId: id }),
  setPayboxId: (id) => set({ payboxId: id }),
  setOrganizationId: (id) => set({ organizationId: id }),
  setWarehouseId: (id) => set({ warehouseId: id }),
  setPriceTypeId: (id) => set({ priceTypeId: id }),
  setComment: (value) => set({ comment: value }),
  setProductSearch: (value) => set({ productSearch: value }),
  setItems: (items) => set({ items }),
  addProduct: (product) =>
    set((state) => {
      const existing = state.items.find((item) => item.product.id === product.id)
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        }
      }
      return {
        items: [
          ...state.items,
          {
            product,
            quantity: 1,
            price: product.price ?? 0,
          },
        ],
      }
    }),
  updateItem: (productId, field, value) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, [field]: value } : item,
      ),
    })),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    })),
  resetForm: () =>
    set((state) => ({
      ...state,
      phone: '',
      contragentId: undefined,
      payboxId: undefined,
      organizationId: undefined,
      warehouseId: undefined,
      priceTypeId: undefined,
      comment: '',
      items: [],
      productSearch: '',
    })),
}))

