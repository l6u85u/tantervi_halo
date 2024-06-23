import { Semester } from "./semester"
import { Subject, Status } from "./subject"
import { environment } from "../../environments/environment"

const SPEC_NAMES: Array<string> = environment.specNames

export class Curriculum {

    //#region Properties

    private _completedCredits: number
    private _enrolledCredits: number
    private _semesters: Array<Semester>
    private _compElectiveSubjects: Array<Subject>
    private _specName: string;
    private _currentSubjectCode: string = "";
    private _compElectiveCreditsInfo: number
    private _compElectiveCreditsCompScience: number
    private _compElectiveCreditsNeeded: Array<number>
    private _electiveCredits: number
    private _isEnglish: boolean
    private _isInternshipCompleted: boolean

    //#endregion

    //#region Getters and Setters

    public get completedCredits(): number {
        return this._completedCredits
    }

    public get enrolledCredits(): number {
        return this._enrolledCredits
    }

    public set completedCredits(value: number) {
        this._completedCredits = value
    }

    public set enrolledCredits(value: number) {
        this._enrolledCredits = value
    }

    public get completedCreditsPerc(): string {
        return this._completedCredits / 18 * 10 + "%"
    }

    public get enrolledCreditsPerc(): string {
        return this._enrolledCredits / 18 * 10 + "%"
    }

    public get semesters(): Array<Semester> {
        return this._semesters
    }

    public get compElectiveSubjects(): Array<Subject> {
        return this._compElectiveSubjects
    }

    public set compElectiveSubjects(compElectiveSubjects: Array<Subject>) {
        this._compElectiveSubjects = compElectiveSubjects
    }

    public get specName(): string {
        return this._specName
    }

    public get currentSubjectCode(): string {
        return this._currentSubjectCode
    }

    public get isInternshipCompleted(): boolean {
        return this._isInternshipCompleted
    }

    public set isInternshipCompleted(value: boolean) {
        this._isInternshipCompleted = value
    }

    public get electiveCredits(): number {
        return this._electiveCredits
    }

    public set electiveCredits(value: number) {
        this._electiveCredits = value
    }

    public get compElectiveCreditsInfo(): number {
        return this._compElectiveCreditsInfo
    }

    public get compElectiveCreditsCompScience(): number {
        return this._compElectiveCreditsCompScience
    }

    public set compElectiveCreditsInfo(value: number) {
        this._compElectiveCreditsInfo = value
    }

    public set compElectiveCreditsCompScience(value: number) {
        this._compElectiveCreditsCompScience = value
    }

    public get compElectiveCreditsNeeded(): Array<number> {
        return this._compElectiveCreditsNeeded
    }

    public get isEnglish(): boolean {
        return this._isEnglish
    }

    //#endregion

    //#region Constructors

    constructor(specName: string, compInfoCredits: number, compScienceCredits: number) {
        //check if it is an English curriculum
        this._isEnglish = specName == SPEC_NAMES[5]

        //initialize enrolled and completed credits in a semester
        this._completedCredits = 0
        this._enrolledCredits = 0

        //initialize the elective and compulsory elective subject credits
        this._compElectiveCreditsInfo = 0
        this._compElectiveCreditsCompScience = 0
        this._electiveCredits = 0
        this._compElectiveCreditsNeeded = [compInfoCredits, compScienceCredits]

        //initialize the semester
        this._semesters = []
        this._compElectiveSubjects = []
        this._specName = specName
        this._isInternshipCompleted = false
    }

    //#endregion

    //#region Public Methods

    //change the status of a subject, example: enrolled -> completed
    public changeSubjectStatus(subj: Subject, idx: number): string[] {
        var enrolled;
        var completed;

        this.updateCurrentSubjectCode(subj.code)
        subj.border = 1

        if (subj.status == Status.NotEnrolled) {
            this.showPrerequisites(subj)
            var pre = this.checkPrerequisites(subj)
            if (pre.length > 0) {
                return pre
            }
            enrolled = subj.credit
            completed = 0
        }
        else if (subj.status == Status.Enrolled) {
            var pre = this.checkPrerequisites(subj)
            if (pre.length > 0) {
                return pre
            }
            enrolled = 0
            completed = subj.credit
            this.hidePrerequisites(subj)
            this.showOverlays(subj)
        }
        else { //completed status
            enrolled = completed = -1 * subj.credit
            this.resetOverlays(subj)
            this.hideOverlays(subj)
        }

        subj.status = (subj.status + 1) % 3 //update status
        subj.over.forEach(elem => {
            this.setSubjectAvailability(elem)
        });
        this.updateSubjectCredits([enrolled, completed], idx, subj.spec, subj.ken) //update credits

        return []
    }

