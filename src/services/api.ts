import { User, Role, Market, RoleItem, Distributor } from '../types';

/**
 * [서버 연동 가이드]
 * 현재는 메모리 상의 변수(MOCK_*)를 조작하여 서버 동작을 흉내내고 있습니다.
 * 실제 서버 연동 시에는 아래 함수들의 내부 로직을 axios나 fetch를 사용한 API 호출로 변경하면 됩니다.
 */

// --- 1. MOCK DATA ---

// 요청된 기본 역할 4개
let MOCK_ROLES: RoleItem[] = [
  { id: 1, code: '7777', name: '지자체', description: '구단위', status: '사용' },
  { id: 2, code: '9999', name: '시스템관리자', description: '시스템관리자', status: '사용' },
  { id: 3, code: '8000', name: '총판관리자', description: '총판관리자', status: '사용' },
  { id: 4, code: '1000', name: '시장관리자', description: '시장관리자', status: '사용' },
];

// 사용자 데이터 역할명 동기화 (smsReceive 추가, password 추가)
// 비밀번호는 모두 '12341234!'로 설정
let MOCK_USERS: User[] = [
  { id: 1, userId: 'admin', password: '12341234!', name: '관리자', role: '시스템관리자', phone: '010-1234-5678', department: '본사', status: '사용', smsReceive: '수신' },
  { id: 2, userId: 'dist01', password: '12341234!', name: '김총판', role: '총판관리자', phone: '010-9876-5432', department: '경기남부', status: '사용', smsReceive: '미수신' },
  { id: 3, userId: 'market01', password: '12341234!', name: '박시장', role: '시장관리자', phone: '010-5555-4444', department: '부평시장', status: '사용', smsReceive: '수신' },
  { id: 4, userId: 'store01', password: '12341234!', name: '이상인', role: '시장관리자', phone: '010-1111-2222', department: '진라도김치', status: '미사용', smsReceive: '수신' },
];

let MOCK_MARKETS: Market[] = [
  { id: 1, name: '부평자유시장', address: '인천광역시 부평구 시장로 11', addressDetail: '', managerName: '홍길동', managerPhone: '010-1234-1234', status: 'Normal' },
  { id: 2, name: '대전중앙시장', address: '대전광역시 동구 중교로 12', addressDetail: '', managerName: '김철수', managerPhone: '010-9876-5432', status: 'Fire' },
];

let MOCK_DISTRIBUTORS: Distributor[] = [
  { 
    id: 1, name: '미창', address: '경기도 부천시 원미구 도약로 294', addressDetail: '5,7F', 
    latitude: '37.5102443', longitude: '126.7822721', 
    managerName: '미창AS', managerPhone: '01074158119', managerEmail: '', memo: '', status: '사용',
    managedMarkets: ['원주자유시장', '원주시민시장', '원주남부시장', '사직시장', '상동시장']
  },
  { 
    id: 2, name: '디지털허브', address: '서울특별시 성동구 아차산로 17', addressDetail: '101호', 
    latitude: '37.541', longitude: '127.056', 
    managerName: '정진욱팀장', managerPhone: '01071512644', managerEmail: '', memo: '', status: '사용',
    managedMarkets: []
  },
  { 
    id: 3, name: '창조라이팅', address: '대전광역시 대덕구 한남로 107', addressDetail: '', 
    latitude: '36.353', longitude: '127.422', 
    managerName: '이건철', managerPhone: '01076113935', managerEmail: '', memo: '', status: '사용',
    managedMarkets: []
  },
  { 
    id: 4, name: '신흥아이엔지', address: '대구광역시 남구 명덕로 104', addressDetail: '', 
    latitude: '35.856', longitude: '128.591', 
    managerName: '박영호', managerPhone: '01046287591', managerEmail: '', memo: '', status: '사용',
    managedMarkets: []
  },
  { 
    id: 5, name: '에어텍코리아', address: '경상남도 김해시 내덕로148번길 38', addressDetail: '', 
    latitude: '35.215', longitude: '128.855', 
    managerName: '김영호', managerPhone: '01043320709', managerEmail: '', memo: '', status: '사용',
    managedMarkets: []
  },
  { 
    id: 6, name: '대전서구청', address: '대전광역시 서구 둔산서로 100', addressDetail: '', 
    latitude: '36.355', longitude: '127.383', 
    managerName: '대전서구청', managerPhone: '', managerEmail: '', memo: '', status: '사용',
    managedMarkets: []
  },
  { 
    id: 7, name: '송파구청', address: '서울특별시 송파구 올림픽로 326', addressDetail: '', 
    latitude: '37.514', longitude: '127.106', 
    managerName: '송파구', managerPhone: '', managerEmail: '', memo: '', status: '사용',
    managedMarkets: []
  },
  { 
    id: 8, name: '부천소방서', address: '경기도 부천시 신흥로 115', addressDetail: '', 
    latitude: '37.498', longitude: '126.776', 
    managerName: '부천소방서', managerPhone: '', managerEmail: '', memo: '', status: '사용',
    managedMarkets: []
  },
  { 
    id: 9, name: '솔루션디', address: '부산광역시 연제구 시청로 12', addressDetail: '', 
    latitude: '35.176', longitude: '129.076', 
    managerName: '김덕호 대표', managerPhone: '01028681190', managerEmail: '', memo: '', status: '사용',
    managedMarkets: []
  },
  { 
    id: 10, name: '도봉구', address: '서울특별시 도봉구 도봉로 721', addressDetail: '', 
    latitude: '37.668', longitude: '127.047', 
    managerName: '도봉구관리자', managerPhone: '', managerEmail: '', memo: '', status: '사용',
    managedMarkets: []
  }
];

