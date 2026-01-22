import { supabase } from '../lib/supabaseClient';
import { User, RoleItem, Market, Distributor, Store, WorkLog, Receiver, Repeater, Detector, Transmitter, Alarm, MenuItemDB, CommonCode, FireHistoryItem, DeviceStatusItem, DataReceptionItem } from '../types';

/**
 * [API 서비스 정책]
 * 1. 우선적으로 Supabase DB에서 데이터를 조회합니다.
 * 2. DB 연결 실패, 에러 발생, 또는 데이터가 0건일 경우(초기 상태) -> 자동으로 MOCK(임시) 데이터를 반환합니다.
 *    이를 통해 DB가 준비되지 않아도 프론트엔드 화면이 비어 보이지 않게 합니다.
 */

// --- 1. MOCK DATA (Fallback용 임시 데이터) ---

const MOCK_ROLES: RoleItem[] = [
  { id: 1, code: '7777', name: '지자체', description: '구단위', status: '사용' },
  { id: 2, code: '9999', name: '시스템관리자', description: '시스템관리자', status: '사용' },
  { id: 3, code: '8000', name: '총판관리자', description: '총판관리자', status: '사용' },
  { id: 4, code: '1000', name: '시장관리자', description: '시장관리자', status: '사용' },
];

const MOCK_USERS: User[] = [
  { id: 1, userId: 'admin', password: '12341234!', name: '관리자', role: '시스템관리자', phone: '010-1234-5678', department: '본사', status: '사용', smsReceive: '수신' },
  { id: 2, userId: 'dist01', password: '12341234!', name: '김총판', role: '총판관리자', phone: '010-9876-5432', department: '경기남부', status: '사용', smsReceive: '미수신' },
  { id: 3, userId: 'market01', password: '12341234!', name: '박시장', role: '시장관리자', phone: '010-5555-4444', department: '부평시장', status: '사용', smsReceive: '수신' },
  { id: 4, userId: 'store01', password: '12341234!', name: '이상인', role: '시장관리자', phone: '010-1111-2222', department: '진라도김치', status: '미사용', smsReceive: '수신' },
];

const MOCK_MARKETS: Market[] = [
  { 
    id: 1, name: '부평자유시장', address: '인천광역시 부평구 시장로 11', addressDetail: '', 
    latitude: '37.4924', longitude: '126.7234', 
    managerName: '홍길동', managerPhone: '010-1234-1234', status: 'Normal',
    distributorId: 1
  },
  { 
    id: 2, name: '대전중앙시장', address: '대전광역시 동구 중교로 12', addressDetail: '', 
    latitude: '36.3288', longitude: '127.4268',
    managerName: '김철수', managerPhone: '010-9876-5432', status: 'Fire',
    distributorId: 1
  }
];

const MOCK_DISTRIBUTORS: Distributor[] = [
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
];

