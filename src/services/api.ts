import { supabase } from '../lib/supabaseClient';
import { User, RoleItem, Market, Distributor, Store, WorkLog, Receiver, Repeater, Detector, Transmitter, Alarm, MenuItemDB, CommonCode, FireHistoryItem, DeviceStatusItem, DataReceptionItem } from '../types';

/**
 * [API 서비스 정책]
 * 1. 읽기(Read): Supabase 조회 실패 시에만 Mock 데이터 반환
 * 2. 쓰기(Write): 실제 DB 결과를 반환. 실패 시 에러 throw.
 */

// --- 1. MOCK DATA (Fallback) ---

const MOCK_ROLES: RoleItem[] = [
  { id: 1, code: '7777', name: '지자체', description: '구단위', status: '사용' },
  { id: 2, code: '9999', name: '시스템관리자', description: '시스템관리자', status: '사용' },
  { id: 3, code: '8000', name: '총판관리자', description: '총판관리자', status: '사용' },
  { id: 4, code: '1000', name: '시장관리자', description: '시장관리자', status: '사용' },
];

const MOCK_USERS: User[] = [
  { id: 1, userId: 'admin', password: '12341234!', name: '관리자', role: '시스템관리자', phone: '010-1234-5678', department: '본사', status: '사용', smsReceive: '수신' },
  { id: 2, userId: 'dist01', password: '12341234!', name: '김총판', role: '총판관리자', phone: '010-9876-5432', department: '경기남부', status: '사용', smsReceive: '미수신' },
];

const MOCK_MARKETS: Market[] = [
  { 
    id: 1, name: '부평자유시장', address: '인천광역시 부평구 시장로 11', addressDetail: '', 
    latitude: '37.4924', longitude: '126.7234', 
    managerName: '홍길동', managerPhone: '010-1234-1234', status: 'Normal',
    distributorId: 1
  }
];

const MOCK_DISTRIBUTORS: Distributor[] = [
  { 
    id: 1, name: '미창', address: '경기도 부천시 원미구 도약로 294', addressDetail: '5,7F', 
    latitude: '37.5102443', longitude: '126.7822721', 
    managerName: '미창AS', managerPhone: '01074158119', managerEmail: '', memo: '', status: '사용',
    managedMarkets: ['원주자유시장']
  }
];

// --- 2. Helper Utilities ---

// 파일명 안전 변환 함수 (한글/특수문자/공백 오류 방지)
const generateSafeFileName = (prefix: string, originalName: string) => {
  // 1. 확장자 추출
  const parts = originalName.split('.');
  let ext = parts.length > 1 ? parts.pop() : 'png';
  
  // 2. 확장자 안전성 검사 (영문 숫자만 허용, 아니면 png로 대체)
  if (!ext || !/^[a-zA-Z0-9]+$/.test(ext)) {
      ext = 'png'; 
  }
  
  // 3. 랜덤 문자열 생성
  const randomStr = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();
  
  // 4. 최종 파일명 반환 (예: market_1700000000_abc123.jpg)
  return `${prefix}_${timestamp}_${randomStr}.${ext}`;
};

// Generic Supabase Reader
async function supabaseReader<T>(
  table: string, 
  params?: Record<string, string>, 
  searchFields?: string[],
  fallbackData: T[] = []
) {
  try {
    let query = supabase.from(table).select('*').order('id', { ascending: false });
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== 'all') {
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
        console.warn(`Supabase read error on ${table}:`, error.message);
        return fallbackData;
    }
    if (data === null) return fallbackData;
    
    return data as T[];
  } catch (e) {
    console.error(`Unexpected error reading ${table}:`, e);
    return fallbackData;
  }
}

// Generic Supabase Saver
async function supabaseSaver<T extends { id: number }>(table: string, item: T): Promise<T> {
  const { id, ...rest } = item;
  
  let query;
  if (id && id > 0) {
    query = supabase.from(table).update(rest).eq('id', id).select();
  } else {
    query = supabase.from(table).insert(rest).select();
  }

  const { data, error } = await query;
  
  if (error) {
    console.error(`Save failed for ${table}:`, error);
    throw new Error(error.message);
  }
  
  if (!data || data.length === 0) {
    throw new Error('데이터 저장 후 반환된 결과가 없습니다.');
  }

  return data[0] as T;
}

