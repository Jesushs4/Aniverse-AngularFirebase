import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';

@Directive({
  selector: '[appCardText]'
})
export class CardTextDirective {
  tooltipElement: HTMLElement;

  constructor(private el: ElementRef, private renderer: Renderer2, private translateService:CustomTranslateService) {
    this.tooltipElement = this.renderer.createElement('span');
    this.renderer.addClass(this.tooltipElement, 'tooltip');
    this.translateService.get('anime.seeMore').subscribe(translatedText => {
      this.renderer.setProperty(this.tooltipElement, 'innerText', `${translatedText}`);
    })
    this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipElement, 'background-color', 'var(--ion-card-background)')
    this.renderer.setStyle(this.tooltipElement, 'display', 'none');
    this.renderer.appendChild(document.body, this.tooltipElement);
  }

  @HostListener('mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    this.renderer.setStyle(this.tooltipElement, 'display', 'block');
    this.renderer.setStyle(this.tooltipElement, 'top', `${event.clientY + 10}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${event.clientX + 10}px`);
  }  

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.tooltipElement, 'display', 'none');
  }

  ngOnDestroy() {
    this.renderer.removeChild(document.body, this.tooltipElement);
  }
}