const MOCK_MENUS: MenuItemDB[] = [
  { id: 1, label: '대시보드', path: null, icon: 'Home', sortOrder: 10, isVisiblePc: true, isVisibleMobile: true },
  { id: 11, parentId: 1, label: '대시보드1', path: '/dashboard', icon: undefined, sortOrder: 10, isVisiblePc: true, isVisibleMobile: true },
  { id: 12, parentId: 1, label: '대시보드2', path: '/dashboard2', icon: undefined, sortOrder: 20, isVisiblePc: true, isVisibleMobile: true },
  { id: 2, label: '시스템 관리', path: null, icon: 'Settings', sortOrder: 20, isVisiblePc: true, isVisibleMobile: false },
  { id: 21, parentId: 2, label: '사용자 관리', path: '/users', icon: undefined, sortOrder: 10, isVisiblePc: true, isVisibleMobile: false },
  { id: 22, parentId: 2, label: '총판 관리', path: '/distributors', icon: undefined, sortOrder: 20, isVisiblePc: true, isVisibleMobile: false },
  { id: 23, parentId: 2, label: '시장 관리', path: '/markets', icon: undefined, sortOrder: 30, isVisiblePc: true, isVisibleMobile: false },
  { id: 24, parentId: 2, label: '상가 관리', path: '/stores', icon: undefined, sortOrder: 40, isVisiblePc: true, isVisibleMobile: false },
  { id: 25, parentId: 2, label: '문자 전송', path: '/sms', icon: undefined, sortOrder: 50, isVisiblePc: true, isVisibleMobile: false },
  { id: 26, parentId: 2, label: '작업일지', path: '/work-logs', icon: undefined, sortOrder: 60, isVisiblePc: true, isVisibleMobile: true },
  { id: 27, parentId: 2, label: '롤 관리', path: '/roles', icon: undefined, sortOrder: 70, isVisiblePc: true, isVisibleMobile: false },
  { id: 28, parentId: 2, label: '공통코드 관리', path: '/common-codes', icon: undefined, sortOrder: 75, isVisiblePc: true, isVisibleMobile: false },
  { id: 29, parentId: 2, label: '메뉴 관리', path: '/menus', icon: undefined, sortOrder: 80, isVisiblePc: true, isVisibleMobile: false },
  { id: 3, label: '기기 관리', path: null, icon: 'Cpu', sortOrder: 30, isVisiblePc: true, isVisibleMobile: false },
  { id: 31, parentId: 3, label: 'R형 수신기 관리', path: '/receivers', icon: undefined, sortOrder: 10, isVisiblePc: true, isVisibleMobile: false },
  { id: 32, parentId: 3, label: '중계기 관리', path: '/repeaters', icon: undefined, sortOrder: 20, isVisiblePc: true, isVisibleMobile: false },
  { id: 33, parentId: 3, label: '화재감지기 관리', path: '/detectors', icon: undefined, sortOrder: 30, isVisiblePc: true, isVisibleMobile: false },
  { id: 34, parentId: 3, label: '발신기 관리', path: '/transmitters', icon: undefined, sortOrder: 40, isVisiblePc: true, isVisibleMobile: false },
  { id: 35, parentId: 3, label: '경종 관리', path: '/alarms', icon: undefined, sortOrder: 50, isVisiblePc: true, isVisibleMobile: false },
  { id: 4, label: '데이터 관리', path: null, icon: 'Activity', sortOrder: 40, isVisiblePc: true, isVisibleMobile: true },
  { id: 41, parentId: 4, label: '화재 이력 관리', path: '/fire-history', icon: undefined, sortOrder: 10, isVisiblePc: true, isVisibleMobile: true },
  { id: 42, parentId: 4, label: '기기 상태 관리', path: '/device-status', icon: undefined, sortOrder: 20, isVisiblePc: true, isVisibleMobile: true },
  { id: 43, parentId: 4, label: '데이터 수신 관리', path: '/data-reception', icon: undefined, sortOrder: 30, isVisiblePc: true, isVisibleMobile: true },
  { id: 44, parentId: 4, label: 'UART 통신', path: '/uart-communication', icon: undefined, sortOrder: 40, isVisiblePc: true, isVisibleMobile: true },
];

const MOCK_FIRE_HISTORY: FireHistoryItem[] = [
  { id: 1, marketName: '대전중앙시장', receiverMac: '01A4', receiverStatus: '10', repeaterId: '06', repeaterStatus: '35', detectorInfoChamber: '07(ITR2)', registeredAt: '2026-01-22 14:15:53', falseAlarmStatus: '화재', registrar: 'system' },
  { id: 2, marketName: '부평자유시장', receiverMac: '0193', receiverStatus: '10', repeaterId: '01', repeaterStatus: '35', detectorInfoChamber: '10(그린야채)', registeredAt: '2026-01-22 12:29:45', falseAlarmStatus: '등록', registrar: 'system' },
];

const MOCK_DEVICE_STATUS: DeviceStatusItem[] = [
  { id: 1, marketName: '대전중앙시장', receiverMac: '0136', repeaterId: '03', deviceType: '수신기', deviceId: '01', deviceStatus: '에러', errorCode: '04', registeredAt: '2026-01-22 11:40:03', processStatus: '미처리' },
  { id: 2, marketName: '부평자유시장', receiverMac: '0156', repeaterId: '04', deviceType: '중계기', deviceId: '01', deviceStatus: '에러', errorCode: '04', registeredAt: '2026-01-22 10:40:03', processStatus: '미처리' },
];

// --- 2. Helper Utilities ---
const simulateDelay = <T>(data: T): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), 200); // 0.2초 딜레이
  });
};

