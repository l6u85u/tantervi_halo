import { Component, Input, Output, EventEmitter} from '@angular/core';
import { Subject } from '../app.component';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.css'
})
export class SubjectComponent {
@Input('parentData') public box: any;

@Output()
notifyStatusChange: EventEmitter<Subject> = new EventEmitter<Subject>();

@Output()
notifyMoreInfo: EventEmitter<Subject> = new EventEmitter<Subject>();

constructor(){

}

statusChange(){
    //this.box.status = (this.box.status + 1) % 3
    this.notifyStatusChange.emit(this.box);
}

deleteSubject(){
  this.notifyMoreInfo.emit(this.box)
}

showPre(): string{
  var resp = ""
  for (let i=0;i<this.box.pre.length;i++){
    resp += this.box.pre[i].subject.code + ","
  }
  return resp.substring(0, resp.length - 1)
}






}


