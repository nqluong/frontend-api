import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllDichvuComponent } from './all-dichvu.component';

describe('AllDichvuComponent', () => {
  let component: AllDichvuComponent;
  let fixture: ComponentFixture<AllDichvuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllDichvuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllDichvuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
