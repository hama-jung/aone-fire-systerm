import React, { useState, useEffect } from 'react';
import { 
  PageHeader, SearchFilterBar, InputGroup, SelectGroup, Button, DataTable, 
  Pagination, FormSection, FormRow, Column, UI_STYLES,
  StatusBadge, StatusRadioGroup, ReceiverSearchModal
} from '../components/CommonUI';
import { Transmitter, Receiver } from '../types';
import { TransmitterAPI } from '../services/api';
import { Search } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

// ID Options (01 ~ 20)
const ID_OPTIONS = Array.from({ length: 20 }, (_, i) => {
  const val = String(i + 1).padStart(2, '0');
  return { value: val, label: val };
});

export const TransmitterManagement: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [transmitters, setTransmitters] = useState<Transmitter[]>([]);
  const [selectedTransmitter, setSelectedTransmitter] = useState<Transmitter | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Search Filters
  const [searchMarket, setSearchMarket] = useState('');
  const [searchReceiverMac, setSearchReceiverMac] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);

  // Form Data
  const [formData, setFormData] = useState<Partial<Transmitter>>({});
  
  // Common Modals
  const [isReceiverModalOpen, setIsReceiverModalOpen] = useState(false);

  // --- Data Fetching ---
  const fetchTransmitters = async (overrides?: any) => {
    setLoading(true);
    try {
      const query = {
        marketName: overrides?.marketName !== undefined ? overrides.marketName : searchMarket,
        receiverMac: overrides?.receiverMac !== undefined ? overrides.receiverMac : searchReceiverMac,
        usageStatus: overrides?.usageStatus !== undefined ? overrides.usageStatus : searchStatus,
      };
      const data = await TransmitterAPI.getList(query);
      setTransmitters(data);
      setCurrentPage(1);
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes('Could not find the table')) {
         console.warn('DB 테이블(transmitters)이 존재하지 않습니다. SQL 스크립트를 실행해주세요.');
      } else {
         alert('데이터 로드 실패: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransmitters();
  }, []);

  // --- Handlers: Search ---
  const handleSearch = () => {
    setIsFiltered(true);
    fetchTransmitters();
  };

  const handleReset = () => {
    setSearchMarket('');
    setSearchReceiverMac('');
    setSearchStatus('');
    setIsFiltered(false);
    fetchTransmitters({ marketName: '', receiverMac: '', usageStatus: '' });
  };

  // --- Handlers: List Actions ---
  const handleRegister = () => {
    setSelectedTransmitter(null);
    setFormData({ 
      repeaterId: '01', 
      transmitterId: '01',
      status: '사용', // unified name
      memo: ''
    });
    setView('form');
  };

  const handleEdit = (transmitter: Transmitter) => {
    setSelectedTransmitter(transmitter);
    setFormData({ ...transmitter });
    setView('form');
  };

  // --- Handlers: Form ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.marketId || !formData.receiverMac) { alert('R형 수신기를 선택해주세요.'); return; }
    if (!formData.repeaterId) { alert('중계기 ID를 선택해주세요.'); return; }
    if (!formData.transmitterId) { alert('발신기 ID를 선택해주세요.'); return; }

    try {
      const newTransmitter: Transmitter = {
        ...formData as Transmitter,
        id: selectedTransmitter?.id || 0,
      };

      await TransmitterAPI.save(newTransmitter);
      alert('저장되었습니다.');
      setView('list');
      fetchTransmitters();
    } catch (e: any) {
      alert(`저장 실패: ${e.message}`);
    }
  };

  const handleDelete = async () => {
    if (selectedTransmitter && confirm('정말 삭제하시겠습니까?')) {
        try {
            await TransmitterAPI.delete(selectedTransmitter.id);
            alert('삭제되었습니다.');
            setView('list');
            fetchTransmitters();
        } catch (e) {
            alert('삭제 실패');
        }
    }
  };

  // --- Receiver Search Modal Handlers ---
  const openReceiverModal = () => setIsReceiverModalOpen(true);

  const handleReceiverSelect = (r: Receiver) => {
    setFormData({ 
      ...formData, 
      marketId: r.marketId, 
      marketName: r.marketName,
      receiverMac: r.macAddress,
    });
    setIsReceiverModalOpen(false);
  };

  // --- Columns ---
  const columns: Column<Transmitter>[] = [
    { header: 'No', accessor: (_, idx) => idx + 1, width: '60px' },
    { header: '수신기 MAC', accessor: 'receiverMac', width: '150px' },
    { header: '중계기 ID', accessor: 'repeaterId', width: '100px' },
    { header: '발신기 ID', accessor: 'transmitterId', width: '100px' },
    { header: '설치시장', accessor: 'marketName' },
    { header: '사용여부', accessor: (item) => <StatusBadge status={item.status} />, width: '100px' },
  ];

  // Pagination logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = transmitters.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transmitters.length / ITEMS_PER_PAGE);

  // --- View: Form ---
  if (view === 'form') {
    return (
      <>
        <PageHeader title={selectedTransmitter ? "발신기 수정" : "발신기 등록"} />
        <form onSubmit={handleSave}>
          <FormSection title={selectedTransmitter ? "발신기 수정" : "발신기 등록"}>
            {/* R형 수신기 MAC (Search) */}
            <FormRow label="R형 수신기 MAC" required className="col-span-1 md:col-span-2">
              <div className="flex gap-2 w-full max-w-md">
                <div onClick={openReceiverModal} className="flex-1 relative cursor-pointer">
                  <input 
                    type="text"
                    value={formData.receiverMac || ''} 
                    placeholder="수신기를 선택하세요" 
                    readOnly 
                    className={`${UI_STYLES.input} cursor-pointer hover:bg-slate-700/50 pr-8`}
                  />
                  <Search className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                </div>
                <Button type="button" variant="secondary" onClick={openReceiverModal}>검색</Button>
              </div>
              {formData.marketName && <p className="text-xs text-blue-400 mt-1">소속 시장: {formData.marketName}</p>}
            </FormRow>

            {/* 중계기 ID */}
            <FormRow label="중계기 ID">
              <SelectGroup 
                options={ID_OPTIONS}
                value={formData.repeaterId || '01'}
                onChange={(e) => setFormData({...formData, repeaterId: e.target.value})}
              />
            </FormRow>

            {/* 발신기 ID (Prompt Request: Dropdown 01~20) */}
            <FormRow label="발신기 ID">
              <SelectGroup 
                options={ID_OPTIONS}
                value={formData.transmitterId || '01'}
                onChange={(e) => setFormData({...formData, transmitterId: e.target.value})}
              />
            </FormRow>

            {/* 비고 (Full Width) */}
            <FormRow label="비고" className="col-span-1 md:col-span-2">
              <InputGroup 
                value={formData.memo || ''} 
                onChange={(e) => setFormData({...formData, memo: e.target.value})}
              />
            </FormRow>

            {/* 사용여부 */}
            <FormRow label="사용여부">
              <StatusRadioGroup 
                label=""
                value={formData.status} 
                onChange={(val) => setFormData({...formData, status: val as any})}
              />
            </FormRow>
          </FormSection>

          <div className="flex justify-center gap-3 mt-8">
            <Button type="submit" variant="primary" className="w-32">{selectedTransmitter ? '수정' : '신규등록'}</Button>
            {selectedTransmitter && (
                <Button type="button" variant="danger" onClick={handleDelete} className="w-32">삭제</Button>
            )}
            <Button type="button" variant="secondary" onClick={() => setView('list')} className="w-32">목록</Button>
          </div>
        </form>

        {/* Common Receiver Modal */}
        <ReceiverSearchModal
          isOpen={isReceiverModalOpen} 
          onClose={() => setIsReceiverModalOpen(false)} 
          onSelect={handleReceiverSelect}
        />
      </>
    );
  }

  // --- View: List ---
  return (
    <>
      <PageHeader title="발신기 관리" />
      
      <SearchFilterBar onSearch={handleSearch} onReset={handleReset} isFiltered={isFiltered}>
        <InputGroup 
            label="설치시장" 
            value={searchMarket} 
            onChange={(e) => setSearchMarket(e.target.value)} 
        />
        <InputGroup 
            label="수신기MAC주소" 
            value={searchReceiverMac} 
            onChange={(e) => setSearchReceiverMac(e.target.value)} 
        />
        <SelectGroup
            label="사용여부"
            options={[{value: '', label: '전체'}, {value: '사용', label: '사용'}, {value: '미사용', label: '미사용'}]}
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
        />
      </SearchFilterBar>

      <div className="flex justify-between items-center mb-2">
         <span className="text-sm text-slate-400">
           전체 <strong className="text-blue-400">{transmitters.length}</strong> 건 
           (페이지 {currentPage})
         </span>
         <div className="flex gap-2">
            <Button variant="primary" onClick={handleRegister}>신규 등록</Button>
         </div>
      </div>

      <DataTable columns={columns} data={currentItems} onRowClick={handleEdit} />
      
      <Pagination 
        totalItems={transmitters.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </>
  );
};