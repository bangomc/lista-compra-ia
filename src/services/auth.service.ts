
import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, authState, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, docData } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AppUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  readonly user$: Observable<AppUser | null> = authState(this.auth).pipe(
    switchMap(user => {
      if (user) {
        return docData(doc(this.firestore, `users/${user.uid}`)) as Observable<AppUser>;
      } else {
        return of(null);
      }
    })
  );

  async googleSignIn(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      const credential = await signInWithPopup(this.auth, provider);
      await this.updateUserData(credential.user);
    } catch (error) {
      console.error("Erro no login com Google:", error);
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  private async updateUserData(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const data: AppUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
    await setDoc(userRef, data, { merge: true });
  }
}
