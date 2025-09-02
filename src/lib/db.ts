import PocketBase from 'pocketbase'
import type { TypedPocketBase } from './types'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090') as TypedPocketBase

export default pb