async function supabaseDeleter(table: string, id: number) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// --- API IMPLEMENTATIONS ---

export const AuthAPI = {
  login: async (id: string, pw: string) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('userId', id).single();
      if (!error && data) {
        if (data.password === pw && data.status === '사용') {
          const { password, ...userInfo } = data;
          return { success: true, token: 'supabase-token', user: userInfo };
        }
      }
    } catch (e) {}
    
    const user = MOCK_USERS.find(u => u.userId === id);
    if (user && user.password === pw && user.status === '사용') {
        const { password, ...userInfo } = user;
        return { success: true, token: 'mock-token', user: userInfo };
    }
    throw new Error('아이디 또는 비밀번호가 잘못되었습니다.');
  },
  changePassword: async (userId: string, currentPw: string, newPw: string) => {
    const { data } = await supabase.from('users').select('*').eq('userId', userId).single();
    if (!data) throw new Error('사용자를 찾을 수 없습니다.');
    if (data.password !== currentPw) throw new Error('현재 비밀번호 불일치');
    
    const { error } = await supabase.from('users').update({ password: newPw }).eq('userId', userId);
    if (error) throw error;
    return { success: true };
  }
};

export const UserAPI = {
  getList: async (params?: { userId?: string, name?: string, role?: string, department?: string }) => {
    return supabaseReader<User>('users', params as any, ['userId', 'name', 'department'], MOCK_USERS);
  },
  checkDuplicate: async (userId: string) => {
    const { data } = await supabase.from('users').select('id').eq('userId', userId);
    return data && data.length > 0;
  },
  save: async (user: User) => {
    return supabaseSaver('users', user);
  },
  delete: async (id: number) => {
    return supabaseDeleter('users', id);
  }
};

export const RoleAPI = {
  getList: async (params?: { code?: string, name?: string }) => {
    return supabaseReader<RoleItem>('roles', params as any, ['code', 'name'], MOCK_ROLES);
  },
  save: async (role: RoleItem) => {
    return supabaseSaver('roles', role);
  },
  delete: async (id: number) => {
    return supabaseDeleter('roles', id);
  }
};

export const CommonAPI = {
  getCompanyList: async (searchName?: string) => {
    try {
      let dQuery = supabase.from('distributors').select('id, name, managerName, managerPhone');
      if(searchName) dQuery = dQuery.ilike('name', `%${searchName}%`);
      const { data: dists } = await dQuery;

      let mQuery = supabase.from('markets').select('id, name, managerName, managerPhone');
      if(searchName) mQuery = mQuery.ilike('name', `%${searchName}%`);
      const { data: mkts } = await mQuery;
      
      const dList = (dists || []).map((d: any) => ({ id: `D_${d.id}`, name: d.name, type: '총판', manager: d.managerName, phone: d.managerPhone }));
      const mList = (mkts || []).map((m: any) => ({ id: `M_${m.id}`, name: m.name, type: '시장', manager: m.managerName, phone: m.managerPhone }));
      
      let all = [...dList, ...mList];
      
      if (all.length === 0 && !searchName) {
          const dMock = MOCK_DISTRIBUTORS.map(d => ({ id: `D_${d.id}`, name: d.name, type: '총판', manager: d.managerName, phone: d.managerPhone }));
          all = [...dMock];
      }
      return all;
    } catch (e) {
      return [];
    }
  }
};

export const MarketAPI = {
  getList: async (params?: { name?: string, address?: string, managerName?: string }) => {
    return supabaseReader<Market>('markets', params as any, ['name', 'address', 'managerName'], MOCK_MARKETS);
  },
  save: async (market: Market) => {
    return supabaseSaver('markets', market);
  },
  delete: async (id: number) => {
    return supabaseDeleter('markets', id);
  },
  uploadMapImage: async (file: File) => {
    const fileName = generateSafeFileName('market', file.name);
    const { data, error } = await supabase.storage.from('market-maps').upload(fileName, file);
    if (error) {
        console.error("Image Upload Error:", error);
        throw new Error('이미지 업로드 실패: ' + error.message);
    }
    if (data) {
      const { data: urlData } = supabase.storage.from('market-maps').getPublicUrl(fileName);
      return urlData.publicUrl;
    }
    return '';
  }
};