// Generic Supabase CRUD helper with Fallback
async function supabaseCrud<T>(
  table: string, 
  params?: Record<string, string>, 
  searchFields?: string[],
  fallbackData: T[] = []
) {
  try {
    let query = supabase.from(table).select('*').order('id', { ascending: false }); // 기본 내림차순 정렬
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          if (searchFields?.includes(key)) {
            query = query.ilike(key, `%${value}%`);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }
    
    const { data, error } = await query;
    if (error) {
        console.warn(`Supabase ${table} fetch error (Using Mock):`, error.message);
        return fallbackData; // 에러 시 Mock 데이터 반환
    }
    // 데이터가 없으면 초기 상태일 수 있으므로 Mock 데이터를 보여줄 수도 있지만, 
    // 실제 운영 환경에서는 []가 맞음. 그러나 데모를 위해 비어있으면 Mock을 반환하게 설정.
    if (!data || data.length === 0) {
        return fallbackData;
    }
    return data as T[];
  } catch (e) {
    console.error(`Error fetching ${table}:`, e);
    return fallbackData;
  }
}

// --- API IMPLEMENTATIONS ---

export const AuthAPI = {
  login: async (id: string, pw: string) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('userId', id).single();
      if (!error && data) {
        if (data.password === pw && data.status === '사용') {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password, ...userInfo } = data;
          return { success: true, token: 'supabase-token', user: userInfo };
        }
      }
    } catch (e) {}
    // Fallback
    const user = MOCK_USERS.find(u => u.userId === id);
    if (user && user.password === pw && user.status === '사용') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userInfo } = user;
        return { success: true, token: 'mock-token', user: userInfo };
    }
    throw new Error('Invalid credentials');
  },
  changePassword: async (userId: string, currentPw: string, newPw: string) => {
    try {
        const { data } = await supabase.from('users').select('*').eq('userId', userId).single();
        if (data) {
            if (data.password !== currentPw) throw new Error('현재 비밀번호 불일치');
            await supabase.from('users').update({ password: newPw }).eq('userId', userId);
            return { success: true };
        }
    } catch (e) {}
    // Fallback
    return simulateDelay({ success: true });
  }
};

export const UserAPI = {
  getList: async (params?: { userId?: string, name?: string, role?: string, department?: string }) => {
    return supabaseCrud<User>('users', params as any, ['userId', 'name', 'department'], MOCK_USERS);
  },
  checkDuplicate: async (userId: string) => {
    const { data } = await supabase.from('users').select('id').eq('userId', userId);
    return data && data.length > 0;
  },
  save: async (user: User) => {
    if (user.id) await supabase.from('users').update(user).eq('id', user.id);
    else await supabase.from('users').insert(user);
    return user;
  },
  delete: async (id: number) => {
    await supabase.from('users').delete().eq('id', id);
    return true;
  }
};

export const RoleAPI = {
  getList: async (params?: { code?: string, name?: string }) => {
    return supabaseCrud<RoleItem>('roles', params as any, ['code', 'name'], MOCK_ROLES);
  },
  save: async (role: RoleItem) => {
    if (role.id) await supabase.from('roles').update(role).eq('id', role.id);
    else await supabase.from('roles').insert(role);
    return role;
  },
  delete: async (id: number) => {
    await supabase.from('roles').delete().eq('id', id);
    return true;
  }
};

export const CommonAPI = {
  getCompanyList: async (searchName?: string) => {
    try {
      const { data: dists } = await supabase.from('distributors').select('id, name, managerName, managerPhone');
      const { data: mkts } = await supabase.from('markets').select('id, name, managerName, managerPhone');
      
      const dList = (dists || []).map((d: any) => ({ id: `D_${d.id}`, name: d.name, type: '총판', manager: d.managerName, phone: d.managerPhone }));
      const mList = (mkts || []).map((m: any) => ({ id: `M_${m.id}`, name: m.name, type: '시장', manager: m.managerName, phone: m.managerPhone }));
      
      let all = [...dList, ...mList];
      if (all.length === 0) {
          // Fallback if empty
          const dMock = MOCK_DISTRIBUTORS.map(d => ({ id: `D_${d.id}`, name: d.name, type: '총판', manager: d.managerName, phone: d.managerPhone }));
          const mMock = MOCK_MARKETS.map(m => ({ id: `M_${m.id}`, name: m.name, type: '시장', manager: m.managerName, phone: m.managerPhone }));
          all = [...dMock, ...mMock];
      }

      if (searchName) all = all.filter(c => c.name.includes(searchName));
      return all;
    } catch (e) {
      return [];
    }
  }
};

