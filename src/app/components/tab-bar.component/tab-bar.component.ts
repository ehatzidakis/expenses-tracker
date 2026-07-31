import { Component, input, output } from '@angular/core';
import { AppTab } from '../../services/expense-state.service';

interface TabDef {
  id: AppTab;
  label: string;
}

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  host: { class: 'block' },
  templateUrl: './tab-bar.component.html',
})
export class TabBarComponent {
  activeTab = input<AppTab>('monthly');
  tabChange = output<AppTab>();

  readonly tabs: TabDef[] = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'sumup', label: 'SumUp' },
    { id: 'create', label: 'Create' },
    { id: 'oneoffs', label: 'OneOffs' },
    { id: 'charts', label: 'Charts' },
  ];

  onSelect(id: AppTab): void {
    this.tabChange.emit(id);
  }
}
