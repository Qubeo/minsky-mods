import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsvExportComponent } from './csv-export.component';

@NgModule({
  imports: [CommonModule, CsvExportComponent],
  exports: [CsvExportComponent],
})
export class CsvExportModule {}
