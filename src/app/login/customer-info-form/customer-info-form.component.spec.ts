import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerInfoFormComponent } from './customer-info-form.component';

describe('CustomerInfoFormComponent', () => {
  let component: CustomerInfoFormComponent;
  let fixture: ComponentFixture<CustomerInfoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerInfoFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomerInfoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
