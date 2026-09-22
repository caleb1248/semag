interface Config {
  controls: Controls;
}

interface Controls {
  style: 'guideline' | 'wasd' | 'custom';
  custom: {
    moveLeft: string[];
    moveRight: string[];
    softDrop: string[];
    hardDrop: string[];
    rotateCCW: string[];
    rotateCW: string[];
    rotate180: string[];
    hold: string[];
    exit: string[];
    retry: string[];
    chat: string[];
    target1: string[];
    target2: string[];
    target3: string[];
    target4: string[];
    menuUp: string[];
    menuDown: string[];
    menuLeft: string[];
    menuRight: string[];
    menuBack: string[];
    menuConfirm: string[];
    openSocial: string[];
  };
}

export type { Config, Controls };
