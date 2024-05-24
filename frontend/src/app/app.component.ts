import { Component, OnInit } from '@angular/core';
import { NgForm } from "@angular/forms";
import * as FileSaver from 'file-saver';
import swal from 'sweetalert';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Subject } from './subject';
import { Curriculum } from './curriculum';
import { LocalStorageService } from './local-storage.service';
import { JsonDataHandler } from './json-data-handler';
import { IStorage } from './i-storage';
import { environment } from '../environments/environment';

const MAX_COLUMN_NUMBERS: number = environment.maxNumberOfSemesters;
const SPEC_NAMES: Array<string> = environment.specNames
const SPEC_LINKS: Array<string> = environment.specLinks
const SPEC_COMP_INFO_CREDITS: Array<number> = environment.specCompInfoCredits
const SPEC_COMP_SCIENCE_CREDITS: Array<number> = environment.specCompScienceCredits
const BACKEND_ADDRESS: string = environment.backendUrl
const BACKEND_PORT: string = environment.backendPort

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

  private _subjectToAddSpecType: string = "compulsory"
  private _compElectiveSubjectsForm: Form = { code: "", name: "", type: "", semester: -1, credit: 0, ken: "" }
  private _electiveSubjectsForm: Form = { code: "", name: "", type: "", semester: -1, credit: 0, ken: "" }
  private _electiveSubjectsFormMessage: string = ""

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

  public get compElectiveSubjectsForm(): Form {
    return this._compElectiveSubjectsForm
  }

  public set compElectiveSubjectsForm(form: any) {
    this._compElectiveSubjectsForm = form
  }

  public get electiveSubjectsForm(): Form {
    return this._electiveSubjectsForm
  }

  public set electiveSubjectsForm(form: any) {
    this._electiveSubjectsForm = form
  }

  public get electiveSubjectsFormMessage(): string {
    return this._electiveSubjectsFormMessage
  }

  public get storage(): IStorage {
    return this._storage;
  }

  //#endregion

  //#region Constructor

  constructor() {
    //create the storage
    this._storage = new LocalStorageService()

    //initialize the curriculums
    for (let i = 0; i < SPEC_LINKS.length; i++) {
      var curriculum = new Curriculum(SPEC_NAMES[i], SPEC_COMP_INFO_CREDITS[i], SPEC_COMP_SCIENCE_CREDITS[i])
      this._curriculums.push(curriculum)
    }

    //set the current spec to the first one
    this._currentSpecName = SPEC_NAMES[0]
    this._currentSpecIdx = 0;
  }

  async ngOnInit(){
    for (let i = 0; i < SPEC_LINKS.length; i++) {
      this.makeRequest('GET', BACKEND_ADDRESS + ":" + BACKEND_PORT + "/" + SPEC_LINKS[i], i)
    }
  }
  //#endregion

  //#region Public Methods

  public getDarkModeText(): string {
    if (!this._isDarkMode) {
      return "Light"
    }
    return "Dark"
  }

  public changeLanguage() {
    this._isLanguageHu = !this._isLanguageHu
  }

  public changeDarkMode() {
    this._isDarkMode = !this._isDarkMode
  }

  //handle the click event for a subject
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

    //special warning to not forget to submit the thesis registration form
    if (subj.status == 1 && (subj.code == "IP-18FSZD" || subj.code == "IP-08SZDPIBN18")) {
      if (this._isLanguageHu) { resp = "Ne feledd a témabejelentő kérvényt leadni!" }
      else { resp = "Do not forget to submit the thesis registration form!" }
      swal(resp);
    }

  }

  //handle the spec type change event of a subject
  public changeTypeEventHandler(subj: Subject): void {
    this.curriculums[this._currentSpecIdx].changeSubjectSpec(subj)
  }

  //handle the drop event of a subject
  public dropEventHandler(event: CdkDragDrop<string[]>, index: number) {
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

  //add a new semester
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

  //delete the semester with the index
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
  public submitFormEventHandler(form: NgForm) {
    var resp = form.value

    //if the new subject is elective
    if (this._subjectToAddSpecType == "not compulsory") {
      if (!this.checkElectiveForm()) {
        this.showElectiveFormMessage()
        this._electiveSubjectsFormMessage = ""
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

        if (resp.ken == "") {
          resp.ken = "Egyéb"
        }

        var subj: Subject = new Subject(resp.code, resp.name, resp.credit, resp.type, 0, [], [], 0, 0, "Szabadon választható", resp.ken)
        this.curriculums[this._currentSpecIdx].semesters[resp.semester].addNewSubject(subj)

        this._electiveSubjectsForm.name = ""
        this._electiveSubjectsForm.code = ""
        this._electiveSubjectsForm.credit = 0
        this._electiveSubjectsForm.type = ""
        this._electiveSubjectsForm.ken = ""
        this._electiveSubjectsForm.semester = -1
      }
    }
    else if (this._subjectToAddSpecType == "compulsory") { //if the new subject is compulsory elective
      var idx = resp.obligName
      var subj = this.curriculums[this._currentSpecIdx].compElectiveSubjects[idx]

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
          swal("Nem veheted fel a tárgyat a kiválasztott félévbe, mivel az előfeltételek nem teljesülnek.")
        }
        else {
          swal("You can not enroll to this subject because the prerequisites are not completed.")
        }
        return
      }

      this.curriculums[this.currentSpecIdx].connectPrerequisites(subj)
      this.curriculums[this._currentSpecIdx].semesters[resp.semester].addNewSubject(subj)
      this.curriculums[this._currentSpecIdx].setSubjectAvailability(subj)
      this._compElectiveSubjectsForm.name = ""
      this._compElectiveSubjectsForm.semester = -1
    }

  }

  //check if the form is correct (else the submit button can not be clicked)
  public checkForm(): boolean {
    if (this._subjectToAddSpecType == "compulsory") {
      var form = this._compElectiveSubjectsForm
      return form.name != "" && form.semester != -1
    }
    else if (this._subjectToAddSpecType == "not compulsory") {
      var form = this._electiveSubjectsForm
      return form.name != "" && form.code != "" && form.credit > 0 && form.semester != -1
    }
    return true
  }

  //show an alert to the user when deleting a subject
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

  //show an alert to the user when deleting a subject
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
    for (let i = 0; i < this._curriculums[this._currentSpecIdx].semesters.length; i++) {
      subjects.push(this._curriculums[this._currentSpecIdx].semesters[i].subjects)
    }

    var content = JSON.stringify(subjects, JsonDataHandler.changePrerequisitesAndOverlaysToString);
    var internship = this._curriculums[this._currentSpecIdx].isInternshipCompleted.toString()

    content = '{"' + this._currentSpecName + '":' + '{"subjects":' + content + ',"internship":' + internship + "}}"

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var name
    if (this._isLanguageHu) {
      name = "tanterv_" + this._currentSpecName.split(' ').join('_').toLowerCase() + ".txt"
    }
    else {
      name = "curriculum_" + this._currentSpecName.split(' ').join('_').toLowerCase() + ".txt"
    }
    FileSaver.saveAs(blob, name);
  }

  //save the current state of the curriculum to the Local Storage
  public saveCurriculumToStorage() {
    var subjects = []
    for (let i = 0; i < this._curriculums[this._currentSpecIdx].semesters.length; i++) {
      subjects.push(this._curriculums[this._currentSpecIdx].semesters[i].subjects)
    }

    var content = JSON.stringify(subjects, JsonDataHandler.changePrerequisitesAndOverlaysToString);
    var internship = this._curriculums[this._currentSpecIdx].isInternshipCompleted.toString()

    content = '{"subjects":' + content + ',"internship":' + internship + "}"
    this._storage.set(this.currentSpecName, content)
  }

  //reset the state of the curriculum to the initial state of the spec
  public async resetCurriculum() {
    this.curriculums[this._currentSpecIdx] = new Curriculum(SPEC_NAMES[this._currentSpecIdx], SPEC_COMP_INFO_CREDITS[this.currentSpecIdx], SPEC_COMP_SCIENCE_CREDITS[this._currentSpecIdx])
    this.makeRequest('GET', BACKEND_ADDRESS + ":" + BACKEND_PORT + "/" + SPEC_LINKS[this._currentSpecIdx], this.currentSpecIdx)
  }

  //open file which contains the state of a curriculum
  public openFile(event: any) {
    var file = event.target.files[0]
    var reader = new FileReader();
    var content

    reader.onload = () => {
      content = reader.result;
      if (typeof (content) === "string") {
        try {
          this.loadCurriculumFromFile(content)
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

  public loadCurriculumFromStorage() {
    var content = this._storage.get(this._currentSpecName)
    if (content) {
      var resp = JSON.parse(content)
      this._curriculums[this.currentSpecIdx] = new Curriculum(SPEC_NAMES[this.currentSpecIdx], SPEC_COMP_INFO_CREDITS[this.currentSpecIdx], SPEC_COMP_SCIENCE_CREDITS[this.currentSpecIdx])
      JsonDataHandler.getAllData(resp.subjects, resp.internship, this._curriculums[this.currentSpecIdx])
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
        swal("Nem veheted fel a tárgyat a kiválasztott félévbe, mivel az előfeltételei vagy a ráépülő tárgyak előfeltételei nem teljesülnek.")
      }
      else {
        swal("You can not enroll to this subject because the prerequisites are not completed.")
      }
      return
    }

    if ((prevColumnIdx + columnIdx) % 2 != 0) {
      if (this._isLanguageHu) {
        swal("Ellenőrizd, hogy a tárgy indul-e az adott félévben.")
      }
      else {
        swal("Check whether you can enroll to the subject in the given semester.")
      }
    }

    this.curriculums[this.currentSpecIdx].moveItemInArray(prevColumnIdx, columnIdx, prevIdx, currentIdx)
  }

  //show error message to the user if the data for the elective subject is not good
  private showElectiveFormMessage() {
    if (this._electiveSubjectsForm.name != "" && this._electiveSubjectsForm.code != "" && this._electiveSubjectsForm.credit > 0 && this._electiveSubjectsForm.semester != -1) {
      swal(this._electiveSubjectsFormMessage)
    }
  }

  //check if the form fields are correct for the elective form
  private checkElectiveForm(): boolean {

    //rules for the name and code (can be added if needed)
    //var nameRegex = new RegExp('^[a-zA-ZÁÉÍÓÖŐÚÜŰáéíóöőúüű][a-zA-Z0-9. ÁÉÍÓÖŐÚÜŰáéíóöőúüű]+$')
    //var codeRegex = new RegExp('^[a-zA-Z][a-zA-Z0-9-]+$')

    var name = this._electiveSubjectsForm.name.length <= 60
    if (!name) {
      if (this._isLanguageHu) {
        this._electiveSubjectsFormMessage += "A név nem megfelelő: maximum 60 karakter hosszú lehet.\n\n"
      }
      else {
        this._electiveSubjectsFormMessage += "The name is incorrect: it can not be more than 60 characters.\n\n"
      }
    }

    var code = this._electiveSubjectsForm.code.length < 20
    if (!code) {
      if (this._isLanguageHu) {
        this._electiveSubjectsFormMessage += "A kód nem megfelelő: maximum 20 karakter hosszú lehet.\n\n"
      }
      else {
        this._electiveSubjectsFormMessage += "The code is incorrect: it can not be more than 20 characters.\n\n"
      }
    }

    var credit = this._electiveSubjectsForm.credit <= 30
    if (!credit) {
      if (this._isLanguageHu) {
        this._electiveSubjectsFormMessage += "A kreditek száma nem megfelelő: nem lehet több 30-nál.\n"
      }
      else {
        this._electiveSubjectsFormMessage += "The number of credits is incorrect: it can not be more than 30\n"
      }
    }

    return (name && code && credit)
  }

  private async makeRequest(method: string, url: string, curriculumIdx: number): Promise<any> {
    return new Promise(() => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.onreadystatechange = () => JsonDataHandler.getData(xhr, this.curriculums[curriculumIdx]);
      xhr.send();
    });
  }

  //load the content of the file and build a curriculum from it
  private loadCurriculumFromFile(content: string) {
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
      this._curriculums[this.currentSpecIdx] = new Curriculum(SPEC_NAMES[this.currentSpecIdx], SPEC_COMP_INFO_CREDITS[this.currentSpecIdx], SPEC_COMP_SCIENCE_CREDITS[this.currentSpecIdx])
      JsonDataHandler.getAllData(curriculum.subjects, curriculum.internship, this._curriculums[this.currentSpecIdx])
      //this.curriculums[this.currentSpecIdx].getSubjects(curriculum.subjects, curriculum.internship)
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
  ken: string;
  credit: number;
  semester: number;
}



