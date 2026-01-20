import React, { useState, useEffect } from 'react';
import { 
  PageHeader, SearchFilterBar, InputGroup, SelectGroup, Button, DataTable, 
  Pagination, FormSection, FormRow, Column, Modal, UI_STYLES 
} from '../components/CommonUI';
import { Alarm, Receiver } from '../types';
import { AlarmAPI, ReceiverAPI } from '../services/api';
import { Search } from 'lucide-react';

const ITEMS_PER_PAGE = 10;
const MODAL_ITEMS_PER_PAGE = 5;

// ID Options (01 ~ 20) for Repeater and Alarm ID
const ID_OPTIONS = Array.from({ length: 20 }, (_, i) => {
  const val = String(i + 1).padStart(2, '0');
  return { value: val, label: val };
});

export const AlarmManagement: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Search Filters
  const [searchMarket, setSearchMarket] = useState('');
  const [searchReceiverMac, setSearchReceiverMac] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);

  // Form Data
  const [formData, setFormData] = useState<Partial<Alarm>>({});
  
  // Receiver Modal
  const [isReceiverModalOpen, setIsReceiverModalOpen] = useState(false);
  const [receiverList, setReceiverList] = useState<Receiver[]>([]);
  const [receiverSearchMac, setReceiverSearchMac] = useState('');
  const [receiverModalPage, setReceiverModalPage] = useState(1);

  // --- Data Fetching ---
  const fetchAlarms = async (overrides?: any) => {
    setLoading(true);
    try {
      const query = {
        marketName: overrides?.marketName !== undefined ? overrides.marketName : searchMarket,
        receiverMac: overrides?.receiverMac !== undefined ? overrides.receiverMac : searchReceiverMac,
        usageStatus: overrides?.usageStatus !== undefined ? overrides.usageStatus : searchStatus,
      };
      const data = await AlarmAPI.getList(query);
      setAlarms(data);
      setCurrentPage(1);
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes('Could not find the table')) {
         console.warn('DB 테이블(alarms)이 존재하지 않습니다. SQL 스크립트를 실행해주세요.');
      } else {
         alert('데이터 로드 실패: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarms();
  }, []);

  // --- Handlers: Search ---
  const handleSearch = () => {
    setIsFiltered(true);
    fetchAlarms();
  };

  const handleReset = () => {
    setSearchMarket('');
    setSearchReceiverMac('');
    setSearchStatus('');
    setIsFiltered(false);
    fetchAlarms({ marketName: '', receiverMac: '', usageStatus: '' });
  };

  // --- Handlers: List Actions ---
  const handleRegister = () => {
    setSelectedAlarm(null);
    setFormData({ 
      repeaterId: '01', 
      alarmId: '01',
      usageStatus: '사용',
      memo: ''
    });
    setView('form');
  };

  const handleEdit = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    setFormData({ ...alarm });
    setView('form');
  };

  // --- Handlers: Form ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.marketId || !formData.receiverMac) { alert('R형 수신기를 선택해주세요.'); return; }
    if (!formData.repeaterId) { alert('중계기 ID를 선택해주세요.'); return; }
    if (!formData.alarmId) { alert('경종 ID를 선택해주세요.'); return; }

    try {
      const newAlarm: Alarm = {
        ...formData as Alarm,
        id: selectedAlarm?.id || 0,
      };

      await AlarmAPI.save(newAlarm);
      alert('저장되었습니다.');
      setView('list');
      fetchAlarms();
    } catch (e: any) {
      alert(`저장 실패: ${e.message}`);
    }
  };

  const handleDelete = async () => {
    if (selectedAlarm && confirm('정말 삭제하시겠습니까?')) {
        try {
            await AlarmAPI.delete(selectedAlarm.id);
            alert('삭제되었습니다.');
            setView('list');
            fetchAlarms();
        } catch (e) {
            alert('삭제 실패');
        }
    }
  };

  // --- Receiver Search Modal ---
  const fetchReceivers = async () => {
    const data = await ReceiverAPI.getList({ macAddress: receiverSearchMac });
    setReceiverList(data);
    setReceiverModalPage(1);
  };
  const openReceiverModal = () => {
    setReceiverSearchMac('');
    fetchReceivers();
    setIsReceiverModalOpen(true);
  };
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
  const columns: Column<Alarm>[] = [
    { header: 'No', accessor: (_, idx) => idx + 1, width: '60px' },
    { header: '수신기 MAC', accessor: 'receiverMac', width: '150px' },
    { header: '중계기 ID', accessor: 'repeaterId', width: '100px' },
    { header: '경종 ID', accessor: 'alarmId', width: '100px' },
    { header: '설치시장', accessor: 'marketName' },
    { header: '사용여부', accessor: (item) => (
      <span className={item.usageStatus === '사용' ? 'text-green-400' : 'text-red-400'}>{item.usageStatus}</span>
    ), width: '100px' },
  ];

  // Pagination logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = alarms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(alarms.length / ITEMS_PER_PAGE);

  // Modal Pagination
  const rmLast = receiverModalPage * MODAL_ITEMS_PER_PAGE;
  const rmFirst = rmLast - MODAL_ITEMS_PER_PAGE;
  const currentReceivers = receiverList.slice(rmFirst, rmLast);
  const rmTotal = Math.ceil(receiverList.length / MODAL_ITEMS_PER_PAGE);

  // --- View: Form ---
  if (view === 'form') {
    return (
      <>
        <PageHeader title={selectedAlarm ? "경종 수정" : "경종 등록"} />
        <form onSubmit={handleSave}>
          <FormSection title={selectedAlarm ? "경종 수정" : "경종 등록"}>
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

            {/* 경종 ID (Dropdown 01~20) */}
            <FormRow label="경종 ID">
              <SelectGroup 
                options={ID_OPTIONS}
                value={formData.alarmId || '01'}
                onChange={(e) => setFormData({...formData, alarmId: e.target.value})}
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
              <div className={`${UI_STYLES.input} flex gap-4 text-slate-300 items-center`}>
                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <input 
                    type="radio" name="status" value="사용" 
                    checked={formData.usageStatus === '사용'} 
                    onChange={() => setFormData({...formData, usageStatus: '사용'})}
                    className="accent-blue-500" 
                  />
                  <span>사용</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <input 
                    type="radio" name="status" value="미사용" 
                    checked={formData.usageStatus === '미사용'} 
                    onChange={() => setFormData({...formData, usageStatus: '미사용'})}
                    className="accent-blue-500" 
                  />
                  <span>미사용</span>
                </label>
              </div>
            </FormRow>
          </FormSection>

          <div className="flex justify-center gap-3 mt-8">
            <Button type="submit" variant="primary" className="w-32">{selectedAlarm ? '수정' : '신규등록'}</Button>
            {selectedAlarm && (
                <Button type="button" variant="danger" onClick={handleDelete} className="w-32">삭제</Button>
            )}
            <Button type="button" variant="secondary" onClick={() => setView('list')} className="w-32">목록</Button>
          </div>
        </form>

        {/* Receiver Search Modal */}
        <Modal isOpen={isReceiverModalOpen} onClose={() => setIsReceiverModalOpen(false)} title="수신기 찾기" width="max-w-3xl">
           <SearchFilterBar onSearch={fetchReceivers}>
              <InputGroup label="MAC주소" value={receiverSearchMac} onChange={(e) => setReceiverSearchMac(e.target.value)} placeholder="MAC주소 검색" />
           </SearchFilterBar>
           <DataTable 
             columns={[
                { header: 'MAC주소', accessor: 'macAddress', width: '150px' },
                { header: '설치시장', accessor: 'marketName' },
                { header: '선택', accessor: (item) => <Button variant="primary" onClick={() => handleReceiverSelect(item)} className="px-2 py-1 text-xs">선택</Button>, width: '80px' }
             ]} 
             data={currentReceivers} 
           />
           <Pagination totalItems={receiverList.length} itemsPerPage={MODAL_ITEMS_PER_PAGE} currentPage={receiverModalPage} onPageChange={setReceiverModalPage} />
        </Modal>
      </>
    );
  }

  // --- View: List ---
  return (
    <>
      <PageHeader title="경종 관리" />
      
      <SearchFilterBar onSearch={handleSearch} onReset={handleReset} isFiltered={isFiltered}>
        <InputGroup 
            label="설치시장" 
            value={searchMarket} 
            onChange={(e) => setSearchMarket(e.target.value)} 
        />
        <InputGroup 
            label="수신기 MAC주소" 
            value={searchReceiverMac} 
            onChange={(e) => setSearchReceiverMac(e.target.value)} 
        />
        {/* Prompt doesn't specify RepeaterID filter in text but shows in image. Adding for completeness based on image */}
        <InputGroup 
            label="중계기ID" 
            value="" // Filter logic for RepeaterID is optional based on text, keeping UI clean or add if needed.
            onChange={() => {}}
            disabled
            placeholder="중계기ID (준비중)"
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
           전체 <strong className="text-blue-400">{alarms.length}</strong> 건 
           (페이지 {currentPage})
         </span>
         <div className="flex gap-2">
            <Button variant="primary" onClick={handleRegister}>신규 등록</Button>
            <Button variant="primary" onClick={handleSearch} icon={<Search size={18} />}>검색</Button>
         </div>
      </div>

      <DataTable columns={columns} data={currentItems} onRowClick={handleEdit} />
      
      <Pagination 
        totalItems={alarms.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </>
  );
};