export const DistributorAPI = {
  getList: async (params?: { address?: string, name?: string, managerName?: string }) => {
    return supabaseReader<Distributor>('distributors', params as any, ['address', 'name', 'managerName'], MOCK_DISTRIBUTORS);
  },
  save: async (dist: Distributor) => {
    return supabaseSaver('distributors', dist);
  },
  delete: async (id: number) => {
    return supabaseDeleter('distributors', id);
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
      return [];
    }
  }, 
  save: async (store: Store) => {
    return supabaseSaver('stores', store);
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('stores', id);
  }, 
  uploadStoreImage: async (file: File) => {
    const fileName = generateSafeFileName('store', file.name);
    const { data, error } = await supabase.storage.from('store-images').upload(fileName, file);
    if (error) throw error;
    if (data) {
      const { data: urlData } = supabase.storage.from('store-images').getPublicUrl(fileName);
      return urlData.publicUrl;
    }
    return '';
  }, 
  saveBulk: async (stores: Store[]) => {
    const storesToInsert = stores.map(({ id, ...rest }) => rest);
    const { error } = await supabase.from('stores').insert(storesToInsert);
    if (error) throw error;
    return true;
  } 
};

export const CommonCodeAPI = { 
  getList: async (params?: { groupName?: string, name?: string }) => {
    return supabaseReader<CommonCode>('common_codes', params as any, ['groupName', 'name', 'code']);
  }, 
  save: async (code: CommonCode) => {
    return supabaseSaver('common_codes', code);
  }, 
  saveBulk: async (codes: CommonCode[]) => {
    const dataToInsert = codes.map(({ id, ...rest }) => rest);
    const { error } = await supabase.from('common_codes').insert(dataToInsert);
    if (error) throw error;
    return true;
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('common_codes', id);
  } 
};

export const WorkLogAPI = { 
  getList: async (params?: { marketName?: string }) => {
    try {
      let query = supabase.from('work_logs').select('*, markets(name)').order('workDate', { ascending: false });
      
      const { data, error } = await query;
      
      if (!error && data) {
        let result = data.map((log: any) => ({
          ...log,
          marketName: log.markets?.name || 'Unknown'
        }));
        if (params?.marketName) {
            result = result.filter((l: any) => l.marketName.includes(params.marketName));
        }
        return result as WorkLog[];
      }
      return [];
    } catch(e) {
      return [];
    }
  }, 
  save: async (log: WorkLog) => {
    const { marketName, ...saveData } = log;
    return supabaseSaver('work_logs', saveData as WorkLog);
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('work_logs', id);
  }, 
  uploadAttachment: async (file: File) => {
    const fileName = generateSafeFileName('log', file.name);
    const { data, error } = await supabase.storage.from('work-log-images').upload(fileName, file);
    if (error) throw error;
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
      if (params?.emergencyPhone) query = query.ilike('emergencyPhone', `%${params.emergencyPhone}%`);
      
      const { data, error } = await query;
      if (!error && data) {
        let result = data.map((r: any) => ({ ...r, marketName: r.markets?.name }));
        if (params?.marketName) {
            result = result.filter(r => r.marketName?.includes(params.marketName));
        }
        return result as Receiver[];
      }
      return [];
    } catch(e) { return []; }
  }, 
  save: async (receiver: Receiver) => {
    const { marketName, ...saveData } = receiver;
    return supabaseSaver('receivers', saveData as Receiver);
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('receivers', id);
  }, 
  uploadImage: async (file: File) => {
    const fileName = generateSafeFileName('rcv', file.name);
    const { data, error } = await supabase.storage.from('receiver-images').upload(fileName, file);
    if (error) throw error;
    if (data) {
      const { data: urlData } = supabase.storage.from('receiver-images').getPublicUrl(fileName);
      return urlData.publicUrl;
    }
    return '';
  }, 
  saveBulk: async (data: Receiver[]) => {
    const insertData = data.map(({ id, marketName, ...rest }) => rest);
    const { error } = await supabase.from('receivers').insert(insertData);
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
      return [];
    } catch(e) { return []; }
  }, 
  save: async (repeater: Repeater) => {
    const { marketName, ...saveData } = repeater;
    return supabaseSaver('repeaters', saveData as Repeater);
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('repeaters', id);
  }, 
  uploadImage: async (file: File) => {
    const fileName = generateSafeFileName('rpt', file.name);
    const { data, error } = await supabase.storage.from('repeater-images').upload(fileName, file);
    if (error) throw error;
    if (data) {
      const { data: urlData } = supabase.storage.from('repeater-images').getPublicUrl(fileName);
      return urlData.publicUrl;
    }
    return '';
  }, 
  saveBulk: async (data: Repeater[]) => {
    const insertData = data.map(({ id, marketName, ...rest }) => rest);
    const { error } = await supabase.from('repeaters').insert(insertData);
    if (error) throw error;
    return true;
  } 
};