const MOCK_DASHBOARD = {
  stats: [
    { label: '최근 화재 발생', value: 2, type: 'fire', color: 'bg-red-500' },
    { label: '최근 고장 발생', value: 5, type: 'fault', color: 'bg-orange-500' },
    { label: '통신 이상', value: 1, type: 'error', color: 'bg-gray-500' },
  ],
  fireLogs: [
    { id: 1, msg: '인천광역시 부평구 진라도김치 화재 감지', time: '2024-05-25 12:39:15', type: 'fire' },
    { id: 2, msg: '대전광역시 서구 약초마을 화재 감지 알림', time: '2024-06-25 08:59:15', type: 'fire' },
  ],
  faultLogs: [
    { id: 1, msg: '중계기 02 감지기 01 감지기 통신이상', time: '2024-06-25 10:06:53', type: 'fault' },
    { id: 2, msg: '중계기 15 감지기 11 감지기 통신이상', time: '2024-06-25 08:01:51', type: 'fault' },
  ],
  mapPoints: [
    { id: 1, x: 30, y: 40, name: '서울/경기', status: 'normal' },
    { id: 2, x: 60, y: 50, name: '경상북도', status: 'fire' },
    { id: 3, x: 40, y: 70, name: '전라북도', status: 'normal' },
  ]
};

// --- 2. Helper Utilities ---
const simulateDelay = <T>(data: T): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), 300 + Math.random() * 300);
  });
};

// --- 3. API Services ---

export const AuthAPI = {
  login: async (id: string, pw: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = MOCK_USERS.find(u => u.userId === id);
        
        // 1. 사용자 존재 여부 및 비밀번호 일치 확인
        // 2. 상태가 '사용'인지 확인
        if (user && user.password === pw && user.status === '사용') {
          // 비밀번호는 제외하고 사용자 정보 반환
          const { password, ...userInfo } = user;
          resolve({
            success: true,
            token: 'mock-jwt-token-12345',
            user: userInfo
          });
        } else {
          // 실패 시 에러
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  },
  // 비밀번호 변경 기능 추가
  changePassword: async (userId: string, currentPw: string, newPw: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userIndex = MOCK_USERS.findIndex(u => u.userId === userId);
        
        if (userIndex === -1) {
          reject(new Error('사용자를 찾을 수 없습니다.'));
          return;
        }

        if (MOCK_USERS[userIndex].password !== currentPw) {
          reject(new Error('현재 비밀번호가 일치하지 않습니다.'));
          return;
        }

        // 비밀번호 업데이트
        MOCK_USERS[userIndex].password = newPw;
        resolve({ success: true });
      }, 500);
    });
  }
};

export const RoleAPI = {
  getList: async (params?: { code?: string, name?: string }) => {
    let data = [...MOCK_ROLES];
    if (params) {
      if (params.code) data = data.filter(r => r.code.includes(params.code!));
      if (params.name) data = data.filter(r => r.name.includes(params.name!));
    }
    return simulateDelay(data);
  },
  save: async (role: RoleItem) => {
    if (role.id) {
      MOCK_ROLES = MOCK_ROLES.map(r => r.id === role.id ? role : r);
      return simulateDelay(role);
    } else {
      const newRole = { ...role, id: Math.max(...MOCK_ROLES.map(r => r.id)) + 1 };
      MOCK_ROLES.push(newRole);
      return simulateDelay(newRole);
    }
  },
  delete: async (id: number) => {
    MOCK_ROLES = MOCK_ROLES.filter(r => r.id !== id);
    return simulateDelay(true);
  }
};

