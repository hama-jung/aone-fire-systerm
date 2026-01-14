import React from 'react';

// Role Enum은 레거시 호환을 위해 유지하되, 실제로는 string으로 처리됨
export enum Role {
  ADMIN = '관리자',
  DISTRIBUTOR = '총판관리자',
  MARKET = '시장관리자',
  STORE = '상가관리자'
}

export interface RoleItem {
  id: number;
  code: string; // 롤 코드 (예: 7777)
  name: string; // 롤 이름
  description: string; // 롤 설명
  status: '사용' | '미사용'; // 사용 여부
}

export interface User {
  id: number;
  userId: string;
  password?: string; // 비밀번호 필드 추가
  name: string;
  role: string; // Enum 대신 string으로 변경하여 동적 롤 지원
  phone: string;
  email?: string;
  department?: string;
  status: '사용' | '미사용';
  smsReceive?: '수신' | '미수신'; // SMS 수신 여부 추가
}

export interface Market {
  id: number;
  name: string;
  address: string;
  addressDetail?: string; // 상세주소 추가
  zipCode?: string; // 우편번호 추가
  managerName: string;
  managerPhone: string;
  status: 'Normal' | 'Fire' | 'Error';
}

export interface Distributor {
  id: number;
  name: string;           // 총판명
  address: string;        // 주소 (기본)
  addressDetail: string;  // 상세 주소 (5,7F 등)
  latitude: string;       // 위도
  longitude: string;      // 경도
  managerName: string;    // 담당자명
  managerPhone: string;   // 담당자 전화
  managerEmail: string;   // 담당자 이메일
  memo: string;           // 비고
  status: '사용' | '미사용';
  managedMarkets: string[]; // 관리 시장 목록 (이름)
}

export interface FireEvent {
  id: number;
  marketName: string;
  storeName: string;
  deviceType: string;
  timestamp: string;
  status: 'Fire' | 'Fault' | 'Recovered';
  location: string;
}

export interface MenuItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
}