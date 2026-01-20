import React, { useState, useEffect } from 'react';
import { PageHeader, DataTable, Column, ActionBar, Modal, FormRow, InputGroup, SelectGroup, Button, UI_STYLES } from '../components/CommonUI';
import { MenuItemDB } from '../types';
import { MenuAPI } from '../services/api';
import { getIcon, ICON_KEYS } from '../utils/iconMapper';
import { Edit, Trash2 } from 'lucide-react';

export const MenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<MenuItemDB[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItemDB | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItemDB>>({});

  // Parent Menu Options
  const [parentOptions, setParentOptions] = useState<{value: string | number, label: string}[]>([]);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const data = await MenuAPI.getAll();
      setMenus(data);
      
      // 상위 메뉴 옵션 생성 (자기 자신 제외 로직은 모달 열 때 처리)
      const roots = data.filter(m => !m.parentId).map(m => ({ value: m.id, label: m.label }));
      setParentOptions([{ value: '', label: '최상위 메뉴 (Root)' }, ...roots]);

    } catch (e: any) {
      if (e.message && e.message.includes('Could not find the table')) {
         console.warn('DB 테이블(menus)이 존재하지 않습니다. SQL 스크립트를 실행해주세요.');
      } else {
         alert('메뉴 목록 로드 실패');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleToggle = async (id: number, field: 'isVisiblePc' | 'isVisibleMobile', currentValue: boolean) => {
    try {
      // Optimistic Update
      setMenus(prev => prev.map(m => m.id === id ? { ...m, [field]: !currentValue } : m));
      // API Call
      await MenuAPI.toggleVisibility(id, field, !currentValue);
    } catch (e) {
      alert('상태 변경 실패');
      fetchMenus(); // Revert on error
    }
  };

  // --- CRUD Handlers ---
  const handleRegister = () => {
    setSelectedMenu(null);
    setFormData({
      parentId: undefined,
      label: '',
      path: '',
      icon: '',
      sortOrder: (menus.length + 1) * 10,
      isVisiblePc: true,
      isVisibleMobile: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (menu: MenuItemDB) => {
    setSelectedMenu(menu);
    setFormData({ ...menu });
    setIsModalOpen(true);
  };

  const handleDelete = async (menu: MenuItemDB) => {
    if (confirm(`'${menu.label}' 메뉴를 정말 삭제하시겠습니까?`)) {
      try {
        await MenuAPI.delete(menu.id);
        alert('삭제되었습니다.');
        fetchMenus();
      } catch (e: any) {
        alert(`삭제 실패: ${e.message}`);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label) { alert('메뉴명을 입력해주세요.'); return; }

    try {
      const newMenu = {
        ...formData as MenuItemDB,
        id: selectedMenu?.id || 0,
        // parentId가 빈 문자열이면 undefined로 처리
        parentId: formData.parentId ? Number(formData.parentId) : undefined 
      };

      await MenuAPI.save(newMenu);
      alert('저장되었습니다.');
      setIsModalOpen(false);
      fetchMenus();
    } catch (e: any) {
      alert(`저장 실패: ${e.message}`);
    }
  };

  // Helper to visualize depth
  const getLabelWithDepth = (menu: MenuItemDB, allMenus: MenuItemDB[]) => {
    let depth = 0;
    let parent = allMenus.find(m => m.id === menu.parentId);
    while (parent) {
      depth++;
      parent = allMenus.find(m => m.id === parent?.parentId);
    }
    
    return (
      <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
        {depth === 0 && getIcon(menu.icon, 16)}
        {depth > 0 && <span className="text-slate-500">└</span>}
        <span>{menu.label}</span>
      </div>
    );
  };

  const columns: Column<MenuItemDB>[] = [
    { header: 'No', accessor: (_, idx) => idx + 1, width: '60px' },
    { 
      header: '메뉴명', 
      accessor: (item) => getLabelWithDepth(item, menus),
      width: '250px' 
    },
    { header: '경로', accessor: (item) => item.path || '-', width: '200px' },
    { header: '순서', accessor: 'sortOrder', width: '80px' },
    { 
      header: 'PC 노출', 
      accessor: (item) => (
        <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <input 
            type="checkbox" 
            checked={item.isVisiblePc} 
            onChange={() => handleToggle(item.id, 'isVisiblePc', item.isVisiblePc)}
            className="sr-only peer" 
          />
          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      ),
      width: '80px'
    },
    { 
      header: '모바일 노출', 
      accessor: (item) => (
        <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <input 
            type="checkbox" 
            checked={item.isVisibleMobile} 
            onChange={() => handleToggle(item.id, 'isVisibleMobile', item.isVisibleMobile)}
            className="sr-only peer" 
          />
          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      ),
      width: '80px'
    },
    {
      header: '관리',
      accessor: (item) => (
        <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
           <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-400 hover:bg-slate-700 rounded"><Edit size={16}/></button>
           <button onClick={() => handleDelete(item)} className="p-1.5 text-red-400 hover:bg-slate-700 rounded"><Trash2 size={16}/></button>
        </div>
      ),
      width: '100px'
    }
  ];

  return (
    <>
      <PageHeader title="메뉴 관리" />
      <div className="mb-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg text-sm text-blue-200 flex justify-between items-center">
        <div>
          💡 <strong>Tip:</strong> 메뉴 구조가 변경되어도 여기서 바로 추가/수정할 수 있습니다.
          <br/>
          (PC/모바일 노출 설정은 즉시 반영됩니다.)
        </div>
        <ActionBar onRegister={handleRegister} />
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading...</div>
      ) : (
        <DataTable columns={columns} data={menus} />
      )}

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedMenu ? "메뉴 수정" : "메뉴 등록"} 
        width="max-w-xl"
      >
         <form onSubmit={handleSave} className="flex flex-col gap-4">
            <FormRow label="상위 메뉴">
               <SelectGroup 
                  options={parentOptions.filter(opt => Number(opt.value) !== selectedMenu?.id)} // Prevent self-parenting
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({...formData, parentId: Number(e.target.value) || undefined})}
               />
            </FormRow>
            
            <div className="grid grid-cols-2 gap-4">
               <FormRow label="메뉴명" required>
                  <InputGroup 
                     value={formData.label || ''} 
                     onChange={(e) => setFormData({...formData, label: e.target.value})} 
                  />
               </FormRow>
               <FormRow label="순서 (정렬)">
                  <InputGroup 
                     type="number"
                     value={formData.sortOrder || 0} 
                     onChange={(e) => setFormData({...formData, sortOrder: Number(e.target.value)})} 
                  />
               </FormRow>
            </div>

            <FormRow label="경로 (URL)">
               <InputGroup 
                  value={formData.path || ''} 
                  onChange={(e) => setFormData({...formData, path: e.target.value})} 
                  placeholder="예: /users"
               />
            </FormRow>

            <FormRow label="아이콘">
               <div className="flex gap-2 items-center">
                  <div className="p-2 bg-slate-700 rounded border border-slate-600 text-white">
                     {getIcon(formData.icon, 20)}
                  </div>
                  <SelectGroup 
                     className="flex-1"
                     options={[{value: '', label: '선택 안함'}, ...ICON_KEYS.map(k => ({value: k, label: k}))]}
                     value={formData.icon || ''}
                     onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  />
               </div>
            </FormRow>

            <div className="grid grid-cols-2 gap-4 pt-2">
               <FormRow label="PC 노출">
                  <div className={`${UI_STYLES.input} flex items-center`}>
                     <input 
                        type="checkbox" 
                        checked={formData.isVisiblePc || false}
                        onChange={(e) => setFormData({...formData, isVisiblePc: e.target.checked})}
                        className="w-5 h-5 accent-blue-500 mr-2"
                     />
                     <span>보이기</span>
                  </div>
               </FormRow>
               <FormRow label="모바일 노출">
                  <div className={`${UI_STYLES.input} flex items-center`}>
                     <input 
                        type="checkbox" 
                        checked={formData.isVisibleMobile || false}
                        onChange={(e) => setFormData({...formData, isVisibleMobile: e.target.checked})}
                        className="w-5 h-5 accent-blue-500 mr-2"
                     />
                     <span>보이기</span>
                  </div>
               </FormRow>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700">
               <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>취소</Button>
               <Button type="submit" variant="primary">저장</Button>
            </div>
         </form>
      </Modal>
    </>
  );
};