// 공통 API (업체 목록 등)
export const CommonAPI = {
  // 총판 + 시장 목록 통합 조회
  getCompanyList: async (searchName?: string) => {
    const distributors = MOCK_DISTRIBUTORS.map(d => ({
      id: `D_${d.id}`,
      name: d.name,
      type: '총판',
      manager: d.managerName,
      phone: d.managerPhone
    }));
    
    const markets = MOCK_MARKETS.map(m => ({
      id: `M_${m.id}`,
      name: m.name,
      type: '시장',
      manager: m.managerName,
      phone: m.managerPhone
    }));

    let all = [...distributors, ...markets];
    
    if (searchName) {
      all = all.filter(c => c.name.includes(searchName));
    }
    
    return simulateDelay(all);
  }
};

export const UserAPI = {
  getList: async (params?: { userId?: string, name?: string, role?: string, department?: string }) => {
    let data = [...MOCK_USERS];
    if (params) {
      if (params.userId) data = data.filter(u => u.userId.includes(params.userId!));
      if (params.name) data = data.filter(u => u.name.includes(params.name!));
      if (params.role) data = data.filter(u => u.role === params.role);
      if (params.department) data = data.filter(u => u.department?.includes(params.department!));
    }
    return simulateDelay(data);
  },
  // 중복 체크 API
  checkDuplicate: async (userId: string) => {
    const exists = MOCK_USERS.some(u => u.userId === userId);
    return simulateDelay(exists);
  },
  save: async (user: User) => {
    if (user.id) {
      const existing = MOCK_USERS.find(u => u.id === user.id);
      // 비밀번호 업데이트가 없는 경우 기존 비밀번호 유지
      const updatedUser = { 
        ...existing, 
        ...user, 
        password: user.password || existing?.password 
      };
      
      MOCK_USERS = MOCK_USERS.map(u => u.id === user.id ? updatedUser : u);
      return simulateDelay(updatedUser);
    } else {
      // 신규 생성 시
      const newUser = { 
        ...user, 
        id: Math.max(...MOCK_USERS.map(u => u.id)) + 1,
        // 비밀번호가 없으면 기본값 설정 (혹은 에러처리)
        password: user.password || '12341234!' 
      };
      MOCK_USERS.push(newUser);
      return simulateDelay(newUser);
    }
  },
  delete: async (id: number) => {
    MOCK_USERS = MOCK_USERS.filter(u => u.id !== id);
    return simulateDelay(true);
  }
};

export const MarketAPI = {
  getList: async (params?: { name?: string, address?: string, managerName?: string }) => {
    let data = [...MOCK_MARKETS];
    if (params) {
      if (params.name) data = data.filter(m => m.name.includes(params.name!));
      if (params.address) data = data.filter(m => m.address.includes(params.address!));
      if (params.managerName) data = data.filter(m => m.managerName.includes(params.managerName!));
    }
    return simulateDelay(data);
  },
  save: async (market: Market) => {
    if (market.id) {
      MOCK_MARKETS = MOCK_MARKETS.map(m => m.id === market.id ? market : m);
      return simulateDelay(market);
    } else {
      const newMarket = { ...market, id: Math.max(...MOCK_MARKETS.map(m => m.id)) + 1 };
      MOCK_MARKETS.push(newMarket);
      return simulateDelay(newMarket);
    }
  },
  delete: async (id: number) => {
    MOCK_MARKETS = MOCK_MARKETS.filter(m => m.id !== id);
    return simulateDelay(true);
  }
};

export const DistributorAPI = {
  getList: async (params?: { address?: string, name?: string, managerName?: string }) => {
    let data = [...MOCK_DISTRIBUTORS];
    if (params) {
      // 주소 검색 (Select Box '전체'일 경우 필터링 안함, 그 외에는 포함 여부 확인)
      if (params.address && params.address !== '전체') {
        data = data.filter(d => d.address.includes(params.address!));
      }
      if (params.name) data = data.filter(d => d.name.includes(params.name!));
      if (params.managerName) data = data.filter(d => d.managerName.includes(params.managerName!));
    }
    return simulateDelay(data);
  },
  save: async (dist: Distributor) => {
    if (dist.id) {
      MOCK_DISTRIBUTORS = MOCK_DISTRIBUTORS.map(d => d.id === dist.id ? dist : d);
      return simulateDelay(dist);
    } else {
      const newDist = { ...dist, id: Math.max(...MOCK_DISTRIBUTORS.map(d => d.id), 0) + 1 };
      MOCK_DISTRIBUTORS.push(newDist);
      return simulateDelay(newDist);
    }
  },
  delete: async (id: number) => {
    MOCK_DISTRIBUTORS = MOCK_DISTRIBUTORS.filter(d => d.id !== id);
    return simulateDelay(true);
  }
};

export const DashboardAPI = {
  getData: async () => {
    return simulateDelay(MOCK_DASHBOARD);
  }
};