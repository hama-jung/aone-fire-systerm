import { supabase } from '../lib/supabaseClient';
import { User, RoleItem, Market, Distributor } from '../types';

/**
 * [Supabase 연동 완료]
 * 이제 메모리(MOCK) 데이터 대신 실제 Supabase DB와 통신합니다.
 * UI 코드는 변경할 필요가 없습니다.
 */

// --- Helper: 에러 처리 ---
const handleError = (error: any) => {
  console.error("Supabase Error:", error);
  throw new Error(error.message || "데이터 처리 중 오류가 발생했습니다.");
};

// --- Helper: Market Data Mapping (CamelCase <-> SnakeCase) ---
// DB는 보통 snake_case를 사용하고, Frontend는 camelCase를 사용하므로 변환이 필요합니다.
// 기존 필드(managerName 등)가 camelCase로 되어 있는 경우를 대비해 혼용을 방지합니다.
// 여기서는 '새로 추가된 필드' 위주로 snake_case 매핑을 적용하고, 
// 기존 필드(managerName 등)는 기존 DB 스키마가 camelCase일 가능성을 염두에 둡니다.
// 단, 오류가 발생한 distributorId는 distributor_id로 매핑합니다.

const marketToDB = (market: Market) => {
  // DB에 보낼 때는 snake_case로 변환 (필요한 필드만)
  const { 
    distributorId, managerEmail, enableMarketSms, enableStoreSms, 
    enableMultiMedia, multiMediaType, usageStatus, enableDeviceFaultSms, 
    enableCctvUrl, smsFire, smsFault, mapImage, 
    addressDetail, zipCode,
    ...rest 
  } = market;

  return {
    ...rest,
    distributor_id: distributorId,         // distributorId -> distributor_id
    manager_email: managerEmail,           // managerEmail -> manager_email
    address_detail: addressDetail,         // addressDetail -> address_detail
    zip_code: zipCode,                     // zipCode -> zip_code
    enable_market_sms: enableMarketSms,
    enable_store_sms: enableStoreSms,
    enable_multi_media: enableMultiMedia,
    multi_media_type: multiMediaType,
    usage_status: usageStatus,
    enable_device_fault_sms: enableDeviceFaultSms,
    enable_cctv_url: enableCctvUrl,
    sms_fire: smsFire,
    sms_fault: smsFault,
    map_image: mapImage,
    // 기존 managerName, managerPhone 등은 DB 스키마에 따라 camelCase 유지 가능성 있음.
    // 만약 DB도 전부 snake_case라면 여기서 manager_name: market.managerName 등으로 추가 매핑 필요.
    // 현재는 에러가 난 distributorId 위주로 처리.
  };
};

const dbToMarket = (dbRow: any): Market => {
  // DB에서 받을 때는 camelCase로 복원
  return {
    ...dbRow,
    distributorId: dbRow.distributor_id || dbRow.distributorId,
    managerEmail: dbRow.manager_email || dbRow.managerEmail,
    addressDetail: dbRow.address_detail || dbRow.addressDetail,
    zipCode: dbRow.zip_code || dbRow.zipCode,
    enableMarketSms: dbRow.enable_market_sms || dbRow.enableMarketSms,
    enableStoreSms: dbRow.enable_store_sms || dbRow.enableStoreSms,
    enableMultiMedia: dbRow.enable_multi_media || dbRow.enableMultiMedia,
    multiMediaType: dbRow.multi_media_type || dbRow.multiMediaType,
    usageStatus: dbRow.usage_status || dbRow.usageStatus,
    enableDeviceFaultSms: dbRow.enable_device_fault_sms || dbRow.enableDeviceFaultSms,
    enableCctvUrl: dbRow.enable_cctv_url || dbRow.enableCctvUrl,
    smsFire: dbRow.sms_fire || dbRow.smsFire,
    smsFault: dbRow.sms_fault || dbRow.smsFault,
    mapImage: dbRow.map_image || dbRow.mapImage,
  };
};

