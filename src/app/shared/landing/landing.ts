import { Component, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './landing.html'
})
export class LandingComponent {
    @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;

    playVideo(): void {
        if (this.heroVideo?.nativeElement) {
            this.heroVideo.nativeElement.play().catch(() => {
                // Video might not be available, ignore error
            });
        }
    }

    pauseVideo(): void {
        if (this.heroVideo?.nativeElement) {
            this.heroVideo.nativeElement.pause();
        }
    }
}
