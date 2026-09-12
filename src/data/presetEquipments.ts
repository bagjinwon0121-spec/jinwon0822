import { Equipment } from '../types';

export const PRESET_EQUIPMENTS: Equipment[] = [
  {
    id: 'eq_bodyweight',
    name: '맨몸 (기본)',
    category: 'bodyweight',
    createdAt: new Date().toISOString(),
    description: '별도의 기구 없이 내 체중을 이용해 운동합니다.',
    targetParts: ['chest', 'back', 'shoulder', 'arms', 'abs', 'legs', 'fullBody'],
  },
  {
    id: 'eq_dumbbell',
    name: '덤벨 / 아령',
    category: 'dumbbell',
    createdAt: new Date().toISOString(),
    description: '가슴, 어깨, 팔, 하체 등 다양한 중량 운동 가능',
    targetParts: ['chest', 'shoulder', 'arms', 'back', 'legs'],
  },
  {
    id: 'eq_pullup_bar',
    name: '풀업바 (문틀/치닝디핑)',
    category: 'pullup_bar',
    createdAt: new Date().toISOString(),
    description: '턱걸이, 친업, 행잉 레그레이즈 등 상체 및 등 운동의 핵심',
    targetParts: ['back', 'arms', 'abs'],
  },
  {
    id: 'eq_band',
    name: '튜빙 / 저항 밴드',
    category: 'band',
    createdAt: new Date().toISOString(),
    description: '관절 부담 없이 일정한 장력으로 자극을 주는 홈트 필수템',
    targetParts: ['shoulder', 'arms', 'back', 'chest', 'legs'],
  },
  {
    id: 'eq_kettlebell',
    name: '케틀벨',
    category: 'kettlebell',
    createdAt: new Date().toISOString(),
    description: '스윙, 스쿼트 등 코어와 전신 파워/유산소 운동에 적합',
    targetParts: ['legs', 'abs', 'fullBody', 'shoulder'],
  },
  {
    id: 'eq_bench',
    name: '운동 벤치 (평벤치/각도조절)',
    category: 'bench',
    createdAt: new Date().toISOString(),
    description: '덤벨 프레스, 스텝업, 딥스 등 운동 가동범위를 극대화',
    targetParts: ['chest', 'shoulder', 'arms', 'back'],
  },
  {
    id: 'eq_foam_roller',
    name: '폼롤러 / 스트레칭 바',
    category: 'foam_roller',
    createdAt: new Date().toISOString(),
    description: '근막 이완, 척추 스트레칭 및 웜업/쿨다운에 최적',
    targetParts: ['back', 'legs', 'fullBody'],
  },
  {
    id: 'eq_yoga_mat',
    name: '요가 / 홈트 매트',
    category: 'yoga_mat',
    createdAt: new Date().toISOString(),
    description: '바닥 충격 흡수, 복근 운동 및 플랭크 필수 장비',
    targetParts: ['abs', 'fullBody', 'legs'],
  },
  {
    id: 'eq_jump_rope',
    name: '줄넘기',
    category: 'jump_rope',
    createdAt: new Date().toISOString(),
    description: '심폐 지구력 강화 및 고강도 체지방 연소 유산소',
    targetParts: ['legs', 'fullBody'],
  },
];

export const INITIAL_USER_EQUIPMENT_IDS = ['eq_bodyweight', 'eq_dumbbell', 'eq_yoga_mat'];