// --- API Services ---

export const AuthAPI = {
  login: async (id: string, pw: string) => {
    // 1. users 테이블에서 매칭되는 사용자 조회
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('userId', id) 
      .eq('password', pw)
      .single();

    if (error || !data) {
      throw new Error('아이디나 비밀번호가 틀립니다.');
    }

    if (data.status !== '사용') {
      throw new Error('사용 중지된 계정입니다. 관리자에게 문의하세요.');
    }

    const { password, ...userInfo } = data;
    return {
      success: true,
      token: 'supabase-session-token',
      user: userInfo
    };
  },

  changePassword: async (userId: string, currentPw: string, newPw: string) => {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password')
      .eq('userId', userId)
      .single();

    if (fetchError || !user) throw new Error('사용자를 찾을 수 없습니다.');
    if (user.password !== currentPw) throw new Error('현재 비밀번호가 일치하지 않습니다.');

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPw })
      .eq('userId', userId);

    if (updateError) handleError(updateError);
    return { success: true };
  }
};

export const RoleAPI = {
  getList: async (params?: { code?: string, name?: string }) => {
    let query = supabase.from('roles').select('*').order('id', { ascending: true });

    if (params?.code) query = query.ilike('code', `%${params.code}%`);
    if (params?.name) query = query.ilike('name', `%${params.name}%`);

    const { data, error } = await query;
    if (error) handleError(error);
    return data || [];
  },

  save: async (role: RoleItem) => {
    if (role.id === 0) {
      const { id, ...newRole } = role;
      const { data, error } = await supabase.from('roles').insert(newRole).select().single();
      if (error) handleError(error);
      return data;
    } else {
      const { data, error } = await supabase.from('roles').update(role).eq('id', role.id).select().single();
      if (error) handleError(error);
      return data;
    }
  },

  delete: async (id: number) => {
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) handleError(error);
    return true;
  }
};

export const CommonAPI = {
  getCompanyList: async (searchName?: string) => {
    const [distRes, marketRes] = await Promise.all([
      supabase.from('distributors').select('id, name, managerName, managerPhone'),
      supabase.from('markets').select('id, name, managerName, managerPhone')
    ]);

    if (distRes.error) handleError(distRes.error);
    if (marketRes.error) handleError(marketRes.error);

    const distributors = (distRes.data || []).map(d => ({
      id: `D_${d.id}`,
      name: d.name,
      type: '총판',
      manager: d.managerName,
      phone: d.managerPhone
    }));

    const markets = (marketRes.data || []).map(m => ({
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

    return all;
  }
};

export const UserAPI = {
  getList: async (params?: { userId?: string, name?: string, role?: string, department?: string }) => {
    let query = supabase.from('users').select('*').order('id', { ascending: false });

    if (params?.userId) query = query.ilike('userId', `%${params.userId}%`);
    if (params?.name) query = query.ilike('name', `%${params.name}%`);
    if (params?.role && params.role !== '전체') query = query.eq('role', params.role);
    if (params?.department) query = query.ilike('department', `%${params.department}%`);

    const { data, error } = await query;
    if (error) handleError(error);
    return data || [];
  },

  checkDuplicate: async (userId: string) => {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId);
    
    if (error) handleError(error);
    return (count || 0) > 0;
  },

  save: async (user: User) => {
    if (user.id === 0) {
      const { id, ...newUser } = user;
      const { data, error } = await supabase.from('users').insert(newUser).select().single();
      if (error) handleError(error);
      return data;
    } else {
      const { data, error } = await supabase.from('users').update(user).eq('id', user.id).select().single();
      if (error) handleError(error);
      return data;
    }
  },

  delete: async (id: number) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) handleError(error);
    return true;
  }
};

