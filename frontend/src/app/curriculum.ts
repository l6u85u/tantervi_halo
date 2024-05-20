import { Semester } from "./semester"
import { Subject } from "./subject"
import { IStorage } from './i-storage';
import { environment } from "../environments/environment";

const BACKEND_ADDRESS: string = environment.backendUrl
const BACKEND_PORT: string = environment.backendPort
const NUMBER_OF_COLUMNS: number = environment.numberOfSemesters

export class Curriculum {

    //#region Properties

    private _completedCredits: number
    private _enrolledCredits: number
    private _completedCreditsPerc: string
    private _enrolledCreditsPerc: string
    private _semesters: Array<Semester>
    private _electiveSubjects: Array<Subject>
    private _xhttp: XMLHttpRequest;
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

    public get completedCreditsPerc(): string {
        return this._completedCreditsPerc
    }

    public get enrolledCreditsPerc(): string {
        return this._enrolledCreditsPerc
    }

    public get semesters(): Array<Semester> {
        return this._semesters
    }

    public get electiveSubjects(): Array<Subject> {
        return this._electiveSubjects
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

    public get compElectiveCreditsInfo(): number {
        return this._compElectiveCreditsInfo
    }

    public get compElectiveCreditsCompScience(): number {
        return this._compElectiveCreditsCompScience
    }

    public get compElectiveCreditsNeeded(): Array<number> {
        return this._compElectiveCreditsNeeded
    }

    public get isEnglish(): boolean {
        return this._isEnglish
    }


    //#endregion

    //#region Constructors

    constructor(storage: IStorage, specName: string, specLink: string, compInfoCredits: number, compScienceCredits: number) {
        //check if it is an English curriculum
        this._isEnglish = specLink == "angol"

        //initialize enrolled and completed credits in a semester
        this._completedCredits = 0
        this._enrolledCredits = 0
        this._enrolledCreditsPerc = "0%"
        this._completedCreditsPerc = "0%"

        //initialize the elective and compulsory elective subject credits
        this._compElectiveCreditsInfo = 0
        this._compElectiveCreditsCompScience = 0
        this._electiveCredits = 0
        this._compElectiveCreditsNeeded = [compInfoCredits, compScienceCredits]

        //initialize the semester
        this._semesters = []
        this._electiveSubjects = []
        this._specName = specName
        this._isInternshipCompleted = false

        this._xhttp = new XMLHttpRequest();

        //get the data from the backend with XMLHttpRequest
        this._xhttp.open('GET', BACKEND_ADDRESS + ":" + BACKEND_PORT + "/" + specLink, true)
        this._xhttp.onreadystatechange = () => this.getData();
        this._xhttp.send();
    }

    //#endregion

    //#region Public Methods

    //changes the status of a subject, example: enrolled -> completed
    public changeSubjectStatus(subj: Subject, idx: number): string[] {
        var enrolled;
        var completed;

        this.updateCurrentSubjectCode(subj.code)

        subj.border = 1

        if (subj.status == 0) {  //not enrolled status
            this.showPrerequisites(subj)
            var pre = this.checkPrerequisites(subj)
            if (pre.length > 0) {
                return pre
            }
            enrolled = subj.credit
            completed = 0
        }
        else if (subj.status == 1) { //enrolled status
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

    //changes the type of a subject, example: electve -> comp. elective
    public changeSubjectSpec(subj: Subject): void {
        //update the completed compulsory elective and elective credits
        if (subj.status == 2) {  //completed status
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

    //updates the subject which is currently chosen
    public updateCurrentSubjectCode(newValue: string) {

        //if a subject was previously chosen and it is active
        if (this._currentSubjectCode != "") {
            for (let i = 0; i < this.semesters.length; i++)
                for (let j = 0; j < this.semesters[i].subjects.length; j++) {
                    if (this.semesters[i].subjects[j].code == this._currentSubjectCode) {
                        this.semesters[i].subjects[j].border = 0 //remove the mark
                        if (this.semesters[i].subjects[j].status != 2) {
                            this.hidePrerequisites(this.semesters[i].subjects[j])
                        }
                        else if (this.semesters[i].subjects[j].status == 2) {
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
                if (subj.status == 1) {
                    this.semesters[i].enrolledCredits += subj.credit
                }
                else if (subj.status == 2) {
                    this.semesters[i].enrolledCredits += subj.credit
                    this.semesters[i].completedCredits += subj.credit
                }
            }

            this._completedCredits += this.semesters[i].completedCredits
            this._enrolledCredits += this.semesters[i].enrolledCredits
        }

        this._completedCreditsPerc = this._completedCredits / 18 * 10 + "%"
        this._enrolledCreditsPerc = this._enrolledCredits / 18 * 10 + "%"
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

    //connect the newly added elective subject prerequisites with the core subject overlays
    public connectPrerequisites(subject: Subject) {
        for (let i = 0; i < subject.pre.length; i++) {
            if (subject.pre[i].subject.spec == "Kötelező" && !subject.pre[i].subject.over.includes(subject)) {
                this.updatePrerequisite(subject, subject.pre[i].subject)
            }
        }
    }

    //remove a subject and update the credits
    public deleteSubject(subj: Subject, semesterIdx: number): void {
        const index = this.semesters[semesterIdx].subjects.indexOf(subj, 0);
        if (index > -1) {
            this.semesters[semesterIdx].deleteSubject(index)
        }
        if (subj.status == 1) { //if status if enrolled
            this.updateSubjectCurriculumCredits([-1 * subj.credit, 0], subj.spec, subj.ken)
            subj.status = 0
        }
        else if (subj.status == 2) { //if status is completed
            this.updateSubjectCurriculumCredits([-1 * subj.credit, -1 * subj.credit], subj.spec, subj.ken)
            subj.status = 0
            this.resetOverlays(subj)
        }
    }

    public getSubjects(curriculum: any, internship: any) {
        this._semesters = []

        for (let i = 0; i < curriculum.length; i++) {
            this._semesters.push(new Semester())

            for (let j = 0; j < curriculum[i].length; j++) {
                var subj = curriculum[i][j]
                //add subject
                this._semesters[i].addNewSubject(new Subject(subj._code, subj._name, subj._credit, subj._type, subj._status, [], [], 0, subj._proposedSemester, subj._spec, subj._ken, subj._isAvailable))
            }
        }

        for (let i = 0; i < curriculum.length; i++) {
            for (let j = 0; j < curriculum[i].length; j++) {

                //add the prerequisites for every subject
                var subj = curriculum[i][j]
                for (let l = 0; l < subj._pre.length; l++) {
                    for (let k = 0; k <= i; k++) {
                        for (let m = 0; m < this.semesters[k].subjects.length; m++) {
                            if (this.semesters[k].subjects[m].code == subj._pre[l].subject) {
                                this.semesters[i].subjects[j].pre.push({ subject: this.semesters[k].subjects[m], weak: subj._pre[l].weak })
                                break
                            }
                        }
                    }
                }

                //add the overlays for every subject
                for (let l = 0; l < subj._over.length; l++) {
                    for (let k = i; k < curriculum.length; k++) {
                        for (let m = 0; m < this.semesters[k].subjects.length; m++) {
                            if (this.semesters[k].subjects[m].code == subj._over[l]) {
                                this.semesters[i].subjects[j].over.push(this.semesters[k].subjects[m])
                                break
                            }
                        }
                    }
                }
            }
        }

        //reinitialize the credits
        this._completedCredits = 0
        this._enrolledCredits = 0

        //recalculate the credits
        for (let i = 0; i < this.semesters.length; i++) {
            this._completedCredits += this.semesters[i].completedCredits
            this._enrolledCredits += this.semesters[i].enrolledCredits
        }

        this._completedCreditsPerc = this._completedCredits / 18 * 10 + "%"
        this._enrolledCreditsPerc = this._enrolledCredits / 18 * 10 + "%"

        if (internship) {
            this.isInternshipCompleted = true
        }
        else {
            this.isInternshipCompleted = false
        }

    }

    //update the order when a subject is dropped in the same semester
    public moveItemInArray(prevColumnIdx: number, columnIdx: number, prevIdx: number, currentIdx: number) {
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

        //iterate through the prerequisites and check the completion
        subj.pre.forEach(elem => {
            if (elem.subject.status != 2) {
                if (elem.subject.status == 0 && elem.weak) {
                    pre.push(elem.subject.name + " " + elem.subject.type + " (gyenge)")
                }
                else if (elem.subject.status == 0 || !elem.weak) {
                    pre.push(elem.subject.name + " " + elem.subject.type)
                }
            }
        });

        return pre;

    }

    //if a subject's status changes from completed to not enrolled, the overlay curriculums' status also reflect that 
    private resetOverlays(subj: Subject) {

        //iterate through the overlays
        subj.over.forEach(elem => {
            if (elem.status != 0) { //if the overlay subject's status is enrolled or completed
                var col = -1;
                for (let i = 0; i < this.semesters.length; i++) { //finding the column which contains it
                    if (this.semesters[i].subjects.includes(elem)) {
                        col = i;
                        break;
                    }
                }
                if (elem.status == 1) { //update credits if the status was enrolled
                    this.updateSubjectCredits([-1 * elem.credit, 0], col, elem.spec, elem.ken)
                }
                else if (elem.status == 2) { //update credits if the status was completed
                    this.updateSubjectCredits([-1 * elem.credit, -1 * elem.credit], col, elem.spec, elem.ken)
                }
                elem.status = 0;
            }
            this.setSubjectAvailability(elem)
        });
    }

    //update all credits if a subject status changes
    private updateSubjectCredits(credit: Array<number>, idx: number, spec: string, ken: string): void {
        this.semesters[idx].enrolledCredits += credit[0]
        this._enrolledCredits += credit[0]
        this.semesters[idx].completedCredits += credit[1]
        this._completedCredits += credit[1]
        this._completedCreditsPerc = this._completedCredits / 18 * 10 + "%"
        this._enrolledCreditsPerc = this._enrolledCredits / 18 * 10 + "%"
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

    //update only curriculum credits if a subject status changes
    private updateSubjectCurriculumCredits(credit: Array<number>, spec: string, ken: string): void {
        this._enrolledCredits += credit[0]
        this._completedCredits += credit[1]
        this._completedCreditsPerc = this._completedCredits / 18 * 10 + "%"
        this._enrolledCreditsPerc = this._enrolledCredits / 18 * 10 + "%"

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

    //recursively adds a new subject to the overlay list of another subject
    private updatePrerequisite(newOverSubject: Subject, subject: Subject) {
        subject.over.push(newOverSubject)
        subject.over = subject.over.concat(newOverSubject.over)
        for (let i = 0; i < subject.pre.length; i++) {
            this.updatePrerequisite(newOverSubject, subject.pre[i].subject)
        }
    }

    //get the data from backend for one spec 
    private getData() {
        if (this._xhttp.readyState == 4 && this._xhttp.status == 200) {
            var resp = JSON.parse(JSON.parse(this._xhttp.responseText));

            for (let i = 0; i < NUMBER_OF_COLUMNS; i++) {
                this.addNewSemester()
            }

            this.getObligatoryData(resp[0])
            this.getElectiveData(resp[1])
        }
    }

    //get the core subject list from backend
    private getObligatoryData(resp: any) {

        //iterate through every subject
        for (var i = 0; i < resp.length; i++) {
            var semester = resp[i]["Ajánlott félév"]

            if (typeof semester === 'string') {
                semester = parseInt(semester.split(",")[0]) //get the first semester from the recommended ones
            }

            //set type (Lecture or Practice)
            var type = ""
            if (resp[i]["Előadás"] > 0) {
                if (resp[i]["Gyakorlat"] == 0 && resp[i]["Labor"] == 0) {
                    if (this.isEnglish) { type = "L" }
                    else { type = "EA" }
                }
            }
            else {
                if (this.isEnglish) { type = "P" }
                else { type = "GY" }
            }

            this.semesters[Math.floor(semester - 1)].addNewSubject(new Subject(resp[i]["Kód"], resp[i]["Tanegység"], resp[i]["Kredit"], type, 0, [], [], 0, semester, resp[i]["Típus"], resp[i]["Ismeretkör"]))
        }

        //iterate through every subject
        for (var i = 0; i < resp.length; i++) {
            var semester = resp[i]["Ajánlott félév"]

            if (typeof semester === 'string') {
                semester = parseInt(semester.split(",")[0]) //get the first semester from the recommended ones
            }

            //find the current subject in the subject array
            var col = Math.floor(semester - 1)
            var idx = 0;
            for (let j = 0; j < this.semesters[col].subjects.length; j++) {
                if (this.semesters[col].subjects[j].code == resp[i]["Kód"]) {
                    idx = j;
                    break
                }
            }

            //separate the prerequisites of the subject
            var pre_code = []
            if (resp[i]["Előfeltétel(ek)"] !== null) {
                pre_code = resp[i]["Előfeltétel(ek)"].split(",").map((str: string) => str.trim())
            }

            //find all the curriculums in the curriculums list and add them as prerequisite
            pre_code.forEach((code: string) => {
                var words = code.split(" ")
                var weak = false; //type of prerequisite

                if (words.length > 1 && (words[1] == "(gyenge)" || words[1] == "(weak)")) {
                    weak = true
                }

                for (let j = 0; j <= col; j++)
                    for (let l = 0; l < this.semesters[j].subjects.length; l++) {
                        if (this.semesters[j].subjects[l].code == words[0]) {
                            this.semesters[col].subjects[idx].pre.push({ subject: this.semesters[j].subjects[l], weak: weak })
                            break
                        }
                    }

            })

            //check availability
            if (this.semesters[col].subjects[idx].pre.length == 0) {
                this.semesters[col].subjects[idx].isAvailable = true
            }

            //separate the overlays of the subject
            var over_code = []
            if (resp[i]["Ráépülő"] != "") {
                over_code = resp[i]["Ráépülő"].split(",").map((str: string) => str.trim())
            }

            //find all the curriculums in the curriculums list and add them as overlays
            over_code.forEach((code: string) => {
                for (let j = col; j < this.semesters.length; j++)
                    for (let l = 0; l < this.semesters[j].subjects.length; l++) {
                        if (this.semesters[j].subjects[l].code == code) {
                            this.semesters[col].subjects[idx].over.push(this.semesters[j].subjects[l])
                            break
                        }
                    }
            })

        }

        //add the 'Diploma work consultation' subject in the last semester
        if (this.isEnglish) {
            var thesis = new Subject("IP-18FSZD", "Diploma work consult.", 20, "", 0, [], [], 0, 6, "Kötelező", "", true)
        }
        else {
            var thesis = new Subject("IP-08SZDPIBN18", "Szakdolgozati konz.", 20, "", 0, [], [], 0, 6, "Kötelező", "", true)
        }

        this.semesters[NUMBER_OF_COLUMNS - 1].addNewSubject(thesis)
    }

    //get the elective subject list from backend
    private getElectiveData(resp: any) {

        //iterate through every subject
        for (var i = 0; i < resp.length; i++) {
            var semester = resp[i]["Ajánlott félév"]

            if (typeof semester === 'string') {
                semester = parseInt(semester.split(",")[0]) //get the first semester from the recommended ones
            }

            var type = ""  //set type (Lecture or Practice)
            if (resp[i]["Előadás"] > 0) {
                if (resp[i]["Gyakorlat"] == 0 && resp[i]["Labor"] == 0) {
                    if (this.isEnglish) { type = "L" }
                    else { type = "EA" }
                }
            }
            else {
                if (this.isEnglish) { type = "P" }
                else { type = "GY" }
            }

            this.electiveSubjects.push(new Subject(resp[i]["Kód"], resp[i]["Tanegység"], resp[i]["Kredit"], type, 0, [], [], 0, semester, resp[i]["Típus"], resp[i]["Ismeretkör"]))
        }

        //iterate through every elective subject
        for (var i = 0; i < this.electiveSubjects.length; i++) {

            //separate the prerequisites of the subject
            var pre_code = []
            if (resp[i]["Előfeltétel(ek)"] !== null) {
                pre_code = resp[i]["Előfeltétel(ek)"].split(",").map((str: string) => str.trim())
            }

            //find all the curriculums in the elective curriculums list and add them as prerequisite
            pre_code.forEach((code: string) => {
                var words = code.split(" ")
                var weak = false;
                if (words.length > 1 && (words[1] == "(gyenge)" || words[1] == "(weak)")) {
                    weak = true
                }

                //search in the elective subject list
                var found = false;
                for (let j = 0; j < this.electiveSubjects.length; j++) {
                    if (this.electiveSubjects[j].code == words[0]) {
                        this.electiveSubjects[i].pre.push({ subject: this.electiveSubjects[j], weak: weak })
                        found = true
                        break
                    }
                }

                //search in the core subject list
                if (!found) {
                    for (let j = 0; j < this.semesters.length && !found; j++)
                        for (let l = 0; l < this.semesters[j].subjects.length; l++) {
                            if (this.semesters[j].subjects[l].code == words[0]) {
                                this.electiveSubjects[i].pre.push({ subject: this.semesters[j].subjects[l], weak: weak })
                                found = true
                                break
                            }
                        }
                }

            })

            //separate the overlays of the subject
            var over_code = []
            if (resp[i]["Ráépülő"] != "") {
                over_code = resp[i]["Ráépülő"].split(",").map((str: string) => str.trim())
            }

            //find all the curriculums in the elective curriculums list and add them as overlays
            over_code.forEach((code: string) => {
                for (let j = 0; j < this.electiveSubjects.length; j++) {
                    if (this.electiveSubjects[j].code == code) {
                        this.electiveSubjects[i].over.push(this.electiveSubjects[j])
                        break
                    }
                }
            })

        }

    }

    //#endregion

}