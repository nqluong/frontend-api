import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablesDatatablesComponent } from './tables-datatables.component';

describe('TablesDatatablesComponent', () => {
  let component: TablesDatatablesComponent;
  let fixture: ComponentFixture<TablesDatatablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablesDatatablesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablesDatatablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
