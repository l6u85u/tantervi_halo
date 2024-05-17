import { Component } from '@angular/core';
import { NgForm } from "@angular/forms";
import * as FileSaver from 'file-saver';
import swal from 'sweetalert';
import * as CryptoJS from 'crypto-js';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Subject } from './subject';
import { Curriculum } from './curriculum';
import { LocalStorageService } from './local-storage.service';
import { IStorage } from './i-storage';

const PASSWORD: string = 'myPassword';
const MAX_COLUMN_NUMBERS: number = 18;
const TITLE: string = 'frontend';
const SPEC_NAMES: Array<string> = ["PTI Modellező", "PTI Tervező", "PTI Fejlesztő", "PTI Szoftvermérnök", "PTI Esti", "Computer Science"]
const SPEC_LINKS: Array<string> = ["modellezo", "tervezo", "fejleszto", "szombathely", "esti", "angol"]
const SPEC_COMP_INFO_CREDITS: Array<number> = [7,2,13,10,13,23]
const SPEC_COMP_SCIENCE_CREDITS: Array<number> = [2,7,7,0,7,0]

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

  private _storage: IStorage

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

    this._storage = new LocalStorageService()

    //initialize the curriculums
    for (let i = 0; i < SPEC_LINKS.length; i++) {
      var curriculum = new Curriculum(this._storage, SPEC_NAMES[i], SPEC_LINKS[i], SPEC_COMP_INFO_CREDITS[i], SPEC_COMP_SCIENCE_CREDITS[i])
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
    var internship = this._curriculums[this._currentSpecIdx].isInternshipCompleted.toString()

    content = '{"' + this._currentSpecName + '":' + '{"subjects":' + content + ',"internship":' + internship + "}}"
    console.log(content)
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

  //save the current state of the curriculum to the Local Storage
  public saveCurriculumToStorage(){
    var subjects = []
    for (let i=0;i<this._curriculums[this._currentSpecIdx].semesters.length;i++){
      subjects.push(this._curriculums[this._currentSpecIdx].semesters[i].subjects)
    }

    var content = JSON.stringify(subjects, this.changePrerequisitesAndOverlaysToString);
    var internship = this._curriculums[this._currentSpecIdx].isInternshipCompleted.toString()

    content = '{"subjects":' + content + ',"internship":' + internship + "}"
    this._storage.set(this.currentSpecName,content)
  }

  //reset the state of the curriculum to the initial state of the spec
  public resetCurriculum() {
    this._storage.remove(this.currentSpecName)
    this.curriculums[this._currentSpecIdx] = new Curriculum(this._storage, SPEC_NAMES[this._currentSpecIdx], SPEC_LINKS[this._currentSpecIdx], SPEC_COMP_INFO_CREDITS[this.currentSpecIdx], SPEC_COMP_SCIENCE_CREDITS[this._currentSpecIdx])
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

  public loadCurriculumFromLocalStorage() {
    var content = this._storage.get(this._currentSpecName)
    if (content){
      var resp = JSON.parse(content)
      this.curriculums[this.currentSpecIdx].getSubjects(resp.subjects, resp.internship)
    }
    else {
      swal(("A local storage-ban nincs elmentve " + this.currentSpecName + " tanterv!"))
    }
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

      this.curriculums[this.currentSpecIdx].getSubjects(curriculum.subjects, curriculum.internship)

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

export type Form = {
  code: string;
  name: string;
  type: string;
  credit: number;
  semester: number;
}



