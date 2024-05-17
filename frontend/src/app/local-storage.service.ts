import { Injectable } from '@angular/core';
import { IStorage } from './i-storage';

@Injectable({
  providedIn: 'root'
})

export class LocalStorageService implements IStorage{
  constructor() { }

  // Set a value in local storage
  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  // Get a value from local storage
  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  // Remove a value from local storage
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  // Clear all items from local storage
  clear(): void {
    localStorage.clear();
  }

}
