import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPricingComponent } from './edit-pricing.component';

describe('EditPricingComponent', () => {
  let component: EditPricingComponent;
  let fixture: ComponentFixture<EditPricingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPricingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditPricingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
