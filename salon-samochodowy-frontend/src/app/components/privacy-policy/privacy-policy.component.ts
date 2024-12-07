import { Component } from '@angular/core';

/**
 * PrivacyPolicyComponent wyświetla politykę prywatności aplikacji.
 *
 * @component
 */
@Component({
  selector: 'app-privacy-policy',
  standalone: true, // Umożliwia używanie komponentu jako standalone
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css'] // Poprawiono literówkę z styleUrl na styleUrls
})
export class PrivacyPolicyComponent {
}
