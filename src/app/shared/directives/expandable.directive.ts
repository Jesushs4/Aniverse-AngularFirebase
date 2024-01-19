import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appExpandable]'
})
export class ExpandableDirective {

  private maxLength: number = 250;
  private synopsis: string = '';
  private isExpanded: boolean = false;
  private toggleButton: HTMLButtonElement | undefined;

  constructor(private el: ElementRef) { }

  ngAfterViewInit() {
    this.synopsis = this.el.nativeElement.textContent;
    if (this.synopsis.length > this.maxLength) { // Si la sinopsis es más grande que el límite, se crea el botón de expandir y se recorta el texto, añadiendo puntos suspensivos al final
      this.el.nativeElement.textContent = this.synopsis.substring(0, this.maxLength) + '...';
      this.addToggleButton();
    }
  }

  addToggleButton() { // Se crea el botón y se añade al ElementRef
    this.toggleButton = document.createElement('button');
    this.toggleButton.textContent = "+";
    this.toggleButton.addEventListener('click', () => this.toggleText()); // Al hacer click expandirá o reducirá el texto
    this.el.nativeElement.appendChild(this.toggleButton);
  }

  toggleText() { // Al activarlo se invierte el booleano, así se podrá expandir o reducir
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.toggleButton!.textContent = "-"
      this.el.nativeElement.textContent = this.synopsis;
      this.el.nativeElement.appendChild(this.toggleButton); // Se vuelve a añadir el botón ya que el contenido se reemplaza con la anterior línea
    } else {
      this.toggleButton!.textContent = "+"
      this.el.nativeElement.textContent = this.synopsis.substring(0, this.maxLength) + '...';
      this.el.nativeElement.appendChild(this.toggleButton);
    }
  }
}