import { Component } from '@angular/core';
import { NgForm } from "@angular/forms";
import * as FileSaver from 'file-saver';
import swal from 'sweetalert';
import * as CryptoJS from 'crypto-js';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

const BACKEND_ADDRESS: string = "https://127.0.0.1";
const BACKEND_PORT: string = "8000";
const NUMBER_OF_COLUMNS: number = 6
const PASSWORD: string = 'myPassword';
const MAX_COLUMN_NUMBERS: number = 18;
const TITLE: string = 'frontend';
const SPEC_NAMES: Array<string> = ["PTI Modellező", "PTI Tervező", "PTI Fejlesztő", "PTI Szoftvermérnök", "PTI Esti", "Computer Science"]
const SPEC_LINKS: Array<string> = ["modellezo", "tervezo", "fejleszto", "szombathely", "esti", "angol"]

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {

  //#region Properties

  private _isDarkMode: boolean = false
  private _isLanguageHu: boolean = true

  private _modalBodyText: string = ""
  private _modalTitleText: string = ""
  private _modalFirstButtonText: string = ""
  private _modalSecondButtonText: string = ""

  private _subjectToDelete!: Subject;
  private _subjectToDeleteSemester: number = -1;

  private _curriculums: Array<Curriculum> = [];
  private _currentSpecName: string;
  private _currentSpecIdx: number;

  private _subjectToAddSpecType: string = "obligatory"
  private _electiveSubjectsForm: Form = { code: "", name: "", type: "", semester: -1, credit: 0 }
  private _optionalSubjectsForm: Form = { code: "", name: "", type: "", semester: -1, credit: 0 }
  private _optionalSubjectsFormMessage: string = ""

  //#endregion

  //#region Getters and Setters

  public get subjectToDelete(): Subject {
    return this._subjectToDelete
  }

  public get subjectToDeleteSemester(): number {
    return this._subjectToDeleteSemester
  }

  public get modalTitleText(): string {
    return this._modalTitleText
  }

  public get modalBodyText(): string {
    return this._modalBodyText
  }

  public get modalFirstButtonText(): string {
    return this._modalFirstButtonText
  }

  public get modalSecondButtonText(): string {
    return this._modalSecondButtonText
  }

  public get isDarkMode(): boolean {
    return this._isDarkMode
  }

  public get isLanguageHu(): boolean {
    return this._isLanguageHu
  }

  public get curriculums(): Array<Curriculum> {
    return this._curriculums
  }

  public get currentSpecName(): string {
    return this._currentSpecName
  }

  public get currentSpecIdx(): number {
    return this._currentSpecIdx
  }

  public get subjectToAddSpecType(): string {
    return this._subjectToAddSpecType
  }

  public set subjectToAddSpecType(value: string) {
    this._subjectToAddSpecType = value
  }

  public get electiveSubjectsForm(): Form {
    return this._electiveSubjectsForm
  }

  public set electiveSubjectsForm(form: any) {
    this._electiveSubjectsForm = form
  }

  public get optionalSubjectsForm(): Form {
    return this._optionalSubjectsForm
  }

  public set optionalSubjectsForm(form: any) {
    this._optionalSubjectsForm = form
  }

  public get optionalSubjectsFormMessage(): string {
    return this._optionalSubjectsFormMessage
  }

  //#endregion

  //#region Constructor

  constructor() {

    //initialize the curriculums
    for (let i = 0; i < SPEC_LINKS.length; i++) {
      var curriculum = new Curriculum(SPEC_NAMES[i], SPEC_LINKS[i])
      this._curriculums.push(curriculum)
    }

    //set the current spec to the first one
    this._currentSpecName = SPEC_NAMES[0]
    this._currentSpecIdx = 0;

  }

  //#endregion

  //#region Public Methods

  public getDarkModeText(): string {
    if (this._isDarkMode) {
      return "Light"
    }
    return "Dark"
  }

  public changeLanguage() {
    this._isLanguageHu = !this._isLanguageHu
  }

  //handles the click event for a subject
  public clickEventHandler(subj: Subject, idx: number): void {

    //the list of prerequisites which are not completed
    var pre = this.curriculums[this._currentSpecIdx].changeSubjectStatus(subj, idx)

    if (pre.length > 0) {
      var resp: string

      if (this._isLanguageHu) { resp = "A következő előfeltételek nem teljesültek:\n" }
      else { resp = "The following prerequisites are not completed:\n" }

      pre.forEach(e => { resp += e + "\n" })

      swal(resp);
    }

    //warning 
    if (subj.status==1 && (subj.code=="IP-18FSZD" || subj.code=="IP-08SZDPIBN18")){
      if (this._isLanguageHu) { resp = "Ne feledd a témabejelentő kérvényt leadni!" }
      else { resp = "Do not forget to submit the thesis registration form!" }
      swal(resp);
    }

  }

  //handles the drop event of a subject
  public drop(event: CdkDragDrop<string[]>, index: number) {

    //if the subject was dropped in the same semester as before
    if (event.previousContainer === event.container) {
      this.curriculums[this.currentSpecIdx].moveItemInArray(index, index, event.previousIndex, event.currentIndex);
    }
    else {
      var prevColumn = parseInt(event.previousContainer.element.nativeElement.classList[1].split("-")[1])
      this.transferArrayItem(prevColumn, index, event.previousIndex, event.currentIndex,);
    }
  }

  //change the specialization 
  public changeSpec(index: number) {
    this.curriculums[this._currentSpecIdx].updateCurrentSubjectCode("")
    this._currentSpecIdx = index;
    this._currentSpecName = SPEC_NAMES[index]
    this.curriculums[index].updateCredits()
  }

  //adds a new semester
  public addSemester() {
    if (this.curriculums[this._currentSpecIdx].semesters.length >= MAX_COLUMN_NUMBERS) {
      if (this._isLanguageHu) {
        swal("Elérted a maximális félévszámot, többet nem tudsz felvenni.")
      }
      else {
        swal("You reached the maximum number of semesters, you can not add more.")
      }
    }
    else {
      this.curriculums[this._currentSpecIdx].addNewSemester()
    }
  }

  //deletes the semester with the index
  public deleteSemester(index: number) {
    //if the semester is not empty do not delete it
    if (this.curriculums[this._currentSpecIdx].semesters[index].subjects.length != 0) {
      if (this._isLanguageHu) {
        swal("Csak üres félévet tudsz törölni.")
      }
      else {
        swal("You can only delete empty semesters.")
      }
    }
    else {
      this.curriculums[this._currentSpecIdx].deleteSemester(index)
    }
  }

  //handles the submit form event
  public submitForm(form: NgForm) {
    var resp = form.value

    //if the new subject is optional
    if (this._subjectToAddSpecType == "not obligatory") {
      if (!this.checkOptionalForm()) {
        this.showOptionalFormMessage()
        this._optionalSubjectsFormMessage = ""
      }
      else {
        if (this.curriculums[this.currentSpecIdx].subjectIsAlreadyIn(resp.code)) {
          if (this._isLanguageHu) {
            swal({ text: "Ez a tárgy már szerepel a tantervben!", dangerMode: true })
          }
          else {
            swal({ text: "This subject is already in the curriculum!", dangerMode: true })
          }
          return
        }
        var subj: Subject = new Subject(resp.code, resp.name, resp.credit, resp.type, 0, [], [], 0, 0, "Szabadon választható", "Egyéb")
        this.curriculums[this._currentSpecIdx].semesters[resp.semester].addNewSubject(subj)

        this._optionalSubjectsForm.name = ""
        this._optionalSubjectsForm.code = ""
        this._optionalSubjectsForm.credit = 0
        this._optionalSubjectsForm.type = ""
        this._optionalSubjectsForm.semester = -1
      }
    }
    else if (this._subjectToAddSpecType == "obligatory") { //if the new subject is elective
      var idx = resp.obligName
      var subj = this.curriculums[this._currentSpecIdx].electiveSubjects[idx]

      if (this.curriculums[this._currentSpecIdx].subjectIsAlreadyIn(subj.code)) {
        if (this._isLanguageHu) {
          swal({ text: "Ez a tárgy már szerepel a tantervben!", dangerMode: true })
        }
        else {
          swal({ text: "This subject is already in the curriculum!", dangerMode: true })
        }
        return
      }

      if (this.curriculums[this.currentSpecIdx].prerequisiteIsFurther(subj, parseInt(resp.semester))) { //check if can be added
        if (this._isLanguageHu) {
          swal("Nem veheted fel a tárgyat a kiválasztott félévbe, mivel az előkövetelmények nem teljesülnek.")
        }
        else {
          swal("You can not enroll to this subject because the prerequisites are not completed.")
        }
        return
      }

      this.curriculums[this.currentSpecIdx].connectPrerequisites(subj)
      this.curriculums[this._currentSpecIdx].semesters[resp.semester].addNewSubject(subj)
      this.curriculums[this._currentSpecIdx].setSubjectAvailability(subj)
      this._electiveSubjectsForm.name = ""
      this._electiveSubjectsForm.semester = -1
    }

  }

  //check if the form is correct (else the submit button can not be clicked)
  public checkForm(): boolean {
    if (this._subjectToAddSpecType == "obligatory") {
      var form = this._electiveSubjectsForm
      return form.name != "" && form.semester != -1
    }
    else if (this._subjectToAddSpecType == "not obligatory") {
      var form = this._optionalSubjectsForm
      return form.name != "" && form.code != "" && form.credit > 0 && form.semester != -1
    }
    return true
  }

  //shows an alert for the user when deleting a subject
  public showDeleteSubjectModal(subj: Subject, idx: number): void {
    if (this._isLanguageHu) {
      this._modalTitleText = "Tárgy törlése"
      this._modalBodyText = "Biztos törölni szeretnéd a " + subj.name + " " + subj.type + " tárgyat?"
      this._modalFirstButtonText = "Igen"
      this._modalSecondButtonText = "Mégsem"
    }
    else {
      this._modalTitleText = "Delete subject"
      this._modalBodyText = "Are you sure you want to delete " + subj.name + " " + subj.type + " subject?"
      this._modalFirstButtonText = "Yes"
      this._modalSecondButtonText = "Cancel"
    }
    this._subjectToDelete = subj
    this._subjectToDeleteSemester = idx
  }

  //shows an alert for the user when deleting a subject
  public showResetCurriculumModal(): void {
    if (this._isLanguageHu) {
      this._modalTitleText = "Tanterv törlése"
      this._modalBodyText = "Biztos törölni szeretnéd a mintatanterv jelenlegi állapotát?"
      this._modalFirstButtonText = "Igen"
      this._modalSecondButtonText = "Mégsem"
    }
    else {
      this._modalTitleText = "Delete curriculum"
      this._modalBodyText = "Are you sure you want to delete the current curriculum?"
      this._modalFirstButtonText = "Yes"
      this._modalSecondButtonText = "Cancel"
    }
  }

  //delete subject event handler
  public deleteSubject() {
    this.curriculums[this._currentSpecIdx].deleteSubject(this._subjectToDelete, this._subjectToDeleteSemester)
  }

  //save the current state of the curriculum to a file
  public saveCurriculumToFile() {
    var subjects = []
    for (let i=0;i<this._curriculums[this._currentSpecIdx].semesters.length;i++){
      subjects.push(this._curriculums[this._currentSpecIdx].semesters[i].subjects)
    }

    var content = JSON.stringify(subjects, this.changePrerequisitesAndOverlaysToString);
    content = '{"' + this._currentSpecName + '":' + content + "}"
    content = CryptoJS.AES.encrypt(content, PASSWORD).toString(); //encrypt the content for safety reasons

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var name
    if (this._isLanguageHu) {
      name = "tanterv_" + this._currentSpecName.split(' ').join('_').toLowerCase() + ".txt"
    }
    else {
      name = "course_" + this._currentSpecName.split(' ').join('_').toLowerCase() + ".txt"
    }
    FileSaver.saveAs(blob, name);
  }

  //reset the state of the curriculum to the initial state of the spec
  public resetCurriculum() {
    this.curriculums[this._currentSpecIdx] = new Curriculum(SPEC_NAMES[this._currentSpecIdx], SPEC_LINKS[this._currentSpecIdx])
  }

  //open file which contains the state of a curriculum
  public openFile(event: any) {
    var file = event.target.files[0]
    var reader = new FileReader();
    var content
    console.log("HERE")

    reader.onload = () => {
      console.log("HERE2")
      content = reader.result;
      console.log(typeof (content))
      if (typeof (content) === "string") {
        try {
          content = CryptoJS.AES.decrypt(content, PASSWORD).toString(CryptoJS.enc.Utf8); //decrypt the content of the file
          //console.log(content)
          this.loadDataFromFile(content)
        }
        catch (error) {
          console.log("HERE4")
          if (this._isLanguageHu) {
            swal({ text: "Hibás a fájl formátuma!", dangerMode: true })
          }
          else {
            swal({ text: "The format of the file is incorrect!", dangerMode: true })
          }
        }
      }
    }
    console.log("HERE#")
    reader.readAsText(file);
    event.target.value = "";
  }

  //#endregion 

  //#region Private Methods

  //update the semesters when a subject is dropped into another semester
  private transferArrayItem(prevColumnIdx: number, columnIdx: number, prevIdx: number, currentIdx: number) {

    const itemToMove = this.curriculums[this._currentSpecIdx].semesters[prevColumnIdx].subjects[prevIdx];

    //check whether the subject can be moved to the semester
    if (this.curriculums[this.currentSpecIdx].prerequisiteIsFurther(itemToMove, columnIdx) || this.curriculums[this.currentSpecIdx].overlayIsSooner(itemToMove, columnIdx)) {
      if (this._isLanguageHu) {
        swal("Nem veheted fel a tárgyat a kiválasztott félévbe, mivel az előkövetelmények nem teljesülnek.")
      }
      else {
        swal("You can not enroll to this subject because the prerequisites are not completed.")
      }
      return
    }

    if ((prevColumnIdx + columnIdx) % 2 != 0) {
      if (this._isLanguageHu) {
        swal("Ellenőrizd, hogy a tárgy a keresztfélévben is indul.")
      }
      else {
        swal("Check whether you can enroll to the subject in a cross semester.")
      }
    }

    this.curriculums[this.currentSpecIdx].moveItemInArray(prevColumnIdx, columnIdx, prevIdx, currentIdx)
  }

  //show error message for the user if the data for the optional subject is not good
  private showOptionalFormMessage() {
    if (this._optionalSubjectsForm.name != "" && this._optionalSubjectsForm.code != "" && this._optionalSubjectsForm.credit > 0 && this._optionalSubjectsForm.semester != -1) {
      swal(this._optionalSubjectsFormMessage)
    }
  }

  //check if the form fields are correct for the optional form
  private checkOptionalForm(): boolean {

    //rules for the name and code (can be added if needed)
    //var nameRegex = new RegExp('^[a-zA-ZÁÉÍÓÖŐÚÜŰáéíóöőúüű][a-zA-Z0-9. ÁÉÍÓÖŐÚÜŰáéíóöőúüű]+$')
    //var codeRegex = new RegExp('^[a-zA-Z][a-zA-Z0-9-]+$')

    var name = this._optionalSubjectsForm.name.length <= 60
    if (!name) {
      if (this._isLanguageHu) {
        this._optionalSubjectsFormMessage += "A név nem megfelelő: maximum 60 karakter hosszú lehet.\n\n"
      }
      else {
        this._optionalSubjectsFormMessage += "The name is incorrect: it can not be more than 60 characters.\n\n"
      }
    }

    var code = this._optionalSubjectsForm.code.length < 20
    if (!code) {
      if (this._isLanguageHu) {
        this._optionalSubjectsFormMessage += "A kód nem megfelelő: maximum 20 karakter hosszú lehet.\n\n"
      }
      else {
        this._optionalSubjectsFormMessage += "The code is incorrect: it can not be more than 20 characters.\n\n"
      }
    }

    var credit = this._optionalSubjectsForm.credit <= 30
    if (!credit) {
      if (this._isLanguageHu) {
        this._optionalSubjectsFormMessage += "A kreditek száma nem megfelelő: nem lehet több 30-nál.\n"
      }
      else {
        this._optionalSubjectsFormMessage += "The number of credits is incorrect: it can not be more than 30\n"
      }
    }

    return (name && code && credit)
  }

  //change the subject types to string to create JSON from it
  private changePrerequisitesAndOverlaysToString(key: any, value: any): any {
    if (key === "_pre") {
      var curriculums = value
      value = []
      for (let i = 0; i < curriculums.length; i++) {
        var pre = curriculums[i]
        pre.subject = pre.subject.code
        value.push(pre)
      }
    }
    else if (key === "_over") {
      var curriculums = value
      value = []
      for (let i = 0; i < curriculums.length; i++) {
        value.push(curriculums[i].code)
      }
    }
    return value;
  }

  //load the content of the file and build a curriculum from it
  private loadDataFromFile(content: string) {
    try {
      const jsonObject = JSON.parse(content);

      //if the curriculum in the file belongs to the current spec 
      if (!jsonObject.hasOwnProperty(this._currentSpecName)) {
        if (this._isLanguageHu) {
          swal({ text: "Nem megfelelő tanterv!", dangerMode: true })
        }
        else {
          swal({ text: "Incorrect curriculum!", dangerMode: true })
        }
        return
      }

      const curriculum = jsonObject[this._currentSpecName]

      this.curriculums[this.currentSpecIdx].getSubjects(curriculum)

    }
    catch (error) {
      if (this._isLanguageHu) {
        swal({ text: "Hibás a fájl formátuma!", dangerMode: true })
      }
      else {
        swal({ text: "The format of the file is incorrect!", dangerMode: true })
      }
    }
  }

  //#endregion 

}

