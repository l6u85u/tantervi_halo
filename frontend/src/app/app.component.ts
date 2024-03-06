import { Component } from '@angular/core';

import { SubjectComponent } from './subject/subject.component';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDragPlaceholder
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

  public completedCredit = 0;
  public completedCreditPerc = "0%";
  public completedCreditSemester: Array<number> = [];
  public creditSemester: Array<number> = [];

  public numberOfColumns: number = 6;

  public subjects: Array<Array<Array<Subject>>> = [];

  public xhttpSpecA: XMLHttpRequest;

  private borderCode = "";


  //public specABox: SubjectBox = {color:"grey", name:""}

  private getDataFromSpec(xhttp: XMLHttpRequest, boxes: Array<Array<Subject>>) {

    if (xhttp.readyState == 4 && xhttp.status == 200) {
      var resp = JSON.parse(JSON.parse(xhttp.responseText));

      for (let i = 0; i < this.numberOfColumns; i++) {
        boxes.push([])
      }

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

        boxes[Math.floor(felev - 1)].push({ name: resp[i]["Tanegység"], code: resp[i]["Kód"], color: "", credit: resp[i]["Kredit"], type: type, status: 0, pre: [], over: [], border: 0 })
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
        for (let j = 0; j < boxes[col].length; j++) {
          if (boxes[col][j].code == resp[i]["Kód"]) {
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
          if (words.length > 1 && words[1] == "(gyenge)") {
            weak = true
          }

          for (let j = 0; j <= col; j++)
            for (let l = 0; l < boxes[j].length; l++) {
              if (boxes[j][l].code == words[0]) {
                boxes[col][idx].pre.push({ subject: boxes[j][l], weak: weak })
                break
              }
            }

        })

        var over_code = []
        if (resp[i]["Ráépülő"] != "") {
          over_code = resp[i]["Ráépülő"].split(",").map((str: string) => str.trim())
        }

        over_code.forEach((code: string) => {
          for (let j = col; j < boxes.length; j++)
            for (let l = 0; l < boxes[j].length; l++) {
              if (boxes[j][l].code == code) {
                boxes[col][idx].over.push(boxes[j][l])
                break
              }
            }
        })

        console.log(boxes[col][idx])
      }


      //var subj = resp.split(",");


    }
  }

  getSubjectCredit(subj: Subject, idx: number): void {
    var registered;
    var completed;

    if (this.borderCode != "") {
      for (let i = 0; i < this.subjects[0].length; i++)
        for (let j = 0; j < this.subjects[0][i].length; j++) {
          if (this.subjects[0][i][j].code == this.borderCode) {
            this.subjects[0][i][j].border = 0
            if (this.subjects[0][i][j].status!=2){
              this.hidePrerequisites(this.subjects[0][i][j])
            }
            else if (this.subjects[0][i][j].status==2){
              this.hideOverlays(this.subjects[0][i][j])
            }
            break;
          }
        }
    }

    subj.border = 1
    this.borderCode = subj.code

    if (subj.status == 0) {
      this.showPrerequisites(subj)
      if (!this.checkPrerequisites(subj)){
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

  checkPrerequisites(subj: Subject) : Boolean{
    var pre : Array<string> = []
    subj.pre.forEach(elem => {
      if (elem.subject.status != 2){
        pre.push(elem.subject.name + " " + elem.subject.type)
      }
    });

    if (pre.length > 0){
      var resp = "A következő előfeltételek nem teljesültek:\n"
      pre.forEach(e => {
        resp += e + "\n"
      })
      alert(resp);
      return false;
    }
    
    return true
  }

  showPrerequisites(subj: Subject){
    subj.pre.forEach(elem => {
      elem.subject.border = 2
    });
  }

  hidePrerequisites(subj: Subject){
    subj.pre.forEach(elem => {
      elem.subject.border = 0
    });
  }

  showOverlays(subj: Subject) {
    subj.over.forEach(elem => {
      elem.border = 3
    });
  }

  hideOverlays(subj: Subject){
    subj.over.forEach(elem => {
      elem.border = 0
    });
  }

  resetOverlays(subj: Subject){
    subj.over.forEach(elem => {
      if (elem.status!=0){
        var col = -1;
        for (let i=0;i<this.numberOfColumns;i++){
          if (this.subjects[0][i].includes(elem)){
            col = i;
            break;
          }
        }
        if (elem.status==1){
         this.changeSubjectCredit([-1 * elem.credit,0],col)
        }
        else if (elem.status==2){
          this.changeSubjectCredit([-1 * elem.credit, -1 * elem.credit],col)
        }
        elem.status=0;
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
    const itemToMove = this.subjects[0][columnIdx][prevIdx];

    this.subjects[0][columnIdx].splice(prevIdx, 1);

    this.subjects[0][columnIdx].splice(currentIdx, 0, itemToMove);
  }

  transferArrayItem(prevColumnIdx: number, columnIdx: number, prevIdx: number, currentIdx: number) {
    const itemToMove = this.subjects[0][prevColumnIdx][prevIdx];

    this.subjects[0][prevColumnIdx].splice(prevIdx, 1);
    this.subjects[0][columnIdx].splice(currentIdx, 0, itemToMove);

    if (itemToMove.status == 1) {
      this.changeSubjectCredit([- 1 * itemToMove.credit, 0], prevColumnIdx)
      this.changeSubjectCredit([itemToMove.credit, 0], columnIdx)
    }
    else if (itemToMove.status == 2) {
      this.changeSubjectCredit([-1 * itemToMove.credit, - 1 * itemToMove.credit], prevColumnIdx)
      this.changeSubjectCredit([itemToMove.credit, itemToMove.credit], columnIdx)
    }

  }

  constructor() {
    this.xhttpSpecA = new XMLHttpRequest();


    this.subjects.push([])
    this.xhttpSpecA.open('GET', backendAddress + ":" + backendPort + "/modellezo", true)
    this.xhttpSpecA.onreadystatechange = () => this.getDataFromSpec(this.xhttpSpecA, this.subjects[0]);
    this.xhttpSpecA.send();

    for (let i = 0; i < this.numberOfColumns; i++) {
      this.creditSemester[i] = 0;
      this.completedCreditSemester[i] = 0;
    }

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
}

type Prerequisite = {
  subject: Subject;
  weak: boolean;
}

