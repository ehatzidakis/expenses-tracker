import { Injectable, computed, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { auth, db } from '../firebase.config';

export type UserRole = 'admin' | 'kiosk';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly adminUid = 'YnKzDa3eDIbeeYrRYEdJJikB7wu2';

  readonly user = signal<User | null>(null);
  readonly currentRole = signal<UserRole | null>(null);
  readonly authReady = signal(false);
  readonly isAuthenticated = computed(() => this.authReady() && this.user() !== null);
  readonly isAdmin = computed(() => this.currentRole() === 'admin');
  readonly isKiosk = computed(() => this.currentRole() === 'kiosk');

  constructor() {
    onAuthStateChanged(auth, async (nextUser) => {
      this.user.set(nextUser);

      if (!nextUser) {
        this.currentRole.set(null);
        this.authReady.set(true);
        return;
      }

      try {
        this.currentRole.set(await this.loadUserRole(nextUser.uid));
      } catch (error) {
        console.error('Failed to load user role:', error);
        this.currentRole.set(this.getFallbackRole(nextUser.uid));
      } finally {
        this.authReady.set(true);
      }
    });
  }

  private getFallbackRole(uid: string): UserRole {
    return uid === this.adminUid ? 'admin' : 'kiosk';
  }

  private async loadUserRole(uid: string): Promise<UserRole> {
    if (uid === this.adminUid) {
      return 'admin';
    }

    const profileRef = doc(db, 'users', uid);
    const profileSnap = await getDoc(profileRef);
    const storedRole = profileSnap.data()?.['role'];

    if (storedRole === 'kiosk') {
      return 'kiosk';
    }

    return this.getFallbackRole(uid);
  }

  private async upsertUserProfile(
    uid: string,
    email: string,
    role: UserRole = 'admin',
  ): Promise<void> {
    const profileRef = doc(db, 'users', uid);
    await setDoc(
      profileRef,
      {
        uid,
        email,
        role,
        createdAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  async signIn(email: string, password: string): Promise<User> {
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    return credentials.user;
  }

  async createAccount(email: string, password: string, role: UserRole = 'admin'): Promise<User> {
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    await this.upsertUserProfile(credentials.user.uid, credentials.user.email ?? email, role);
    this.currentRole.set(role);
    return credentials.user;
  }

  async signOutUser(): Promise<void> {
    this.currentRole.set(null);
    await signOut(auth);
  }

  async signOut(): Promise<void> {
    await this.signOutUser();
  }
}
