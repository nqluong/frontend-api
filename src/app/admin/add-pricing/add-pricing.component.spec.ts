import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPricingComponent } from './add-pricing.component';

describe('AddPricingComponent', () => {
  let component: AddPricingComponent;
  let fixture: ComponentFixture<AddPricingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPricingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddPricingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
