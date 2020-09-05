import {
  circularMovement,
  follow,
  lemniscateMovement,
  slideIn,
} from '../animation';
import {
  DEFAULT_FRAME_WIDTH,
  KEY_ENEMY_DEAD_FRAME,
  KEY_ENEMY_IS_DEAD,
  KEY_ENEMY_IS_UNTOUCHABLE,
  KEY_OBJECT_FRAME,
  KEY_OBJECT_ON_UPDATE,
  KEY_STAGE_INITIATE,
  KEY_STAGE_IS_WAVE_CLEAN,
  KEY_STAGE_TRANSITION,
  KEY_STAGE_WAVES,
} from '../constants';
import { easeInOutQuad, easeInQuad } from '../easing';
import { chain, enemy, fire, firework, recover, shell } from '../helper/enemy';
import { gradient, movingMountain } from '../helper/graphic';
import {
  boundary,
  followPlayerX,
  followPlayerY,
  platform,
  water,
} from '../helper/platform';
import {
  $backgroundColor,
  $backgroundV,
  $cameraLoop,
  $cameraZoom,
  $g,
  $maxReleaseVelocity,
  $reflectionGradient,
  $reflectionY,
  cameraCenter,
  enemies,
  graphics,
  platforms,
  player,
} from '../state';
import { alternateProgress, vector } from '../utils';

let tempPlayerPos;

