import axios from 'axios'

const BASE_URL = 'https://app.tablecrm.com/api/v1'

export const tableCrmClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const buildTokenizedPath = (path: string, token: string) => {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}token=${token}`
}

