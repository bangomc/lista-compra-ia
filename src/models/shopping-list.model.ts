
export interface ShoppingListItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  name: string;
  ownerId: string;
  members: string[]; // array of user uids
  items: ShoppingListItem[];
  createdAt: any; // Firestore Timestamp
}
