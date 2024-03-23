import { Component } from '@angular/core';
import { FormGroup, FormControl, NgForm } from "@angular/forms";
import { SubjectComponent } from './subject/subject.component';
import swal from 'sweetalert';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDragPlaceholder,
} from '@angular/cdk/drag-drop';

var backendAddress: string = "https://127.0.0.1";
var backendPort: string = "8000";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  title = 'frontend';

  public MAX_COLUMN_NUMBERS = 18;

  public modalBody = ""
  public modalTitle = ""
  public modalFirstButton = ""
  public modalSecondButton = ""
  public semesterToDelete = -1;

  public completedCredit = 0;
  public completedCreditPerc = "0%";
  public completedCreditSemester: Array<number> = [];
  public creditSemester: Array<number> = [];

  public numberOfColumns: number = 6;

  public subjects: Array<Array<Array<Subject>>> = [];
  public obligatorySpecSubjects: Array<Array<Subject>> = [];

  public xhttpSpec: Array<XMLHttpRequest> = [];

  private borderCode = "";

  public currentSpecName: string;
  public currentSpecIdx: number;

  public specType: String = "obligatory";

  public specNames: Array<string> = ["PTI Modellező", "PTI Tervező", "PTI Fejlesztő", "PTI Szoftvermérnök", "PTI Esti", "Computer Science"]
  public specLinks: Array<string> = ["modellezo", "tervezo", "fejleszto", "szombathely", "esti", "angol"]

  public thesis: Subject = { name: "Szakdolgozati konz.", code: "IP-08SZDPIBN18", color: "", credit: 20, type: "", status: 0, pre: [], over: [], border: 0, proposedSemester: 6, spec: "obligatory" }


  //public specABox: SubjectBox = {color:"grey", name:""}

  private getDataFromSpec(xhttp: XMLHttpRequest, obligBoxes: Array<Array<Subject>>, obligSpecBoxes: Array<Subject>) {


    if (xhttp.readyState == 4 && xhttp.status == 200) {
      var resp = JSON.parse(JSON.parse(xhttp.responseText));

      for (let i = 0; i < this.numberOfColumns; i++) {
        obligBoxes.push([])
      }

      this.getObligatoryData(resp[0], obligBoxes)
      this.getObligatorySpecData(resp[1], obligSpecBoxes, obligBoxes)

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

      obligBoxes[Math.floor(felev - 1)].push({ name: resp[i]["Tanegység"], code: resp[i]["Kód"], color: "", credit: resp[i]["Kredit"], type: type, status: 0, pre: [], over: [], border: 0, proposedSemester: felev, spec: "obligatory" })
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

    obligBoxes[5].push(this.thesis)
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

      boxes.push({ name: resp[i]["Tanegység"], code: resp[i]["Kód"], color: "", credit: resp[i]["Kredit"], type: type, status: 0, pre: [], over: [], border: 0, proposedSemester: felev, spec: "obligatory spec" })
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
        for (let i = 0; i < this.numberOfColumns; i++) {
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

  drop(event: CdkDragDrop<string[]>) {
    var column = parseInt(event.container.id.split("-")[3])

    if (event.previousContainer === event.container) {
      this.moveItemInArray(column, event.previousIndex, event.currentIndex);
    } else {
      var prevColumn = parseInt(event.previousContainer.id.split("-")[3])
      this.transferArrayItem(
        prevColumn,
        column,
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

    this.subjects[this.currentSpecIdx][prevColumnIdx].splice(prevIdx, 1);
    this.subjects[this.currentSpecIdx][columnIdx].splice(currentIdx, 0, itemToMove);

    if (itemToMove.status == 1) {
      this.changeSubjectCredit([- 1 * itemToMove.credit, 0], prevColumnIdx)
      this.changeSubjectCredit([itemToMove.credit, 0], columnIdx)
    }
    else if (itemToMove.status == 2) {
      this.changeSubjectCredit([-1 * itemToMove.credit, - 1 * itemToMove.credit], prevColumnIdx)
      this.changeSubjectCredit([itemToMove.credit, itemToMove.credit], columnIdx)
    }

  }

  changeSpec(index: number) {
    this.currentSpecIdx = index;
    this.currentSpecName = this.specNames[index]
    this.updateCredits(index)
    this.changeBorderCode("")
  }

  updateCredits(index: number) {
    this.completedCredit = 0;
    for (let i = 0; i < this.creditSemester.length; i++) {
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


    for (let i = 0; i < this.numberOfColumns; i++) {
      this.creditSemester[i] = 0;
      this.completedCreditSemester[i] = 0;
    }

    this.currentSpecName = this.specNames[0]
    this.currentSpecIdx = 0;

  }

  addSemester() {
    if (this.numberOfColumns >= this.MAX_COLUMN_NUMBERS) {
      swal("Elérted a maximális félévszámot, többet nem tudsz felvenni.")
    }
    else {
      this.numberOfColumns += 1;
      this.subjects[this.currentSpecIdx].push([])
      this.creditSemester.push(0)
      this.completedCreditSemester.push(0);
    }
  }

  deleteSemester() {
    var index = this.semesterToDelete
    this.numberOfColumns -= 1;
    this.subjects[this.currentSpecIdx].splice(index, 1)
    this.completedCredit -= this.completedCreditSemester[index]
    this.creditSemester.splice(index, 1)
    this.completedCreditSemester.splice(index, 1)
    this.completedCreditPerc = this.completedCredit / 18 * 10 + "%"
  }

  setModalText(index: number, type: string) {
    if (type == "delete semester") {
      this.semesterToDelete = index
      this.modalTitle = "Félév törlése"
      this.modalBody = "Ha törlöd a féléved, akkor az összes adott féléves tárgy is törlődni fog"
      this.modalFirstButton = "Rendben"
      this.modalSecondButton = "Mégsem"
    }
    else {
      this.modalTitle = "Félév törlése"
      this.modalBody = "Ha törlöd a féléved, akkor az összes adott féléves tárgy is törlődni fog"
      this.modalFirstButton = "Rendben"
      this.modalSecondButton = "Mégsem"
    }
  }

  submitForm(form: NgForm) {
    var resp = form.value
    if (this.specType == "not obligatory") {
      var subj: Subject = { name: resp.name, code: resp.code, color: "", credit: resp.credit, type: resp.type, status: 0, pre: [], over: [], border: 0, proposedSemester: 0, spec: "not obligatory spec" }
      this.subjects[this.currentSpecIdx][resp.semester].push(subj)
    }
    else if (this.specType == "obligatory") {
      var idx = resp.obligName
      var subj = this.obligatorySpecSubjects[this.currentSpecIdx][idx]
      this.updatePrerequisites(subj)
      this.subjects[this.currentSpecIdx][resp.semester].push(subj)
    }

  }

  updatePrerequisites(subject: Subject) {
    for (let i = 0; i < subject.pre.length; i++) {
      if (subject.pre[i].subject.spec == "obligatory") {
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

  showSubjectInfo(subj: Subject, idx: number): void{
    
  }


}

export type Subject = {
  code: string,
  name: string;
  color: string;
  type: string;
  credit: number;
  status: number;
  pre: Array<Prerequisite>;
  over: Array<Subject>;
  border: number;
  proposedSemester: number;
  spec: string;
}

type Prerequisite = {
  subject: Subject;
  weak: boolean;
}

