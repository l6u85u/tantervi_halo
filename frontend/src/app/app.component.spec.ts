import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent} from './app.component';
import { Semester } from './semester'
import { Subject } from './subject'
import { FormsModule, NgForm } from "@angular/forms";
import { RESP_FROM_BACKEND } from "../testing/backend-response"
import { SAVED_CURRICULUM } from '../testing/saved-data';
import { CORRECT_INPUT } from '../testing/correct_input';
import * as FileSaver from 'file-saver';
import swal from 'sweetalert';
import * as CryptoJS from 'crypto-js';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { SweetAlert } from 'sweetalert/typings/core';
import { LocalStorageService } from './local-storage.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule, FormsModule
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  describe(".clickEventHandler(subj, index)", async () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();


      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      app.curriculums[0].getObligatoryData(resp[0], false)

    });

    it('should emit an alert when the prerequisites are not completed)', async () => {
      spyOn<any>(app.curriculums[0], 'changeSubjectStatus').and.returnValue(["pre1", "pre2", "pre3"]);

      var subject = app.curriculums[0].semesters[0].subjects[0]
      app.clickEventHandler(subject, 0)
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.clickEventHandler(subject, 0)
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()
    });

    it('should emit an alert when the subject is the Szakdolgozati konzultacio)', async () => {
      spyOn<any>(app.curriculums[0], 'changeSubjectStatus').and.returnValue([]);

      var subject = app.curriculums[0].semesters[5].subjects[0]
      subject.status = 1
      app.clickEventHandler(subject, 5)
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.clickEventHandler(subject, 5)
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()
    });

  });

  describe(".drop(event, index)", async () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();


      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      app.curriculums[0].getObligatoryData(resp[0], false)

    });

    it('should call transferArrayItem function when dropping to another semester)', () => {
      const event: CdkDragDrop<any[]> = { previousContainer: { element: { nativeElement: { classList: ["class1", "list-0"] } } }, container: { element: { nativeElement: { classList: ["class5", "list-5"] } } }, previousIndex: 7, currentIndex: 1 } as any;
      spyOn<any>(app, 'transferArrayItem');

      app.drop(event, 5)

      // @ts-ignore
      expect(app.transferArrayItem).toHaveBeenCalledWith(0, 5, 7, 1);

    });

    it('should call curriculum.moveItemInArray function when dropping to same semester)', () => {
      var container = { element: { nativeElement: { classList: ["class1", "list-0"] } } }
      const event: CdkDragDrop<any[]> = { previousContainer: container, container: container, previousIndex: 7, currentIndex: 1 } as any;
      spyOn<any>(app.curriculums[0], 'moveItemInArray');

      app.drop(event, 0)

      // @ts-ignore
      expect(app.curriculums[0].moveItemInArray).toHaveBeenCalledWith(0, 0, 7, 1);

    });

    it('should emit an alert when dropping to a cross semester)', async () => {
      const event: CdkDragDrop<any[]> = { previousContainer: { element: { nativeElement: { classList: ["class1", "list-0"] } } }, container: { element: { nativeElement: { classList: ["class5", "list-5"] } } }, previousIndex: 7, currentIndex: 1 } as any;
      spyOn<any>(app.curriculums[0], 'moveItemInArray');
      spyOn<any>(app.curriculums[0], 'prerequisiteIsFurther').and.returnValue(false);
      spyOn<any>(app.curriculums[0], 'overlayIsSooner').and.returnValue(false);

      app.drop(event, 5)
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()

      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.drop(event, 5)

      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()

      //@ts-ignore
      swal.close()
    });

    it('should emit an alert when the prerequisites are in a further semester)', async () => {
      const event: CdkDragDrop<any[]> = { previousContainer: { element: { nativeElement: { classList: ["class1", "list-0"] } } }, container: { element: { nativeElement: { classList: ["class5", "list-2"] } } }, previousIndex: 7, currentIndex: 1 } as any;
      spyOn<any>(app.curriculums[0], 'moveItemInArray');
      spyOn<any>(app.curriculums[0], 'prerequisiteIsFurther').and.returnValue(true);
      spyOn<any>(app.curriculums[0], 'overlayIsSooner').and.returnValue(false);

      app.drop(event, 2)
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()

      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.drop(event, 2)

      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()

      //@ts-ignore
      swal.close()
    });

    it('should emit an alert when the overlays are in a sooner semester)', async () => {
      const event: CdkDragDrop<any[]> = { previousContainer: { element: { nativeElement: { classList: ["class1", "list-0"] } } }, container: { element: { nativeElement: { classList: ["class5", "list-2"] } } }, previousIndex: 7, currentIndex: 1 } as any;
      spyOn<any>(app.curriculums[0], 'moveItemInArray');
      spyOn<any>(app.curriculums[0], 'prerequisiteIsFurther').and.returnValue(false);
      spyOn<any>(app.curriculums[0], 'overlayIsSooner').and.returnValue(true);

      app.drop(event, 2)
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()

      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.drop(event, 2)

      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()

      //@ts-ignore
      swal.close()
    });

  });

  describe(".changeSpec(index)", function () {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();

      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      app.curriculums[0].getObligatoryData(resp[0], false)

    });

    it('should change the spec)', () => {
      spyOn<any>(app.curriculums[0], 'updateCurrentSubjectCode');
      spyOn<any>(app.curriculums[1], 'updateCredits');

      app.changeSpec(1)

      expect(app.currentSpecIdx).toBe(1)
      expect(app.currentSpecName).toBe("PTI Tervező")
      expect(app.curriculums[0].updateCurrentSubjectCode).toHaveBeenCalled();
      expect(app.curriculums[1].updateCredits).toHaveBeenCalled();
    });

  });

  describe(".addSemester()", async () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();


      for (let i = 0; i < 17; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

    });

    it('should call curriculum.addNewSemester)', () => {
      spyOn(app.curriculums[0], 'addNewSemester');

      app.addSemester()

      // @ts-ignore
      expect(app.curriculums[0].addNewSemester).toHaveBeenCalled();

    });

    it('should emit an alert because the number of semesters has reached the maximum limit)', async () => {
      app.curriculums[0].semesters.push(new Semester())
      app.addSemester()

      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.addSemester()
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()
    });

  });

  describe(".deleteSemester(index)", async () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();

      for (let i = 0; i < 7; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      app.curriculums[0].getObligatoryData(resp[0], false)
    });

    it('should call curriculum.deleteSemester)', () => {
      spyOn(app.curriculums[0], 'deleteSemester');
      app.deleteSemester(6)

      // @ts-ignore
      expect(app.curriculums[0].deleteSemester).toHaveBeenCalled();
    });

    it('should emit an alert because the semester in not empty)', async () => {
      app.deleteSemester(3)

      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.deleteSemester(1)
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()
    });

  });

  describe(".submitForm(form)", async () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();

      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

    });

    it('should call semester.addNewSubject() and update the form for optional subject)', () => {
      spyOn(app.curriculums[0], 'subjectIsAlreadyIn').and.returnValue(false);
      spyOn(app.curriculums[0].semesters[3], 'addNewSubject');

      const testForm = <NgForm>{
        value: {
          name: "ExampleSubj",
          code: "IP-CODE",
          credit: 4,
          type: "",
          semester: 3
        }
      };

      app.subjectToAddSpecType = "not obligatory"

      app.submitForm(testForm)

      expect(app.curriculums[0].semesters[3].addNewSubject).toHaveBeenCalled();
      expect(app.optionalSubjectsForm.name).toBe("")
      expect(app.optionalSubjectsForm.code).toBe("")
      expect(app.optionalSubjectsForm.credit).toBe(0)
      expect(app.optionalSubjectsForm.type).toBe("")
      expect(app.optionalSubjectsForm.semester).toBe(-1)

    });

    it('should call the methods for adding a subject and update the form for elective subject)', () => {
      spyOn(app.curriculums[0], 'subjectIsAlreadyIn').and.returnValue(false);
      spyOn(app.curriculums[0], 'connectPrerequisites');
      spyOn(app.curriculums[0], 'setSubjectAvailability');
      spyOn(app.curriculums[0].semesters[5], 'addNewSubject');

      var resp = JSON.parse(RESP_FROM_BACKEND);
      //@ts-ignore
      app.curriculums[0].getElectiveData(resp[1], false)

      const testForm = <NgForm>{
        value: {
          obligName: 6,
          semester: 5
        }
      };

      app.subjectToAddSpecType = "obligatory"

      app.submitForm(testForm)

      expect(app.curriculums[0].semesters[5].addNewSubject).toHaveBeenCalled();
      expect(app.curriculums[0].connectPrerequisites).toHaveBeenCalled();
      expect(app.curriculums[0].setSubjectAvailability).toHaveBeenCalled();
      expect(app.electiveSubjectsForm.name).toBe("")
      expect(app.electiveSubjectsForm.semester).toBe(-1)

    });

    it('should emit an alert because the form fields are not correct)', async () => {
      spyOn(app.curriculums[0], 'subjectIsAlreadyIn').and.returnValue(false);

      const testForm = <NgForm>{
        value: {
          name: "ExampleSubjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj",
          code: "IP-CODEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
          credit: 31,
          type: "",
          semester: 3
        }
      };

      app.subjectToAddSpecType = "not obligatory"
      app.optionalSubjectsForm = testForm.value

      app.submitForm(testForm)

      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.submitForm(testForm)
      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()
    });

    it('should emit an alert because the optional subject is already in the curriculum)', async () => {
      spyOn(app.curriculums[0], 'subjectIsAlreadyIn').and.returnValue(true);

      const testForm = <NgForm>{
        value: {
          name: "Programozás",
          code: "IP-18PROGEG",
          credit: 5,
          type: "",
          semester: 4
        }
      };

      app.subjectToAddSpecType = "not obligatory"

      app.submitForm(testForm)

      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.submitForm(testForm)
      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()
    });


    it('should emit an alert because the prerequisites are not completed)', async () => {
      spyOn(app.curriculums[0], 'subjectIsAlreadyIn').and.returnValue(false);
      spyOn(app.curriculums[0], 'prerequisiteIsFurther').and.returnValue(true)

      var resp = JSON.parse(RESP_FROM_BACKEND);
      //@ts-ignore
      app.curriculums[0].getElectiveData(resp[1], false)

      const testForm = <NgForm>{
        value: {
          obligName: 6,
          semester: 5
        }
      };

      app.subjectToAddSpecType = "obligatory"

      app.submitForm(testForm)

      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.submitForm(testForm)
      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()
    });

    it('should emit an alert because the elective subject is already in the curriculum)', async () => {
      spyOn(app.curriculums[0], 'subjectIsAlreadyIn').and.returnValue(true);

      var resp = JSON.parse(RESP_FROM_BACKEND);
      //@ts-ignore
      app.curriculums[0].getElectiveData(resp[1], false)

      const testForm = <NgForm>{
        value: {
          obligName: 6,
          semester: 5
        }
      };

      app.subjectToAddSpecType = "obligatory"

      app.submitForm(testForm)

      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.submitForm(testForm)
      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()
    });

  });

  describe(".checkForm()", () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();

      for (let i = 0; i < 7; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

    });

    it('should rerturn true if the optional subject form is filled)', () => {
      const testForm = <NgForm>{
        value: {
          name: "ExampleSubj",
          code: "IP-CODE",
          credit: 4,
          type: "",
          semester: 3
        }
      };

      app.subjectToAddSpecType = "not obligatory"
      app.optionalSubjectsForm = testForm.value

      var ok = app.checkForm()
      expect(ok).toBeTrue();
    });

    it('should return false if the optional subject form is not filled)', () => {
      const testForm = <NgForm>{
        value: {
          name: "ExampleSubj",
          code: "",
          credit: 4,
          type: "",
          semester: 3
        }
      };

      app.subjectToAddSpecType = "not obligatory"
      app.optionalSubjectsForm = testForm.value

      var ok = app.checkForm()
      expect(ok).toBeFalse();
    });

    it('should rerturn true if the elective subject form is filled)', () => {
      const testForm = <NgForm>{
        value: {
          name: "ExampleSubj",
          code: "IP-CODE",
          credit: 4,
          type: "",
          semester: 3
        }
      };

      app.subjectToAddSpecType = "obligatory"
      app.electiveSubjectsForm = testForm.value

      var ok = app.checkForm()
      expect(ok).toBeTrue();
    });

    it('should return false if the elective subject form is not filled)', () => {
      const testForm = <NgForm>{
        value: {
          name: "ExampleSubj",
          code: "IP-CODE",
          credit: 4,
          type: "",
          semester: -1
        }
      };

      app.subjectToAddSpecType = "obligatory"
      app.electiveSubjectsForm = testForm.value

      var ok = app.checkForm()
      expect(ok).toBeFalse();
    });

  });

  describe(".showDeleteSubjectModal(subj, idx)", () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();
    });

    it('should set the message in hungarian and set the subject to delete)', () => {
      var subject = new Subject("IP-18PROGEG", "Programozás", 6, "", 0, [], [], 0, 1, "obligatory", "Informatika", false)
      app.showDeleteSubjectModal(subject, 3)

      expect(app.modalTitleText).toBe("Tárgy törlése");
      expect(app.subjectToDelete).toBe(subject)
      expect(app.subjectToDeleteSemester).toBe(3)
    });

    it('should set the message in english and set the subject to delete)', () => {
      var subject = new Subject("IP-18PROGEG", "Programozás", 6, "", 0, [], [], 0, 1, "obligatory", "Informatika", false)
      app.changeLanguage()
      app.showDeleteSubjectModal(subject, 3)

      expect(app.modalTitleText).toBe("Delete subject");
      expect(app.subjectToDelete).toBe(subject)
      expect(app.subjectToDeleteSemester).toBe(3)
    });

  });

  describe(".showResetCurriculumModal(subj, idx)", () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();
    });

    it('should set the message in hungarian)', () => {
      app.showResetCurriculumModal()
      expect(app.modalTitleText).toBe("Tanterv törlése");
    });

    it('should set the message in english)', () => {
      app.changeLanguage()
      app.showResetCurriculumModal()
      expect(app.modalTitleText).toBe("Delete curriculum");
    });

  });

  describe(".deleteSubject()", () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();
    });

    it('should call curriculum.deleteSubject', () => {
      spyOn(app.curriculums[0], 'deleteSubject')
      app.deleteSubject()
      expect(app.curriculums[0].deleteSubject).toHaveBeenCalled();
    });

  });

  describe(".resetCurriculum()", () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();
    });

    it('should create a new curriculum', () => {
      var curriculum = app.curriculums[0]
      app.resetCurriculum()
      expect(app.curriculums[0] === curriculum).toBeFalse();
    });

  });

  describe(".saveCurriculumToFile()", () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();

      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      app.curriculums[0].getObligatoryData(resp[0], false)
    });

    it('should call FileSaver.saveAs', () => {
      spyOn(FileSaver, 'saveAs')
      app.saveCurriculumToFile()
      expect(FileSaver.saveAs).toHaveBeenCalled();
    });

  });

  /*describe(".openFile(event)", () => {
    let app: AppComponent;

    beforeEach(function () {
      app = new AppComponent();

      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      app.curriculums[0].getObligatoryData(resp[0], false)
    });

    it('should call app.loadDataFromFile', () => {
      spyOn<any>(app, 'loadDataFromFile')
      var event = {
        target: {
          files: [new Blob([CORRECT_INPUT],{ type: 'text/plain;charset=utf-8' })]
        }
      }
      
      app.openFile(event)
      // @ts-ignore
      expect(app.loadDataFromFile).toHaveBeenCalled();
    });

    it('should throw error: wrong file format', () => {
      spyOn<any>(app, 'loadDataFromFile').and.throwError("ERROR")
      var event = {
        target: {
          files: [new Blob([CORRECT_INPUT],{ type: 'text/plain;charset=utf-8' })]
        }
      }

      // @ts-ignore
      expect(() => {app.openFile(event)}).toThrowError();
    });

  });*/
});

