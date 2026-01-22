import React, { useState, useEffect } from 'react';
import { 
  PageHeader, SearchFilterBar, InputGroup, SelectGroup, AddressInput,
  Button, DataTable, Pagination, ActionBar, FormSection, FormRow, Column, UI_STYLES,
  formatPhoneNumber, handlePhoneKeyDown, StatusBadge
} from '../components/CommonUI';
import { Distributor } from '../types';
import { DistributorAPI } from '../services/api';
import { exportToExcel } from '../utils/excel';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 10;

export const DistributorManagement: React.FC = () => {
  const [view, setView] = useState<'list' | 'form' | 'excel'>('list');
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [loading, setLoading] = useState(false);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);

  // 검색 상태
  const [searchAddress, setSearchAddress] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchManager, setSearchManager] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);

  // 폼 상태 (전체 객체로 관리)
  const [formData, setFormData] = useState<Partial<Distributor>>({});
  
  // 관리 시장 목록 (수정 모드 전용 - Read Only)
  const [managedMarkets, setManagedMarkets] = useState<string[]>([]);

  // -- Data Fetching --
  const fetchData = async (overrides?: { address?: string, name?: string, managerName?: string }) => {
    setLoading(true);
    try {
      const query = {
        address: overrides?.address !== undefined ? overrides.address : searchAddress,
        name: overrides?.name !== undefined ? overrides.name : searchName,
        managerName: overrides?.managerName !== undefined ? overrides.managerName : searchManager
      };
      const data = await DistributorAPI.getList(query);
      setDistributors(data);
      setCurrentPage(1);
    } catch (e) {
      alert('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -- Handlers --
  const handleSearch = () => {
    setIsFiltered(true);
    fetchData();
  };

  const handleReset = () => {
    setSearchAddress('');
    setSearchName('');
    setSearchManager('');
    setIsFiltered(false);
    fetchData({ address: '', name: '', managerName: '' });
  };

  const handleRegister = () => {
    setSelectedDistributor(null);
    setFormData({ status: '사용', address: '', addressDetail: '' }); 
    setManagedMarkets([]);
    setView('form');
  };

  const handleEdit = (dist: Distributor) => {
    setSelectedDistributor(dist);
    setFormData({ ...dist });
    // 관리 시장 목록은 DB에서 불러온 값을 그대로 표시 (수정 불가)
    setManagedMarkets(dist.managedMarkets || []);
    setView('form');
  };

  const handleExcel = () => {
    const excelData = distributors.map((d, index) => ({
      'No': index + 1,
      '총판명': d.name,
      '담당자명': d.managerName,
      '담당자전화': d.managerPhone,
      'E-mail': d.managerEmail,
      '주소': `${d.address} ${d.addressDetail}`,
      '관리시장': (d.managedMarkets || []).join(', '),
      '메모': d.memo,
      '상태': d.status
    }));
    exportToExcel(excelData, '총판관리_목록');
  };

  const handleDelete = async () => {
    if (selectedDistributor && confirm('정말 삭제하시겠습니까?')) {
      try {
        await DistributorAPI.delete(selectedDistributor.id);
        alert('삭제되었습니다.');
        setView('list');
        fetchData();
      } catch (e) {
        alert('삭제 실패');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
        alert('총판명을 입력해주세요.');
        return;
    }
    
    // managedMarkets는 Form에서 수정하지 않고, DB의 상태를 유지하거나 API에서 재동기화됨
    const newDist: Distributor = {
      id: selectedDistributor?.id || 0,
      name: formData.name!,
      address: formData.address || '',
      addressDetail: formData.addressDetail || '',
      latitude: formData.latitude || '',
      longitude: formData.longitude || '',
      managerName: formData.managerName || '',
      managerPhone: formData.managerPhone || '',
      managerEmail: formData.managerEmail || '',
      memo: formData.memo || '',
      status: formData.status as '사용' | '미사용',
      managedMarkets: managedMarkets // 기존 값 유지 (API에서 실제 관계 기준으로 덮어쓸 수 있음)
    };

    try {
      await DistributorAPI.save(newDist);
      alert('저장되었습니다.');
      setView('list');
      fetchData();
    } catch (e) {
      alert('저장 실패');
    }
  };

  const handleCancel = () => { setView('list'); };

  // -- Pagination Logic --
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = distributors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(distributors.length / ITEMS_PER_PAGE);

  // -- Table Columns --
  const columns: Column<Distributor>[] = [
    { header: 'No', accessor: 'id', width: '60px' },
    { header: '총판명', accessor: 'name' },
    { header: '담당자명', accessor: 'managerName' },
    { header: '담당자전화', accessor: (d) => formatPhoneNumber(d.managerPhone) || '-' },
    { header: '관리시장수', accessor: (d) => `${(d.managedMarkets || []).length} 개`, width: '100px' },
    { header: '주소', accessor: (d) => `${d.address} ${d.addressDetail}` },
    { header: '상태', accessor: (d) => <StatusBadge status={d.status} />, width: '80px' }
  ];

  // -- Views --
  if (view === 'form') {
    return (
      <>
        <PageHeader title="총판 관리" />
        <form onSubmit={handleSave}>
          <FormSection title={selectedDistributor ? "총판 수정" : "총판 등록"}>
              {/* 총판명 (Full Width) - 필수 */}
              <FormRow label="총판" required className="col-span-1 md:col-span-2">
                <InputGroup 
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="총판명을 입력하세요"
                />
              </FormRow>

              {/* 주소 (AddressInput) */}
              <div className="col-span-1 md:col-span-2">
                  <AddressInput 
                     label="주소"
                     required
                     address={formData.address || ''}
                     addressDetail={formData.addressDetail || ''}
                     onAddressChange={(val) => setFormData({...formData, address: val})}
                     onDetailChange={(val) => setFormData({...formData, addressDetail: val})}
                     onCoordinateChange={(lat, lng) => setFormData(prev => ({...prev, latitude: lat, longitude: lng}))}
                  />
              </div>

              {/* 위도 */}
              <FormRow label="위도">
                  <InputGroup 
                      value={formData.latitude || ''} 
                      onChange={e => setFormData({...formData, latitude: e.target.value})}
                  />
              </FormRow>

              {/* 경도 */}
              <FormRow label="경도">
                  <InputGroup 
                      value={formData.longitude || ''} 
                      onChange={e => setFormData({...formData, longitude: e.target.value})}
                  />
              </FormRow>

              {/* 담당자 */}
              <FormRow label="담당자">
                  <InputGroup 
                      value={formData.managerName || ''} 
                      onChange={e => setFormData({...formData, managerName: e.target.value})}
                  />
              </FormRow>

              {/* 담당자 전화 */}
              <FormRow label="담당자 전화">
                  <InputGroup 
                      value={formData.managerPhone || ''} 
                      onChange={e => setFormData({...formData, managerPhone: e.target.value.replace(/[^0-9]/g, '')})}
                      onKeyDown={handlePhoneKeyDown}
                      inputMode="numeric"
                      placeholder="숫자만 입력하세요"
                      maxLength={11}
                  />
              </FormRow>

              {/* 담당자 E-mail */}
              <FormRow label="담당자 E-mail">
                  <InputGroup 
                      value={formData.managerEmail || ''} 
                      onChange={e => setFormData({...formData, managerEmail: e.target.value})}
                  />
              </FormRow>

              {/* 비고 */}
              <FormRow label="비고">
                  <InputGroup 
                      value={formData.memo || ''} 
                      onChange={e => setFormData({...formData, memo: e.target.value})}
                  />
              </FormRow>

              {/* 총판 사용여부 (Full Width) */}
              <FormRow label="총판 사용여부" required className="col-span-1 md:col-span-2">
                <div className={`${UI_STYLES.input} flex gap-4 text-slate-300 items-center`}>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input 
                        type="radio" name="status" value="사용" 
                        checked={formData.status === '사용'} 
                        onChange={() => setFormData({...formData, status: '사용'})}
                        className="accent-blue-500" 
                    />
                    <span>사용</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input 
                        type="radio" name="status" value="미사용" 
                        checked={formData.status === '미사용'} 
                        onChange={() => setFormData({...formData, status: '미사용'})}
                        className="accent-blue-500" 
                    />
                    <span>미사용</span>
                  </label>
                </div>
              </FormRow>

              {/* 관리 시장 (Full Width, 수정 모드일 때만 표시, 자동 연동) */}
              {selectedDistributor && (
                  <FormRow label="관리 시장" className="col-span-1 md:col-span-2">
                      <div className="flex flex-col gap-2 w-full">
                          <div className="text-xs text-blue-400 mb-1">
                              * 관리 시장은 '시장 관리' 메뉴에서 해당 총판을 선택하여 등록/수정하면 자동으로 연동됩니다.
                          </div>
                          <div className="border border-slate-600 bg-slate-800 rounded h-40 overflow-y-auto custom-scrollbar p-2">
                              {managedMarkets.length === 0 && (
                                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                      등록된 관리 시장이 없습니다.
                                  </div>
                              )}
                              <ul className="p-0 m-0 list-none space-y-1">
                                  {managedMarkets.map((marketName, idx) => (
                                      <li 
                                        key={idx}
                                        className="flex items-center px-3 py-2 bg-slate-700/30 rounded border border-slate-700/50"
                                      >
                                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                                          <span className="text-slate-200 text-sm font-medium">{marketName}</span>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      </div>
                  </FormRow>
              )}
          </FormSection>

          {/* 하단 버튼 */}
          <div className="flex justify-center gap-3 mt-8 border-t border-slate-700 pt-6">
             {selectedDistributor ? (
                 <>
                    <Button type="submit" variant="primary" className="w-32">수정</Button>
                    <Button type="button" variant="danger" onClick={handleDelete} className="w-32">삭제</Button>
                 </>
             ) : (
                <Button type="submit" variant="primary" className="w-32">신규등록</Button>
             )}
             <Button type="button" variant="secondary" onClick={handleCancel} className="w-32">취소</Button>
          </div>
        </form>
      </>
    );
  }

  // --- View: List ---
  // ... (Excel Upload View & List View remain largely the same, kept simple for brevity)
  return (
    <>
      <PageHeader title="총판 관리" />
      
      <SearchFilterBar onSearch={handleSearch} onReset={handleReset} isFiltered={isFiltered}>
        <InputGroup 
            label="주소" 
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
        />
        <InputGroup 
            label="총판" 
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
        />
        <InputGroup 
            label="담당자" 
            value={searchManager}
            onChange={(e) => setSearchManager(e.target.value)}
        />
      </SearchFilterBar>

      <div className="flex justify-between items-center mb-2">
         <span className="text-sm text-slate-400">
           전체 <strong className="text-blue-400">{distributors.length}</strong> 건 
           (페이지 {currentPage}/{totalPages || 1})
         </span>
         <ActionBar onRegister={handleRegister} onExcel={handleExcel} />
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading...</div>
      ) : (
        <DataTable columns={columns} data={currentItems} onRowClick={handleEdit} />
      )}
      
      <Pagination 
        totalItems={distributors.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </>
  );
};