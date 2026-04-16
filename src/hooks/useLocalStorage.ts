import { useEffect, useState } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const rawValue = window.localStorage.getItem(key);
      if (!rawValue) {
        return initialValue;
      }

      return JSON.parse(rawValue) as T;
    } catch (error) {
      console.error(`Failed to parse localStorage key "${key}"`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save localStorage key "${key}"`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export default useLocalStorage;