    //change the type of a subject, example: electve -> comp. elective
    public changeSubjectSpec(subj: Subject): void {
        //update the completed compulsory elective and elective credits
        if (subj.status == Status.Completed) {
            if (subj.spec == "Kötelezően választható") {
                if (subj.ken == "Informatika") {
                    this._compElectiveCreditsInfo -= subj.credit
                }
                else if (subj.ken == "Számítástudomány") {
                    this._compElectiveCreditsCompScience -= subj.credit
                }
                this._electiveCredits += subj.credit
            }
            else {
                this._electiveCredits -= subj.credit
                if (subj.ken == "Informatika") {
                    this._compElectiveCreditsInfo += subj.credit
                }
                else if (subj.ken == "Számítástudomány") {
                    this._compElectiveCreditsCompScience += subj.credit
                }
            }
        }

        //change the type
        if (subj.spec == "Kötelezően választható") {
            subj.spec = "Szabadon választható"
        }
        else if (subj.spec == "Szabadon választható") {
            subj.spec = "Kötelezően választható"
        }
    }

    //update the subject which is currently chosen
    public updateCurrentSubjectCode(newValue: string) {
        //if a subject was previously chosen and it is active
        if (this._currentSubjectCode != "") {
            for (let i = 0; i < this.semesters.length; i++)
                for (let j = 0; j < this.semesters[i].subjects.length; j++) {
                    if (this.semesters[i].subjects[j].code == this._currentSubjectCode) {
                        this.semesters[i].subjects[j].border = 0 //remove the mark
                        if (this.semesters[i].subjects[j].status != Status.Completed) {
                            this.hidePrerequisites(this.semesters[i].subjects[j])
                        }
                        else if (this.semesters[i].subjects[j].status == Status.Completed) {
                            this.hideOverlays(this.semesters[i].subjects[j])
                        }
                        break;
                    }
                }
        }
        this._currentSubjectCode = newValue //update the active subject with the new value
    }

    //recalculate the credits in a semester
    public updateCredits() {
        this._completedCredits = 0;
        this._enrolledCredits = 0;

        for (let i = 0; i < this.semesters.length; i++) {
            this.semesters[i].enrolledCredits = 0
            this.semesters[i].completedCredits = 0

            for (let j = 0; j < this.semesters[i].subjects.length; j++) {
                var subj = this.semesters[i].subjects[j]
                if (subj.status == Status.Enrolled) {
                    this.semesters[i].enrolledCredits += subj.credit
                }
                else if (subj.status == Status.Completed) {
                    this.semesters[i].enrolledCredits += subj.credit
                    this.semesters[i].completedCredits += subj.credit
                }
            }

            this._completedCredits += this.semesters[i].completedCredits
            this._enrolledCredits += this.semesters[i].enrolledCredits
        }

    }

    public addNewSemester(): void {
        this.semesters.push(new Semester())
    }

    public deleteSemester(index: number): void {
        this.semesters.splice(index, 1)
    }

    //check if the subject that needs to be added is already in the list
    public subjectIsAlreadyIn(code: string) {
        for (let i = 0; i < this.semesters.length; i++) {
            for (let j = 0; j < this.semesters[i].subjects.length; j++)
                if (this.semesters[i].subjects[j].code == code) {
                    return true
                }
        }
        return false
    }

    //check if a prerequisite is in a further semester (or in the same semester)
    public prerequisiteIsFurther(subject: Subject, columnIdx: number): boolean {
        for (let p = 0; p < subject.pre.length; p++) {
            for (let i = columnIdx + 1; i < this.semesters.length; i++) {
                for (let j = 0; j < this.semesters[i].subjects.length; j++) {
                    if (subject.pre[p].subject.code == this.semesters[i].subjects[j].code) {
                        return true
                    }
                }
            }

            //in the same semester but the interdependency is not weak
            for (let j = 0; j < this.semesters[columnIdx].subjects.length; j++) {
                if (subject.pre[p].subject.code == this.semesters[columnIdx].subjects[j].code) {
                    var isWeak = false;
                    for (let k = 0; k < subject.pre.length; k++) {
                        if (subject.pre[k].subject == this.semesters[columnIdx].subjects[j] && subject.pre[k].weak) {
                            isWeak = true
                        }
                    }
                    if (!isWeak) {
                        return true
                    }
                }
            }
        }
        return false
    }

