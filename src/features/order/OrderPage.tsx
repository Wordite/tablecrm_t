import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createSale,
  fetchContragents,
  fetchOrganizations,
  fetchPayboxes,
  fetchPriceTypes,
  fetchProducts,
  fetchWarehouses,
  type SaleGood,
  type SaleSettings,
} from '../../services/tablecrm.ts'
import type {
  Contragent,
  Paybox,
  Organization,
  Warehouse,
  PriceType,
  Product,
} from '../../types/tablecrm.ts'
import { getOrganizationName } from '../../types/tablecrm.ts'
import { useOrderStore } from '../../store/orderStore.ts'

const MIN_PHONE_LENGTH = 6
const MIN_SEARCH_LENGTH = 2

const Section = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    <div className="mt-3 space-y-3">{children}</div>
  </section>
)

export const OrderPage = () => {
  const {
    tokenInput,
    setTokenInput,
    token,
    applyToken,
    phone,
    setPhone,
    contragentId,
    setContragentId,
    payboxId,
    setPayboxId,
    organizationId,
    setOrganizationId,
    warehouseId,
    setWarehouseId,
    priceTypeId,
    setPriceTypeId,
    comment,
    productSearch,
    setProductSearch,
    items,
    addProduct,
    updateItem,
    removeItem,
    resetForm,
  } = useOrderStore()

  const {
    data: contragents = [],
    isFetching: contragentsLoading,
    refetch: refetchContragents,
  } = useQuery<Contragent[]>({
    queryKey: ['contragents', token, phone],
    queryFn: () => fetchContragents(token, phone),
    enabled: Boolean(token) && phone.length >= MIN_PHONE_LENGTH,
    staleTime: 60 * 1000,
  })

  const { data: payboxes = [], isFetching: payboxesLoading } =
    useQuery<Paybox[]>({
    queryKey: ['payboxes', token],
    queryFn: () => fetchPayboxes(token),
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  })

  const { data: organizations = [], isFetching: organizationsLoading } =
    useQuery<Organization[]>({
    queryKey: ['organizations', token],
    queryFn: () => fetchOrganizations(token),
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  })

  const { data: warehouses = [], isFetching: warehousesLoading } =
    useQuery<Warehouse[]>({
    queryKey: ['warehouses', token],
    queryFn: () => fetchWarehouses(token),
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  })

  const { data: priceTypes = [], isFetching: priceTypesLoading } =
    useQuery<PriceType[]>({
    queryKey: ['priceTypes', token],
    queryFn: () => fetchPriceTypes(token),
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  })

  const {
    data: products = [],
    isFetching: productsLoading,
    refetch: refetchProducts,
  } = useQuery<Product[]>({
    queryKey: ['products', token, productSearch],
    queryFn: () => fetchProducts(token, productSearch),
    enabled: Boolean(token) && productSearch.length >= MIN_SEARCH_LENGTH,
  })

  const organizationsWithName = useMemo(
    () =>
      organizations.map((org) => ({
        id: org.id,
        name: getOrganizationName(org),
      })),
    [organizations],
  )

  const mutation = useMutation({
    mutationFn: (conduct: boolean) => {
      if (
        !payboxId ||
        !organizationId ||
        !warehouseId ||
        items.length === 0
      ) {
        throw new Error('Не все обязательные поля заполнены')
      }

      const total = items.reduce(
        (sum, item) =>
          sum + item.quantity * item.price - (item.discount ?? 0),
        0,
      )

      const settings: SaleSettings = {
        repeatability_period: 'minutes',
        repeatability_value: 0,
        date_next_created: 0,
        transfer_from_weekends: true,
        skip_current_month: true,
        repeatability_count: 0,
        default_payment_status: false,
        repeatability_tags: false,
        repeatability_status: true,
      }

      return createSale(token, {
        number: undefined,
        dated: Math.floor(Date.now() / 1000),
        operation: 'Заказ',
        tags: '',
        parent_docs_sales: undefined,
        comment: comment || undefined,
        client: contragentId ?? undefined,
        contragent: contragentId ?? undefined,
        contract: undefined,
        organization: organizationId,
        loyality_card_id: undefined,
        warehouse: warehouseId,
        paybox: payboxId,
        tax_included: true,
        tax_active: true,
        settings,
        sales_manager: undefined,
        paid_rubles: conduct ? total : 0,
        paid_lt: 0,
        status: conduct,
        tech_card_operation_uuid: undefined,
        goods: items.map((item): SaleGood => {
          const good: SaleGood = {
            price_type: priceTypeId ?? undefined,
            price: item.price,
            quantity: item.quantity,
            tax: 0,
            discount: item.discount ?? 0,
            sum_discounted: (item.discount ?? 0) * item.quantity,
            status: conduct ? 'completed' : 'draft',
            nomenclature: String(item.product.id),
            nomenclature_name: item.product.name,
            unit_name: item.product.unit,
          }
          if (item.product.unit) {
            const unitNum = Number(item.product.unit)
            if (!isNaN(unitNum)) {
              good.unit = unitNum
            }
          }
          return good
        }),
        priority: conduct ? 10 : 0,
        is_marketplace_order: false,
      })
    },
    onSuccess: () => {
      resetForm()
    },
  })

  const selectedContragent = useMemo(
    () => contragents.find((c) => c.id === contragentId),
    [contragents, contragentId],
  )

  const handleSelectContragent = (client: Contragent) => {
    setContragentId(client.id)
    if (!phone && client.phone) {
      setPhone(client.phone)
    }
  }

  const isReadyToSubmit =
    Boolean(token) &&
    Boolean(payboxId) &&
    Boolean(organizationId) &&
    Boolean(warehouseId) &&
    Boolean(priceTypeId) &&
    items.length > 0

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4">
        <header className="text-center">
          <p className="text-sm uppercase tracking-wide text-slate-500">
            tablecrm.com
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Оформление заказа
          </h1>
        </header>

        <Section title="1. Авторизация по токену">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base outline-none focus:border-slate-400"
              placeholder="Введите токен кассы"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
            />
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:bg-slate-300"
              onClick={applyToken}
              disabled={!tokenInput}
            >
              Применить
            </button>
          </div>
          {token && (
            <p className="text-sm text-emerald-600">
              Токен активен. Данные подтягиваются автоматически.
            </p>
          )}
        </Section>

        <Section title="2. Клиент">
          <label className="block text-sm font-medium text-slate-600">
            Телефон клиента
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base outline-none focus:border-slate-400"
              placeholder="+79998887766"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>
              {contragentsLoading
                ? 'Поиск...'
                : phone.length >= MIN_PHONE_LENGTH
                  ? `${contragents.length} найдено`
                  : `Введите минимум ${MIN_PHONE_LENGTH} цифр`}
            </span>
            {phone.length >= MIN_PHONE_LENGTH && (
              <button
                type="button"
                className="text-slate-900 underline"
                onClick={() => refetchContragents()}
              >
                Обновить
              </button>
            )}
          </div>
          <div className="space-y-2">
            {contragents.map((client) => (
              <button
                type="button"
                key={client.id}
                onClick={() => handleSelectContragent(client)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                  contragentId === client.id
                    ? 'border-slate-900 bg-slate-900/5'
                    : 'border-slate-200'
                }`}
              >
                <p className="font-medium text-slate-900">{client.name}</p>
                {client.phone && (
                  <p className="text-slate-500">{client.phone}</p>
                )}
              </button>
            ))}
            {!contragents.length && phone.length >= MIN_PHONE_LENGTH && (
              <p className="text-sm text-slate-500">
                Клиенты не найдены. Можно создать нового при отправке.
              </p>
            )}
          </div>
          {selectedContragent && (
            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Выбран клиент: {selectedContragent.name}
            </div>
          )}
        </Section>

        <Section title="3. Реквизиты продажи">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Счет (касса)"
              placeholder="Выберите счет"
              options={payboxes}
              value={payboxId}
              onChange={setPayboxId}
              loading={payboxesLoading}
            />
            <SelectField
              label="Организация"
              placeholder="Выберите организацию"
              options={organizationsWithName}
              value={organizationId}
              onChange={setOrganizationId}
              loading={organizationsLoading}
            />
            <SelectField
              label="Склад"
              placeholder="Выберите склад"
              options={warehouses}
              value={warehouseId}
              onChange={setWarehouseId}
              loading={warehousesLoading}
            />
            <SelectField
              label="Тип цены"
              placeholder="Выберите тип"
              options={priceTypes}
              value={priceTypeId}
              onChange={setPriceTypeId}
              loading={priceTypesLoading}
            />
          </div>
        </Section>

        <Section title="4. Товары">
          <label className="block text-sm font-medium text-slate-600">
            Поиск по названию или артикулу
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base outline-none focus:border-slate-400"
              placeholder="Например, Латте"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>
              {productsLoading
                ? 'Загрузка товаров...'
                : productSearch.length >= MIN_SEARCH_LENGTH
                  ? `${products.length} найдено`
                  : `Введите минимум ${MIN_SEARCH_LENGTH} символа`}
            </span>
            {productSearch.length >= MIN_SEARCH_LENGTH && (
              <button
                type="button"
                className="text-slate-900 underline"
                onClick={() => refetchProducts()}
              >
                Обновить
              </button>
            )}
          </div>
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">
                    {product.article ?? 'Без артикула'}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-3 py-1 text-sm text-white"
                  onClick={() => addProduct(product)}
                >
                  Добавить
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.product.article ?? 'Без артикула'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-rose-500"
                    onClick={() => removeItem(item.product.id)}
                  >
                    Удалить
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <LabeledNumberInput
                    label="Кол-во"
                    value={item.quantity}
                    min={0.1}
                    step={0.1}
                    onChange={(value) =>
                      updateItem(item.product.id, 'quantity', value)
                    }
                  />
                  <LabeledNumberInput
                    label="Цена"
                    value={item.price}
                    min={0}
                    step={1}
                    onChange={(value) =>
                      updateItem(item.product.id, 'price', value)
                    }
                  />
                  <LabeledNumberInput
                    label="Скидка"
                    value={item.discount ?? 0}
                    min={0}
                    step={1}
                    onChange={(value) =>
                      updateItem(item.product.id, 'discount', value)
                    }
                  />
                </div>
              </div>
            ))}
            {!items.length && (
              <p className="text-sm text-slate-500">
                Добавьте товары, чтобы сформировать заказ.
              </p>
            )}
          </div>
        </Section>

        <Section title="5. Создание продажи">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-xl border border-slate-900 px-4 py-3 font-medium text-slate-900 disabled:border-slate-300 disabled:text-slate-400"
              disabled={!isReadyToSubmit || mutation.isPending}
              onClick={() => mutation.mutate(false)}
            >
              Создать продажу
            </button>
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-3 font-medium text-white disabled:bg-slate-300"
              disabled={!isReadyToSubmit || mutation.isPending}
              onClick={() => mutation.mutate(true)}
            >
              Создать и провести
            </button>
          </div>
          {mutation.isPending && (
            <p className="mt-3 text-sm text-slate-500">
              Отправляем данные, пожалуйста подождите...
            </p>
          )}
          {mutation.isSuccess && (
            <p className="mt-3 text-sm text-emerald-600">
              Продажа успешно создана.
            </p>
          )}
          {mutation.isError && (
            <p className="mt-3 text-sm text-rose-500">
              Не удалось создать продажу. Проверьте токен и данные.
            </p>
          )}
        </Section>
      </div>
    </div>
  )
}

interface SelectFieldProps {
  label: string
  placeholder: string
  value?: number
  options: Array<{ id: number; name: string }>
  onChange: (value: number) => void
  loading?: boolean
}

const SelectField = ({
  label,
  placeholder,
  value,
  options,
  onChange,
  loading,
}: SelectFieldProps) => (
  <label className="block text-sm font-medium text-slate-600">
    {label}
    <select
      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base outline-none focus:border-slate-400"
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      <option value="" disabled>
        {loading ? 'Загрузка...' : placeholder}
      </option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  </label>
)

interface LabeledNumberInputProps {
  label: string
  value: number
  min?: number
  step?: number
  onChange: (value: number) => void
}

const LabeledNumberInput = ({
  label,
  value,
  min,
  step,
  onChange,
}: LabeledNumberInputProps) => (
  <label className="block text-sm font-medium text-slate-600">
    {label}
    <input
      type="number"
      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base outline-none focus:border-slate-400"
      value={value}
      min={min}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </label>
)

