import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppService } from './app.service';
import * as ngm from '../../../ng-mock-api/src/public-api'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'test-app';

  constructor(private appService: AppService) {
    // this.appService.getUsers('asf').subscribe(console.log)
    // this.appService.getUsers().subscribe(console.log)
    // this.appService.getUser(100, true).subscribe(console.log)
    this.appService.getRights().subscribe({
      next: (value) => {
        console.log('received value', value)
      },
      error: err => {
        console.log('received error', err)
      }
    })

  }
}
