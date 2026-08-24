import { Injectable, computed, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);

  constructor() {
    onAuthStateChanged(auth, (nextUser) => {
      this.user.set(nextUser);
    });
  }

  async signIn(email: string, password: string): Promise<User> {
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    return credentials.user;
  }

  async createAccount(email: string, password: string): Promise<User> {
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    return credentials.user;
  }

  async signOutUser(): Promise<void> {
    await signOut(auth);
  }

  async signOut(): Promise<void> {
    await this.signOutUser();
  }
}
