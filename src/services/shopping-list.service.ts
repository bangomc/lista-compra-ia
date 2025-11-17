import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  query, 
  where, 
  addDoc, 
  serverTimestamp, 
  collectionData,
  doc,
  updateDoc,
  arrayUnion,
  getDocs,
  docData
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ShoppingList, ShoppingListItem } from '../models/shopping-list.model';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  private firestore: Firestore = inject(Firestore);

  getListsForUser(userId: string): Observable<ShoppingList[]> {
    const listsRef = collection(this.firestore, 'shoppingLists');
    const q = query(listsRef, where('members', 'array-contains', userId));
    return collectionData(q, { idField: 'id' }) as Observable<ShoppingList[]>;
  }

  // FIX: Added method to get a single list by ID with real-time updates.
  getListById(listId: string): Observable<ShoppingList | null> {
    const listRef = doc(this.firestore, `shoppingLists/${listId}`);
    return docData(listRef, { idField: 'id' }) as Observable<ShoppingList | null>;
  }

  async createList(userId: string, name: string): Promise<void> {
    const listsRef = collection(this.firestore, 'shoppingLists');
    await addDoc(listsRef, {
      name,
      ownerId: userId,
      members: [userId],
      items: [],
      createdAt: serverTimestamp()
    });
  }

  async addItem(listId: string, itemName: string): Promise<void> {
    const listRef = doc(this.firestore, `shoppingLists/${listId}`);
    const newItem: ShoppingListItem = {
      id: doc(collection(this.firestore, 'dummy')).id, // generate a unique ID
      name: itemName,
      checked: false
    };
    await updateDoc(listRef, {
      items: arrayUnion(newItem)
    });
  }
  
  async updateListItems(listId: string, items: ShoppingListItem[]): Promise<void> {
    const listRef = doc(this.firestore, `shoppingLists/${listId}`);
    await updateDoc(listRef, { items });
  }

  async shareList(listId: string, email: string): Promise<{success: boolean, message: string}> {
    if (!email) {
      return { success: false, message: 'Email inválido.' };
    }

    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('email', '==', email));
    
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return { success: false, message: 'Usuário não encontrado com este email.' };
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;

      const listRef = doc(this.firestore, `shoppingLists/${listId}`);
      await updateDoc(listRef, {
        members: arrayUnion(userId)
      });
      return { success: true, message: 'Lista compartilhada com sucesso!' };
    } catch (error) {
      console.error("Erro ao compartilhar lista:", error);
      return { success: false, message: 'Ocorreu um erro ao compartilhar.' };
    }
  }
}
