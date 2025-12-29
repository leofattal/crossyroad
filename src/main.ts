import { Game } from '@/core/Game';
import './styles/main.css';

class GameApp {
  private game: Game | null = null;
  private mainMenu: HTMLElement;
  private deathScreen: HTMLElement;
  private pauseMenu: HTMLElement;
  private hud: HTMLElement;
  private controlsHint: HTMLElement;

  constructor() {
    // Get UI elements
    this.mainMenu = document.getElementById('main-menu')!;
    this.deathScreen = document.getElementById('death-screen')!;
    this.pauseMenu = document.getElementById('pause-menu')!;
    this.hud = document.getElementById('hud')!;
    this.controlsHint = document.getElementById('controls-hint')!;

    this.setupUI();
    this.showMainMenu();
  }

  private setupUI(): void {
    // Main menu buttons
    document.getElementById('play-button')?.addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('settings-button')?.addEventListener('click', () => {
      // TODO: Show settings menu
      console.log('Settings clicked');
    });

    // Death screen buttons
    document.getElementById('retry-button')?.addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('menu-button')?.addEventListener('click', () => {
      this.showMainMenu();
    });

    // Pause menu buttons
    document.getElementById('resume-button')?.addEventListener('click', () => {
      this.resumeGame();
    });

    document.getElementById('restart-button')?.addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('pause-menu-button')?.addEventListener('click', () => {
      this.showMainMenu();
    });
  }

  private showMainMenu(): void {
    this.mainMenu.classList.remove('hidden');
    this.deathScreen.classList.add('hidden');
    this.pauseMenu.classList.add('hidden');
    this.hud.style.display = 'none';
    this.controlsHint.classList.add('hidden');

    if (this.game) {
      this.game.stop();
      this.game.dispose();
      this.game = null;
    }
  }

  private startGame(): void {
    // Hide all menus
    this.mainMenu.classList.add('hidden');
    this.deathScreen.classList.add('hidden');
    this.pauseMenu.classList.add('hidden');
    this.hud.style.display = 'block';

    // Reset HUD to 0
    document.getElementById('score')!.textContent = '0';
    document.getElementById('distance')!.textContent = '0m';

    // Show controls hint briefly
    this.controlsHint.classList.remove('hidden');
    setTimeout(() => {
      this.controlsHint.classList.add('hidden');
    }, 3000);

    // Dispose old game completely
    if (this.game) {
      this.game.dispose();
      this.game = null;
    }

    // Small delay to ensure clean state
    setTimeout(() => {
      this.game = new Game(this);
      this.game.start();

      // Start HUD update loop
      this.updateHUD();
    }, 50);
  }

  private resumeGame(): void {
    this.pauseMenu.classList.add('hidden');
    if (this.game) {
      this.game.start();
    }
  }

  private updateHUD(): void {
    if (!this.game) return;

    const updateLoop = setInterval(() => {
      if (!this.game) {
        clearInterval(updateLoop);
        return;
      }

      // Update HUD with real-time values
      const score = this.game.getScore();
      const distance = this.game.getDistance();

      document.getElementById('score')!.textContent = score.toString();
      document.getElementById('distance')!.textContent = `${distance}m`;
    }, 100);
  }

  public showDeathScreen(score: number, distance: number): void {
    this.deathScreen.classList.remove('hidden');
    this.hud.style.display = 'none';
    document.getElementById('final-score')!.textContent = score.toString();
    document.getElementById('final-distance')!.textContent = distance.toString();
    document.getElementById('final-coins')!.textContent = '0';
  }
}

// Initialize the app when DOM is ready and make it globally accessible
let gameApp: GameApp;

window.addEventListener('DOMContentLoaded', () => {
  gameApp = new GameApp();
});

export { gameApp };
