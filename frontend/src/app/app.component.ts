import { Component } from '@angular/core';
import { NgForm } from "@angular/forms";
import { saveAs } from 'file-saver';
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

  private _completedCredits: number = 0;
  private _enrolledCredits: number = 0;
  private _completedCreditsPerc: string = "0%";
  private _enrolledCreditsPerc: string = "0%";
  private _completedCreditsSemester: Array<number> = [];
  private _enrolledCreditsSemester: Array<number> = [];

  private _subjects: Array<Array<Array<Subject>>> = [];
  private _electiveSubjects: Array<Array<Subject>> = [];

  private _xhttpForSpec: Array<XMLHttpRequest> = [];

  private _currentSubjectCode: string = "";
  private _currentSpecName: string;
  private _currentSpecIdx: number;

  private _specNames: Array<string> = SPEC_NAMES
  private _specLinks: Array<string> = SPEC_LINKS

  private _subjectToAddSpecType: string = "obligatory"
  private _electiveSubjectsForm: Form = { code: "", name: "", type: "", semester: -1, credit: 0 }
  private _optionalSubjectsForm: Form = { code: "", name: "", type: "", semester: -1, credit: 0 }
  private _optionalSubjectsFormMessage: string = ""

  //#endregion

  //#region Getters and Setters

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

  public get enrolledCreditsSemester(): Array<number> {
    return this._enrolledCreditsSemester
  }

  public get completedCreditsSemester(): Array<number> {
    return this._completedCreditsSemester
  }

  public get subjects(): Array<Array<Array<Subject>>> {
    return this._subjects
  }

  public get electiveSubjects(): Array<Array<Subject>> {
    return this._electiveSubjects
  }

  public get currentSubjectCode(): string {
    return this._currentSubjectCode
  }

  public get currentSpecName(): string {
    return this._currentSpecName
  }

  public get currentSpecIdx(): number {
    return this._currentSpecIdx
  }

  public get specNames(): Array<string> {
    return this._specNames
  }

  public get specLinks(): Array<string> {
    return this._specLinks
  }

  public get subjectToAddSpecType(): string {
    return this._subjectToAddSpecType
  }

  public get electiveSubjectsForm(): Form {
    return this._electiveSubjectsForm
  }

  public get optionalSubjectsForm(): Form {
    return this._optionalSubjectsForm
  }

  public get optionalSubjectsFormMessage(): string {
    return this._optionalSubjectsFormMessage
  }

  //#endregion

  //#region Constructor

  constructor() {

    for (let i = 0; i < this._specLinks.length; i++) {
      var xhttp = new XMLHttpRequest();
      this._xhttpForSpec.push(xhttp)
    }

    //get the data from the backend with XMLHttpRequest
    for (let i = 0; i < this._specLinks.length; i++) {
      this.electiveSubjects.push([])
      this.subjects.push([])
      this._xhttpForSpec[i].open('GET', BACKEND_ADDRESS + ":" + BACKEND_PORT + "/" + this._specLinks[i], true)
      this._xhttpForSpec[i].onreadystatechange = () => this.getDataFromSpec(this._xhttpForSpec[i], this.subjects[i], this.electiveSubjects[i], this._specLinks[i] == "angol");
      this._xhttpForSpec[i].send();
    }

    //initialize enrolled and completed credits in a semester
    for (let i = 0; i < NUMBER_OF_COLUMNS; i++) {
      this._enrolledCreditsSemester[i] = 0;
      this._completedCreditsSemester[i] = 0;
    }

    //set the current spec to the first one
    this._currentSpecName = this._specNames[0]
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
  public changeSubjectStatus(subj: Subject, idx: number): void {
    var enrolled;
    var completed;

    this.updateCurrentSubjectCode(subj.code)

    subj.border = 1

    if (subj.status == 0) {  //not enrolled status
      this.showPrerequisites(subj)
      if (!this.checkPrerequisites(subj)) {
        return
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
    this.updateSubjectCredits([enrolled, completed], idx) //update credits
  }

  //updates the subject which is currently chosen
  public updateCurrentSubjectCode(newValue: string) {

    //if a subject was previously chosen and it is active
    if (this._currentSubjectCode != "") {
      for (let i = 0; i < this.subjects[this._currentSpecIdx].length; i++)
        for (let j = 0; j < this.subjects[this._currentSpecIdx][i].length; j++) {
          if (this.subjects[this._currentSpecIdx][i][j].code == this._currentSubjectCode) {
            this.subjects[this._currentSpecIdx][i][j].border = 0 //remove the mark
            if (this.subjects[this._currentSpecIdx][i][j].status != 2) {
              this.hidePrerequisites(this.subjects[this._currentSpecIdx][i][j])
            }
            else if (this.subjects[this._currentSpecIdx][i][j].status == 2) {
              this.hideOverlays(this.subjects[this._currentSpecIdx][i][j])
            }
            break;
          }
        }
    }

    this._currentSubjectCode = newValue //update the active subject with the new value
  }

  //handles the drop event of a subject
  public drop(event: CdkDragDrop<string[]>, index: number) {

    //if the subject was dropped in the same semester as before
    if (event.previousContainer === event.container) {
      this.moveItemInArray(index, event.previousIndex, event.currentIndex);
    }
    else {
      var prevColumn = parseInt(event.previousContainer.element.nativeElement.classList[1].split("-")[1])
      this.transferArrayItem(prevColumn, index, event.previousIndex, event.currentIndex,);
    }
  }

  //change the specialization 
  public changeSpec(index: number) {
    this._currentSpecIdx = index;
    this._currentSpecName = this._specNames[index]
    this.updateCredits(index)
    this.updateCurrentSubjectCode("")
  }

  //adds a new semester
  public addSemester() {
    if (this.subjects[this._currentSpecIdx].length >= MAX_COLUMN_NUMBERS) {
      if (this._isLanguageHu) {
        swal("Elérted a maximális félévszámot, többet nem tudsz felvenni.")
      }
      else {
        swal("You reached the maximum number of semesters, you can not add more.")
      }

    }
    else {
      this.subjects[this._currentSpecIdx].push([])
      this._enrolledCreditsSemester.push(0)
      this._completedCreditsSemester.push(0);
    }
  }

  //deletes the semester with the index
  public deleteSemester(index: number) {
    //if the semester is not empty do not delete it
    if (this.subjects[this._currentSpecIdx][index].length != 0) {
      if (this._isLanguageHu) {
        swal("Csak üres félévet tudsz törölni.")
      }
      else {
        swal("You can only delete empty semesters.")
      }
    }
    else {
      this.subjects[this._currentSpecIdx].splice(index, 1)
      this._enrolledCreditsSemester.splice(index, 1)
      this._completedCreditsSemester.splice(index, 1)
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
        if (this.subjectIsAlreadyIn(resp.code)) {
          if (this._isLanguageHu) {
            swal({ text: "Ez a tárgy már szerepel a tantervben!", dangerMode: true })
          }
          else {
            swal({ text: "This subject is already in the curriculum!", dangerMode: true })
          }
          return
        }
        var subj: Subject = new Subject(resp.code, resp.name, resp.credit, resp.type, 0, [], [], 0, 0, "Szabadon választható", "Egyéb")
        this.subjects[this._currentSpecIdx][resp.semester].push(subj)
        this._optionalSubjectsForm.name = ""
        this._optionalSubjectsForm.code = ""
        this._optionalSubjectsForm.credit = 0
        this._optionalSubjectsForm.type = ""
        this._optionalSubjectsForm.semester = -1
      }
    }
    else if (this._subjectToAddSpecType == "obligatory") { //if the new subject is elective
      var idx = resp.obligName
      var subj = this.electiveSubjects[this._currentSpecIdx][idx]

      if (this.subjectIsAlreadyIn(subj.code)) {
        if (this._isLanguageHu) {
          swal({ text: "Ez a tárgy már szerepel a tantervben!", dangerMode: true })
        }
        else {
          swal({ text: "This subject is already in the curriculum!", dangerMode: true })
        }
        return
      }

      if (this.prerequisiteIsFurther(subj, parseInt(resp.semester))) { //check if can be added
        if (this._isLanguageHu) {
          swal("Nem veheted fel a tárgyat a kiválasztott félévbe, mivel az előkövetelmények nem teljesülnek.")
        }
        else {
          swal("You can not enroll to this subject because the prerequisites are not completed.")
        }
        return
      }
      this.connectPrerequisites(subj)
      this.subjects[this._currentSpecIdx][resp.semester].push(subj)
      this._electiveSubjectsForm.name = ""
      this._electiveSubjectsForm.semester = -1
    }

  }

  //check if the form is correct (else the submit button can not be clicked)
  public checkForm(): Boolean {
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

  //remove a subject and update the credits
  public deleteSubject() {
    const index = this.subjects[this._currentSpecIdx][this._subjectToDeleteSemester].indexOf(this._subjectToDelete, 0);
    if (index > -1) {
      this.subjects[this._currentSpecIdx][this._subjectToDeleteSemester].splice(index, 1);
    }
    if (this._subjectToDelete.status == 1) { //if status if enrolled
      this.updateSubjectCredits([-1 * this._subjectToDelete.credit, 0], this._subjectToDeleteSemester)
    }
    else if (this._subjectToDelete.status == 2) { //if status is completed
      this.updateSubjectCredits([-1 * this._subjectToDelete.credit, -1 * this._subjectToDelete.credit], this._subjectToDeleteSemester)
    }
  }

  //save the current state of the syllabus to a file
  public saveSyllabusToFile() {
    var content = JSON.stringify(this.subjects[this._currentSpecIdx], this.changePrerequisitesAndOverlaysToString);
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
    saveAs(blob, name);
  }

  //reset the state of the syllabus to the initial state of the spec
  resetSyllabus() {
    var i = this._currentSpecIdx
    this.subjects[i] = []
    this._xhttpForSpec[i].open('GET', BACKEND_ADDRESS + ":" + BACKEND_PORT + "/" + this._specLinks[i], true)
    this._xhttpForSpec[i].onreadystatechange = () => this.getObligatoryDataFromSpec(this._xhttpForSpec[i], this.subjects[i], this._specLinks[i] == "angol");
    this._xhttpForSpec[i].send();
    this.resetCredits()
  }

  //open file which contains the state of a syllabus
  public openFile(event: any) {
    var file = event.target.files[0]
    var reader = new FileReader();
    var content

    reader.onload = () => {
      content = reader.result;
      if (typeof (content) === "string") {
        try {
          content = CryptoJS.AES.decrypt(content, PASSWORD).toString(CryptoJS.enc.Utf8); //decrypt the content of the file
          this.loadDataFromFile(content)
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
    }
    reader.readAsText(file);
    event.target.value = "";
  }

  //#endregion 

  //#region Private Methods

  //get the data from backend for one spec 
  private getDataFromSpec(xhttp: XMLHttpRequest, coreSubjects: Array<Array<Subject>>, electiveSubjects: Array<Subject>, isEnglish: boolean) {

    if (xhttp.readyState == 4 && xhttp.status == 200) {
      var resp = JSON.parse(JSON.parse(xhttp.responseText));

      for (let i = 0; i < NUMBER_OF_COLUMNS; i++) {
        coreSubjects.push([])
      }

      this.getObligatoryData(resp[0], coreSubjects, isEnglish)
      this.getElectiveData(resp[1], electiveSubjects, coreSubjects, isEnglish)

    }
  }

  //get the core subject list for one spec (without getting the electives)
  private getObligatoryDataFromSpec(xhttp: XMLHttpRequest, coreSubjects: Array<Array<Subject>>, isEnglish: boolean) {

    //check whether everything is ok with the backend
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      var resp = JSON.parse(JSON.parse(xhttp.responseText));

      for (let i = 0; i < NUMBER_OF_COLUMNS; i++) {
        coreSubjects.push([])
      }

      this.getObligatoryData(resp[0], coreSubjects, isEnglish)

    }
  }

  //get the core subject list from backend
  private getObligatoryData(resp: any, coreSubjects: Array<Array<Subject>>, isEnglish: boolean) {

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

      coreSubjects[Math.floor(semester - 1)].push(new Subject(resp[i]["Kód"], resp[i]["Tanegység"], resp[i]["Kredit"], type, 0, [], [], 0, semester, resp[i]["Típus"], resp[i]["Ismeretkör"]))
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
      for (let j = 0; j < coreSubjects[col].length; j++) {
        if (coreSubjects[col][j].code == resp[i]["Kód"]) {
          idx = j;
          break
        }
      }

      //separate the prerequisites of the subject
      var pre_code = []
      if (resp[i]["Előfeltétel(ek)"] !== null) {
        pre_code = resp[i]["Előfeltétel(ek)"].split(",").map((str: string) => str.trim())
      }

      //find all the subjects in the subjects list and add them as prerequisite
      pre_code.forEach((code: string) => {
        var words = code.split(" ")
        var weak = false; //type of prerequisite

        if (words.length > 1 && (words[1] == "(gyenge)" || words[1] == "(weak)")) {
          weak = true
        }

        for (let j = 0; j <= col; j++)
          for (let l = 0; l < coreSubjects[j].length; l++) {
            if (coreSubjects[j][l].code == words[0]) {
              coreSubjects[col][idx].pre.push({ subject: coreSubjects[j][l], weak: weak })
              break
            }
          }

      })

      //separate the overlays of the subject
      var over_code = []
      if (resp[i]["Ráépülő"] != "") {
        over_code = resp[i]["Ráépülő"].split(",").map((str: string) => str.trim())
      }

      //find all the subjects in the subjects list and add them as overlays
      over_code.forEach((code: string) => {
        for (let j = col; j < coreSubjects.length; j++)
          for (let l = 0; l < coreSubjects[j].length; l++) {
            if (coreSubjects[j][l].code == code) {
              coreSubjects[col][idx].over.push(coreSubjects[j][l])
              break
            }
          }
      })

    }

    //add the 'Diploma work consultation' subject in the last semester
    if (isEnglish) {
      var thesis = new Subject("IP-18FSZD", "Diploma work consult.", 20, "", 0, [], [], 0, 6, "Kötelező", "")
    }
    else {
      var thesis = new Subject("IP-08SZDPIBN18", "Szakdolgozati konz.", 20, "", 0, [], [], 0, 6, "Kötelező", "")
    }

    coreSubjects[NUMBER_OF_COLUMNS - 1].push(thesis)
  }

  //get the elective subject list from backend
  private getElectiveData(resp: any, electiveSubjects: Array<Subject>, coreSubjects: Array<Array<Subject>>, isEnglish: boolean) {

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

      electiveSubjects.push(new Subject(resp[i]["Kód"], resp[i]["Tanegység"], resp[i]["Kredit"], type, 0, [], [], 0, semester, resp[i]["Típus"], resp[i]["Ismeretkör"]))
    }

    //iterate through every elective subject
    for (var i = 0; i < electiveSubjects.length; i++) {

      //separate the prerequisites of the subject
      var pre_code = []
      if (resp[i]["Előfeltétel(ek)"] !== null) {
        pre_code = resp[i]["Előfeltétel(ek)"].split(",").map((str: string) => str.trim())
      }

      //find all the subjects in the elective subjects list and add them as prerequisite
      pre_code.forEach((code: string) => {
        var words = code.split(" ")
        var weak = false;
        if (words.length > 1 && (words[1] == "(gyenge)" || words[1] == "(weak)")) {
          weak = true
        }

        //search in the elective subject list
        var found = false;
        for (let j = 0; j < electiveSubjects.length; j++) {
          if (electiveSubjects[j].code == words[0]) {
            electiveSubjects[i].pre.push({ subject: electiveSubjects[j], weak: weak })
            found = true
            break
          }
        }

        //search in the core subject list
        if (!found) {
          for (let j = 0; j < coreSubjects.length && !found; j++)
            for (let l = 0; l < coreSubjects[j].length; l++) {
              if (coreSubjects[j][l].code == words[0]) {
                electiveSubjects[i].pre.push({ subject: coreSubjects[j][l], weak: weak })
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

      //find all the subjects in the elective subjects list and add them as overlays
      over_code.forEach((code: string) => {
        for (let j = 0; j < electiveSubjects.length; j++) {
          if (electiveSubjects[j].code == code) {
            electiveSubjects[i].over.push(electiveSubjects[j])
            break
          }
        }
      })

    }

  }

  //update credits if a subject status changes
  private updateSubjectCredits(credit: Array<number>, idx: number): void {
    this._enrolledCreditsSemester[idx] += credit[0]
    this._enrolledCredits += credit[0]
    this._completedCreditsSemester[idx] += credit[1]
    this._completedCredits += credit[1]
    this._completedCreditsPerc = this._completedCredits / 18 * 10 + "%"
    this._enrolledCreditsPerc = this._enrolledCredits / 18 * 10 + "%"
  }

  //check whether the prerequisites of a subject are completed
  private checkPrerequisites(subj: Subject): Boolean {
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

    //if some prerequisites are not completed
    if (pre.length > 0) {
      var resp: string

      if (this._isLanguageHu) { resp = "A következő előfeltételek nem teljesültek:\n" }
      else { resp = "The following prerequisites are not completed:\n" }

      pre.forEach(e => { resp += e + "\n" })

      swal(resp);
      return false;
    }

    return true
  }

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

  //if a subject's status changes from completed to not enrolled, the overlay subjects' status also reflect that 
  private resetOverlays(subj: Subject) {

    //iterate through the overlays
    subj.over.forEach(elem => {
      if (elem.status != 0) { //if the overlay subject's status is enrolled or completed
        var col = -1;
        for (let i = 0; i < this.subjects[this._currentSpecIdx].length; i++) { //finding the column which contains it
          if (this.subjects[this._currentSpecIdx][i].includes(elem)) {
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
    });
  }

  //update the order when a subject is dropped in the same semester
  private moveItemInArray(columnIdx: number, prevIdx: number, currentIdx: number) {
    const itemToMove = this.subjects[this._currentSpecIdx][columnIdx][prevIdx];

    this.subjects[this._currentSpecIdx][columnIdx].splice(prevIdx, 1);
    this.subjects[this._currentSpecIdx][columnIdx].splice(currentIdx, 0, itemToMove);
  }

  //update the semesters when a subject is dropped into another semester
  private transferArrayItem(prevColumnIdx: number, columnIdx: number, prevIdx: number, currentIdx: number) {

    const itemToMove = this.subjects[this._currentSpecIdx][prevColumnIdx][prevIdx];

    //check whether the subject can be moved to the semester
    if (this.prerequisiteIsFurther(itemToMove, columnIdx) || this.overlayIsSooner(itemToMove, columnIdx)) {
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

    this.subjects[this._currentSpecIdx][prevColumnIdx].splice(prevIdx, 1);
    this.subjects[this._currentSpecIdx][columnIdx].splice(currentIdx, 0, itemToMove);
  }

  //check if a prerequisite is in a further semester (or in the same semester)
  private prerequisiteIsFurther(subject: Subject, columnIdx: number) {
    for (let p = 0; p < subject.pre.length; p++) {
      for (let i = columnIdx + 1; i < this.subjects[this._currentSpecIdx].length; i++) {
        for (let j = 0; j < this.subjects[this._currentSpecIdx][i].length; j++) {
          if (subject.pre[p].subject.code == this.subjects[this._currentSpecIdx][i][j].code) {
            return true
          }
        }
      }

      //in the same semester but the interdependency is not weak
      for (let j = 0; j < this.subjects[this._currentSpecIdx][columnIdx].length; j++) {
        if (subject.pre[p].subject.code == this.subjects[this._currentSpecIdx][columnIdx][j].code) {
          var isWeak = false;
          for (let k = 0; k < subject.pre.length; k++) {
            if (subject.pre[k].subject == this.subjects[this._currentSpecIdx][columnIdx][j] && subject.pre[k].weak) {
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
  private overlayIsSooner(subject: Subject, columnIdx: number) {
    for (let p = 0; p < subject.over.length; p++) {
      for (let i = 0; i < columnIdx; i++) {
        for (let j = 0; j < this.subjects[this._currentSpecIdx][i].length; j++) {
          if (subject.over[p].code == this.subjects[this._currentSpecIdx][i][j].code) {
            return true
          }
        }
      }

      //in the same semester but the interdependency is not weak
      for (let j = 0; j < this.subjects[this._currentSpecIdx][columnIdx].length; j++) {
        if (subject.over[p].code == this.subjects[this._currentSpecIdx][columnIdx][j].code) {
          var isWeak = false;
          for (let k = 0; k < this.subjects[this._currentSpecIdx][columnIdx][j].pre.length; k++) {
            if (this.subjects[this._currentSpecIdx][columnIdx][j].pre[k].subject == subject && this.subjects[this._currentSpecIdx][columnIdx][j].pre[k].weak) {
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

  //recalculate the credits in a semester
  private updateCredits(index: number) {
    this._completedCredits = 0;
    this._enrolledCredits = 0;

    for (let i = 0; i < this.subjects[index].length; i++) {
      this._enrolledCreditsSemester[i] = 0
      this._completedCreditsSemester[i] = 0

      for (let j = 0; j < this.subjects[index][i].length; j++) {
        var subj = this.subjects[index][i][j]
        if (subj.status == 1) {
          this._enrolledCreditsSemester[i] += subj.credit
        }
        else if (subj.status == 2) {
          this._enrolledCreditsSemester[i] += subj.credit
          this._completedCreditsSemester[i] += subj.credit
        }
      }

      this._completedCredits += this._completedCreditsSemester[i]
      this._enrolledCredits += this._enrolledCreditsSemester[i]
    }

    this._completedCreditsPerc = this._completedCredits / 18 * 10 + "%"
    this._enrolledCreditsPerc = this._enrolledCredits / 18 * 10 + "%"
  }

  //check if the subject that needs to be added is already in the list
  private subjectIsAlreadyIn(code: string) {
    for (let i = 0; i < this.subjects[this._currentSpecIdx].length; i++) {
      for (let j = 0; j < this.subjects[this._currentSpecIdx][i].length; j++)
        if (this.subjects[this._currentSpecIdx][i][j].code == code) {
          return true
        }
    }
    return false
  }

  //show error message for the user if the data for the optional subject is not good
  private showOptionalFormMessage() {
    if (this._optionalSubjectsForm.name != "" && this._optionalSubjectsForm.code != "" && this._optionalSubjectsForm.credit > 0 && this._optionalSubjectsForm.semester != -1) {
      swal(this._optionalSubjectsFormMessage)
    }
  }

  //check if the form fields are correct for the optional form
  private checkOptionalForm(): Boolean {

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

  //connect the newly added elective subject prerequisites with the core subject overlays
  private connectPrerequisites(subject: Subject) {
    for (let i = 0; i < subject.pre.length; i++) {
      if (subject.pre[i].subject.spec == "Kötelező" && !subject.pre[i].subject.over.includes(subject)) {
        this.updatePrerequisite(subject, subject.pre[i].subject)
      }
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

  //change the subject types to string to create JSON from it
  private changePrerequisitesAndOverlaysToString(key: any, value: any): any {
    if (key === "pre") {
      var subjects = value
      value = []
      for (let i = 0; i < subjects.length; i++) {
        var pre = subjects[i]
        pre.subject = pre.subject.code
        value.push(pre)
      }
    }
    else if (key === "over") {
      var subjects = value
      value = []
      for (let i = 0; i < subjects.length; i++) {
        value.push(subjects[i].code)
      }
    }
    return value;
  }

  //reset the credits in a semester to initial state
  private resetCredits() {
    for (let i = 0; i < this._completedCreditsSemester.length; i++) {
      this._enrolledCreditsSemester[i] = 0
      this._completedCreditsSemester[i] = 0
    }
    this._completedCredits = 0
    this._enrolledCredits = 0
    this._enrolledCreditsPerc = "0%"
    this._completedCreditsPerc = "0%"
  }

  //load the content of the file and build a syllabus from it
  private loadDataFromFile(content: string) {
    var coreSubjects = Array<Array<Subject>>()
    var complCredits = []
    var credits = []

    try {
      const jsonObject = JSON.parse(content);

      //if the syllabus in the file belongs to the current spec 
      if (!jsonObject.hasOwnProperty(this._currentSpecName)) {
        if (this._isLanguageHu) {
          swal({ text: "Nem megfelelő tanterv!", dangerMode: true })
        }
        else {
          swal({ text: "Incorrect curriculum!", dangerMode: true })
        }
        return
      }

      const syllabus = jsonObject[this._currentSpecName]

      for (let i = 0; i < syllabus.length; i++) {
        coreSubjects.push([])
        credits.push(0)
        complCredits.push(0)

        for (let j = 0; j < syllabus[i].length; j++) {
          var subj = syllabus[i][j]
          //add subject
          coreSubjects[i].push(new Subject(subj.code, subj.name, subj.credit, subj.type, subj.status, [], [], 0, subj.proposedSemester,subj.spec, subj.ken))
          if (subj.status == 1) { //if the status is enrolled
            credits[i] += subj.credit
          }
          else if (subj.status == 2) { //if the status is completed
            credits[i] += subj.credit
            complCredits[i] += subj.credit
          }
        }
      }

      for (let i = 0; i < syllabus.length; i++) {
        for (let j = 0; j < syllabus[i].length; j++) {

          //add the prerequisites for every subject
          var subj = syllabus[i][j]
          for (let l = 0; l < subj.pre.length; l++) {
            for (let k = 0; k <= i; k++) {
              for (let m = 0; m < coreSubjects[k].length; m++) {
                if (coreSubjects[k][m].code == subj.pre[l].subject) {
                  coreSubjects[i][j].pre.push({ subject: coreSubjects[k][m], weak: subj.pre[l].weak })
                  break
                }
              }
            }
          }

          //add the overlays for every subject
          for (let l = 0; l < subj.over.length; l++) {
            for (let k = i; k < syllabus.length; k++) {
              for (let m = 0; m < coreSubjects[k].length; m++) {
                if (coreSubjects[k][m].code == subj.over[l]) {
                  coreSubjects[i][j].over.push(coreSubjects[k][m])
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
      this._completedCreditsSemester = complCredits
      this._enrolledCreditsSemester = credits

      //recalculate the credits
      for (let i = 0; i < complCredits.length; i++) {
        this._completedCredits += complCredits[i]
        this._enrolledCredits += credits[i]
      }

      this._completedCreditsPerc = this._completedCredits / 18 * 10 + "%"
      this._enrolledCreditsPerc = this._enrolledCredits / 18 * 10 + "%"
      this.subjects[this._currentSpecIdx] = coreSubjects
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

  constructor(code: string, name: string, credit: number, type: string = "", status: number = 0, pre: Array<Prerequisite> = [], over: Array<Subject> = [], border: number = 0, proposedSemester: number = 0, spec: string = "", ken: string = "") {
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

