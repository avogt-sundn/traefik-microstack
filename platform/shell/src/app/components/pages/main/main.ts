import {Component} from '@angular/core';
import {Header} from "./header/header";
import {Footer} from "./footer/footer";
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'shell-main',
  imports: [
    Header,
    Footer,
    RouterOutlet,
  ],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {

}
