import { Component } from '@theme/component';
import { debounce } from '@theme/utilities';

/**
 * A custom element that displays testimonials with auto-scrolling functionality.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} wrapper - The wrapper element.
 * @property {HTMLElement} track - The track element containing testimonials.
 * @property {HTMLElement} content - The content element with testimonials.
 * @property {HTMLElement} clone - The cloned content for seamless scrolling.
 * @property {HTMLElement} prevButton - Previous button element.
 * @property {HTMLElement} nextButton - Next button element.
 *
 * @extends Component<Refs>
 */
class TestimonialsComponent extends Component {
  requiredRefs = ['wrapper', 'track', 'content'];

  connectedCallback() {
    super.connectedCallback();

    const autoScroll = this.getAttribute('data-auto-scroll') === 'true';
    const scrollSpeed = parseFloat(this.getAttribute('data-scroll-speed') ?? '') || 30;

    // Wait for layout to be ready
    requestAnimationFrame(() => {
      if (autoScroll && this.refs.content.children.length > 0) {
        this.#setupAutoScroll();
        this.#handleResize();
        window.addEventListener('resize', this.#handleResize);
      }

      if (this.refs.prevButton && this.refs.nextButton) {
        this.#setupManualControls();
      }

      // Pause on hover if enabled
      if (autoScroll) {
        this.addEventListener('mouseenter', this.#pauseScroll);
        this.addEventListener('mouseleave', this.#resumeScroll);
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.#handleResize);
    this.removeEventListener('mouseenter', this.#pauseScroll);
    this.removeEventListener('mouseleave', this.#resumeScroll);
  }

  #animation = null;

  #setupAutoScroll() {
    const { content, track } = this.refs;
    
    // Check if content width exceeds track width (needs scrolling)
    const contentWidth = content.scrollWidth;
    const trackWidth = track.offsetWidth;
    
    // Only clone if content is wider than track (needs infinite scroll)
    if (contentWidth > trackWidth && !this.refs.clone && content.firstElementChild) {
      // Clone content for seamless loop
      const cloneElement = content.cloneNode(true);
      cloneElement.classList.add('testimonials-content--clone');
      cloneElement.setAttribute('aria-hidden', 'true');
      this.refs.track.appendChild(cloneElement);
      this.refs.clone = cloneElement;
    }
  }

  #setupManualControls() {
    const { prevButton, nextButton, track } = this.refs;
    const scrollAmount = 400; // pixels to scroll

    nextButton.addEventListener('click', () => {
      track.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    });

    prevButton.addEventListener('click', () => {
      track.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    });
  }

  #pauseScroll = () => {
    const pauseOnHover = this.style.getPropertyValue('--testimonials-pause-on-hover') === 'true';
    if (pauseOnHover && this.#animation) {
      this.#animation.pause();
    } else {
      const animations = this.refs.track.getAnimations();
      animations.forEach(anim => anim.pause());
    }
  };

  #resumeScroll = () => {
    const pauseOnHover = this.style.getPropertyValue('--testimonials-pause-on-hover') === 'true';
    if (pauseOnHover && this.#animation) {
      this.#animation.play();
    } else {
      const animations = this.refs.track.getAnimations();
      animations.forEach(anim => anim.play());
    }
  };

  #handleResize = debounce(() => {
    // Recalculate if needed for responsive behavior
    const { content } = this.refs;
    if (content.children.length === 0) return;

    // Update animation if auto-scroll is enabled
    const autoScroll = this.getAttribute('data-auto-scroll') === 'true';
    if (autoScroll) {
      this.#restartAnimation();
    }
  }, 250);

  #restartAnimation() {
    const animations = this.refs.track.getAnimations();
    requestAnimationFrame(() => {
      for (const animation of animations) {
        animation.currentTime = 0;
      }
    });
  }
}

if (!customElements.get('testimonials-component')) {
  customElements.define('testimonials-component', TestimonialsComponent);
}

