import { Curriculum } from './curriculum';
import { Semester } from './semester';
import { Subject } from './subject';

import { RESP_FROM_BACKEND } from "../testing/backend-response"
import { SAVED_CURRICULUM } from '../testing/saved-data';
import { CORRECT_INPUT } from '../testing/correct_input';
import { LocalStorageService } from './local-storage.service';

describe('Curriculum', () => {
  let curriculum: Curriculum;

  beforeEach(function () {
    spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
    spyOn(XMLHttpRequest.prototype, 'send');

    curriculum = new Curriculum(new LocalStorageService(), "PTI Modellező", "modellezo", 7, 2);
  });

  it('should initialize with default values', () => {
    expect(curriculum.completedCredits).toBe(0);
    expect(curriculum.enrolledCredits).toBe(0);
    expect(curriculum.semesters.length).toBe(0);
    expect(curriculum.electiveSubjects.length).toBe(0);
  });

  describe(".getObligatoryData(resp, isEnglish)", function () {
    let resp: any

    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      resp = JSON.parse(RESP_FROM_BACKEND);
    });

    it('should add subjects in the right semester', () => {
      // @ts-ignore
      curriculum.getObligatoryData(resp[0], false)

      expect(curriculum.semesters[0].subjects.length).toBe(8);
      expect(curriculum.semesters[1].subjects.length).toBe(9);
      expect(curriculum.semesters[2].subjects.length).toBe(9);
      expect(curriculum.semesters[3].subjects.length).toBe(11);
      expect(curriculum.semesters[4].subjects.length).toBe(8);
      expect(curriculum.semesters[5].subjects.length).toBe(1);
    });

    it('should set all the subjects in the first semester to available', () => {
      // @ts-ignore
      curriculum.getObligatoryData(resp[0], false)

      var ok = true
      for (let i = 0; i < curriculum.semesters[0].subjects.length; i++) {
        if (!curriculum.semesters[0].subjects[i].isAvailable) {
          ok = false
        }
      }

      expect(ok).toBeTrue()
    });

    it('should add all the overlays to the subjects', () => {
      // @ts-ignore
      curriculum.getObligatoryData(resp[0], false)

      //check the subjects in the first semester
      expect(curriculum.semesters[0].subjects[0].over.length).toBe(2);
      expect(curriculum.semesters[0].subjects[1].over.length).toBe(12);
      expect(curriculum.semesters[0].subjects[2].over.length).toBe(3);
      expect(curriculum.semesters[0].subjects[3].over.length).toBe(0);
      expect(curriculum.semesters[0].subjects[4].over.length).toBe(28);
      expect(curriculum.semesters[0].subjects[5].over.length).toBe(0);
      expect(curriculum.semesters[0].subjects[6].over.length).toBe(0);
      expect(curriculum.semesters[0].subjects[7].over.length).toBe(0);
    });

    it('should add prerequisites to subjects', () => {
      // @ts-ignore
      curriculum.getObligatoryData(resp[0], false)

      //check the Algoritmusok es adatszerkezetek I GY and EA subjects
      expect(curriculum.semesters[1].subjects[4].pre.length).toBe(2);
      expect(curriculum.semesters[1].subjects[4].pre[0].subject.code).toBe("IP-18MATAG");
      expect(curriculum.semesters[1].subjects[4].pre[0].weak).toBeFalse();
      expect(curriculum.semesters[1].subjects[4].pre[1].subject.code).toBe("IP-18PROGEG");
      expect(curriculum.semesters[1].subjects[4].pre[1].weak).toBeFalse();

      expect(curriculum.semesters[1].subjects[3].pre.length).toBe(1);
      expect(curriculum.semesters[1].subjects[3].pre[0].subject.code).toBe("IP-18AA1G");
      expect(curriculum.semesters[1].subjects[3].pre[0].weak).toBeTrue();
    });

    it('should add lecture or practice to subjects', () => {
      // @ts-ignore
      curriculum.getObligatoryData(resp[0], false)

      //check the Algoritmusok es adatszerkezetek I GY, EA and Programozas subjects
      expect(curriculum.semesters[1].subjects[4].type).toBe("GY");
      expect(curriculum.semesters[1].subjects[3].type).toBe("EA");
      expect(curriculum.semesters[0].subjects[1].type).toBe("");
    });

  });

  describe(".getElectiveData(resp, isEnglish)", function () {
    let resp: any

    beforeEach(function () {
      resp = JSON.parse(RESP_FROM_BACKEND);
    });

    it('should add all the elective subjects', () => {
      // @ts-ignore
      curriculum.getElectiveData(resp[1], false)

      expect(curriculum.electiveSubjects.length).toBe(41);
    });

    it('should add all the overlays to the subjects', () => {
      // @ts-ignore
      curriculum.getElectiveData(resp[1], false)

      //check the Webprogramozas, Programozasi Nyelvek (C++) and Python subjects
      expect(curriculum.electiveSubjects[6].code).toBe("IP-18KWEBPROGEG");
      expect(curriculum.electiveSubjects[6].over.length).toBe(4);

      expect(curriculum.electiveSubjects[32].code).toBe("IP-18KVPNY1EG");
      expect(curriculum.electiveSubjects[32].over.length).toBe(3);

      expect(curriculum.electiveSubjects[38].code).toBe("IP-18KVPYEG");
      expect(curriculum.electiveSubjects[38].over.length).toBe(0);
    });

    it('should add prerequisites to the subjects', () => {
      // @ts-ignore
      curriculum.getElectiveData(resp[1], false)

      //check the Kliensoldali webprog, Programozaselmelet GY and EA subjects
      expect(curriculum.electiveSubjects[7].code).toBe("IP-18KVIKWPROGEG");
      expect(curriculum.electiveSubjects[7].pre[0].subject.code).toBe("IP-18KWEBPROGEG");
      expect(curriculum.electiveSubjects[7].pre[0].weak).toBeFalse();

      expect(curriculum.electiveSubjects[19].code).toBe("IP-18KVSZPREE");
      expect(curriculum.electiveSubjects[19].pre[0].subject.code).toBe("IP-18KVSZPREG");
      expect(curriculum.electiveSubjects[19].pre[0].weak).toBeTrue();

      expect(curriculum.electiveSubjects[20].code).toBe("IP-18KVSZPREG");
      expect(curriculum.electiveSubjects[20].pre.length).toBe(0);
    });

    it('should add lecture or practice to subjects', () => {
      // @ts-ignore
      curriculum.getElectiveData(resp[1], false)

      //check the Kliensoldali webprog, Programozaselmelet GY and EA subjects
      expect(curriculum.electiveSubjects[7].code).toBe("IP-18KVIKWPROGEG");
      expect(curriculum.electiveSubjects[7].type).toBe("");

      expect(curriculum.electiveSubjects[19].code).toBe("IP-18KVSZPREE");
      expect(curriculum.electiveSubjects[19].type).toBe("EA");

      expect(curriculum.electiveSubjects[20].code).toBe("IP-18KVSZPREG");
      expect(curriculum.electiveSubjects[20].type).toBe("GY");
    });

  });

  describe(".getSubjects(curriculum)", function () {
    let curr: any

    beforeEach(function () {
      const jsonObject = JSON.parse(SAVED_CURRICULUM)
      curr = jsonObject["PTI Modellező"]
    });


    it('should add all the overlays to the subjects', () => {
      // @ts-ignore
      curriculum.getSubjects(curr)

      //check the subjects in the first semester
      expect(curriculum.semesters[0].subjects[0].over.length).toBe(2);
      expect(curriculum.semesters[0].subjects[1].over.length).toBe(12);
      expect(curriculum.semesters[0].subjects[2].over.length).toBe(3);
      expect(curriculum.semesters[0].subjects[3].over.length).toBe(0);
      expect(curriculum.semesters[0].subjects[4].over.length).toBe(28);
      expect(curriculum.semesters[0].subjects[5].over.length).toBe(0);
      expect(curriculum.semesters[0].subjects[6].over.length).toBe(0);
      expect(curriculum.semesters[0].subjects[7].over.length).toBe(0);
    });

    it('should add prerequisites to subjects', () => {
      // @ts-ignore
      curriculum.getSubjects(curr)

      //check the Algoritmusok es adatszerkezetek I GY and EA subjects
      expect(curriculum.semesters[1].subjects[4].pre.length).toBe(2);
      expect(curriculum.semesters[1].subjects[4].pre[0].subject.code).toBe("IP-18MATAG");
      expect(curriculum.semesters[1].subjects[4].pre[0].weak).toBeFalse();
      expect(curriculum.semesters[1].subjects[4].pre[1].subject.code).toBe("IP-18PROGEG");
      expect(curriculum.semesters[1].subjects[4].pre[1].weak).toBeFalse();

      expect(curriculum.semesters[1].subjects[3].pre.length).toBe(1);
      expect(curriculum.semesters[1].subjects[3].pre[0].subject.code).toBe("IP-18AA1G");
      expect(curriculum.semesters[1].subjects[3].pre[0].weak).toBeTrue();
    });

    it('should recalculate the credits', () => {
      // @ts-ignore
      curriculum.getSubjects(curr)

      expect(curriculum.enrolledCredits).toBe(82)
      expect(curriculum.completedCredits).toBe(70)
      expect(curriculum.enrolledCreditsPerc).toBe(82 / 1.8 + "%")
      expect(curriculum.completedCreditsPerc).toBe(70 / 1.8 + "%")
    });

    it('should keep the number of semesters', () => {
      // @ts-ignore
      curriculum.getSubjects(curr)
      expect(curriculum.semesters.length).toBe(7)
    });

    it('should keep the status of subjects', () => {
      // @ts-ignore
      curriculum.getSubjects(curr)

      let enrolledCounter = 0
      let completedCounter = 0

      curriculum.semesters.forEach(sem => {
        sem.subjects.forEach(subj => {
          if (subj.status == 1) {
            enrolledCounter += 1
          }
          else if (subj.status == 2) {
            completedCounter += 1
          }
        });
      });

      expect(enrolledCounter).toBe(4)
      expect(completedCounter).toBe(19)

    });

  });

  describe(".setSubjectAvailability(subj)", function () {
    let resp: any;

    beforeEach(function () {
      for (let i = 0; i < 6; i++) {
        curriculum.semesters.push(new Semester())
      }

      resp = JSON.parse(RESP_FROM_BACKEND);

      // @ts-ignore
      curriculum.getObligatoryData(resp[0], false)
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
      curriculum.getObligatoryData(resp[0], false)
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
      curriculum.getObligatoryData(resp[0], false)
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
      curriculum.getObligatoryData(resp[0], false)
      // @ts-ignore
      curriculum.getElectiveData(resp[1], false)
    });

    it('should add elective subject as an overlay to its prerequisites', () => {
      //Webprogramozas subject
      var subj = curriculum.electiveSubjects[6]

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
      curriculum.getObligatoryData(resp[0], false)
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
      curriculum.getObligatoryData(resp[0], false)
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
      curriculum.getObligatoryData(resp[0], false)
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
      curriculum.getObligatoryData(resp[0], false)
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
      curriculum.getObligatoryData(resp[0], false)
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
      curriculum.getObligatoryData(resp[0], false)
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
      curriculum.getObligatoryData(resp[0], false)
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
      curriculum.getObligatoryData(resp[0], false)
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

});