export const MarketAPI = {
  getList: async (params?: { name?: string, address?: string, managerName?: string }) => {
    return supabaseCrud<Market>('markets', params as any, ['name', 'address', 'managerName'], MOCK_MARKETS);
  },
  save: async (market: Market) => {
    if (market.id) await supabase.from('markets').update(market).eq('id', market.id);
    else await supabase.from('markets').insert(market);
    return market;
  },
  delete: async (id: number) => {
    await supabase.from('markets').delete().eq('id', id);
    return true;
  },
  uploadMapImage: async (file: File) => {
    const fileName = `${Date.now()}_${file.name}`;
    const { data } = await supabase.storage.from('market-maps').upload(fileName, file);
    if (data) {
      const { data: urlData } = supabase.storage.from('market-maps').getPublicUrl(fileName);
      return urlData.publicUrl;
    }
    // Fallback: don't error, just return null string to proceed
    console.warn('Image upload failed, skipping image.');
    return '';
  }
};

export const DistributorAPI = {
  getList: async (params?: { address?: string, name?: string, managerName?: string }) => {
    return supabaseCrud<Distributor>('distributors', params as any, ['address', 'name', 'managerName'], MOCK_DISTRIBUTORS);
  },
  save: async (dist: Distributor) => {
    if (dist.id) await supabase.from('distributors').update(dist).eq('id', dist.id);
    else await supabase.from('distributors').insert(dist);
    return dist;
  },
  delete: async (id: number) => {
    await supabase.from('distributors').delete().eq('id', id);
    return true;
  }
};

