import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, ChevronRight, LogOut, Menu, Bell, Key, HelpCircle, User
} from 'lucide-react';
import { MenuItemDB } from '../types';
import { Modal, InputGroup, Button } from './CommonUI';
import { AuthAPI, MenuAPI } from '../services/api';
import { getIcon } from '../utils/iconMapper';

// 비밀번호 정규식
const PW_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,12}$/;

const SidebarItem: React.FC<{ item: MenuItemDB; level?: number }> = ({ item, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  
  const isActive = item.path ? location.pathname === item.path : false;
  
  // 폰트 크기: text-[14px]
  const baseClasses = "w-full flex items-center gap-3 px-5 py-2.5 text-[14px] font-medium transition-all duration-200";

  if (hasChildren) {
    return (
      <div className="mb-1">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`${baseClasses} justify-between text-gray-300 hover:text-white hover:bg-[#3e4b61]`}
        >
          <div className="flex items-center gap-3">
            {getIcon(item.icon)}
            <span>{item.label}</span>
          </div>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {isOpen && (
          <div className="bg-[#232d3f] py-1">
            {item.children?.map((child, idx) => (
              <SidebarItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path || '#'}
      className={`
        ${baseClasses}
        ${level > 0 ? 'pl-12' : ''}
        ${isActive 
          ? 'bg-[#2563eb] text-white shadow-md'
          : 'text-gray-400 hover:text-white hover:bg-[#3e4b61]'}
      `}
    >
      {!level && getIcon(item.icon)}
      <span>{item.label}</span>
    </NavLink>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemDB[]>([]);
  
  // 비밀번호 변경 모달 상태
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });

  const [currentUser, setCurrentUser] = useState<{name: string, userId: string} | null>(null);

  // 화면 크기에 따른 모바일 여부 상태
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 메뉴 데이터 로드 함수
  const loadMenus = useCallback(async () => {
    try {
        const tree = await MenuAPI.getTree();
        setMenuItems(tree);
    } catch (e) {
        console.error("Failed to load menus");
    }
  }, []);

  useEffect(() => {
    // 1. 사용자 정보 로드
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to parse user info");
      }
    }

    // 2. 초기 메뉴 로드
    loadMenus();

    // 3. 메뉴 업데이트 이벤트 리스너 등록
    const handleMenuUpdate = () => loadMenus();
    window.addEventListener('menu-update', handleMenuUpdate);

    return () => {
      window.removeEventListener('menu-update', handleMenuUpdate);
    };
  }, [loadMenus]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleOpenPwModal = () => {
    setPwForm({ current: '', new: '', confirm: '' });
    setIsPwModalOpen(true);
  };

  const handlePwChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!pwForm.current || !pwForm.new || !pwForm.confirm) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    if (pwForm.new !== pwForm.confirm) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!PW_REGEX.test(pwForm.new)) {
      alert('비밀번호는 영문, 숫자, 특수문자 포함 6자 ~ 12자로 생성해 주세요.');
      return;
    }

    try {
      await AuthAPI.changePassword(currentUser.userId, pwForm.current, pwForm.new);
      alert('비밀번호가 성공적으로 변경되었습니다.\n새로운 비밀번호로 다시 로그인해주세요.');
      setIsPwModalOpen(false);
      handleLogout();
    } catch (e: any) {
      alert(e.message || '비밀번호 변경에 실패했습니다.');
    }
  };

  // --- Menu Filtering Logic ---
  // DB에서 가져온 트리 구조를 현재 뷰(PC/Mobile) 설정에 따라 필터링
  const getVisibleMenus = (menus: MenuItemDB[]): MenuItemDB[] => {
    return menus
      .filter(item => {
        // 1. 현재 뷰에 따라 노출 여부 확인
        if (isMobileView) return item.isVisibleMobile;
        return item.isVisiblePc;
      })
      .map(item => ({
        ...item,
        // 2. 자식 메뉴도 재귀적으로 필터링
        children: item.children ? getVisibleMenus(item.children) : undefined
      }))
      // 3. 자식이 모두 필터링되어 사라졌는데, 본인도 경로가 없는 폴더(Folder)라면 숨김 처리 (옵션)
      //    (현재는 폴더도 명시적으로 노출 설정되어 있으면 보이도록 유지)
  };

  const visibleMenuItems = getVisibleMenus(menuItems);

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden text-slate-200">
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-60 bg-[#2f3b52] text-white transform transition-transform duration-300 ease-in-out shadow-xl border-r border-slate-800
          lg:translate-x-0 lg:static lg:inset-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="h-20 flex flex-col justify-center px-5 bg-[#263245] shadow-sm border-b border-[#3e4b61]">
          <div className="text-[20px] font-black text-white tracking-wide leading-none mb-1">
            A-ONE 에이원
          </div>
          <div className="text-[12px] font-bold text-red-500 tracking-tight">
            화재감지 모니터링
          </div>
        </div>

        {/* Menu Area */}
        <div className="overflow-y-auto h-[calc(100vh-5rem)] custom-scrollbar py-3">
          <nav className="space-y-0.5">
            {visibleMenuItems.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-[#2f3b52] text-white shadow-md flex items-center justify-between px-4 lg:px-6 z-40 border-b border-[#1e293b]">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-gray-300 hover:bg-[#3e4b61] rounded-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={22} />
            </button>
            
            {/* Left Side: Fire Status Alert */}
            <div className="flex items-center gap-2 text-red-500 font-bold px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
               <Bell size={16} className="animate-pulse" />
               <span className="text-[13px] hidden sm:inline">현재 전국 화재 상황 (0건)</span>
               <span className="text-[13px] sm:hidden">화재 (0)</span>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2">
             {/* User Profile */}
             <div className="flex items-center gap-2 mr-3 px-3 py-1 rounded-full bg-[#3e4b61]/50 border border-[#4b5563]">
                <div className="p-1 bg-gray-600 rounded-full">
                  <User size={12} className="text-white" />
                </div>
                <span className="text-[13px] text-gray-200 hidden sm:inline">
                  {currentUser ? (
                    <>
                      <span className="font-bold text-white">{currentUser.name}</span> ({currentUser.userId})
                    </>
                  ) : (
                    <span className="font-bold text-white">Guest</span>
                  )}
                </span>
             </div>

             {/* Action Buttons (PC Only) */}
             <div className="hidden sm:flex items-center gap-2">
               <button 
                 onClick={handleOpenPwModal}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-600 hover:bg-[#3e4b61] text-gray-300 hover:text-white transition-colors text-[12px]"
               >
                 <Key size={12} />
                 <span>비밀번호 변경</span>
               </button>

               <button className="p-1.5 rounded-full hover:bg-[#3e4b61] text-gray-400 hover:text-white transition-colors">
                 <HelpCircle size={18} />
               </button>
             </div>

             <button 
               className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-600 hover:bg-[#3e4b61] text-gray-300 hover:text-white transition-colors text-[12px]"
               onClick={handleLogout}
             >
               <LogOut size={12} />
               <span className="hidden sm:inline">로그아웃</span>
             </button>
          </div>
        </header>

        {/* Content Body (Dark bg) - Added pb-24 for extra bottom space */}
        <main className="flex-1 overflow-auto py-5 px-4 md:px-[60px] pb-24 bg-[#0f172a] custom-scrollbar">
          <div className="w-full h-full flex flex-col max-w-[1920px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Password Change Modal */}
      {isPwModalOpen && (
        <Modal 
          isOpen={isPwModalOpen} 
          onClose={() => setIsPwModalOpen(false)}
          title="비밀번호 변경"
          icon={<Key size={20} className="text-blue-500" />}
        >
          <form onSubmit={handlePwChangeSubmit} className="flex flex-col gap-6">
            <div className="space-y-5">
              <InputGroup 
                label="현재 비밀번호" 
                type="password" 
                placeholder="현재 비밀번호 입력"
                value={pwForm.current}
                onChange={(e) => setPwForm({...pwForm, current: e.target.value})}
                inputClassName="!bg-slate-900 border-slate-600 focus:border-blue-500"
              />
              <InputGroup 
                label="새 비밀번호" 
                type="password" 
                placeholder="새 비밀번호 입력"
                value={pwForm.new}
                onChange={(e) => setPwForm({...pwForm, new: e.target.value})}
                inputClassName="!bg-slate-900 border-slate-600 focus:border-blue-500"
              />
              <div className="flex flex-col gap-1">
                <InputGroup 
                  label="새 비밀번호 확인" 
                  type="password" 
                  placeholder="새 비밀번호 다시 입력"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({...pwForm, confirm: e.target.value})}
                  inputClassName="!bg-slate-900 border-slate-600 focus:border-blue-500"
                />
                {pwForm.new && pwForm.confirm && pwForm.new !== pwForm.confirm && (
                    <p className="text-xs text-red-400 font-medium">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
               <Button type="submit" variant="primary" className="w-full py-2.5">
                 변경하기
               </Button>
               <Button 
                 type="button" 
                 variant="secondary" 
                 onClick={() => setIsPwModalOpen(false)} 
                 className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"
               >
                 취소
               </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};