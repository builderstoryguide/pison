"use client"

import { useEffect, useState } from "react"

/**
 * A hook to persist form data to localStorage.
 * 
 * @param key The key to use for localStorage
 * @param initialData The initial data for the form
 * @param onDataLoaded Optional callback when data is loaded from storage
 * @returns An object containing the current data, a setter for the data, and a function to clear the saved data
 */
export function useFormPersistence<T>(
  key: string, 
  initialData: T,
  onDataLoaded?: (data: T) => void
) {
  const [data, setData] = useState<T>(initialData)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(key)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setData(parsedData)
        if (onDataLoaded) {
          onDataLoaded(parsedData)
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error loading data for key ${key}:`, error)
    } finally {
      setIsLoaded(true)
    }
  }, [key, onDataLoaded])

  // Save data to localStorage whenever it changes
  // We use a debounce-like effect by only saving when data changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error saving data for key ${key}:`, error)
      }
    }
  }, [data, key, isLoaded])

  const clearSavedData = () => {
    try {
      localStorage.removeItem(key)
      setData(initialData)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error clearing data for key ${key}:`, error)
    }
  }

  return { 
    data, 
    setData, 
    clearSavedData,
    isLoaded 
  }
}
