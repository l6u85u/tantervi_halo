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
notify: EventEmitter<Subject> = new EventEmitter<Subject>();

constructor(){

}

statusChange(){
    //this.box.status = (this.box.status + 1) % 3
    this.notify.emit(this.box);
}


}


