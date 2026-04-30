import { Component, Input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starHalfOutline, starOutline } from 'ionicons/icons';

export type StarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() size: StarSize = 'md';
  @Input() readonly: boolean = true;

  constructor() {
    addIcons({
      star,
      starHalfOutline,
      starOutline,
    });
  }

  protected readonly stars = computed(() => {
    const ratingValue = typeof this.rating === 'number' && !isNaN(this.rating) ? this.rating : 0;
    const clampedRating = Math.max(0, Math.min(5, ratingValue));
    const fullStars = Math.floor(clampedRating);
    const hasHalf = clampedRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    const result: { type: 'filled' | 'half' | 'outline'; index: number }[] = [];

    for (let i = 0; i < fullStars; i++) {
      result.push({ type: 'filled', index: i });
    }

    if (hasHalf) {
      result.push({ type: 'half', index: fullStars });
    }

    for (let i = 0; i < emptyStars; i++) {
      result.push({ type: 'outline', index: fullStars + (hasHalf ? 1 : 0) + i });
    }

    return result;
  });

  getStarIconName(type: 'filled' | 'half' | 'outline'): string {
    switch (type) {
      case 'filled': return 'star';
      case 'half': return 'star-half-outline';
      case 'outline': return 'star-outline';
    }
  }
}