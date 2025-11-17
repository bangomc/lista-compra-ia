import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from './services/auth.service';
import { ShoppingListService } from './services/shopping-list.service';

import { LoginComponent } from './components/login/login.component';
import { ShoppingListViewComponent } from './components/shopping-list-view/shopping-list-view.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { ShoppingList } from './models/shopping-list.model';
import { of } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LoginComponent, ShoppingListViewComponent, SpinnerComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  authService = inject(AuthService);
  shoppingListService = inject(ShoppingListService);
  
  user = toSignal(this.authService.user$);
  
  // FIX: Removed redundant user$ signal.
  
  private lists$ = computed(() => {
    const u = this.user();
    if (u) {
      return this.shoppingListService.getListsForUser(u.uid);
    }
    return of([]);
  });

  // FIX: Correctly convert the observable of lists to a signal. The previous implementation was buggy.
  shoppingLists = toSignal(this.lists$(), { initialValue: [] });
  
  isCreatingList = signal(false);
  newListName = signal('');
  selectedListId = signal<string | null>(null);

  isMenuOpen = signal(false);

  selectList(listId: string) {
    this.selectedListId.set(listId);
    this.isMenuOpen.set(false); // Close menu on selection for mobile
  }

  async createList() {
    const name = this.newListName().trim();
    const currentUser = this.user();
    if (name && currentUser) {
      await this.shoppingListService.createList(currentUser.uid, name);
      this.newListName.set('');
      this.isCreatingList.set(false);
    }
  }

  cancelCreateList() {
    this.newListName.set('');
    this.isCreatingList.set(false);
  }

  logout() {
    this.authService.signOut();
  }
}
