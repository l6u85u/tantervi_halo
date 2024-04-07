import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormControl, NgForm } from "@angular/forms";
import { SubjectComponent } from './subject/subject.component';
import { saveAs } from 'file-saver';
import swal from 'sweetalert';
import * as CryptoJS from 'crypto-js';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDragPlaceholder,
} from '@angular/cdk/drag-drop';

var backendAddress: string = "https://127.0.0.1";
var backendPort: string = "8000";

const numberOfColumns: number = 6
const password = 'myPassword';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  public isDarkMode = false
  public language = "HU"

  title = 'frontend';

  public MAX_COLUMN_NUMBERS = 18;

  public modalBody = ""
  public modalTitle = ""
  public modalFirstButton = ""
  public modalSecondButton = ""
  public subjectToDeleteSemester = -1;
  public subjectToDelete: any;

  public completedCredit = 0;
  public completedCreditPerc = "0%";
  public completedCreditSemester: Array<number> = [];
  public creditSemester: Array<number> = [];

  public subjects: Array<Array<Array<Subject>>> = [];
  public obligatorySpecSubjects: Array<Array<Subject>> = [];

  public xhttpSpec: Array<XMLHttpRequest> = [];

  private borderCode = "";

  public currentSpecName: string;
  public currentSpecIdx: number;

  public specNames: Array<string> = ["PTI Modellező", "PTI Tervező", "PTI Fejlesztő", "PTI Szoftvermérnök", "PTI Esti", "Computer Science"]
  public specLinks: Array<string> = ["modellezo", "tervezo", "fejleszto", "szombathely", "esti", "angol"]

  //public thesis: Subject = { name: "Szakdolgozati konz.", code: "IP-08SZDPIBN18", color: "", credit: 20, type: "", status: 0, pre: [], over: [], border: 0, proposedSemester: 6, spec: "Kötelező", ken: "" }

  public specType: string = "obligatory"
  public obligatorySpecForm: Form = { code: "", name: "", type: "", semester: -1, credit: 0 }
  public chosenSpecForm: Form = { code: "", name: "", type: "", semester: -1, credit: 0 }
  public chosenSpecFormMessage = ""

  darkMode(): string {
    if (this.isDarkMode) {
      return "Light"
    }
    return "Dark"
  }

  //public specABox: SubjectBox = {color:"grey", name:""}

  private getDataFromSpec(xhttp: XMLHttpRequest, obligBoxes: Array<Array<Subject>>, obligSpecBoxes: Array<Subject>) {


    if (xhttp.readyState == 4 && xhttp.status == 200) {
      var resp = JSON.parse(JSON.parse(xhttp.responseText));

      for (let i = 0; i < numberOfColumns; i++) {
        obligBoxes.push([])
      }

      this.getObligatoryData(resp[0], obligBoxes)
      this.getObligatorySpecData(resp[1], obligSpecBoxes, obligBoxes)

    }
  }

  private getObligatoryDataFromSpec(xhttp: XMLHttpRequest, obligBoxes: Array<Array<Subject>>) {

    if (xhttp.readyState == 4 && xhttp.status == 200) {
      var resp = JSON.parse(JSON.parse(xhttp.responseText));

      for (let i = 0; i < numberOfColumns; i++) {
        obligBoxes.push([])
      }

      this.getObligatoryData(resp[0], obligBoxes)

    }
  }

  private getObligatoryData(resp: any, obligBoxes: Array<Array<Subject>>) {

    for (var i = 0; i < resp.length; i++) {
      var felev = resp[i]["Ajánlott félév"]

      if (typeof felev === 'string') {
        felev = parseInt(felev.split(",")[0])
      }

      if (typeof felev === 'object') {
        felev = 4
      }

      var type = ""
      if (resp[i]["Előadás"] > 0) {
        if (resp[i]["Gyakorlat"] == 0 && resp[i]["Labor"] == 0) {
          type = "EA"
        }
      }
      else {
        type = "GY"
      }

      obligBoxes[Math.floor(felev - 1)].push({ name: resp[i]["Tanegység"], code: resp[i]["Kód"], color: "", credit: resp[i]["Kredit"], type: type, status: 0, pre: [], over: [], border: 0, proposedSemester: felev, spec: resp[i]["Típus"], ken: resp[i]["Ismeretkör"], warning: false })
    }


    for (var i = 0; i < resp.length; i++) {

      var felev = resp[i]["Ajánlott félév"]
      if (typeof felev === 'string') {
        felev = parseInt(felev.split(",")[0])
      }
      if (typeof felev === 'object') {
        felev = 4
      }

      var col = Math.floor(felev - 1)
      var idx = 0;
      for (let j = 0; j < obligBoxes[col].length; j++) {
        if (obligBoxes[col][j].code == resp[i]["Kód"]) {
          idx = j;
          break
        }
      }

      var pre_code = []
      if (resp[i]["Előfeltétel(ek)"] !== null) {
        pre_code = resp[i]["Előfeltétel(ek)"].split(",").map((str: string) => str.trim())
      }

      pre_code.forEach((code: string) => {
        var words = code.split(" ")
        var weak = false;
        if (words.length > 1 && (words[1] == "(gyenge)" || words[1] == "(weak)")) {
          weak = true
        }

        for (let j = 0; j <= col; j++)
          for (let l = 0; l < obligBoxes[j].length; l++) {
            if (obligBoxes[j][l].code == words[0]) {
              obligBoxes[col][idx].pre.push({ subject: obligBoxes[j][l], weak: weak })
              break
            }
          }

      })

      var over_code = []
      if (resp[i]["Ráépülő"] != "") {
        over_code = resp[i]["Ráépülő"].split(",").map((str: string) => str.trim())
      }

      over_code.forEach((code: string) => {
        for (let j = col; j < obligBoxes.length; j++)
          for (let l = 0; l < obligBoxes[j].length; l++) {
            if (obligBoxes[j][l].code == code) {
              obligBoxes[col][idx].over.push(obligBoxes[j][l])
              break
            }
          }
      })

    }
    var thesis = { name: "Szakdolgozati konz.", code: "IP-08SZDPIBN18", color: "", credit: 20, type: "", status: 0, pre: [], over: [], border: 0, proposedSemester: 6, spec: "Kötelező", ken: "", warning: false }
    obligBoxes[5].push(thesis)
  }

  private getObligatorySpecData(resp: any, boxes: Array<Subject>, obligBoxes: Array<Array<Subject>>) {
    for (var i = 0; i < resp.length; i++) {
      var felev = resp[i]["Ajánlott félév"]

      if (typeof felev === 'string') {
        felev = parseInt(felev.split(",")[0])
      }

      if (typeof felev === 'object') {
        felev = 4
      }

      var type = ""
      if (resp[i]["Előadás"] > 0) {
        if (resp[i]["Gyakorlat"] == 0 && resp[i]["Labor"] == 0) {
          type = "EA"
        }
      }
      else {
        type = "GY"
      }

      boxes.push({ name: resp[i]["Tanegység"], code: resp[i]["Kód"], color: "", credit: resp[i]["Kredit"], type: type, status: 0, pre: [], over: [], border: 0, proposedSemester: felev, spec: resp[i]["Típus"], ken: resp[i]["Ismeretkör"], warning: false })
    }


    for (var i = 0; i < boxes.length; i++) {

      var pre_code = []
      if (resp[i]["Előfeltétel(ek)"] !== null) {
        pre_code = resp[i]["Előfeltétel(ek)"].split(",").map((str: string) => str.trim())
      }

      pre_code.forEach((code: string) => {
        var words = code.split(" ")
        var weak = false;
        if (words.length > 1 && (words[1] == "(gyenge)" || words[1] == "(weak)")) {
          weak = true
        }

        var found = false;
        for (let j = 0; j < boxes.length; j++) {
          if (boxes[j].code == words[0]) {
            boxes[i].pre.push({ subject: boxes[j], weak: weak })
            found = true
            break
          }
        }

        if (!found) {
          for (let j = 0; j < obligBoxes.length && !found; j++)
            for (let l = 0; l < obligBoxes[j].length; l++) {
              if (obligBoxes[j][l].code == words[0]) {
                boxes[i].pre.push({ subject: obligBoxes[j][l], weak: weak })
                found = true
                break
              }
            }
        }


      })

      var over_code = []
      if (resp[i]["Ráépülő"] != "") {
        over_code = resp[i]["Ráépülő"].split(",").map((str: string) => str.trim())
      }

      over_code.forEach((code: string) => {
        for (let j = 0; j < boxes.length; j++) {
          if (boxes[j].code == code) {
            boxes[i].over.push(boxes[j])
            break
          }
        }
      })

    }

  }


  getSubjectCredit(subj: Subject, idx: number): void {
    var registered;
    var completed;

    this.changeBorderCode(subj.code)

    subj.border = 1
    //this.borderCode = subj.code

    if (subj.status == 0) {
      this.showPrerequisites(subj)
      if (!this.checkPrerequisites(subj)) {
        return
      }
      registered = subj.credit
      completed = 0
    }
    else if (subj.status == 1) {
      registered = 0
      completed = subj.credit
      this.hidePrerequisites(subj)
      this.showOverlays(subj)
    }
    else {
      registered = completed = -1 * subj.credit
      this.resetOverlays(subj)
      this.hideOverlays(subj)
    }
    subj.status = (subj.status + 1) % 3
    this.changeSubjectCredit([registered, completed], idx)

  }

  changeSubjectCredit(credit: Array<number>, idx: number): void {
    this.creditSemester[idx] += credit[0]
    this.completedCreditSemester[idx] += credit[1]
    this.completedCredit += credit[1]
    this.completedCreditPerc = this.completedCredit / 18 * 10 + "%"
  }

  checkPrerequisites(subj: Subject): Boolean {
    var pre: Array<string> = []
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

    if (pre.length > 0) {
      var resp = "A következő előfeltételek nem teljesültek:\n"
      pre.forEach(e => {
        resp += e + "\n"
      })
      swal(resp);
      return false;
    }

    return true
  }

  showPrerequisites(subj: Subject) {
    subj.pre.forEach(elem => {
      elem.subject.border = 2
    });
  }

  hidePrerequisites(subj: Subject) {
    subj.pre.forEach(elem => {
      elem.subject.border = 0
    });
  }

  showOverlays(subj: Subject) {
    subj.over.forEach(elem => {
      elem.border = 3
    });
  }

  hideOverlays(subj: Subject) {
    subj.over.forEach(elem => {
      elem.border = 0
    });
  }

  changeBorderCode(newValue: string) {

    if (this.borderCode != "") {
      for (let i = 0; i < this.subjects[this.currentSpecIdx].length; i++)
        for (let j = 0; j < this.subjects[this.currentSpecIdx][i].length; j++) {
          if (this.subjects[this.currentSpecIdx][i][j].code == this.borderCode) {
            this.subjects[this.currentSpecIdx][i][j].border = 0
            if (this.subjects[this.currentSpecIdx][i][j].status != 2) {
              this.hidePrerequisites(this.subjects[this.currentSpecIdx][i][j])
            }
            else if (this.subjects[this.currentSpecIdx][i][j].status == 2) {
              this.hideOverlays(this.subjects[this.currentSpecIdx][i][j])
            }
            break;
          }
        }
    }

    this.borderCode = newValue
  }

  resetOverlays(subj: Subject) {
    subj.over.forEach(elem => {
      if (elem.status != 0) {
        var col = -1;
        for (let i = 0; i < this.subjects[this.currentSpecIdx].length; i++) {
          if (this.subjects[this.currentSpecIdx][i].includes(elem)) {
            col = i;
            break;
          }
        }
        if (elem.status == 1) {
          this.changeSubjectCredit([-1 * elem.credit, 0], col)
        }
        else if (elem.status == 2) {
          this.changeSubjectCredit([-1 * elem.credit, -1 * elem.credit], col)
        }
        elem.status = 0;
      }
    });
  }

  drop(event: CdkDragDrop<string[]>, index: number) {
    if (event.previousContainer === event.container) {
      this.moveItemInArray(index, event.previousIndex, event.currentIndex);
    } else {
      var prevColumn = parseInt(event.previousContainer.element.nativeElement.classList[1].split("-")[1])
      this.transferArrayItem(
        prevColumn,
        index,
        event.previousIndex,
        event.currentIndex,
      );

    }
  }

  moveItemInArray(columnIdx: number, prevIdx: number, currentIdx: number) {
    const itemToMove = this.subjects[this.currentSpecIdx][columnIdx][prevIdx];

    this.subjects[this.currentSpecIdx][columnIdx].splice(prevIdx, 1);

    this.subjects[this.currentSpecIdx][columnIdx].splice(currentIdx, 0, itemToMove);
  }

  transferArrayItem(prevColumnIdx: number, columnIdx: number, prevIdx: number, currentIdx: number) {

    const itemToMove = this.subjects[this.currentSpecIdx][prevColumnIdx][prevIdx];

    if (this.prerequisiteIsFurther(itemToMove, columnIdx) || this.overlayIsSooner(itemToMove, columnIdx)) {
      swal("Nem veheted fel a tárgyat a kiválasztott félévbe, mivel az előkövetelmények nem teljesülnek.")
      return
    }

    if ((prevColumnIdx + columnIdx) % 2 != 0) {
      swal("Ellenőrizd, hogy keresztféléves-e tárgy.")
    }


    this.subjects[this.currentSpecIdx][prevColumnIdx].splice(prevIdx, 1);
    this.subjects[this.currentSpecIdx][columnIdx].splice(currentIdx, 0, itemToMove);


    /*if (itemToMove.status == 1) {
      this.changeSubjectCredit([- 1 * itemToMove.credit, 0], prevColumnIdx)
      this.changeSubjectCredit([itemToMove.credit, 0], columnIdx)
    }
    else if (itemToMove.status == 2) {
      this.changeSubjectCredit([-1 * itemToMove.credit, - 1 * itemToMove.credit], prevColumnIdx)
      this.changeSubjectCredit([itemToMove.credit, itemToMove.credit], columnIdx)
    }*/

  }

  prerequisiteIsFurther(subject: Subject, columnIdx: number) {
    for (let p = 0; p < subject.pre.length; p++) {
      for (let i = columnIdx + 1; i < this.subjects[this.currentSpecIdx].length; i++) {
        for (let j = 0; j < this.subjects[this.currentSpecIdx][i].length; j++) {
          if (subject.pre[p].subject.code == this.subjects[this.currentSpecIdx][i][j].code) {
            return true
          }
        }
      }

      for (let j = 0; j < this.subjects[this.currentSpecIdx][columnIdx].length; j++) {
        if (subject.pre[p].subject.code == this.subjects[this.currentSpecIdx][columnIdx][j].code) {
          var isWeak = false;
          for (let k = 0; k < subject.pre.length; k++) {
            if (subject.pre[k].subject == this.subjects[this.currentSpecIdx][columnIdx][j] && subject.pre[k].weak) {
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

  overlayIsSooner(subject: Subject, columnIdx: number) {
    for (let p = 0; p < subject.over.length; p++) {
      for (let i = 0; i < columnIdx; i++) {
        for (let j = 0; j < this.subjects[this.currentSpecIdx][i].length; j++) {
          if (subject.over[p].code == this.subjects[this.currentSpecIdx][i][j].code) {
            return true
          }
        }
      }
      for (let j = 0; j < this.subjects[this.currentSpecIdx][columnIdx].length; j++) {
        if (subject.over[p].code == this.subjects[this.currentSpecIdx][columnIdx][j].code) {
          var isWeak = false;
          for (let k = 0; k < this.subjects[this.currentSpecIdx][columnIdx][j].pre.length; k++) {
            if (this.subjects[this.currentSpecIdx][columnIdx][j].pre[k].subject == subject && this.subjects[this.currentSpecIdx][columnIdx][j].pre[k].weak) {
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

  changeSpec(index: number) {
    this.currentSpecIdx = index;
    this.currentSpecName = this.specNames[index]
    this.updateCredits(index)
    this.changeBorderCode("")
  }

  updateCredits(index: number) {
    this.completedCredit = 0;
    for (let i = 0; i < this.subjects[index].length; i++) {
      this.creditSemester[i] = 0
      this.completedCreditSemester[i] = 0

      for (let j = 0; j < this.subjects[index][i].length; j++) {
        var subj = this.subjects[index][i][j]
        if (subj.status == 1) {
          this.creditSemester[i] += subj.credit
        }
        else if (subj.status == 2) {
          this.creditSemester[i] += subj.credit
          this.completedCreditSemester[i] += subj.credit
        }
      }

      this.completedCredit += this.completedCreditSemester[i]
    }

    this.completedCreditPerc = this.completedCredit / 18 * 10 + "%"
  }

  constructor() {

    for (let i = 0; i < this.specLinks.length; i++) {
      var xhttp = new XMLHttpRequest();
      this.xhttpSpec.push(xhttp)
    }

    for (let i = 0; i < this.specLinks.length; i++) {
      this.obligatorySpecSubjects.push([])
      this.subjects.push([])
      this.xhttpSpec[i].open('GET', backendAddress + ":" + backendPort + "/" + this.specLinks[i], true)
      this.xhttpSpec[i].onreadystatechange = () => this.getDataFromSpec(this.xhttpSpec[i], this.subjects[i], this.obligatorySpecSubjects[i]);
      this.xhttpSpec[i].send();
    }


    for (let i = 0; i < numberOfColumns; i++) {
      this.creditSemester[i] = 0;
      this.completedCreditSemester[i] = 0;
    }

    this.currentSpecName = this.specNames[0]
    this.currentSpecIdx = 0;

  }

  addSemester() {
    if (this.subjects[this.currentSpecIdx].length >= this.MAX_COLUMN_NUMBERS) {
      swal("Elérted a maximális félévszámot, többet nem tudsz felvenni.")
    }
    else {
      this.subjects[this.currentSpecIdx].push([])
      this.creditSemester.push(0)
      this.completedCreditSemester.push(0);
    }
  }

  deleteSemester(index: number) {
    if (this.subjects[this.currentSpecIdx][index].length != 0) {
      swal("Csak üres félévet tudsz törölni.")
    }
    else {
      this.subjects[this.currentSpecIdx].splice(index, 1)
      this.completedCredit -= this.completedCreditSemester[index]
      this.creditSemester.splice(index, 1)
      this.completedCreditSemester.splice(index, 1)
      this.completedCreditPerc = this.completedCredit / 18 * 10 + "%"
    }
  }

  subjectIsAlreadyIn(code: string) {
    for (let i = 0; i < this.subjects[this.currentSpecIdx].length; i++) {
      for (let j = 0; j < this.subjects[this.currentSpecIdx][i].length; j++)
        if (this.subjects[this.currentSpecIdx][i][j].code == code) {
          return true
        }
    }
    return false
  }

  submitForm(form: NgForm) {
    var resp = form.value
    if (this.specType == "not obligatory") {
      if (!this.checkNonObligatoryForm()) {
        this.showNonObligatoryFormMessage()
        this.chosenSpecFormMessage = ""
      }
      else {
        if (this.subjectIsAlreadyIn(resp.code)) {
          swal({ text: "Ez a tárgy már szerepel a tantervben!", dangerMode: true })
          return
        }
        var subj: Subject = { name: resp.name, code: resp.code, color: "", credit: resp.credit, type: resp.type, status: 0, pre: [], over: [], border: 0, proposedSemester: 0, spec: "Szabadon választható", ken: "Egyéb", warning: false }
        this.subjects[this.currentSpecIdx][resp.semester].push(subj)
        this.chosenSpecForm.name = ""
        this.chosenSpecForm.code = ""
        this.chosenSpecForm.credit = 0
        this.chosenSpecForm.type = ""
        this.chosenSpecForm.semester = -1
      }
    }
    else if (this.specType == "obligatory") {
      var idx = resp.obligName
      var subj = this.obligatorySpecSubjects[this.currentSpecIdx][idx]
      if (this.subjectIsAlreadyIn(subj.code)) {
        swal({ text: "Ez a tárgy már szerepel a tantervben!", dangerMode: true })
        return
      }
      this.updatePrerequisites(subj)
      this.subjects[this.currentSpecIdx][resp.semester].push(subj)
      this.obligatorySpecForm.name = ""
      this.obligatorySpecForm.semester = -1
    }

  }

  checkForm(): Boolean {
    if (this.specType == "obligatory") {
      var form = this.obligatorySpecForm
      return form.name != "" && form.semester != -1
    }
    else if (this.specType == "not obligatory") {
      var form = this.chosenSpecForm
      return form.name != "" && form.code != "" && form.credit > 0 && form.semester != -1
      /*var everythingIsOk =  this.checkNonObligatoryForm()
      if (!everythingIsOk) {
        
      }
      this.chosenSpecFormMessage
      return everythingIsOk*/
    }
    return true
  }

  showNonObligatoryFormMessage() {
    if (this.chosenSpecForm.name != "" && this.chosenSpecForm.code != "" && this.chosenSpecForm.credit > 0 && this.chosenSpecForm.semester != -1) {
      swal(this.chosenSpecFormMessage)
    }
  }

  checkNonObligatoryForm(): Boolean {
    var nameRegex = new RegExp('^[a-zA-ZÁÉÍÓÖŐÚÜŰáéíóöőúüű][a-zA-Z0-9. ÁÉÍÓÖŐÚÜŰáéíóöőúüű]+$')
    var codeRegex = new RegExp('^[a-zA-Z][a-zA-Z0-9-]+$')

    var name = this.chosenSpecForm.name.length <= 60 && nameRegex.test(this.chosenSpecForm.name)
    if (!name) {
      this.chosenSpecFormMessage += "A név nem megfelelő: maximum 60 karakter hosszú lehet, nem tartalmazhat speciális karaktereket és nem kezdődhet számmal.\n\n"
    }

    var code = this.chosenSpecForm.code.length < 20 && codeRegex.test(this.chosenSpecForm.code)
    if (!code) {
      this.chosenSpecFormMessage += "A kód nem megfelelő: maximum 20 karakter hosszú lehet, nem tartalmazhat speciális karaktereket (- kivételével) és nem kezdődhet számmal.\n\n"
    }

    var credit = this.chosenSpecForm.credit <= 30
    if (!credit) {
      this.chosenSpecFormMessage += "A kreditek száma nem megfelelő: nem lehet több 30-nál.\n"
    }

    return (name && code && credit)
  }

  updatePrerequisites(subject: Subject) {
    for (let i = 0; i < subject.pre.length; i++) {
      if (subject.pre[i].subject.spec == "Kötelező" && !subject.pre[i].subject.over.includes(subject)) {
        this.updatePrerequisite(subject, subject.pre[i].subject)
      }
    }
  }

  updatePrerequisite(newOverSubject: Subject, subject: Subject) {
    subject.over.push(newOverSubject)
    subject.over = subject.over.concat(newOverSubject.over)
    for (let i = 0; i < subject.pre.length; i++) {
      this.updatePrerequisite(newOverSubject, subject.pre[i].subject)
    }
  }

  showModal(subj: Subject, idx: number): void {
    this.modalTitle = "Tárgy törlése"
    this.modalBody = "Biztos törölni szeretnéd a " + subj.name + " " + subj.type + " tárgyat?"
    this.modalFirstButton = "Igen"
    this.modalSecondButton = "Mégsem"
    this.subjectToDelete = subj
    this.subjectToDeleteSemester = idx
  }

  deleteSubject() {
    const index = this.subjects[this.currentSpecIdx][this.subjectToDeleteSemester].indexOf(this.subjectToDelete, 0);
    if (index > -1) {
      this.subjects[this.currentSpecIdx][this.subjectToDeleteSemester].splice(index, 1);
    }
    if (this.subjectToDelete.status == 1) {
      this.changeSubjectCredit([-1 * this.subjectToDelete.credit, 0], this.subjectToDeleteSemester)
    }
    else if (this.subjectToDelete.status == 2) {
      this.changeSubjectCredit([-1 * this.subjectToDelete.credit, -1 * this.subjectToDelete.credit], this.subjectToDeleteSemester)
    }
  }


  changePreAndOverToString(key: any, value: any): any {
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

  saveSyllabusToFile() {
    var content = JSON.stringify(this.subjects[this.currentSpecIdx], this.changePreAndOverToString);
    content = '{"' + this.currentSpecName + '":' + content + "}"
    content = CryptoJS.AES.encrypt(content, password).toString();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const name = "tanterv_" + this.currentSpecName.split(' ').join('_').toLowerCase() + ".txt"
    saveAs(blob, name);
  }

  resetSyllabus() {
    var i = this.currentSpecIdx
    this.subjects[i] = []
    this.xhttpSpec[i].open('GET', backendAddress + ":" + backendPort + "/" + this.specLinks[i], true)
    this.xhttpSpec[i].onreadystatechange = () => this.getObligatoryDataFromSpec(this.xhttpSpec[i], this.subjects[i]);
    this.xhttpSpec[i].send();
    this.resetCredits()
  }

  resetCredits() {
    for (let i = 0; i < this.completedCreditSemester.length; i++) {
      this.creditSemester[i] = 0
      this.completedCreditSemester[i] = 0
    }
    this.completedCredit = 0
    this.completedCreditPerc = "0%"
  }

  openFile(event: any) {
    var file = event.target.files[0]
    //console.log(file)
    var reader = new FileReader();
    var content
    reader.onload = () => {
      content = reader.result;
      if (typeof (content) === "string") {
        try {
          content = CryptoJS.AES.decrypt(content, password).toString(CryptoJS.enc.Utf8);
          this.loadDataFromFile(content)
        }
        catch (error) {
          swal({ text: "Hibás a fájl formátuma!", dangerMode: true })
        }
      }
    }
    reader.readAsText(file);
    event.target.value = "";
  }

  loadDataFromFile(content: string) {
    var obligBoxes = Array<Array<Subject>>()
    var complCredits = []
    var credits = []
    try {
      const jsonObject = JSON.parse(content);
      if (!jsonObject.hasOwnProperty(this.currentSpecName)) {
        swal({ text: "Nem megfelelő tanterv!", dangerMode: true })
        return
      }
      const syllabus = jsonObject[this.currentSpecName]


      for (let i = 0; i < syllabus.length; i++) {
        obligBoxes.push([])
        credits.push(0)
        complCredits.push(0)
        for (let j = 0; j < syllabus[i].length; j++) {
          var subj = syllabus[i][j]
          obligBoxes[i].push({ name: subj.name, code: subj.code, color: subj.color, credit: subj.credit, type: subj.type, status: subj.status, pre: [], over: [], border: 0, proposedSemester: subj.proposedSemester, spec: subj.spec, ken: subj.ken, warning: subj.warning })
          if (subj.status == 1) {
            credits[i] += subj.credit
          }
          else if (subj.status == 2) {
            credits[i] += subj.credit
            complCredits[i] += subj.credit
          }
        }
      }

      for (let i = 0; i < syllabus.length; i++) {
        for (let j = 0; j < syllabus[i].length; j++) {

          var subj = syllabus[i][j]
          for (let l = 0; l < subj.pre.length; l++) {
            for (let k = 0; k <= i; k++) {
              for (let m = 0; m < obligBoxes[k].length; m++) {
                if (obligBoxes[k][m].code == subj.pre[l].subject) {
                  obligBoxes[i][j].pre.push({ subject: obligBoxes[k][m], weak: subj.pre[l].weak })
                  break
                }
              }
            }
          }

          for (let l = 0; l < subj.over.length; l++) {
            for (let k = i; k < syllabus.length; k++) {
              for (let m = 0; m < obligBoxes[k].length; m++) {
                if (obligBoxes[k][m].code == subj.over[l]) {
                  obligBoxes[i][j].over.push(obligBoxes[k][m])
                  break
                }
              }
            }
          }
        }
      }
      //console.log("HERE\n" + obligBoxes)
      this.completedCredit = 0
      this.completedCreditSemester = complCredits
      this.creditSemester = credits
      for (let i = 0; i < complCredits.length; i++) {
        this.completedCredit += complCredits[i]
      }
      this.completedCreditPerc = this.completedCredit / 18 * 10 + "%"
      this.subjects[this.currentSpecIdx] = obligBoxes
    }
    catch (error) {
      swal({ text: "Hibás a fájl formátuma!", dangerMode: true })
      //console.log(error)
    }
  }

}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));



export type Subject = {
  code: string,
  name: string;
  color: string;
  type: string;
  credit: number;
  status: number;
  pre: Array<Prerequisite>;
  over: Array<Subject>
  border: number;
  proposedSemester: number;
  spec: string;
  ken: string;
  warning: boolean;
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

