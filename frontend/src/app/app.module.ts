import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SubjectComponent } from './subject/subject.component';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {DragDropModule} from '@angular/cdk/drag-drop'

@NgModule({
  declarations: [
    AppComponent,
    SubjectComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatProgressBarModule,
    DragDropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
