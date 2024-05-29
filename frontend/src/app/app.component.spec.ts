import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { Semester } from './model/semester'
import { Subject, Status } from './model/subject'
import { FormsModule, NgForm } from "@angular/forms";
import { RESP_FROM_BACKEND } from "../testing/backend-response"
import { CORRECT_INPUT } from '../testing/correct-input';
import { INCORRECT_INPUT } from '../testing/incorrect-input';
import * as FileSaver from 'file-saver';
import swal from 'sweetalert';
import * as CryptoJS from 'crypto-js';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { SweetAlert } from 'sweetalert/typings/core';
import { LocalStorageService } from './data-handling/local-storage.service';
import { JsonDataHandler } from './data-handling/json-data-handler';

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
    spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
    spyOn(XMLHttpRequest.prototype, 'send');
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  describe(".clickEventHandler(subj, index)", async () => {
    let app: AppComponent;

    beforeEach(function () {
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
      app = new AppComponent();

      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], app.curriculums[0])

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
      subject.status = Status.Enrolled
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

  describe(".dropEventHandler(event, index)", async () => {
    let app: AppComponent;

    beforeEach(function () {
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
      app = new AppComponent();


      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], app.curriculums[0])

    });

    it('should call transferArrayItem function when dropping to another semester)', () => {
      const event: CdkDragDrop<any[]> = { previousContainer: { element: { nativeElement: { classList: ["class1", "list-0"] } } }, container: { element: { nativeElement: { classList: ["class5", "list-5"] } } }, previousIndex: 7, currentIndex: 1 } as any;
      spyOn<any>(app, 'transferArrayItem');

      app.dropEventHandler(event, 5)

      // @ts-ignore
      expect(app.transferArrayItem).toHaveBeenCalledWith(0, 5, 7, 1);

    });

    it('should call curriculum.moveSubjectToSemester function when dropping to same semester)', () => {
      var container = { element: { nativeElement: { classList: ["class1", "list-0"] } } }
      const event: CdkDragDrop<any[]> = { previousContainer: container, container: container, previousIndex: 7, currentIndex: 1 } as any;
      spyOn<any>(app.curriculums[0], 'moveSubjectToSemester');

      app.dropEventHandler(event, 0)

      // @ts-ignore
      expect(app.curriculums[0].moveSubjectToSemester).toHaveBeenCalledWith(0, 0, 7, 1);

    });

    it('should emit an alert when dropping to a cross semester)', async () => {
      const event: CdkDragDrop<any[]> = { previousContainer: { element: { nativeElement: { classList: ["class1", "list-0"] } } }, container: { element: { nativeElement: { classList: ["class5", "list-5"] } } }, previousIndex: 7, currentIndex: 1 } as any;
      spyOn<any>(app.curriculums[0], 'moveSubjectToSemester');
      spyOn<any>(app.curriculums[0], 'prerequisiteIsFurther').and.returnValue(false);
      spyOn<any>(app.curriculums[0], 'overlayIsSooner').and.returnValue(false);

      app.dropEventHandler(event, 5)
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()

      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.dropEventHandler(event, 5)

      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()

      //@ts-ignore
      swal.close()
    });

    it('should emit an alert when the prerequisites are in a further semester)', async () => {
      const event: CdkDragDrop<any[]> = { previousContainer: { element: { nativeElement: { classList: ["class1", "list-0"] } } }, container: { element: { nativeElement: { classList: ["class5", "list-2"] } } }, previousIndex: 7, currentIndex: 1 } as any;
      spyOn<any>(app.curriculums[0], 'moveSubjectToSemester');
      spyOn<any>(app.curriculums[0], 'prerequisiteIsFurther').and.returnValue(true);
      spyOn<any>(app.curriculums[0], 'overlayIsSooner').and.returnValue(false);

      app.dropEventHandler(event, 2)
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()

      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.dropEventHandler(event, 2)

      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()

      //@ts-ignore
      swal.close()
    });

    it('should emit an alert when the overlays are in a sooner semester)', async () => {
      const event: CdkDragDrop<any[]> = { previousContainer: { element: { nativeElement: { classList: ["class1", "list-0"] } } }, container: { element: { nativeElement: { classList: ["class5", "list-2"] } } }, previousIndex: 7, currentIndex: 1 } as any;
      spyOn<any>(app.curriculums[0], 'moveSubjectToSemester');
      spyOn<any>(app.curriculums[0], 'prerequisiteIsFurther').and.returnValue(false);
      spyOn<any>(app.curriculums[0], 'overlayIsSooner').and.returnValue(true);

      app.dropEventHandler(event, 2)
      await new Promise(f => setTimeout(f, 10));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()

      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.dropEventHandler(event, 2)

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
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
      app = new AppComponent();

      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
        app.curriculums[1].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], app.curriculums[0])
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], app.curriculums[1])
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
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
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
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
      app = new AppComponent();

      for (let i = 0; i < 7; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], app.curriculums[0])
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

  describe(".submitFormEventHandler(form)", async () => {
    let app: AppComponent;

    beforeEach(function () {
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
      app = new AppComponent();

      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

    });

    it('should call semester.addNewSubject() and update the form for elective subject)', () => {
      spyOn(app.curriculums[0], 'subjectIsAlreadyIn').and.returnValue(false);
      spyOn(app.curriculums[0].semesters[3], 'addNewSubject');

      const testForm = <NgForm>{
        value: {
          name: "ExampleSubj",
          code: "IP-CODE",
          credit: 4,
          type: "",
          semester: 3,
          ken: ""
        }
      };

      app.subjectToAddSpecType = "not compulsory"

      app.submitFormEventHandler(testForm)

      expect(app.curriculums[0].semesters[3].addNewSubject).toHaveBeenCalled();
      expect(app.electiveSubjectsForm.name).toBe("")
      expect(app.electiveSubjectsForm.code).toBe("")
      expect(app.electiveSubjectsForm.credit).toBe(0)
      expect(app.electiveSubjectsForm.type).toBe("")
      expect(app.electiveSubjectsForm.semester).toBe(-1)

    });

    it('should call the methods for adding a subject and update the form for comp. elective subject)', () => {
      spyOn(app.curriculums[0], 'subjectIsAlreadyIn').and.returnValue(false);
      spyOn(app.curriculums[0], 'connectPrerequisites');
      spyOn(app.curriculums[0], 'setSubjectAvailability');
      spyOn(app.curriculums[0].semesters[5], 'addNewSubject');

      var resp = JSON.parse(RESP_FROM_BACKEND);
      //@ts-ignore
      JsonDataHandler.getElectiveData(resp[1], app.curriculums[0])

      const testForm = <NgForm>{
        value: {
          obligName: 6,
          semester: 5
        }
      };

      app.subjectToAddSpecType = "compulsory"

      app.submitFormEventHandler(testForm)

      expect(app.curriculums[0].semesters[5].addNewSubject).toHaveBeenCalled();
      expect(app.curriculums[0].connectPrerequisites).toHaveBeenCalled();
      expect(app.curriculums[0].setSubjectAvailability).toHaveBeenCalled();
      expect(app.compElectiveSubjectsForm.name).toBe("")
      expect(app.compElectiveSubjectsForm.semester).toBe(-1)

    });

    it('should emit an alert because the form fields are not correct)', async () => {
      spyOn(app.curriculums[0], 'subjectIsAlreadyIn').and.returnValue(false);

      const testForm = <NgForm>{
        value: {
          name: "ExampleSubjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj",
          code: "IP-CODEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
          credit: 31,
          type: "",
          semester: 3,
          ken: ""
        }
      };

      app.subjectToAddSpecType = "not compulsory"
      app.electiveSubjectsForm = testForm.value

      app.submitFormEventHandler(testForm)

      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.submitFormEventHandler(testForm)
      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()
    });

    it('should emit an alert because the elective subject is already in the curriculum)', async () => {
      spyOn(app.curriculums[0], 'subjectIsAlreadyIn').and.returnValue(true);

      const testForm = <NgForm>{
        value: {
          name: "Programozás",
          code: "IP-18PROGEG",
          credit: 5,
          type: "",
          semester: 4,
          ken: ""
        }
      };

      app.subjectToAddSpecType = "not compulsory"

      app.submitFormEventHandler(testForm)

      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.submitFormEventHandler(testForm)
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
      JsonDataHandler.getElectiveData(resp[1], app.curriculums[0])

      const testForm = <NgForm>{
        value: {
          obligName: 6,
          semester: 5
        }
      };

      app.subjectToAddSpecType = "compulsory"

      app.submitFormEventHandler(testForm)

      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.submitFormEventHandler(testForm)
      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()
    });

    it('should emit an alert because the comp. elective subject is already in the curriculum)', async () => {
      spyOn(app.curriculums[0], 'subjectIsAlreadyIn').and.returnValue(true);

      var resp = JSON.parse(RESP_FROM_BACKEND);
      //@ts-ignore
      JsonDataHandler.getElectiveData(resp[1], app.curriculums[0])

      const testForm = <NgForm>{
        value: {
          obligName: 6,
          semester: 5
        }
      };

      app.subjectToAddSpecType = "compulsory"

      app.submitFormEventHandler(testForm)

      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.submitFormEventHandler(testForm)
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
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
      app = new AppComponent();

      for (let i = 0; i < 7; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

    });

    it('should rerturn true if the elective subject form is filled)', () => {
      const testForm = <NgForm>{
        value: {
          name: "ExampleSubj",
          code: "IP-CODE",
          credit: 4,
          type: "",
          semester: 3,
          ken: ""
        }
      };

      app.subjectToAddSpecType = "not compulsory"
      app.electiveSubjectsForm = testForm.value

      var ok = app.checkForm()
      expect(ok).toBeTrue();
    });

    it('should return false if the elective subject form is not filled)', () => {
      const testForm = <NgForm>{
        value: {
          name: "ExampleSubj",
          code: "",
          credit: 4,
          type: "",
          semester: 3,
          ken: ""
        }
      };

      app.subjectToAddSpecType = "not compulsory"
      app.electiveSubjectsForm = testForm.value

      var ok = app.checkForm()
      expect(ok).toBeFalse();
    });

    it('should rerturn true if the comp. elective subject form is filled)', () => {
      const testForm = <NgForm>{
        value: {
          name: "ExampleSubj",
          code: "IP-CODE",
          credit: 4,
          type: "",
          semester: 3,
          ken: ""
        }
      };

      app.subjectToAddSpecType = "compulsory"
      app.compElectiveSubjectsForm = testForm.value

      var ok = app.checkForm()
      expect(ok).toBeTrue();
    });

    it('should return false if the comp. elective subject form is not filled)', () => {
      const testForm = <NgForm>{
        value: {
          name: "ExampleSubj",
          code: "IP-CODE",
          credit: 4,
          type: "",
          semester: -1,
          ken: ""
        }
      };

      app.subjectToAddSpecType = "compulsory"
      app.compElectiveSubjectsForm = testForm.value

      var ok = app.checkForm()
      expect(ok).toBeFalse();
    });

  });

  describe(".showDeleteSubjectModal(subj, idx)", () => {
    let app: AppComponent;

    beforeEach(function () {
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
      app = new AppComponent();
    });

    it('should set the message in hungarian and set the subject to delete)', () => {
      var subject = new Subject("IP-18PROGEG", "Programozás", 6, "", 0, [], [], 0, 1, "Kötelező", "Informatika", false)
      app.showDeleteSubjectModal(subject, 3)

      expect(app.modalTitleText).toBe("Tárgy törlése");
      expect(app.subjectToDelete).toBe(subject)
      expect(app.subjectToDeleteSemester).toBe(3)
    });

    it('should set the message in english and set the subject to delete)', () => {
      var subject = new Subject("IP-18PROGEG", "Programozás", 6, "", 0, [], [], 0, 1, "Kötelező", "Informatika", false)
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
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
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
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
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
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
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
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
      app = new AppComponent();

      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], app.curriculums[0])
    });

    it('should call FileSaver.saveAs', () => {
      spyOn(FileSaver, 'saveAs')
      app.saveCurriculumToFile()
      expect(FileSaver.saveAs).toHaveBeenCalled();
    });

  });

  describe(".saveCurriculumToStorage()", () => {
    let app: AppComponent;

    beforeEach(function () {
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
      app = new AppComponent();

      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], app.curriculums[0])
      app.storage.clear()
    });

    it('should save the curriculum to the Local Storage', () => {
      expect(app.storage.get(app.currentSpecName)).toBeNull();
      app.saveCurriculumToStorage()
      expect(app.storage.get(app.currentSpecName)).not.toBeNull();
      app.storage.remove(app.currentSpecName)
    });

  });

  describe(".loadCurriculumFromStorage()", () => {
    let app: AppComponent;

    beforeEach(function () {
      spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
      spyOn(XMLHttpRequest.prototype, 'send');
      app = new AppComponent();

      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], app.curriculums[0])
      app.saveCurriculumToStorage()
    });

    it('should load the curriculum correctly from the Local Storage', () => {
      var numberOfSubjectsInSemesters = []
      var semesters = app.curriculums[0].semesters
      for (let i = 0; i < app.curriculums[0].semesters.length; i++) {
        numberOfSubjectsInSemesters.push(app.curriculums[0].semesters[i].subjects.length);
      }
      app.loadCurriculumFromStorage()
      expect(app.curriculums[0].semesters).not.toBe(semesters);
      for (let i = 0; i < app.curriculums[0].semesters.length; i++) {
        expect(app.curriculums[0].semesters[i].subjects.length).toEqual(numberOfSubjectsInSemesters[i])
      }
      app.storage.remove(app.currentSpecName)
    });

  });

  describe(".loadCurriculumFromFile(event)", () => {
    let app: AppComponent;

    beforeEach(function () {
      spyOn(XMLHttpRequest.prototype, 'open');
      spyOn(XMLHttpRequest.prototype, 'send');
      app = new AppComponent();

      for (let i = 0; i < 6; i++) {
        app.curriculums[0].semesters.push(new Semester())
      }

      var resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], app.curriculums[0])
    });

    
    it('should load the curriculum from file', () => {
      const fakeFile = new File([CORRECT_INPUT], "file.txt", { type: "text/plain" });
      var event = {
        target: {
          files: [fakeFile]
        }
      }
      var numberOfSubjectsInSemesters = []
      for (let i = 0; i < app.curriculums[0].semesters.length; i++) {
        numberOfSubjectsInSemesters.push(app.curriculums[0].semesters[i].subjects.length);
      }

      app.loadCurriculumFromFile(event)
      for (let i = 0; i < app.curriculums[0].semesters.length; i++) {
        expect(app.curriculums[0].semesters[i].subjects.length).toEqual(numberOfSubjectsInSemesters[i])
      }
    });
    
    it('should emit an alert because of the wrong file format', async () => {
      var event = {
        target: {
          files: [new Blob([INCORRECT_INPUT], { type: 'text/plain;charset=utf-8' })]
        }
      }

      app.loadCurriculumFromFile(event)
      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()

      app.changeLanguage()
      app.loadCurriculumFromFile(event)
      await new Promise(f => setTimeout(f, 20));
      //@ts-ignore
      expect(swal.getState().isOpen).toBeTrue()
      //@ts-ignore
      swal.close()
    });
    
  });

});