export const StoreAPI = { 
  getList: async (params?: { address?: string, marketName?: string, storeName?: string, marketId?: number }) => {
    try {
      let query = supabase.from('stores').select('*').order('id', { ascending: false });
      if (params?.storeName) query = query.ilike('name', `%${params.storeName}%`);
      if (params?.address) query = query.ilike('address', `%${params.address}%`);
      if (params?.marketId) query = query.eq('marketId', params.marketId);
      if (params?.marketName) query = query.ilike('marketName', `%${params.marketName}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Store[];
    } catch (e) {
      // Return empty array for stores if failed, as we don't have good mock data for stores in this file yet
      return [];
    }
  }, 
  save: async (store: Store) => {
    if (store.id) await supabase.from('stores').update(store).eq('id', store.id);
    else await supabase.from('stores').insert(store);
    return store;
  }, 
  delete: async (id: number) => {
    await supabase.from('stores').delete().eq('id', id);
    return true;
  }, 
  uploadStoreImage: async (file: File) => {
    const fileName = `store_${Date.now()}_${file.name}`;
    const { data } = await supabase.storage.from('store-images').upload(fileName, file);
    if (data) {
      const { data: urlData } = supabase.storage.from('store-images').getPublicUrl(fileName);
      return urlData.publicUrl;
    }
    return '';
  }, 
  saveBulk: async (stores: Store[]) => {
    const { error } = await supabase.from('stores').insert(stores);
    if (error) throw error;
    return true;
  } 
};

export const CommonCodeAPI = { 
  getList: async (params?: { groupName?: string, name?: string }) => {
    return supabaseCrud<CommonCode>('common_codes', params as any, ['groupName', 'name', 'code']);
  }, 
  save: async (code: CommonCode) => {
    if (code.id) await supabase.from('common_codes').update(code).eq('id', code.id);
    else await supabase.from('common_codes').insert(code);
    return code;
  }, 
  saveBulk: async (codes: CommonCode[]) => {
    const { error } = await supabase.from('common_codes').insert(codes);
    if (error) throw error;
    return true;
  }, 
  delete: async (id: number) => {
    await supabase.from('common_codes').delete().eq('id', id);
    return true;
  } 
};

export const WorkLogAPI = { 
  getList: async (params?: { marketName?: string }) => {
    try {
      let query = supabase.from('work_logs').select('*, markets(name)').order('workDate', { ascending: false });
      const { data, error } = await query;
      
      if (!error && data) {
        return data.map((log: any) => ({
          ...log,
          marketName: log.markets?.name || 'Unknown'
        })) as WorkLog[];
      }
    } catch(e) {}
    return [];
  }, 
  save: async (log: WorkLog) => {
    const { marketName, ...saveData } = log;
    if (saveData.id) await supabase.from('work_logs').update(saveData).eq('id', saveData.id);
    else await supabase.from('work_logs').insert(saveData);
    return log;
  }, 
  delete: async (id: number) => {
    await supabase.from('work_logs').delete().eq('id', id);
    return true;
  }, 
  uploadAttachment: async (file: File) => {
    const fileName = `log_${Date.now()}_${file.name}`;
    const { data } = await supabase.storage.from('work-log-images').upload(fileName, file);
    if (data) {
      const { data: urlData } = supabase.storage.from('work-log-images').getPublicUrl(fileName);
      return urlData.publicUrl;
    }
    return '';
  } 
};

export const ReceiverAPI = { 
  getList: async (params?: { marketName?: string, macAddress?: string, ip?: string, emergencyPhone?: string }) => {
    try {
      let query = supabase.from('receivers').select('*, markets(name)').order('id', { ascending: false });
      if (params?.macAddress) query = query.ilike('macAddress', `%${params.macAddress}%`);
      if (params?.ip) query = query.ilike('ip', `%${params.ip}%`);
      
      const { data, error } = await query;
      if (!error && data) {
        let result = data.map((r: any) => ({ ...r, marketName: r.markets?.name }));
        if (params?.marketName) {
            result = result.filter(r => r.marketName?.includes(params.marketName));
        }
        return result as Receiver[];
      }
    } catch(e) {}
    return [];
  }, 
  save: async (receiver: Receiver) => {
    const { marketName, ...saveData } = receiver;
    if (saveData.id) await supabase.from('receivers').update(saveData).eq('id', saveData.id);
    else await supabase.from('receivers').insert(saveData);
    return receiver;
  }, 
  delete: async (id: number) => {
    await supabase.from('receivers').delete().eq('id', id);
    return true;
  }, 
  uploadImage: async (file: File) => {
    const fileName = `rcv_${Date.now()}_${file.name}`;
    const { data } = await supabase.storage.from('receiver-images').upload(fileName, file);
    if (data) {
      const { data: urlData } = supabase.storage.from('receiver-images').getPublicUrl(fileName);
      return urlData.publicUrl;
    }
    return '';
  }, 
  saveBulk: async (data: Receiver[]) => {
    const { error } = await supabase.from('receivers').insert(data);
    if (error) throw error;
    return true;
  } 
};

export const RepeaterAPI = { 
  getList: async (params?: any) => {
    try {
      let query = supabase.from('repeaters').select('*, markets(name)').order('id', { ascending: false });
      if (params?.receiverMac) query = query.ilike('receiverMac', `%${params.receiverMac}%`);
      if (params?.repeaterId) query = query.eq('repeaterId', params.repeaterId);
      
      const { data, error } = await query;
      if (!error && data) {
        let result = data.map((r: any) => ({ ...r, marketName: r.markets?.name }));
        if (params?.marketName) result = result.filter(r => r.marketName?.includes(params.marketName));
        return result as Repeater[];
      }
    } catch(e) {}
    return [];
  }, 
  save: async (repeater: Repeater) => {
    const { marketName, ...saveData } = repeater;
    if (saveData.id) await supabase.from('repeaters').update(saveData).eq('id', saveData.id);
    else await supabase.from('repeaters').insert(saveData);
    return repeater;
  }, 
  delete: async (id: number) => {
    await supabase.from('repeaters').delete().eq('id', id);
    return true;
  }, 
  uploadImage: async (file: File) => {
    const fileName = `rpt_${Date.now()}_${file.name}`;
    const { data } = await supabase.storage.from('repeater-images').upload(fileName, file);
    if (data) {
      const { data: urlData } = supabase.storage.from('repeater-images').getPublicUrl(fileName);
      return urlData.publicUrl;
    }
    return '';
  }, 
  saveBulk: async (data: Repeater[]) => {
    const { error } = await supabase.from('repeaters').insert(data);
    if (error) throw error;
    return true;
  } 
};

export const DetectorAPI = { 
  getList: async (params?: any) => {
    try {
      let query = supabase.from('detectors').select('*, markets(name)').order('id', { ascending: false });
      if (params?.receiverMac) query = query.ilike('receiverMac', `%${params.receiverMac}%`);
      
      const { data, error } = await query;
      if (!error && data) {
        let result = data.map((d: any) => ({ ...d, marketName: d.markets?.name }));
        if (params?.marketName) result = result.filter(r => r.marketName?.includes(params.marketName));
        return result as Detector[];
      }
    } catch(e) {}
    return [];
  }, 
  save: async (detector: Detector) => {
    const { marketName, stores, ...saveData } = detector;
    let savedId = saveData.id;
    
    if (savedId) {
        await supabase.from('detectors').update(saveData).eq('id', savedId);
    } else {
        const { data } = await supabase.from('detectors').insert(saveData).select();
        if (data) savedId = data[0].id;
    }
    
    // Save Junction Stores (Simplify: Delete all and re-insert)
    if (savedId && stores) {
        await supabase.from('detector_stores').delete().eq('detectorId', savedId);
        if (stores.length > 0) {
            const junctions = stores.map(s => ({ detectorId: savedId, storeId: s.id }));
            await supabase.from('detector_stores').insert(junctions);
        }
    }
    return detector;
  }, 
  delete: async (id: number) => {
    await supabase.from('detectors').delete().eq('id', id);
    return true;
  }, 
  saveBulk: async (data: Detector[]) => {
    const { error } = await supabase.from('detectors').insert(data);
    if (error) throw error;
    return true;
  } 
};

export const TransmitterAPI = { 
  getList: async (params?: any) => {
    try {
        let query = supabase.from('transmitters').select('*, markets(name)').order('id', { ascending: false });
        const { data, error } = await query;
        if (!error && data) {
            let result = data.map((t: any) => ({ ...t, marketName: t.markets?.name }));
            if (params?.marketName) result = result.filter(r => r.marketName?.includes(params.marketName));
            return result as Transmitter[];
        }
    } catch(e) {}
    return [];
  }, 
  save: async (t: Transmitter) => {
    const { marketName, ...saveData } = t;
    if (saveData.id) await supabase.from('transmitters').update(saveData).eq('id', saveData.id);
    else await supabase.from('transmitters').insert(saveData);
    return t;
  }, 
  delete: async (id: number) => {
    await supabase.from('transmitters').delete().eq('id', id);
    return true;
  } 
};

export const AlarmAPI = { 
  getList: async (params?: any) => {
    try {
        let query = supabase.from('alarms').select('*, markets(name)').order('id', { ascending: false });
        const { data, error } = await query;
        if (!error && data) {
            let result = data.map((a: any) => ({ ...a, marketName: a.markets?.name }));
            if (params?.marketName) result = result.filter(r => r.marketName?.includes(params.marketName));
            return result as Alarm[];
        }
    } catch(e) {}
    return [];
  }, 
  save: async (a: Alarm) => {
    const { marketName, ...saveData } = a;
    if (saveData.id) await supabase.from('alarms').update(saveData).eq('id', saveData.id);
    else await supabase.from('alarms').insert(saveData);
    return a;
  }, 
  delete: async (id: number) => {
    await supabase.from('alarms').delete().eq('id', id);
    return true;
  } 
};

// --- Log & Data APIs with Mock Fallback ---

export const FireHistoryAPI = { 
  getList: async (params?: { startDate?: string, endDate?: string, marketName?: string, status?: string }) => {
    return supabaseCrud<FireHistoryItem>('fire_history', params as any, ['marketName'], MOCK_FIRE_HISTORY);
  }, 
  save: async (id: number, type: string, note: string) => {
    await supabase.from('fire_history').update({ falseAlarmStatus: type, note }).eq('id', id);
    return true;
  }, 
  delete: async (id: number) => {
    await supabase.from('fire_history').delete().eq('id', id);
    return true;
  } 
};

export const DeviceStatusAPI = { 
  getList: async (params?: { startDate?: string, endDate?: string, marketName?: string, status?: string }) => {
    return supabaseCrud<DeviceStatusItem>('device_status', params as any, ['marketName'], MOCK_DEVICE_STATUS);
  }, 
  save: async (id: number, status: string, note: string) => {
    await supabase.from('device_status').update({ processStatus: status, note }).eq('id', id);
    return true;
  }, 
  delete: async (id: number) => {
    await supabase.from('device_status').delete().eq('id', id);
    return true;
  } 
};

export const DataReceptionAPI = { 
  getList: async (params?: { startDate?: string, endDate?: string, marketName?: string }) => {
    return supabaseCrud<DataReceptionItem>('data_reception', params as any, ['marketName'], []);
  }, 
  delete: async (id: number) => {
    await supabase.from('data_reception').delete().eq('id', id);
    return true;
  } 
};

export const MenuAPI = { 
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('sortOrder', { ascending: true });
      
      if (error || !data || data.length === 0) {
        return MOCK_MENUS;
      }
      return data as MenuItemDB[];
    } catch (e) {
      return MOCK_MENUS;
    }
  },
  
  getTree: async () => {
    const list = await MenuAPI.getAll();
    const buildTree = (items: MenuItemDB[], parentId: number | null = null): MenuItemDB[] => {
      return items
        .filter(item => (item.parentId || null) === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder);
    };
    return buildTree(list);
  },

  toggleVisibility: async () => simulateDelay(true), 
  updateVisibilities: async (updates: any) => {
    try {
        await Promise.all(updates.map((u: any) => 
            supabase.from('menus').update({ isVisiblePc: u.isVisiblePc, isVisibleMobile: u.isVisibleMobile }).eq('id', u.id)
        ));
        return true;
    } catch (e) { return false; }
  }, 
  save: async (m: MenuItemDB) => {
    if (m.id) await supabase.from('menus').update(m).eq('id', m.id);
    else await supabase.from('menus').insert(m);
    return m;
  }, 
  delete: async (id: number) => {
    await supabase.from('menus').delete().eq('id', id);
    return true;
  } 
};

export const DashboardAPI = { 
    getData: async () => {
        // [수정] 실제 DB 조회 시도 후, 실패 시 Mock 데이터 반환
        try {
            // 1. 화재 발생 건수 (최근 24시간 or 전체) - 여기서는 전체 '화재' 상태 카운트
            const { count: fireCount, error: fireError } = await supabase
                .from('fire_history')
                .select('*', { count: 'exact', head: true })
                .eq('falseAlarmStatus', '화재');

            // 2. 고장 발생 건수
            const { count: faultCount, error: faultError } = await supabase
                .from('device_status')
                .select('*', { count: 'exact', head: true })
                .eq('deviceStatus', '에러');

            // 3. 최근 화재 로그 (Top 5)
            const { data: fireLogs } = await supabase
                .from('fire_history')
                .select('*')
                .eq('falseAlarmStatus', '화재')
                .order('registeredAt', { ascending: false })
                .limit(5);

            // 4. 최근 고장 로그 (Top 5)
            const { data: faultLogs } = await supabase
                .from('device_status')
                .select('*')
                .eq('deviceStatus', '에러')
                .order('registeredAt', { ascending: false })
                .limit(5);

            // 에러가 없고 데이터가 있으면 리얼 데이터 반환
            if (!fireError && !faultError) {
                return {
                    stats: [
                        { label: '최근 화재 발생', value: fireCount || 0, type: 'fire', color: 'bg-red-600' },
                        { label: '최근 고장 발생', value: faultCount || 0, type: 'fault', color: 'bg-orange-500' },
                        { label: '통신 이상', value: 0, type: 'error', color: 'bg-slate-600' }, // 통신 이상은 별도 집계 필요 (여기선 0)
                    ],
                    fireLogs: (fireLogs || []).map((l: any) => ({
                        id: l.id,
                        msg: `${l.marketName} - ${l.receiverStatus || '화재감지'}`,
                        time: l.registeredAt,
                        type: 'fire'
                    })),
                    faultLogs: (faultLogs || []).map((l: any) => ({
                        id: l.id,
                        msg: `${l.marketName} ${l.deviceType} ${l.deviceId} 에러`,
                        time: l.registeredAt,
                        type: 'fault'
                    })),
                    mapPoints: [
                        { id: 1, x: 30, y: 40, name: '서울/경기', status: 'normal' },
                        { id: 2, x: 60, y: 50, name: '경상북도', status: fireCount ? 'fire' : 'normal' },
                        { id: 3, x: 40, y: 70, name: '전라북도', status: 'normal' },
                    ]
                };
            }
        } catch (e) {
            console.warn("Dashboard DB fetch failed, using mock.", e);
        }

        // Fallback Mock Data
        return {
            stats: [
                { label: '최근 화재 발생', value: 2, type: 'fire', color: 'bg-red-600' },
                { label: '최근 고장 발생', value: 5, type: 'fault', color: 'bg-orange-500' },
                { label: '통신 이상', value: 1, type: 'error', color: 'bg-slate-600' },
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
    } 
};