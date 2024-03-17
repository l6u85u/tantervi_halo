import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SubjectComponent } from './subject/subject.component';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { ClickStopPropagationDirective } from './click-stop-propagation.directive'
import { FormsModule} from '@angular/forms';


@NgModule({
  declarations: [
    AppComponent,
    SubjectComponent,
    ClickStopPropagationDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatProgressBarModule,
    MatMenuModule,
    FormsModule,
    MatButtonModule,
    DragDropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
