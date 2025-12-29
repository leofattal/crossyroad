type InputEventType = 'forward' | 'pause';
type InputCallback = () => void;

export class InputManager {
  private callbacks: Map<InputEventType, InputCallback[]> = new Map();
  private keyboardEnabled: boolean = true;
  private touchEnabled: boolean = true;
  private mouseEnabled: boolean = true;

  constructor() {
    this.setupKeyboardListeners();
    this.setupTouchListeners();
    this.setupMouseListeners();
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.keyboardEnabled) return;

    switch (event.key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
      case ' ':
        event.preventDefault();
        this.trigger('forward');
        break;
      case 'Escape':
        event.preventDefault();
        this.trigger('pause');
        break;
    }
  }

  private setupMouseListeners(): void {
    window.addEventListener('click', this.handleMouseClick.bind(this));
  }

  private handleMouseClick(event: MouseEvent): void {
    if (!this.mouseEnabled) return;

    // Ignore clicks on UI elements
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('.menu')) {
      return;
    }

    // Any click = jump forward
    this.trigger('forward');
  }

  private setupTouchListeners(): void {
    window.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: false,
    });
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.touchEnabled) return;

    // Ignore touches on UI elements
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('.menu')) {
      return;
    }

    event.preventDefault();

    // Any tap = jump forward
    this.trigger('forward');
  }

  public on(event: InputEventType, callback: InputCallback): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  public off(event: InputEventType, callback: InputCallback): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private trigger(event: InputEventType): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback());
    }
  }

  public setKeyboardEnabled(enabled: boolean): void {
    this.keyboardEnabled = enabled;
  }

  public setTouchEnabled(enabled: boolean): void {
    this.touchEnabled = enabled;
  }

  public setMouseEnabled(enabled: boolean): void {
    this.mouseEnabled = enabled;
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('click', this.handleMouseClick.bind(this));
    window.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.callbacks.clear();
  }
}
