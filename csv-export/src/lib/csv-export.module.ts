import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CsvExportComponent } from './csv-export.component';

@NgModule({
  imports: [
    CommonModule,
    CsvExportComponent,
    RouterModule.forChild([
      { path: '', component: CsvExportComponent }
    ])
  ],
  exports: [CsvExportComponent],
})
export class CsvExportModule { }
