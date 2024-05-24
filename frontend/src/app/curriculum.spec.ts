import { Curriculum } from './curriculum';
import { Semester } from './semester';
import { Subject } from './subject';
import { JsonDataHandler } from './json-data-handler';
import { RESP_FROM_BACKEND } from "../testing/backend-response"

describe('Curriculum', () => {
  let curriculum: Curriculum;

  beforeEach(function () {
    spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
    spyOn(XMLHttpRequest.prototype, 'send');

    curriculum = new Curriculum("PTI Modellező", 7, 2);
  });

  it('should initialize with default values', () => {
    expect(curriculum.completedCredits).toBe(0);
    expect(curriculum.enrolledCredits).toBe(0);
    expect(curriculum.semesters.length).toBe(0);
    expect(curriculum.compElectiveSubjects.length).toBe(0);
  });

  describe(".setSubjectAvailability(subj)", function () {
    let resp: any;

    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should set availability to false (not all prerequisites are completed)', () => {
      var subject = new Subject("IP-18KWEBPROGEG", "Webprogramozás", 4, "", 0, [], [], 0, 3, "Kötelezően választható", "Informatika", false)
      subject.pre.push({ weak: false, subject: curriculum.semesters[1].subjects[2] })

      curriculum.setSubjectAvailability(subject)
      expect(subject.isAvailable).toBeFalse();
    });

    it('should set availability to true (all prerequisites are completed)', () => {
      var subject = new Subject("IP-18KWEBPROGEG", "Webprogramozás", 4, "", 0, [], [], 0, 3, "Kötelezően választható", "Informatika", false)
      subject.pre.push({ weak: false, subject: curriculum.semesters[1].subjects[2] })

      //set Webprog and Szamitogepes rendszerek subjects to completed status
      curriculum.semesters[1].subjects[2].status = 2
      curriculum.semesters[0].subjects[0].status = 2

      curriculum.setSubjectAvailability(subject)
      expect(subject.isAvailable).toBeTrue();
    });

    it('should set availability to true (there are no prerequisites)', () => {
      var subject = new Subject("IP-18KVPYEG", "Python", 5, "", 0, [], [], 0, 3, "Kötelezően választható", "Informatika", false)

      curriculum.setSubjectAvailability(subject)
      expect(subject.isAvailable).toBeTrue();
    });

  });

  describe(".moveItemInArray(prevColumnIdx, columnIdx, prevIdx, currentIdx)", function () {
    let resp: any

    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should move subject to a new semester', () => {
      expect(curriculum.semesters[0].subjects.length).toBe(8);
      expect(curriculum.semesters[5].subjects.length).toBe(1);

      curriculum.moveItemInArray(0, 5, 7, 1)

      expect(curriculum.semesters[0].subjects.length).toBe(7);
      expect(curriculum.semesters[5].subjects.length).toBe(2);
      expect(curriculum.semesters[5].subjects[1].name).toBe("Jogi ismeretek");
    });

    it('should move subject to a new index in the same semester', () => {
      expect(curriculum.semesters[0].subjects[0].name).toBe("Számítógépes rendszerek");

      curriculum.moveItemInArray(0, 0, 0, 5)

      expect(curriculum.semesters[0].subjects.length).toBe(8);
      expect(curriculum.semesters[0].subjects[5].name).toBe("Számítógépes rendszerek");
    });

  });

  describe(".deleteSubject(subj, semesterIdx)", function () {
    let resp: any

    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should delete subject with status not enrolled', () => {
      expect(curriculum.semesters[0].subjects.length).toBe(8);
      expect(curriculum.semesters[5].subjects.length).toBe(1);

      var subject = new Subject("IP-18KWEBPROGEG", "Webprogramozás", 4, "", 0, [], [], 0, 3, "Kötelezően választható", "Informatika", false)
      curriculum.semesters[5].addNewSubject(subject)
      expect(curriculum.semesters[5].subjects.includes(subject)).toBeTrue()

      curriculum.deleteSubject(subject, 5)
      expect(curriculum.semesters[5].subjects.includes(subject)).toBeFalse()
    });

    it('should delete subject with status enrolled', () => {
      expect(curriculum.semesters[0].subjects.length).toBe(8);
      expect(curriculum.semesters[5].subjects.length).toBe(1);

      var subject = new Subject("IP-18KWEBPROGEG", "Webprogramozás", 4, "", 0, [], [], 0, 3, "Kötelezően választható", "Informatika", false)
      curriculum.semesters[5].addNewSubject(subject)
      expect(curriculum.semesters[5].subjects.includes(subject)).toBeTrue()
      curriculum.changeSubjectStatus(subject, 5)
      expect(curriculum.enrolledCredits).toBe(4)
      expect(curriculum.enrolledCreditsPerc).toBe(4 / 1.8 + "%")

      curriculum.deleteSubject(subject, 5)
      expect(curriculum.semesters[5].subjects.includes(subject)).toBeFalse()
      expect(curriculum.enrolledCredits).toBe(0)
      expect(curriculum.enrolledCreditsPerc).toBe("0%")
      expect(curriculum.completedCredits).toBe(0)
      expect(curriculum.completedCreditsPerc).toBe("0%")
    });

    it('should delete subject with status completed (no overlays)', () => {
      expect(curriculum.semesters[0].subjects.length).toBe(8);
      expect(curriculum.semesters[5].subjects.length).toBe(1);

      var subject = new Subject("IP-18KWEBPROGEG", "Webprogramozás", 4, "", 0, [], [], 0, 3, "Kötelezően választható", "Informatika", false)
      curriculum.semesters[5].addNewSubject(subject)
      expect(curriculum.semesters[5].subjects.includes(subject)).toBeTrue()
      curriculum.changeSubjectStatus(subject, 5)
      curriculum.changeSubjectStatus(subject, 5)
      expect(curriculum.enrolledCredits).toBe(4)
      expect(curriculum.completedCredits).toBe(4)
      expect(curriculum.enrolledCreditsPerc).toBe(4 / 1.8 + "%")
      expect(curriculum.completedCreditsPerc).toBe(4 / 1.8 + "%")

      curriculum.deleteSubject(subject, 5)
      expect(curriculum.semesters[5].subjects.includes(subject)).toBeFalse()
      expect(curriculum.enrolledCredits).toBe(0)
      expect(curriculum.enrolledCreditsPerc).toBe("0%")
      expect(curriculum.completedCredits).toBe(0)
      expect(curriculum.completedCreditsPerc).toBe("0%")
    });

  });

  describe(".connectPrerequisites(subject)", function () {
    let resp: any

    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }
      resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
      // @ts-ignore
      JsonDataHandler.getElectiveData(resp[1], curriculum)
    });

    it('should add elective subject as an overlay to its prerequisites', () => {
      //Webprogramozas subject
      var subj = curriculum.compElectiveSubjects[6]

      //check Szamitogepes rendszerek and Webfejlesztes overlay list
      expect(curriculum.semesters[0].subjects[0].over.length).toBe(2)
      expect(curriculum.semesters[1].subjects[2].over.length).toBe(0)

      curriculum.connectPrerequisites(subj)
      expect(curriculum.semesters[0].subjects[0].over.length).toBe(2 + subj.over.length + 1)
      expect(curriculum.semesters[1].subjects[2].over.length).toBe(0 + subj.over.length + 1)
    });

  });

  describe(".changeSubjectStatus(subj, idx)", function () {
    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      let resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should change the status from not enrolled to enrolled', () => {
      var subject = curriculum.semesters[0].subjects[0]
      expect(subject.status).toBe(0);
      curriculum.changeSubjectStatus(subject, 0)
      expect(subject.status).toBe(1);
    });

    it('should change the status from enrolled to completed', () => {
      var subject = curriculum.semesters[0].subjects[0]
      subject.status = 1
      curriculum.changeSubjectStatus(subject, 0)
      expect(subject.status).toBe(2);
    });

    it('should change the status from completed to not enrolled', () => {
      var subject = curriculum.semesters[0].subjects[0]
      subject.status = 2
      curriculum.changeSubjectStatus(subject, 0)
      expect(subject.status).toBe(0);
    });

    it('should not change the status from not enrolled to enrolled because some prerequisites are not completed', () => {
      var subject = curriculum.semesters[1].subjects[0]
      expect(subject.status).toBe(0);
      var prerequisites = curriculum.changeSubjectStatus(subject, 0)
      expect(subject.status).toBe(0);
      expect(prerequisites.length).toBeGreaterThan(0)
    });

    it('should update the credits when changing the status from not enrolled to enrolled', () => {
      var subject = curriculum.semesters[0].subjects[0]
      curriculum.changeSubjectStatus(subject, 0)
      expect(curriculum.enrolledCredits).toBe(5)
      expect(curriculum.completedCredits).toBe(0)
      expect(curriculum.enrolledCreditsPerc).toBe(5 / 1.8 + "%")
      expect(curriculum.semesters[0].enrolledCredits).toBe(5)
      expect(curriculum.semesters[0].completedCredits).toBe(0)
    });

    it('should update the credits when changing the status from enrolled to completed', () => {
      var subject = curriculum.semesters[0].subjects[0]
      curriculum.changeSubjectStatus(subject, 0)
      curriculum.changeSubjectStatus(subject, 0)
      expect(curriculum.enrolledCredits).toBe(5)
      expect(curriculum.completedCredits).toBe(5)
      expect(curriculum.enrolledCreditsPerc).toBe(5 / 1.8 + "%")
      expect(curriculum.completedCreditsPerc).toBe(5 / 1.8 + "%")
      expect(curriculum.semesters[0].enrolledCredits).toBe(5)
      expect(curriculum.semesters[0].completedCredits).toBe(5)
    });

    it('should update the comp. elective and elective credits when changing the status from enrolled to completed', () => {
      var subject = new Subject("IP-18KWEBPROGEG", "Webprogramozás", 4, "", 0, [], [], 0, 3, "Kötelezően választható", "Informatika", false)
      curriculum.semesters[5].addNewSubject(subject)
      curriculum.changeSubjectStatus(subject, 5)
      expect(curriculum.compElectiveCreditsInfo).toBe(0)
      curriculum.changeSubjectStatus(subject, 5)
      expect(curriculum.compElectiveCreditsInfo).toBe(4)

      var subject = new Subject("IP-18KWEBPROGEG", "Example", 4, "", 0, [], [], 0, 3, "Kötelezően választható", "Számítástudomány", false)
      curriculum.semesters[5].addNewSubject(subject)
      curriculum.changeSubjectStatus(subject, 5)
      expect(curriculum.compElectiveCreditsCompScience).toBe(0)
      curriculum.changeSubjectStatus(subject, 5)
      expect(curriculum.compElectiveCreditsInfo).toBe(4)

      var subject = new Subject("IP-18KWEBPROGEG", "Example", 4, "", 0, [], [], 0, 3, "Szabadon választható", "Számítástudomány", false)
      curriculum.semesters[5].addNewSubject(subject)
      curriculum.changeSubjectStatus(subject, 5)
      expect(curriculum.electiveCredits).toBe(0)
      curriculum.changeSubjectStatus(subject, 5)
      expect(curriculum.electiveCredits).toBe(4)
    });

    it('should update the credits when changing the status from completed to not enrolled', () => {
      var subject = curriculum.semesters[0].subjects[0]
      curriculum.changeSubjectStatus(subject, 0)
      curriculum.changeSubjectStatus(subject, 0)
      curriculum.changeSubjectStatus(subject, 0)
      expect(curriculum.enrolledCredits).toBe(0)
      expect(curriculum.completedCredits).toBe(0)
      expect(curriculum.enrolledCreditsPerc).toBe("0%")
      expect(curriculum.completedCreditsPerc).toBe("0%")
      expect(curriculum.semesters[0].enrolledCredits).toBe(0)
      expect(curriculum.semesters[0].completedCredits).toBe(0)
    });

    it('should update the status of overlay subjects when changing the status from completed to not enrolled', () => {
      var subject = curriculum.semesters[0].subjects[0]
      curriculum.changeSubjectStatus(subject, 0)
      curriculum.changeSubjectStatus(subject, 0)

      //set the status to completed and enrolled to Webfejlesztes and Operacios rendszerek subjects
      curriculum.changeSubjectStatus(curriculum.semesters[1].subjects[2], 1)

      curriculum.semesters[1].subjects[0].status = 2
      curriculum.semesters[0].subjects[2].status = 2
      curriculum.changeSubjectStatus(curriculum.semesters[3].subjects[0], 3)
      curriculum.changeSubjectStatus(curriculum.semesters[3].subjects[0], 3)

      curriculum.changeSubjectStatus(subject, 0)
      expect(curriculum.enrolledCredits).toBe(0)
      expect(curriculum.completedCredits).toBe(0)
      expect(curriculum.enrolledCreditsPerc).toBe("0%")
      expect(curriculum.completedCreditsPerc).toBe("0%")
      expect(curriculum.semesters[3].subjects[0].status).toBe(0)
      expect(curriculum.semesters[1].subjects[2].status).toBe(0)
    });

    it('should update the availability of the overlay subjects when changing the status to completed', () => {
      var subject = curriculum.semesters[0].subjects[4] // Matematikai alapok

      // Diszkret matematika I Gy and Analizis I Gy
      expect(curriculum.semesters[1].subjects[6].isAvailable).toBeFalse()
      expect(curriculum.semesters[1].subjects[8].isAvailable).toBeFalse()

      curriculum.changeSubjectStatus(subject, 0)
      curriculum.changeSubjectStatus(subject, 0)

      expect(curriculum.semesters[1].subjects[6].isAvailable).toBeTrue()
      expect(curriculum.semesters[1].subjects[8].isAvailable).toBeTrue()
    });

  });

  describe(".overlayIsSooner(subject, columnIdx)", function () {
    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      let resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should return true if an overlay subject is in a previous semester', () => {
      //move Matematikai alapok subject to third semester
      expect(curriculum.overlayIsSooner(curriculum.semesters[0].subjects[4], 2)).toBeTrue()
    });

    it('should return true if an overlay subject is in the same semester (interdependency is not weak)', () => {
      //move Matematikai alapok subject to second semester
      expect(curriculum.overlayIsSooner(curriculum.semesters[0].subjects[4], 1)).toBeTrue()
    });

    it('should return false if the interdependency is weak with all the overlay subjects which are in the same semester', () => {
      //move Szamitogepes rendszerek subject to second semester
      expect(curriculum.overlayIsSooner(curriculum.semesters[0].subjects[0], 1)).toBeFalse()
    });

    it('should return false if no overlay subject is in a previous semester', () => {
      //move Programozasi nyelvek subject to third semester
      expect(curriculum.overlayIsSooner(curriculum.semesters[1].subjects[0], 2)).toBeFalse()
    });

  });

  describe(".prerequisiteIsFurther(subject, columnIdx)", function () {
    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      let resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should return true if a prerequisite subject is in a further semester', () => {
      //move Analizis II Gy subject to first semester
      expect(curriculum.prerequisiteIsFurther(curriculum.semesters[2].subjects[4], 0)).toBeTrue()
    });

    it('should return true if a prerequisite subject is in the same semester (interdependency is not weak)', () => {
      //move Analizis II Gy subject to second semester
      expect(curriculum.prerequisiteIsFurther(curriculum.semesters[2].subjects[4], 1)).toBeTrue()
    });

    it('should return false if the interdependency is weak with all the prerequisite subjects which are in the same semester', () => {
      //move Webfejlesztes subject to first semester
      expect(curriculum.prerequisiteIsFurther(curriculum.semesters[1].subjects[2], 0)).toBeFalse()
    });

    it('should return false if no prereqiuisite subject is in a further semester', () => {
      //move Operacios renedszerek subject to third semester
      expect(curriculum.prerequisiteIsFurther(curriculum.semesters[3].subjects[0], 2)).toBeFalse()
    });

  });

  describe(".subjectIsAlreadyIn(code)", function () {
    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      let resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should return true if the subject is already in the curriculum', () => {
      var subject = new Subject("IP-18PROGEG", "Programozás", 6, "", 0, [], [], 0, 1, "Kötelező", "Informatika", false)
      expect(curriculum.subjectIsAlreadyIn(subject.code)).toBeTrue()
    });

    it('should return false if the subject is not in the curriculum', () => {
      var subject = new Subject("IP-18KVPYEG", "Python", 5, "", 0, [], [], 0, 1, "Kötelezően választható", "Informatika", false)
      expect(curriculum.subjectIsAlreadyIn(subject.code)).toBeFalse()
    });

  });

  describe(".deleteSemester(index)", function () {
    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      let resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should delete semester with the index', () => {
      expect(curriculum.semesters.length).toBe(6)
      curriculum.deleteSemester(3)
      expect(curriculum.semesters.length).toBe(5)
      curriculum.deleteSemester(0)
      expect(curriculum.semesters.length).toBe(4)
    });

  });

  describe(".addNewSemester()", function () {
    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      let resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should add new semester', () => {
      expect(curriculum.semesters.length).toBe(6)
      curriculum.addNewSemester()
      expect(curriculum.semesters.length).toBe(7)
    });

  });

  describe(".updateCredits()", function () {
    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      let resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should recalculate the credits from scratch', () => {
      expect(curriculum.enrolledCredits).toBe(0)
      expect(curriculum.completedCredits).toBe(0)
      expect(curriculum.enrolledCreditsPerc).toBe("0%")
      expect(curriculum.completedCreditsPerc).toBe("0%")

      curriculum.semesters[0].subjects[0].status = 2
      curriculum.semesters[1].subjects[0].status = 2
      curriculum.semesters[2].subjects[0].status = 2
      curriculum.semesters[3].subjects[0].status = 2
      curriculum.semesters[4].subjects[0].status = 2

      curriculum.semesters[0].subjects[7].status = 1
      curriculum.semesters[1].subjects[8].status = 1
      curriculum.semesters[2].subjects[8].status = 1
      curriculum.semesters[3].subjects[10].status = 1
      curriculum.semesters[4].subjects[7].status = 1

      curriculum.updateCredits()

      expect(curriculum.enrolledCredits).toBe(36)
      expect(curriculum.completedCredits).toBe(19)
      expect(curriculum.enrolledCreditsPerc).toBe(36 / 1.8 + "%")
      expect(curriculum.completedCreditsPerc).toBe(19 / 1.8 + "%")
    });

  });

  describe(".updateCurrentSubjectCode(newValue)", function () {
    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      let resp = JSON.parse(RESP_FROM_BACKEND);
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should update the active subject', () => {
      expect(curriculum.currentSubjectCode).toBe("")
      curriculum.updateCurrentSubjectCode("IP-18OEPROGEG")
      expect(curriculum.currentSubjectCode).toBe("IP-18OEPROGEG")
    });

    it('should hide the prerequisites of the old subject', () => {
      curriculum.updateCurrentSubjectCode("IP-18OEPROGEG")
      curriculum.semesters[0].subjects[1].border = 2
      curriculum.updateCurrentSubjectCode("")
      expect(curriculum.semesters[0].subjects[1].border).toBe(0)
    });

    it('should hide the overlays of the old subject', () => {
      curriculum.updateCurrentSubjectCode("IP-18OEPROGEG")
      curriculum.semesters[1].subjects[1].status = 2
      curriculum.semesters[2].subjects[2].border = 3
      curriculum.semesters[3].subjects[10].border = 3
      curriculum.semesters[4].subjects[1].border = 3
      curriculum.semesters[4].subjects[2].border = 3

      curriculum.updateCurrentSubjectCode("IP-18OEPROGEG")
      expect(curriculum.semesters[2].subjects[2].border).toBe(0)
      expect(curriculum.semesters[3].subjects[10].border).toBe(0)
      expect(curriculum.semesters[4].subjects[1].border).toBe(0)
      expect(curriculum.semesters[4].subjects[2].border).toBe(0)
    });

  });
  
  describe(".changeSubjectSpec(subj)", function () {
    let resp: any;

    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)
    });

    it('should change subject spec from Kotelezoen valaszthato to Szabadon valaszthato)', () => {
      var subject = new Subject("IP-18KWEBPROGEG", "Webprogramozás", 4, "", 0, [], [], 0, 3, "Kötelezően választható", "Informatika", false)

      expect(subject.spec).toBe("Kötelezően választható");
      curriculum.changeSubjectSpec(subject)
      expect(subject.spec).toBe("Szabadon választható");
    });

    it('should change subject spec from Szabadon valaszthato to Kotelezoen valaszthato)', () => {
      var subject = new Subject("IP-18KWEBPROGEG", "Szabval1", 4, "", 0, [], [], 0, 3, "Szabadon választható", "Informatika", false)

      expect(subject.spec).toBe("Szabadon választható");
      curriculum.changeSubjectSpec(subject)
      expect(subject.spec).toBe("Kötelezően választható");
    });

    it('should update credits when changing from Szabadon valaszthato to Kotelezoen valaszthato)', () => {
      var subject = new Subject("IP-18KWEBPROGEG", "Szabval1", 4, "", 0, [], [], 0, 3, "Szabadon választható", "Informatika", false)
      curriculum.semesters[5].addNewSubject(subject)
      //set completed status
      curriculum.changeSubjectStatus(subject,5)
      curriculum.changeSubjectStatus(subject,5)

      expect(curriculum.compElectiveCreditsInfo).toBe(0);
      expect(curriculum.electiveCredits).toBe(4);
      curriculum.changeSubjectSpec(subject)
      expect(curriculum.compElectiveCreditsInfo).toBe(4);
      expect(curriculum.electiveCredits).toBe(0);
    });

    it('should update credits when changing from Kotelezoen valaszthato to Szabadon valaszthato)', () => {
      var subject = new Subject("IP-18KWEBPROGEG", "Example", 4, "", 0, [], [], 0, 3, "Kötelezően választható", "Számítástudomány", false)
      curriculum.semesters[5].addNewSubject(subject)
      //set completed status
      curriculum.changeSubjectStatus(subject,5)
      curriculum.changeSubjectStatus(subject,5)

      expect(curriculum.compElectiveCreditsCompScience).toBe(4);
      expect(curriculum.electiveCredits).toBe(0);
      curriculum.changeSubjectSpec(subject)
      expect(curriculum.compElectiveCreditsCompScience).toBe(0);
      expect(curriculum.electiveCredits).toBe(4);
    });
  });

});