export const DetectorAPI = { 
  getList: async (params?: any) => {
    try {
      let query = supabase.from('detectors').select('*, markets(name)').order('id', { ascending: false });
      if (params?.receiverMac) query = query.ilike('receiverMac', `%${params.receiverMac}%`);
      
      const { data: detectors, error } = await query;
      if (error || !detectors) return [];

      const detectorIds = detectors.map(d => d.id);
      const { data: junctions } = await supabase
        .from('detector_stores')
        .select('detectorId, storeId, stores(name)')
        .in('detectorId', detectorIds);

      let result = detectors.map((d: any) => {
        const myJunctions = junctions?.filter((j: any) => j.detectorId === d.id) || [];
        const stores = myJunctions.map((j: any) => ({ id: j.storeId, name: j.stores?.name }));
        
        return {
            ...d,
            marketName: d.markets?.name,
            stores: stores
        };
      });

      if (params?.marketName) result = result.filter(r => r.marketName?.includes(params.marketName));
      return result as Detector[];
    } catch(e) { return []; }
  }, 
  save: async (detector: Detector) => {
    const { marketName, stores, ...saveData } = detector;
    
    const savedDetector = await supabaseSaver('detectors', saveData as Detector);
    const savedId = savedDetector.id;

    await supabase.from('detector_stores').delete().eq('detectorId', savedId);
    
    if (stores && stores.length > 0) {
        const junctions = stores.map(s => ({ detectorId: savedId, storeId: s.id }));
        const { error } = await supabase.from('detector_stores').insert(junctions);
        if (error) throw new Error('상가 연결 저장 실패: ' + error.message);
    }
    
    return savedDetector;
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('detectors', id);
  }, 
  saveBulk: async (data: Detector[]) => {
    const insertData = data.map(({ id, marketName, stores, ...rest }) => rest);
    const { error } = await supabase.from('detectors').insert(insertData);
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
    return supabaseSaver('transmitters', saveData as Transmitter);
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('transmitters', id);
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
    return supabaseSaver('alarms', saveData as Alarm);
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('alarms', id);
  } 
};

// --- Log & Data APIs ---

