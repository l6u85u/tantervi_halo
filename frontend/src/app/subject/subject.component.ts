import { Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.css'
})
export class SubjectComponent {
@Input('parentData') public box: any;

@Output()
notify: EventEmitter<Array<number>> = new EventEmitter<Array<number>>();

constructor(){

}

statusChange(){
    this.box.status = (this.box.status + 1) % 3
    if (this.box.status==1){
      this.notify.emit([this.box.credit,0]);
    }
    else if (this.box.status==2){
      this.notify.emit([0,this.box.credit]);
    }
    else {
      var num = 0 - this.box.credit
      this.notify.emit([num, num]);
    }
   
}


}