    //check if an overlay is in a sooner semester (or in the same semester)
    public overlayIsSooner(subject: Subject, columnIdx: number): boolean {
        for (let p = 0; p < subject.over.length; p++) {
            for (let i = 0; i < columnIdx; i++) {
                for (let j = 0; j < this.semesters[i].subjects.length; j++) {
                    if (subject.over[p].code == this.semesters[i].subjects[j].code) {
                        return true
                    }
                }
            }

            //in the same semester but the interdependency is not weak
            for (let j = 0; j < this.semesters[columnIdx].subjects.length; j++) {
                if (subject.over[p].code == this.semesters[columnIdx].subjects[j].code) {
                    var isWeak = false;
                    for (let k = 0; k < this.semesters[columnIdx].subjects[j].pre.length; k++) {
                        if (this.semesters[columnIdx].subjects[j].pre[k].subject == subject && this.semesters[columnIdx].subjects[j].pre[k].weak) {
                            isWeak = true
                        }
                    }
                    if (!isWeak) {
                        return true
                    }
                }
            }
        }
        return false
    }

    //connect the newly added compulsory elective subject prerequisites with the compulsory subject overlays
    public connectPrerequisites(subject: Subject) {
        for (let i = 0; i < subject.pre.length; i++) {
            if (subject.pre[i].subject.spec == "Kötelező" && !subject.pre[i].subject.over.includes(subject)) {
                this.updatePrerequisite(subject, subject.pre[i].subject)
            }
        }
    }

    //connect all the compulsory elective subjects' prerequisites with the compulsory subjects list
    public connectCompulsoryAndElectiveSubjects() {
        //iterate through every comp. elective subject
        for (var i = 0; i < this.compElectiveSubjects.length; i++) {
            for (var p = 0; p < this.compElectiveSubjects[i].pre.length; p++) {
                var subj = this.compElectiveSubjects[i].pre[p].subject

                //check if the prerequisite is a comp. elective subject
                var found = this.compElectiveSubjects.includes(subj)

                //if not found then connect the prerequisites with the compulsory subjects
                if (!found) {
                    for (let j = 0; j < this.semesters.length && !found; j++)
                        for (let l = 0; l < this.semesters[j].subjects.length; l++) {
                            if (this.semesters[j].subjects[l].code == subj.code) {
                                this.compElectiveSubjects[i].pre[p].subject = this.semesters[j].subjects[l]
                                found = true
                                break
                            }
                        }
                }
            }
        }
    }

    //remove a subject and update the credits
    public deleteSubject(subj: Subject, semesterIdx: number): void {
        const index = this.semesters[semesterIdx].subjects.indexOf(subj, 0);
        if (index > -1) {
            this.semesters[semesterIdx].deleteSubject(index)
        }
        if (subj.status == Status.Enrolled) {
            this.updateSubjectCurriculumCredits([-1 * subj.credit, 0], subj.spec, subj.ken)
            subj.status = Status.NotEnrolled
        }
        else if (subj.status == Status.Completed) {
            this.updateSubjectCurriculumCredits([-1 * subj.credit, -1 * subj.credit], subj.spec, subj.ken)
            subj.status = Status.NotEnrolled
            this.resetOverlays(subj)
        }
    }

    //update the order when a subject is dropped in the same semester
    public moveSubjectToSemester(prevColumnIdx: number, columnIdx: number, prevIdx: number, currentIdx: number) {
        const itemToMove = this.semesters[prevColumnIdx].subjects[prevIdx];
        this.semesters[prevColumnIdx].subjects.splice(prevIdx, 1);
        this.semesters[columnIdx].subjects.splice(currentIdx, 0, itemToMove);
    }

    //checks if the subject can be enrolled to
    public setSubjectAvailability(subj: Subject) {
        var pre = this.checkPrerequisites(subj)
        if (pre.length == 0) {
            subj.isAvailable = true
        }
        else {
            subj.isAvailable = false
        }
    }

