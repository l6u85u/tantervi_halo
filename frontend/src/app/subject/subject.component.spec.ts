import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from '../subject';

import { SubjectComponent } from './subject.component';

describe('SubjectComponent', () => {
  let component: SubjectComponent;
  let fixture: ComponentFixture<SubjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SubjectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SubjectComponent);
    component = fixture.componentInstance;
    component.box = new Subject("IP-18PROGEG","Programozás",6,"",0,[],[],0,1,"obligatory","Informatika",false)
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
