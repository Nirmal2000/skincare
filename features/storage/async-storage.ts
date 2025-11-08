import AsyncStorage from "@react-native-async-storage/async-storage";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

async function setJSON<T extends Json>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function getJSON<T>(key: string): Promise<T | null> {
  const stored = await AsyncStorage.getItem(key);
  if (!stored) {
    return null;
  }

  return JSON.parse(stored) as T;
}

async function remove(key: string) {
  await AsyncStorage.removeItem(key);
}

export const storage = {
  setJSON,
  getJSON,
  remove,
};
