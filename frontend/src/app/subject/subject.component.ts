import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from '../app.component';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.css'
})
export class SubjectComponent {
  @Input('parentData') public box: any;

  @Input('languageData') public languageIsHu: boolean;

  @Output()
  notifyStatusChange: EventEmitter<Subject> = new EventEmitter<Subject>();

  @Output()
  notifyDeleteSubject: EventEmitter<Subject> = new EventEmitter<Subject>();

  constructor() {
    this.languageIsHu = true
  }

  public statusChange() {
    this.notifyStatusChange.emit(this.box);
  }

  public deleteSubject() {
    this.notifyDeleteSubject.emit(this.box)
  }

  public showPre(): string {
    var resp = ""
    for (let i = 0; i < this.box.pre.length; i++) {
      resp += this.box.pre[i].subject.code + ","
    }
    return resp.substring(0, resp.length - 1)
  }

  public getSpec(): string {
    if (this.languageIsHu) {
      return this.box.spec
    }
    else {
      if (this.box.spec == "Kötelező") {
        return "Obligatory"
      }
      else if (this.box.spec == "Kötelezően választható") {
        return "Elective"
      }
      else {
        return "Optional"
      }
    }
  }

}