export class Curriculum {

  //#region Properties

  private _completedCredits: number
  private _enrolledCredits: number
  private _completedCreditsPerc: string
  private _enrolledCreditsPerc: string
  private _semesters: Array<Semester>
  private _electiveSubjects: Array<Subject>
  private _xhttp: XMLHttpRequest;
  private _specLink: string;
  private _specName: string;
  private _currentSubjectCode: string = "";

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

  public get specLink(): string {
    return this._specLink
  }

  public get currentSubjectCode(): string {
    return this._currentSubjectCode
  }

  //#endregion

  //#region Constructors

  constructor(specName: string, specLink: string) {
    //initialize enrolled and completed credits in a semester
    this._completedCredits = 0
    this._enrolledCredits = 0
    this._enrolledCreditsPerc = "0%"
    this._completedCreditsPerc = "0%"

    //initialize the semester
    this._semesters = []
    this._electiveSubjects = []
    this._specName = specName
    this._specLink = specLink
    this._xhttp = new XMLHttpRequest();

    //get the data from the backend with XMLHttpRequest
    this._xhttp.open('GET', BACKEND_ADDRESS + ":" + BACKEND_PORT + "/" + specLink, true)
    this._xhttp.onreadystatechange = () => this.getData(specLink == "angol");
    this._xhttp.send();
  }