export const FireHistoryAPI = { 
  getList: async (params?: { startDate?: string, endDate?: string, marketName?: string, status?: string }) => {
    let query = supabase.from('fire_history').select('*').order('registeredAt', { ascending: false });
    
    if (params?.startDate) query = query.gte('registeredAt', `${params.startDate}T00:00:00`);
    if (params?.endDate) query = query.lte('registeredAt', `${params.endDate}T23:59:59`);
    if (params?.marketName) query = query.ilike('marketName', `%${params.marketName}%`);
    if (params?.status && params.status !== 'all') {
        if (params.status === 'fire') query = query.eq('falseAlarmStatus', '화재');
        else if (params.status === 'false') query = query.eq('falseAlarmStatus', '오탐');
    }

    const { data, error } = await query;
    if (error) {
        console.warn(error);
        return [];
    }
    return data as FireHistoryItem[];
  }, 
  save: async (id: number, type: string, note: string) => {
    const { error } = await supabase.from('fire_history').update({ falseAlarmStatus: type, note }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('fire_history', id);
  } 
};

export const DeviceStatusAPI = { 
  getList: async (params?: { startDate?: string, endDate?: string, marketName?: string, status?: string }) => {
    let query = supabase.from('device_status').select('*').order('registeredAt', { ascending: false });
    
    if (params?.startDate) query = query.gte('registeredAt', `${params.startDate}T00:00:00`);
    if (params?.endDate) query = query.lte('registeredAt', `${params.endDate}T23:59:59`);
    if (params?.marketName) query = query.ilike('marketName', `%${params.marketName}%`);
    if (params?.status && params.status !== 'all') {
        if (params.status === 'processed') query = query.eq('processStatus', '처리');
        else if (params.status === 'unprocessed') query = query.eq('processStatus', '미처리');
    }

    const { data } = await query;
    return (data || []) as DeviceStatusItem[];
  }, 
  save: async (id: number, status: string, note: string) => {
    const { error } = await supabase.from('device_status').update({ processStatus: status, note }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('device_status', id);
  } 
};

export const DataReceptionAPI = { 
  getList: async (params?: { startDate?: string, endDate?: string, marketName?: string }) => {
    let query = supabase.from('data_reception').select('*').order('registeredAt', { ascending: false });
    
    if (params?.startDate) query = query.gte('registeredAt', `${params.startDate}T00:00:00`);
    if (params?.endDate) query = query.lte('registeredAt', `${params.endDate}T23:59:59`);
    if (params?.marketName) query = query.ilike('marketName', `%${params.marketName}%`);

    const { data } = await query;
    return (data || []) as DataReceptionItem[];
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('data_reception', id);
  } 
};

export const MenuAPI = { 
  getAll: async () => {
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .order('sortOrder', { ascending: true });
    
    if (error || !data || data.length === 0) {
      return []; // Return empty if error or no data
    }
    return data as MenuItemDB[];
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

  updateVisibilities: async (updates: any) => {
    const { error } = await supabase.from('menus').upsert(updates);
    if (error) throw new Error(error.message);
    return true;
  }, 
  save: async (m: MenuItemDB) => {
    return supabaseSaver('menus', m);
  }, 
  delete: async (id: number) => {
    return supabaseDeleter('menus', id);
  } 
};

export const DashboardAPI = { 
    getData: async () => {
        try {
            const { data: fireLogs, count: fireCount } = await supabase
                .from('fire_history')
                .select('*', { count: 'exact' })
                .eq('falseAlarmStatus', '등록')
                .order('registeredAt', { ascending: false })
                .limit(20);

            const { data: faultLogs, count: faultCount } = await supabase
                .from('device_status')
                .select('*', { count: 'exact' })
                .eq('deviceStatus', '에러')
                .neq('errorCode', '04')
                .order('registeredAt', { ascending: false })
                .limit(20);

            const { data: commLogs, count: commCount } = await supabase
                .from('device_status')
                .select('*', { count: 'exact' })
                .eq('errorCode', '04')
                .order('registeredAt', { ascending: false })
                .limit(20);

            return {
                stats: [
                    { label: '최근 화재 발생', value: fireCount || 0, type: 'fire', color: 'bg-red-600' },
                    { label: '최근 고장 발생', value: faultCount || 0, type: 'fault', color: 'bg-orange-500' },
                    { label: '통신 이상', value: commCount || 0, type: 'error', color: 'bg-slate-600' },
                ],
                fireEvents: (fireLogs || []).map((l: any) => ({
                    id: l.id,
                    msg: `${l.marketName} - ${l.detectorInfoChamber || '화재감지'}`,
                    time: l.registeredAt,
                    marketName: l.marketName,
                    type: 'fire'
                })),
                faultEvents: (faultLogs || []).map((l: any) => ({
                    id: l.id,
                    msg: `${l.marketName} ${l.deviceType} ${l.deviceId} 에러`,
                    time: l.registeredAt,
                    marketName: l.marketName,
                    type: 'fault'
                })),
                commEvents: (commLogs || []).map((l: any) => ({
                    id: l.id,
                    market: l.marketName,
                    address: `${l.deviceType} ${l.deviceId}`,
                    receiver: l.receiverMac,
                    time: l.registeredAt
                })),
            };
        } catch (e) {
            console.error("Dashboard Load Error:", e);
            return {
                stats: [], fireEvents: [], faultEvents: [], commEvents: []
            };
        }
    } 
};