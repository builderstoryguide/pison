export class StorageUtils {
  static isAvailable(): boolean {
    try {
      return typeof window !== "undefined" && window.localStorage !== null
    } catch {
      return false
    }
  }

  static getItem<T>(key: string): T | null {
    if (!this.isAvailable()) return null

    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error)
      return null
    }
  }

  static setItem<T>(key: string, value: T): void {
    if (!this.isAvailable()) return

    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage:`, error)
    }
  }

  static removeItem(key: string): void {
    if (!this.isAvailable()) return

    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error)
    }
  }
}