export default {
  [KEY_STAGE_INITIATE]() {
    $g.$ = 0.3;
    $maxReleaseVelocity.$ = 12;
    cameraCenter.y = player.p.y + 100;
    $reflectionY.$ = 0;
    $reflectionGradient.$ = [
      0,
      230,
      [
        [0, 'rgba(154, 154, 154, 1)'],
        [0.4, 'rgba(125, 125, 125, 0.8)'],
        [1, 'rgba(72, 72, 72, 1)'],
      ],
    ];
    $backgroundV.$ = 0.5;
    $backgroundColor.$ = 'rgb(200,200,200)';
    player.p.x = -DEFAULT_FRAME_WIDTH;
    $cameraLoop.$ = () => {
      cameraCenter.y = Math.max(
        player.p.y - player.s.y / 2 - 100,
        Math.min(100, cameraCenter.y)
      );
    };
    graphics.push(
      gradient(100, 400, 0, 0.1, [
        [0, 'rgb(200,200,200)'],
        [0.5, 'rgb(110,110,110, 1)'],
        [0.6, 'rgb(92,92,92, 0.9)'],
        [1, 'rgb(34, 34, 34, 0.9)'],
      ]),
      ...movingMountain(177, 0, 10, 0.3, 2.8),
      ...movingMountain(0, 40, 10, 0.2, 3.6),
      ...movingMountain(-37, 40, 10, 0.15, 4)
    );
    platforms.push(
      water(0, -200, DEFAULT_FRAME_WIDTH * 2, 400, {
        [KEY_OBJECT_ON_UPDATE]: [followPlayerX],
      }),
      platform(0, -230, player.s.x * 10, 0, {
        [KEY_OBJECT_ON_UPDATE]: [followPlayerX],
      }),
      boundary(DEFAULT_FRAME_WIDTH / 2 - 1, 0, 0, player.s.y * 10, {
        [KEY_OBJECT_ON_UPDATE]: [followPlayerY],
      }),
      boundary(-DEFAULT_FRAME_WIDTH / 2 + 1, 0, 0, player.s.y * 10, {
        [KEY_OBJECT_ON_UPDATE]: [followPlayerY],
      })
    );
  },
  [KEY_STAGE_WAVES]: [
    () =>
      enemies.push(
        shell(50, 200, 30, 30, {
          [KEY_OBJECT_ON_UPDATE]: [
            slideIn(1500, 100, 550),
            circularMovement(3000, 10, 5, 1500),
          ],
        })
      ),
    () =>
      enemies.push(
        enemy(10, 350, 30, 30, {
          [KEY_OBJECT_ON_UPDATE]: [
            fire(6000, 3000),
            slideIn(3500, 0, 550),
            circularMovement(8000, 100, 30, 3500),
          ],
        }),
        shell(-100, 100, 30, 30, {
          [KEY_OBJECT_ON_UPDATE]: [
            slideIn(2000, -100, -150),
            recover(3000, 3),
            circularMovement(5000, 10, 15, 2000),
          ],
        }),
        shell(100, 200, 30, 30, {
          [KEY_OBJECT_ON_UPDATE]: [
            recover(3000, 3),
            slideIn(2500, 100, -150),
            circularMovement(6000, 10, 15, 2500),
          ],
        })
      ),
    () => {
      const core = enemy(0, 300, 30, 30, {
        [KEY_ENEMY_IS_UNTOUCHABLE]: true,
        [KEY_OBJECT_ON_UPDATE]: [
          slideIn(1700, 0, 550),
          circularMovement(10000, 160, 288, 2300, progress => easeInOutQuad(alternateProgress(progress)) / -2),
          checkChildren,
        ],
      });

      const children = [
        vector(-40, 0),
        vector(0, -40),
        vector(40, 0),
        vector(0, 40),
      ].map((offset, index) =>
        shell(offset.x, core.p.y + offset.y, 30, 30, {
          [KEY_OBJECT_ON_UPDATE]: [
            slideIn(
              2000 + index * 100,
              250 * (index > 1 ? 1 : -1),
              index % 2 === 1 ? 400 : 550
            ),
            follow(core, offset, 2300),
          ],
        })
      );

      function checkChildren(enemy) {
        if (
          !enemy[KEY_ENEMY_DEAD_FRAME] &&
          children.filter((child) => child[KEY_ENEMY_IS_DEAD]).length ===
            children.length
        ) {
          enemy[KEY_ENEMY_DEAD_FRAME] = enemy[KEY_OBJECT_FRAME];
        }
      }
      enemies.push(core, ...children);
    },
    () => {
      enemies.push(
        ...chain(
          shell(0, 300, 30, 30, {
            [KEY_OBJECT_ON_UPDATE]: [
              recover(3000, 3),
              slideIn(2000, 250, 450),
              firework(10, 6000, 1000),
              lemniscateMovement(12000, 500, 2000),
            ],
          }),
          6,
          300,
          0,
          (i) =>
            enemy(250, 450, 30, 30, {
              [KEY_ENEMY_IS_UNTOUCHABLE]: i === 0,
            })
        )
      );
    },
    () => {
      enemies.push(
        ...chain(
          enemy(0, 250, 30, 30, {
            [KEY_ENEMY_IS_UNTOUCHABLE]: true,
            [KEY_OBJECT_ON_UPDATE]: [
              slideIn(2000, 250, 450),
              firework(10, 6000, 1000),
              circularMovement(10000, 200, 250, 2000),
            ],
          }),
          6,
          300,
          1,
          (i) =>
            (i === 0 ? shell : enemy)(250, 450, 30, 30, {
              [KEY_ENEMY_IS_UNTOUCHABLE]: i === length - 1,
              [KEY_OBJECT_ON_UPDATE]: [...(i === 0 ? [recover(2500, 3)] : [])],
            })
        )
      );
    },
  ],
  [KEY_STAGE_IS_WAVE_CLEAN]() {
    return enemies.length === 0 && player.p.y <= player.s.y / 2;
  },
  [KEY_STAGE_TRANSITION](progress) {
    const movementProgress = 1 - easeInOutQuad(alternateProgress(progress));
    $cameraZoom.$ = 1 - movementProgress * 0.1;
    $backgroundV.$ = 1 + movementProgress * 3;
    player.v.y = 0;
    player.p.y =
      (1 - easeInQuad(alternateProgress(progress))) * 200 + player.s.y / 2;
    if (progress == 0) tempPlayerPos = vector(player.p.x, player.p.y);
    else player.p.x = tempPlayerPos.x * easeInOutQuad(1 - progress);
  },
};