export const MarketAPI = {
  getList: async (params?: { name?: string, address?: string, managerName?: string }) => {
    let query = supabase.from('markets').select('*').order('id', { ascending: false });

    // 검색 조건 (DB 컬럼명이 snake_case일 수도 있고 camelCase일 수도 있음. 
    // 기존 코드가 camelCase였으므로 그대로 유지하되, 필요시 DB 컬럼명 확인 필요)
    if (params?.name) query = query.ilike('name', `%${params.name}%`);
    if (params?.address) query = query.ilike('address', `%${params.address}%`);
    if (params?.managerName) query = query.ilike('managerName', `%${params.managerName}%`);

    const { data, error } = await query;
    if (error) handleError(error);

    // DB 데이터를 프론트엔드 포맷으로 변환
    return (data || []).map(dbToMarket);
  },

  save: async (market: Market) => {
    // 프론트엔드 데이터를 DB 포맷(snake_case)으로 변환
    const dbPayload = marketToDB(market);

    if (market.id === 0) {
      // id 제외하고 insert
      const { id, ...newMarket } = dbPayload;
      const { data, error } = await supabase.from('markets').insert(newMarket).select().single();
      if (error) handleError(error);
      return dbToMarket(data);
    } else {
      const { data, error } = await supabase.from('markets').update(dbPayload).eq('id', market.id).select().single();
      if (error) handleError(error);
      return dbToMarket(data);
    }
  },

  delete: async (id: number) => {
    const { error } = await supabase.from('markets').delete().eq('id', id);
    if (error) handleError(error);
    return true;
  }
};

export const DistributorAPI = {
  getList: async (params?: { address?: string, name?: string, managerName?: string }) => {
    let query = supabase.from('distributors').select('*').order('id', { ascending: false });

    if (params?.address && params.address !== '전체') query = query.ilike('address', `%${params.address}%`);
    if (params?.name) query = query.ilike('name', `%${params.name}%`);
    if (params?.managerName) query = query.ilike('managerName', `%${params.managerName}%`);

    const { data, error } = await query;
    if (error) handleError(error);
    return data || [];
  },

  save: async (dist: Distributor) => {
    if (dist.id === 0) {
      const { id, ...newDist } = dist;
      const { data, error } = await supabase.from('distributors').insert(newDist).select().single();
      if (error) handleError(error);
      return data;
    } else {
      const { data, error } = await supabase.from('distributors').update(dist).eq('id', dist.id).select().single();
      if (error) handleError(error);
      return data;
    }
  },

  delete: async (id: number) => {
    const { error } = await supabase.from('distributors').delete().eq('id', id);
    if (error) handleError(error);
    return true;
  }
};

export const DashboardAPI = {
  getData: async () => {
    const [fireRes, faultRes] = await Promise.all([
      supabase.from('fire_events').select('*', { count: 'exact', head: true }).eq('type', 'fire'),
      supabase.from('fire_events').select('*', { count: 'exact', head: true }).eq('type', 'fault'),
    ]);

    const fireCount = fireRes.count || 0;
    const faultCount = faultRes.count || 0;

    const { data: logs } = await supabase
      .from('fire_events')
      .select('*')
      .order('time', { ascending: false })
      .limit(5);

    const fireLogs = (logs || []).filter(l => l.type === 'fire');
    const faultLogs = (logs || []).filter(l => l.type === 'fault');

    const mapPoints = [
      { id: 1, x: 30, y: 40, name: '서울/경기', status: 'normal' },
      { id: 2, x: 60, y: 50, name: '경상북도', status: fireCount > 0 ? 'fire' : 'normal' },
      { id: 3, x: 40, y: 70, name: '전라북도', status: 'normal' },
    ];

    return {
      stats: [
        { label: '최근 화재 발생', value: fireCount, type: 'fire', color: 'bg-red-500' },
        { label: '최근 고장 발생', value: faultCount, type: 'fault', color: 'bg-orange-500' },
        { label: '통신 이상', value: 0, type: 'error', color: 'bg-gray-500' },
      ],
      fireLogs: fireLogs,
      faultLogs: faultLogs,
      mapPoints: mapPoints
    };
  }
};