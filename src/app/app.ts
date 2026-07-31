import { Component, inject } from '@angular/core';
import { ExpenseStateService } from './services/expense-state.service';
import { OverviewCardComponent } from './components/overview-card.component/overview-card.component';
import { HeaderComponent } from './components/header.component/header.component';
import { MonthSelectorComponent } from './components/month-selector.component/month-selector.component';
import { CategoryBreakdownComponent } from './components/category-breakdown.component/category-breakdown.component';
import { TabBarComponent } from './components/tab-bar.component/tab-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    OverviewCardComponent,
    MonthSelectorComponent,
    CategoryBreakdownComponent,
    TabBarComponent,
  ],
  templateUrl: './app.html',
})
export class AppComponent {
  state = inject(ExpenseStateService);
}
