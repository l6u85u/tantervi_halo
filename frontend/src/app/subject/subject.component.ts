import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from '../subject';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.css'
})
export class SubjectComponent {
  //get the subject attributes from the AppComponent
  @Input('parentData') public box!: Subject;

  //get the current language of the site from the AppComponent
  @Input('languageData') public languageIsHu: boolean;

  //true if the current curriculum is English
  @Input('curriculumData') public isEnglish: boolean;

  @Output()
  notifyStatusChange: EventEmitter<Subject> = new EventEmitter<Subject>();

  @Output()
  notifyDeleteSubject: EventEmitter<Subject> = new EventEmitter<Subject>();

  @Output()
  notifyTypeChange: EventEmitter<Subject> = new EventEmitter<Subject>();

  constructor() {
    this.languageIsHu = true
    this.isEnglish = false
  }

  //notify the AppComponent that a subject status has changed
  public statusChange() {
    this.notifyStatusChange.emit(this.box);
  }

  //notify the AppComponent that a subject was deleted
  public deleteSubject() {
    this.notifyDeleteSubject.emit(this.box)
  }

  //notify the AppComponent that a subject was moved from elective to comp. elective or vice versa
  public changeTypeOfSubject(){
    this.notifyTypeChange.emit(this.box)
  }

  //convert the Prerequisites array to a string
  public showPre(): string {
    var resp = ""
    for (let i = 0; i < this.box.pre.length; i++) {
      resp += this.box.pre[i].subject.code + ","
    }
    return resp.substring(0, resp.length - 1)
  }

  //convert the spec type names to English if the current language is English
  public getSpec(): string {
    if (this.languageIsHu) {
      return this.box.spec
    }
    else {
      if (this.box.spec == "Kötelező") {
        return "Compulsory"
      }
      else if (this.box.spec == "Kötelezően választható") {
        return "Comp. Elective"
      }
      else {
        return "Elective"
      }
    }
  }
}