    //#endregion

    //#region Private Methods

    //show the prerequisites of a subject
    private showPrerequisites(subj: Subject) {
        subj.pre.forEach(elem => {
            elem.subject.border = 2
        });
    }

    //hide the prerequisites of a subject
    private hidePrerequisites(subj: Subject) {
        subj.pre.forEach(elem => {
            elem.subject.border = 0
        });
    }

    //show the overlays of a subject
    private showOverlays(subj: Subject) {
        subj.over.forEach(elem => {
            elem.border = 3
        });
    }

    //hide the overlays of a subject
    private hideOverlays(subj: Subject) {
        subj.over.forEach(elem => {
            elem.border = 0
        });
    }

    //check whether the prerequisites of a subject are completed
    private checkPrerequisites(subj: Subject): string[] {
        var pre: Array<string> = [] //will contain the prerequisites which are not completed

        if (subj.status != Status.Enrolled) {
            //iterate through the prerequisites and check the completion or enrollment if it is weak
            subj.pre.forEach(elem => {
                if (elem.subject.status != Status.Completed) {
                    if (elem.subject.status == Status.NotEnrolled && elem.weak) {
                        pre.push(elem.subject.name + " " + elem.subject.type + " (gyenge)")
                    }
                    else if (elem.subject.status == Status.NotEnrolled || !elem.weak) {
                        pre.push(elem.subject.name + " " + elem.subject.type)
                    }
                }
            });
        }
        else {
            //iterate through the prerequisites and check the completion
            subj.pre.forEach(elem => {
                if (elem.subject.status != Status.Completed) {
                    if (elem.weak){
                        pre.push(elem.subject.name + " " + elem.subject.type + " (gyenge)")
                    }
                    else {
                        pre.push(elem.subject.name + " " + elem.subject.type)
                    }
                }
            });
        }

        return pre;

    }

    //if a subject's status changes from completed to not enrolled, the overlay curriculums' status also reflect that 
    private resetOverlays(subj: Subject) {

        //iterate through the overlays
        subj.over.forEach(elem => {
            if (elem.status != Status.NotEnrolled) { //if the overlay subject's status is enrolled or completed
                var col = -1;
                for (let i = 0; i < this.semesters.length; i++) { //finding the column which contains it
                    if (this.semesters[i].subjects.includes(elem)) {
                        col = i;
                        break;
                    }
                }
                if (elem.status == Status.Enrolled) {
                    this.updateSubjectCredits([-1 * elem.credit, 0], col, elem.spec, elem.ken)
                }
                else if (elem.status == Status.Completed) {
                    this.updateSubjectCredits([-1 * elem.credit, -1 * elem.credit], col, elem.spec, elem.ken)
                }
                elem.status = Status.NotEnrolled;
            }
            this.setSubjectAvailability(elem)
        });
    }

    //update all credits if a subject status changes
    private updateSubjectCredits(credit: Array<number>, idx: number, spec: string, ken: string): void {
        this.semesters[idx].enrolledCredits += credit[0]
        this.semesters[idx].completedCredits += credit[1]

        this.updateSubjectCurriculumCredits(credit, spec, ken)
    }

    //update only curriculum credits if a subject status changes
    private updateSubjectCurriculumCredits(credit: Array<number>, spec: string, ken: string): void {
        this._enrolledCredits += credit[0]
        this._completedCredits += credit[1]

        if (spec == "Kötelezően választható") {
            if (this.isEnglish || this.specName.includes("mérnök")) {
                this._compElectiveCreditsInfo += credit[1]
            }
            else {
                if (ken == "Informatika") {
                    this._compElectiveCreditsInfo += credit[1]
                }
                else if (ken == "Számítástudomány") {
                    this._compElectiveCreditsCompScience += credit[1]
                }
            }
        }
        else if (spec == "Szabadon választható") {
            this._electiveCredits += credit[1]
        }
    }

    //recursively add a new subject to the overlay list of another subject
    private updatePrerequisite(newOverSubject: Subject, subject: Subject) {
        subject.over.push(newOverSubject)
        subject.over = subject.over.concat(newOverSubject.over)
        for (let i = 0; i < subject.pre.length; i++) {
            this.updatePrerequisite(newOverSubject, subject.pre[i].subject)
        }
    }

    //#endregion

}