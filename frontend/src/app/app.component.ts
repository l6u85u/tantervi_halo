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

  public subjects: Array<SubjectComponent> = []

  public xhttpSpecA: XMLHttpRequest;

  public specABox: SubjectBox = {color:"grey", name:""}

  getDataFromSpecA(xhttp: XMLHttpRequest, box: SubjectBox){
    if (xhttp.readyState == 4 && xhttp.status == 200){
      //console.log(xhttp.responseText);
      var resp = JSON.parse(xhttp.responseText);
      console.log(resp);
    }
  }

  constructor() {
    this.xhttpSpecA = new XMLHttpRequest();

    

    //log(this.xhttpSpecA)

    this.xhttpSpecA.open('GET', backendAddress + ":" + backendPort + "/modellezo", true)
    console.log(this.xhttpSpecA)
    this.xhttpSpecA.onreadystatechange = () => this.getDataFromSpecA(this.xhttpSpecA, this.specABox);
    this.xhttpSpecA.send();

  }


}

type SubjectBox = {
  name : string;
  color : string;
}

