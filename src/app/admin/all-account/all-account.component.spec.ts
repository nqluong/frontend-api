import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllAccountComponent } from './all-account.component';

describe('AllAccountComponent', () => {
  let component: AllAccountComponent;
  let fixture: ComponentFixture<AllAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllAccountComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
