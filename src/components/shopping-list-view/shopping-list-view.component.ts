import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShoppingList, ShoppingListItem } from '../../models/shopping-list.model';
import { ShoppingListService } from '../../services/shopping-list.service';
// FIX: Add Observable and of, remove unused imports and use modern rxjs operator imports
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-shopping-list-view',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './shopping-list-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingListViewComponent {
  listId = input.required<string | null>();
  
  private shoppingListService = inject(ShoppingListService);
  
  newItemName = signal('');
  shareEmail = signal('');
  shareMessage = signal('');
  shareMessageIsError = signal(false);

  private listId$ = toObservable(this.listId);

  // FIX: Refactored to use a direct document subscription for better performance and correctness.
  private listData$ = this.listId$.pipe(
    switchMap(id => {
      if (!id) return of(null);
      return this.shoppingListService.getListById(id);
    })
  );

  list = toSignal(this.listData$);

  items = computed(() => this.list()?.items ?? []);

  async addItem() {
    const name = this.newItemName().trim();
    const id = this.listId();
    if (name && id) {
      // FIX: Use the service method for an atomic update and safer ID generation.
      await this.shoppingListService.addItem(id, name);
      this.newItemName.set('');
    }
  }

  async toggleItem(item: ShoppingListItem) {
    const id = this.listId();
    if (id) {
        const updatedItems = this.items().map(i => 
            i.id === item.id ? { ...i, checked: !i.checked } : i
        );
        await this.shoppingListService.updateListItems(id, updatedItems);
    }
  }
  
  async removeItem(itemToRemove: ShoppingListItem) {
    const id = this.listId();
    if (id) {
        const updatedItems = this.items().filter(i => i.id !== itemToRemove.id);
        await this.shoppingListService.updateListItems(id, updatedItems);
    }
  }

  async handleShare() {
    this.shareMessage.set('');
    this.shareMessageIsError.set(false);
    const id = this.listId();
    const email = this.shareEmail().trim();

    if (id && email) {
      const result = await this.shoppingListService.shareList(id, email);
      this.shareMessage.set(result.message);
      this.shareMessageIsError.set(!result.success);
      if (result.success) {
        this.shareEmail.set('');
      }
    }
  }
  
  trackById(index: number, item: ShoppingListItem) {
    return item.id;
  }
}
