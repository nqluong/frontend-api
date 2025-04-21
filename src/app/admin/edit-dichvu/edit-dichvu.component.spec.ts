import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDichvuComponent } from './edit-dichvu.component';

describe('EditDichvuComponent', () => {
  let component: EditDichvuComponent;
  let fixture: ComponentFixture<EditDichvuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDichvuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditDichvuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
