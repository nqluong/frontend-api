import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomsSuitsComponent } from './rooms-suits.component';

describe('RoomsSuitsComponent', () => {
  let component: RoomsSuitsComponent;
  let fixture: ComponentFixture<RoomsSuitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomsSuitsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RoomsSuitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
