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

  describe(".getSpec()", function () {
    var subjectComp : SubjectComponent;

    beforeEach(function () {
      subjectComp = new SubjectComponent()
    });

    it('should return the correct spec name', () => {
      subjectComp.box = new Subject("IP-18KWEBPROGEG", "Webprogramozás", 4, "", 0, [], [], 0, 3, "Kötelezően választható", "Informatika", false)
      subjectComp.languageIsHu = false
      expect(subjectComp.getSpec()).toBe("Comp. Elective")

      subjectComp.box = new Subject("IP-18KWEBPROGEG", "Webprogramozás", 4, "", 0, [], [], 0, 3, "Szabadon választható", "Informatika", false)
      expect(subjectComp.getSpec()).toBe("Elective")

      subjectComp.box = new Subject("IP-18KWEBPROGEG", "Webprogramozás", 4, "", 0, [], [], 0, 3, "Kötelező", "Informatika", false)
      expect(subjectComp.getSpec()).toBe("Compulsory")
    });

  });
});
