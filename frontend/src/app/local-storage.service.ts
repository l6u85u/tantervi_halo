import { Injectable } from '@angular/core';
import { IStorage } from './i-storage';

@Injectable({
  providedIn: 'root'
})

export class LocalStorageService implements IStorage{
  constructor() { }

  //set a value in local storage
  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  //get a value from local storage
  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  //remove a value from local storage
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  //clear all items from local storage
  clear(): void {
    localStorage.clear();
  }

}
