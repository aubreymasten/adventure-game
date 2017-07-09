import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { Character } from './models/character.model';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// firebase imports
import { masterFirebaseConfig } from './api-keys';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';

// routing import
import { routing } from './app.routing';

import { AppComponent } from './app.component';
import { IntroComponent } from './intro/intro.component';
import { SceneComponent } from './scene/scene.component';
import { AdminComponent } from './admin/admin.component';
import { EditorComponent } from './editor/editor.component';
import { EditSceneComponent } from './edit-scene/edit-scene.component';
import { CharactersComponent } from './characters/characters.component';
import { MapComponent } from './map/map.component';
import { DisplayComponent } from './display/display.component';

// firebase credentials export
export const firebaseConfig = {
  apiKey: masterFirebaseConfig.apiKey,
  authDomain: masterFirebaseConfig.authDomain,
  databaseURL: masterFirebaseConfig.databaseURL,
  storageBucket: masterFirebaseConfig.storageBucket
}

@NgModule({
  declarations: [
    AppComponent,
    IntroComponent,
    SceneComponent,
    AdminComponent,
    EditorComponent,
    EditSceneComponent,
    CharactersComponent,
    MapComponent,
    DisplayComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    routing,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
