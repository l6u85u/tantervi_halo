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

  //public specABox: SubjectBox = {color:"grey", name:""}

  private getDataFromSpec(xhttp: XMLHttpRequest, boxes: Array<Array<Subject>>) {

    if (xhttp.readyState == 4 && xhttp.status == 200) {
      var resp = JSON.parse(JSON.parse(xhttp.responseText));

      for (let i = 0; i < this.numberOfColumns; i++) {
        //console.log(boxes)
        boxes.push([])
      }

      for (var i = 0; i < resp.length; i++) {
        //console.log(resp[i]["Kód"]);
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

        boxes[Math.floor(felev - 1)].push({ name: resp[i]["Tanegység"], color: "", credit: resp[i]["Kredit"], type: type, status: 0 })
      }


      //var subj = resp.split(",");


    }
  }

  getSubjectCredit(credit: Array<number>, idx: number): void {
    console.log(credit)
    this.creditSemester[idx] += credit[0]
    this.completedCreditSemester[idx] += credit[1]
    this.completedCredit += credit[1]
    this.completedCreditPerc = this.completedCredit / 18 * 10 + "%"
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
    console.log(event)
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

    if (itemToMove.status==1){
      this.getSubjectCredit([-1 * itemToMove.credit, 0],prevColumnIdx)
      this.getSubjectCredit([itemToMove.credit, 0],columnIdx)
    }
    else if (itemToMove.status==2){
      this.getSubjectCredit([-1 * itemToMove.credit, -1 * itemToMove.credit],prevColumnIdx)
      this.getSubjectCredit([itemToMove.credit, itemToMove.credit],columnIdx)
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

type Subject = {
  name: string;
  color: string;
  type: string;
  credit: number;
  status: number;
}

