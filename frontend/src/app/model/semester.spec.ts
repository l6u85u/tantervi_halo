import { Semester } from './semester';
import { Subject, Status } from './subject';

describe('Semester', () => {
  let semester: Semester;

  beforeEach(function () {
    semester = new Semester();
  });

  it('should initialize with default values', () => {
    expect(semester.completedCredits).toBe(0);
    expect(semester.enrolledCredits).toBe(0);
    expect(semester.subjects.length).toBe(0);
  });

  describe(".addNewSubject(subject)", function () {

    let subject: Subject;

    beforeEach(function () {
      subject = new Subject("IP-18PROGEG", "Programozás", 6, "", 0, [], [], 0, 1, "obligatory", "Informatika", false)
    });

    it('should add new subject with not enrolled status', () => {
      semester.addNewSubject(subject)

      expect(semester.subjects.length).toBe(1);
      expect(semester.enrolledCredits).toBe(0);
      expect(semester.completedCredits).toBe(0);
    });

    it('should add new subject with enrolled status', () => {
      subject.status = Status.Enrolled
      semester.addNewSubject(subject)

      expect(semester.subjects.length).toBe(1);
      expect(semester.enrolledCredits).toBe(6);
      expect(semester.completedCredits).toBe(0);
    });

    it('should add new subject with completed status', () => {
      subject.status = Status.Completed
      semester.addNewSubject(subject)

      expect(semester.subjects.length).toBe(1);
      expect(semester.enrolledCredits).toBe(6);
      expect(semester.completedCredits).toBe(6);
    });

  });

  describe(".deleteSubject(index)", function () {

    let subject: Subject;

    beforeEach(function () {
      subject = new Subject("IP-18PROGEG", "Programozás", 6, "", 0, [], [], 0, 1, "obligatory", "Informatika", false)
    });

    it('should delete subject with not enrolled status', () => {
      semester.addNewSubject(subject)

      semester.deleteSubject(0)

      expect(semester.subjects.length).toBe(0);
      expect(semester.enrolledCredits).toBe(0);
      expect(semester.completedCredits).toBe(0);
    });

    it('should delete subject with enrolled status', () => {
      subject.status = Status.Enrolled
      semester.addNewSubject(subject)

      semester.deleteSubject(0)

      expect(semester.subjects.length).toBe(0);
      expect(semester.enrolledCredits).toBe(0);
      expect(semester.completedCredits).toBe(0);
    });

    it('should delete subject with completed status', () => {
      subject.status = Status.Completed
      semester.addNewSubject(subject)

      semester.deleteSubject(0)

      expect(semester.subjects.length).toBe(0);
      expect(semester.enrolledCredits).toBe(0);
      expect(semester.completedCredits).toBe(0);
    });

    it('should not delete when the index is incorrect', () => {
      semester.deleteSubject(0)

      expect(semester.subjects.length).toBe(0);
      expect(semester.enrolledCredits).toBe(0);
      expect(semester.completedCredits).toBe(0);
    });

  });

});
