import { Component } from '@angular/core';

import { SubjectComponent } from './subject/subject.component';

var backendAddress : string = "https://127.0.0.1";
var backendPort : string = "8000";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';

  public completedCreditSemester: Array<number> = [];
  public creditSemester: Array<number> = [];

  public numberOfColumns: number = 6;

  public subjects: Array<Array<Array<Subject>>> = [];

  public xhttpSpecA: XMLHttpRequest;

  //public specABox: SubjectBox = {color:"grey", name:""}

  private getDataFromSpec(xhttp: XMLHttpRequest, boxes: Array<Array<Subject>>){
  
    if (xhttp.readyState == 4 && xhttp.status == 200){
      var resp = JSON.parse(JSON.parse(xhttp.responseText));

      for (let i=0;i<this.numberOfColumns;i++){
        //console.log(boxes)
        boxes.push([])
      }
      
      for (var i = 0; i < resp.length; i++){
        console.log(resp[i]["Kód"]);
        var felev = resp[i]["Ajánlott félév"]

        if (typeof felev === 'string'){
          felev = parseInt(felev.split(",")[0])
        }

        if (typeof felev === 'object'){
          felev = 4
        }

        var type = ""
        if (resp[i]["Előadás"]>0){
          if (resp[i]["Gyakorlat"]==0 && resp[i]["Labor"]==0){
            type = "EA"
          }
        }
        else{
          type = "GY"
        }
        
        boxes[Math.floor(felev-1)].push({name:resp[i]["Tanegység"], color:"", credit: resp[i]["Kredit"], type: type, status:0})
      }
     
    
      //var subj = resp.split(",");


    }
  }

  getSubjectCredit(credit: Array<number>, idx:number): void{
    this.creditSemester[idx] += credit[0]
    this.completedCreditSemester[idx] += credit[1]
  }

  constructor() {
    this.xhttpSpecA = new XMLHttpRequest();


    this.subjects.push([])
    this.xhttpSpecA.open('GET', backendAddress + ":" + backendPort + "/modellezo", true)
    this.xhttpSpecA.onreadystatechange = () => this.getDataFromSpec(this.xhttpSpecA, this.subjects[0]);
    this.xhttpSpecA.send();

    for(let i=0;i<this.numberOfColumns;i++){
      this.creditSemester[i] = 0;
      this.completedCreditSemester[i] = 0;
    }

  }


}

type Subject = {
  name : string;
  color : string;
  type : string;
  credit : number;
  status : number;
}

