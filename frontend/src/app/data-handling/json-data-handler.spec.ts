import { JsonDataHandler } from './json-data-handler';
import { Curriculum } from '../model/curriculum';
import { Semester } from '../model/semester';
import { RESP_FROM_BACKEND } from "../../testing/backend-response"
import { SAVED_CURRICULUM } from '../../testing/saved-data';
import { Status } from '../model/subject';

describe('JsonDataHandler', () => {
  let curriculum: Curriculum;

  beforeEach(function () {
    spyOn(XMLHttpRequest.prototype, 'open').and.callThrough();
    spyOn(XMLHttpRequest.prototype, 'send');

    curriculum = new Curriculum("PTI Modellező", 7, 2);
  });

  it('should create an instance', () => {
    expect(new JsonDataHandler()).toBeTruthy();
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
      JsonDataHandler.getObligatoryData(resp[0], curriculum)

      expect(curriculum.semesters[0].subjects.length).toBe(8);
      expect(curriculum.semesters[1].subjects.length).toBe(9);
      expect(curriculum.semesters[2].subjects.length).toBe(9);
      expect(curriculum.semesters[3].subjects.length).toBe(11);
      expect(curriculum.semesters[4].subjects.length).toBe(8);
      expect(curriculum.semesters[5].subjects.length).toBe(1);
    });

    it('should set all the subjects in the first semester to available', () => {
      // @ts-ignore
      JsonDataHandler.getObligatoryData(resp[0], curriculum)

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
      JsonDataHandler.getObligatoryData(resp[0], curriculum)

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
      JsonDataHandler.getObligatoryData(resp[0], curriculum)

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
      JsonDataHandler.getObligatoryData(resp[0], curriculum)

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
      JsonDataHandler.getElectiveData(resp[1], curriculum)

      expect(curriculum.compElectiveSubjects.length).toBe(41);
    });

    it('should add all the overlays to the subjects', () => {
      // @ts-ignore
      JsonDataHandler.getElectiveData(resp[1], curriculum)

      //check the Webprogramozas, Programozasi Nyelvek (C++) and Python subjects
      expect(curriculum.compElectiveSubjects[6].code).toBe("IP-18KWEBPROGEG");
      expect(curriculum.compElectiveSubjects[6].over.length).toBe(4);

      expect(curriculum.compElectiveSubjects[32].code).toBe("IP-18KVPNY1EG");
      expect(curriculum.compElectiveSubjects[32].over.length).toBe(3);

      expect(curriculum.compElectiveSubjects[38].code).toBe("IP-18KVPYEG");
      expect(curriculum.compElectiveSubjects[38].over.length).toBe(0);
    });

    it('should add prerequisites to the subjects', () => {
      // @ts-ignore
      JsonDataHandler.getElectiveData(resp[1], curriculum)

      //check the Kliensoldali webprog, Programozaselmelet GY and EA subjects
      expect(curriculum.compElectiveSubjects[7].code).toBe("IP-18KVIKWPROGEG");
      expect(curriculum.compElectiveSubjects[7].pre[0].subject.code).toBe("IP-18KWEBPROGEG");
      expect(curriculum.compElectiveSubjects[7].pre[0].weak).toBeFalse();

      expect(curriculum.compElectiveSubjects[19].code).toBe("IP-18KVSZPREE");
      expect(curriculum.compElectiveSubjects[19].pre[0].subject.code).toBe("IP-18KVSZPREG");
      expect(curriculum.compElectiveSubjects[19].pre[0].weak).toBeTrue();

      expect(curriculum.compElectiveSubjects[20].code).toBe("IP-18KVSZPREG");
      expect(curriculum.compElectiveSubjects[20].pre.length).toBe(0);
    });

    it('should add lecture or practice to subjects', () => {
      // @ts-ignore
      JsonDataHandler.getElectiveData(resp[1], curriculum)

      //check the Kliensoldali webprog, Programozaselmelet GY and EA subjects
      expect(curriculum.compElectiveSubjects[7].code).toBe("IP-18KVIKWPROGEG");
      expect(curriculum.compElectiveSubjects[7].type).toBe("");

      expect(curriculum.compElectiveSubjects[19].code).toBe("IP-18KVSZPREE");
      expect(curriculum.compElectiveSubjects[19].type).toBe("EA");

      expect(curriculum.compElectiveSubjects[20].code).toBe("IP-18KVSZPREG");
      expect(curriculum.compElectiveSubjects[20].type).toBe("GY");
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
      JsonDataHandler.getAllData(curr.subjects,curr.internship, curriculum)

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
      JsonDataHandler.getAllData(curr.subjects,curr.internship, curriculum)

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
      JsonDataHandler.getAllData(curr.subjects,curr.internship, curriculum)

      expect(curriculum.enrolledCredits).toBe(94)
      expect(curriculum.completedCredits).toBe(82)
      expect(curriculum.enrolledCreditsPerc).toBe(94 / 1.8 + "%")
      expect(curriculum.completedCreditsPerc).toBe(82 / 1.8 + "%")
    });

    it('should recalculate the comp. elective and elective credits', () => {
      // @ts-ignore
      JsonDataHandler.getAllData(curr.subjects,curr.internship, curriculum)

      expect(curriculum.compElectiveCreditsInfo).toBe(4)
      expect(curriculum.compElectiveCreditsCompScience).toBe(3)
      expect(curriculum.electiveCredits).toBe(5)
    });

    it('should keep the number of semesters', () => {
      // @ts-ignore
      JsonDataHandler.getAllData(curr.subjects,curr.internship, curriculum)
      expect(curriculum.semesters.length).toBe(7)
    });

    it('should keep the status of subjects', () => {
      // @ts-ignore
      JsonDataHandler.getAllData(curr.subjects,curr.internship, curriculum)

      let enrolledCounter = 0
      let completedCounter = 0

      curriculum.semesters.forEach(sem => {
        sem.subjects.forEach(subj => {
          if (subj.status == Status.Enrolled) {
            enrolledCounter += 1
          }
          else if (subj.status == Status.Completed) {
            completedCounter += 1
          }
        });
      });

      expect(enrolledCounter).toBe(4)
      expect(completedCounter).toBe(22)

    });

  });
});