  //#endregion

  //#region Public Methods

  //handles the click event for a subject
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
    this.updateSubjectCredits([enrolled, completed], idx) //update credits

    return []
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
  public prerequisiteIsFurther(subject: Subject, columnIdx: number) : boolean {
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
  public overlayIsSooner(subject: Subject, columnIdx: number) : boolean {
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
      this.updateSubjectCurriculumCredits([-1 * subj.credit, 0])
      subj.status = 0
    }
    else if (subj.status == 2) { //if status is completed
      this.updateSubjectCurriculumCredits([-1 * subj.credit, -1 * subj.credit])
      subj.status = 0
      this.resetOverlays(subj)
    }
  }

  public getSubjects(curriculum: any) {
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
    else{
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
          this.updateSubjectCredits([-1 * elem.credit, 0], col)
        }
        else if (elem.status == 2) { //update credits if the status was completed
          this.updateSubjectCredits([-1 * elem.credit, -1 * elem.credit], col)
        }
        elem.status = 0;
      }
      this.setSubjectAvailability(elem)
    });
  }

  //update all credits if a subject status changes
  private updateSubjectCredits(credit: Array<number>, idx: number): void {
    this.semesters[idx].enrolledCredits += credit[0]
    this._enrolledCredits += credit[0]
    this.semesters[idx].completedCredits += credit[1]
    this._completedCredits += credit[1]
    this._completedCreditsPerc = this._completedCredits / 18 * 10 + "%"
    this._enrolledCreditsPerc = this._enrolledCredits / 18 * 10 + "%"
  }

  //update only curriculum credits if a subject status changes
  private updateSubjectCurriculumCredits(credit: Array<number>): void {
    this._enrolledCredits += credit[0]
    this._completedCredits += credit[1]
    this._completedCreditsPerc = this._completedCredits / 18 * 10 + "%"
    this._enrolledCreditsPerc = this._enrolledCredits / 18 * 10 + "%"
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
  private getData(isEnglish: boolean) {
    if (this._xhttp.readyState == 4 && this._xhttp.status == 200) {
      var resp = JSON.parse(JSON.parse(this._xhttp.responseText));

      for (let i = 0; i < NUMBER_OF_COLUMNS; i++) {
        this.addNewSemester()
      }

      this.getObligatoryData(resp[0], isEnglish)
      this.getElectiveData(resp[1], isEnglish)
    }
  }

  //get the core subject list from backend
  private getObligatoryData(resp: any, isEnglish: boolean) {

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
          if (isEnglish) { type = "L" }
          else { type = "EA" }
        }
      }
      else {
        if (isEnglish) { type = "P" }
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
      if (this.semesters[col].subjects[idx].pre.length==0){
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
    if (isEnglish) {
      var thesis = new Subject("IP-18FSZD", "Diploma work consult.", 20, "", 0, [], [], 0, 6, "Kötelező", "", true)
    }
    else {
      var thesis = new Subject("IP-08SZDPIBN18", "Szakdolgozati konz.", 20, "", 0, [], [], 0, 6, "Kötelező", "", true)
    }

    this.semesters[NUMBER_OF_COLUMNS - 1].addNewSubject(thesis)
  }

  //get the elective subject list from backend
  private getElectiveData(resp: any, isEnglish: boolean) {

    //iterate through every subject
    for (var i = 0; i < resp.length; i++) {
      var semester = resp[i]["Ajánlott félév"]

      if (typeof semester === 'string') {
        semester = parseInt(semester.split(",")[0]) //get the first semester from the recommended ones
      }

      var type = ""  //set type (Lecture or Practice)
      if (resp[i]["Előadás"] > 0) {
        if (resp[i]["Gyakorlat"] == 0 && resp[i]["Labor"] == 0) {
          if (isEnglish) { type = "L" }
          else { type = "EA" }
        }
      }
      else {
        if (isEnglish) { type = "P" }
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

export class Semester {

  //#region Properties

  private _subjects: Array<Subject>
  private _completedCredits: number
  private _enrolledCredits: number

  //#endregion

  //#region Getters and Setters

  public get completedCredits(): number {
    return this._completedCredits
  }

  public set completedCredits(value: number) {
    this._completedCredits = value
  }

  public get enrolledCredits(): number {
    return this._enrolledCredits
  }

  public set enrolledCredits(value: number) {
    this._enrolledCredits = value
  }

  public get subjects(): Array<Subject> {
    return this._subjects
  }

  //#endregion

  //#region Constructors

  constructor() {
    this._completedCredits = 0;
    this._enrolledCredits = 0;
    this._subjects = []
  }

  //#endregion

  //#region Public Methods

  public addNewSubject(subj: Subject): void {
    this.subjects.push(subj)

    //update credits
    if (subj.status == 1) { //if the status is enrolled
      this.enrolledCredits += subj.credit
    }
    else if (subj.status == 2) { //if the status is completed
      this.enrolledCredits += subj.credit
      this.completedCredits += subj.credit
    }

  }

  public deleteSubject(index: number): void {
    var subj = this.subjects.splice(index, 1)[0];

    //update credits
    if (subj){
      if (subj.status == 1) { //if the status is enrolled
        this.enrolledCredits -= subj.credit
      }
      else if (subj.status == 2) { //if the status is completed
        this.enrolledCredits -= subj.credit
        this.completedCredits -= subj.credit
      }
    }

  }

  //#endregion

}

export class Subject {

  private _code: string;
  private _name: string;
  private _type: string;
  private _credit: number;
  private _status: number;
  private _pre: Array<Prerequisite>;
  private _over: Array<Subject>;
  private _border: number;
  private _proposedSemester: number;
  private _spec: string;
  private _ken: string;
  private _isAvailable: boolean;

  constructor(code: string, name: string, credit: number, type: string = "", status: number = 0, pre: Array<Prerequisite> = [], over: Array<Subject> = [], border: number = 0, proposedSemester: number = 0, spec: string = "", ken: string = "", isAvailable: boolean = false) {
    this._code = code
    this._name = name
    this._credit = credit
    this._type = type
    this._status = status
    this._pre = pre
    this._over = over
    this._border = border
    this._proposedSemester = proposedSemester
    this._spec = spec
    this._ken = ken
    this._isAvailable = isAvailable
  }

  //#region Getters and Setters

  public get code(): string {
    return this._code;
  }

  public set code(value: string) {
    this._code = value;
  }

  public get name(): string {
    return this._name;
  }

  public set name(value: string) {
    this._name = value;
  }

  public get type(): string {
    return this._type;
  }

  public set type(value: string) {
    this._type = value;
  }

  public get credit(): number {
    return this._credit;
  }

  public set credit(value: number) {
    this._credit = value;
  }

  public get status(): number {
    return this._status;
  }

  public set status(value: number) {
    this._status = value;
  }

  public get pre(): Array<Prerequisite> {
    return this._pre;
  }

  public set pre(value: Array<Prerequisite>) {
    this._pre = value;
  }

  public get over(): Array<Subject> {
    return this._over;
  }

  public set over(value: Array<Subject>) {
    this._over = value;
  }

  public get border(): number {
    return this._border;
  }

  public set border(value: number) {
    this._border = value;
  }

  public get proposedSemester(): number {
    return this._proposedSemester;
  }

  public set proposedSemester(value: number) {
    this._proposedSemester = value;
  }

  public get spec(): string {
    return this._spec;
  }

  public set spec(value: string) {
    this._spec = value;
  }

  public get ken(): string {
    return this._ken;
  }

  public set ken(value: string) {
    this._ken = value;
  }

  public get isAvailable(): boolean {
    return this._isAvailable;
  }

  public set isAvailable(value: boolean) {
    this._isAvailable = value;
  }

  //#endregion

}

type Form = {
  code: string;
  name: string;
  type: string;
  credit: number;
  semester: number;
}

type Prerequisite = {
  subject: Subject;
  weak: boolean;
}

