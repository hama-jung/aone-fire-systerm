import React, { useState, useEffect, useRef } from 'react';
import { 
  PageHeader, SearchFilterBar, InputGroup, SelectGroup,
  Button, DataTable, Pagination, ActionBar, FormSection, FormRow, Column, Modal, UI_STYLES
} from '../components/CommonUI';
import { Store, Market } from '../types';
import { StoreAPI, MarketAPI } from '../services/api';
import { exportToExcel } from '../utils/excel';
import { X, Paperclip, Search, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 10;
const MODAL_ITEMS_PER_PAGE = 5;

export const StoreManagement: React.FC = () => {
  const [view, setView] = useState<'list' | 'form' | 'excel'>('list');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Pagination ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- Search Filters ---
  const [searchAddress, setSearchAddress] = useState('');
  const [searchMarket, setSearchMarket] = useState('');
  const [searchStore, setSearchStore] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);

  // --- Form Data ---
  const [formData, setFormData] = useState<Partial<Store>>({});
  
  // Image handling
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Market Modal Data ---
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [marketList, setMarketList] = useState<Market[]>([]);
  const [marketSearchName, setMarketSearchName] = useState('');
  const [marketModalPage, setMarketModalPage] = useState(1);
  const [selectedMarketForForm, setSelectedMarketForForm] = useState<Market | null>(null); // For display

  // --- Excel Upload Data ---
  const [excelData, setExcelData] = useState<Store[]>([]);
  const [excelMarket, setExcelMarket] = useState<Market | null>(null); // Market selected for bulk upload

  // --- Initial Data Load ---
  const fetchStores = async (overrides?: { address?: string, marketName?: string, storeName?: string }) => {
    setLoading(true);
    try {
      const query = {
        address: overrides?.address !== undefined ? overrides.address : searchAddress,
        marketName: overrides?.marketName !== undefined ? overrides.marketName : searchMarket,
        storeName: overrides?.storeName !== undefined ? overrides.storeName : searchStore
      };
      const data = await StoreAPI.getList(query);
      setStores(data);
      setCurrentPage(1);
    } catch (e) {
      alert('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // --- Handlers: Search ---
  const handleSearch = () => {
    setIsFiltered(true);
    fetchStores();
  };

  const handleReset = () => {
    setSearchAddress('');
    setSearchMarket('');
    setSearchStore('');
    setIsFiltered(false);
    fetchStores({ address: '', marketName: '', storeName: '' });
  };

  // --- Handlers: List Actions ---
  const handleRegister = () => {
    setSelectedStore(null);
    setFormData({ status: '사용', mode: '복합' });
    setSelectedMarketForForm(null);
    setStoreImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setView('form');
  };

  const handleEdit = (store: Store) => {
    setSelectedStore(store);
    setFormData({ ...store });
    // Set market info for display
    setSelectedMarketForForm({ id: store.marketId, name: store.marketName || '' } as Market);
    setStoreImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setView('form');
  };

  const handleExcelRegister = () => {
    setExcelData([]);
    setExcelMarket(null);
    setView('excel');
  };

  const handleListExcelDownload = () => {
    const exportData = stores.map((s, idx) => ({
        'No': idx + 1,
        '소속시장': s.marketName,
        '상가명': s.name,
        '담당자명': s.managerName,
        '담당자연락처': s.managerPhone,
        '상태': s.status
    }));
    exportToExcel(exportData, '상가관리_목록');
  };

  // --- Handlers: Form Image ---
  const handleFileClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (formData.storeImage || storeImageFile) {
      e.preventDefault();
      alert("등록된 이미지를 삭제해 주세요.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setStoreImageFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (confirm("이미지를 삭제하시겠습니까?")) {
        setFormData({ ...formData, storeImage: undefined });
        setStoreImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFileName = () => {
     if (storeImageFile) return storeImageFile.name;
     if (formData.storeImage) {
        try {
           const url = new URL(formData.storeImage);
           return decodeURIComponent(url.pathname.split('/').pop() || 'image.jpg');
        } catch {
           return '상가_이미지.jpg';
        }
     }
     return '';
  };

  // --- Handlers: Market Modal ---
  const fetchMarkets = async () => {
    const data = await MarketAPI.getList({ name: marketSearchName });
    setMarketList(data);
    setMarketModalPage(1);
  };

  const openMarketModal = () => {
    setMarketSearchName('');
    fetchMarkets();
    setIsMarketModalOpen(true);
  };

  const handleMarketSelect = (market: Market) => {
    if (view === 'form') {
      setSelectedMarketForForm(market);
      setFormData({ ...formData, marketId: market.id });
    } else if (view === 'excel') {
      setExcelMarket(market);
    }
    setIsMarketModalOpen(false);
  };

  // --- Handlers: Save (Single) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.marketId) { alert('소속 시장을 선택해주세요.'); return; }
    if (!formData.name) { alert('상가명을 입력해주세요.'); return; }
    if (!formData.status) { alert('상가 사용여부를 선택해주세요.'); return; }

    try {
      let uploadedImageUrl = formData.storeImage;
      if (storeImageFile) {
        uploadedImageUrl = await StoreAPI.uploadStoreImage(storeImageFile);
      }

      const newStore: Store = {
        ...formData as Store,
        id: selectedStore?.id || 0,
        storeImage: uploadedImageUrl,
      };

      await StoreAPI.save(newStore);
      alert('저장되었습니다.');
      setView('list');
      fetchStores();
    } catch (e: any) {
      alert(`저장 실패: ${e.message}`);
    }
  };

  const handleDelete = async () => {
    if(selectedStore && confirm('정말 삭제하시겠습니까?')) {
       try {
         await StoreAPI.delete(selectedStore.id);
         alert('삭제되었습니다.');
         setView('list');
         fetchStores();
       } catch(e) {
         alert('삭제 실패');
       }
    }
  };

  // --- Handlers: Excel Logic ---
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!excelMarket) {
        alert('먼저 소속 시장을 선택해주세요.');
        e.target.value = ''; // reset
        return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      // Map excel rows to Store objects
      // Expected Columns: 상가명, 담당자명, 담당자연락처, 수신기MAC, 중계기ID, 감지기번호, 모드
      const parsedStores: Store[] = data.map((row: any, idx: number) => ({
        id: 0, // new
        marketId: excelMarket.id,
        marketName: excelMarket.name,
        name: row['상가명'] || `상가_${idx+1}`,
        managerName: row['담당자명'] || '',
        managerPhone: row['담당자연락처'] || '',
        status: '사용',
        receiverMac: row['수신기MAC'] ? String(row['수신기MAC']) : '',
        repeaterId: row['중계기ID'] ? String(row['중계기ID']) : '',
        detectorId: row['감지기번호'] ? String(row['감지기번호']) : '',
        mode: row['모드'] || '복합',
      }));

      setExcelData(parsedStores);
    };
    reader.readAsBinaryString(file);
  };

  const handleExcelSave = async () => {
    if (excelData.length === 0) {
        alert('등록할 데이터가 없습니다.');
        return;
    }
    if (!excelMarket) {
        alert('소속 시장이 선택되지 않았습니다.');
        return;
    }

    try {
        await StoreAPI.saveBulk(excelData);
        alert(`${excelData.length}건이 성공적으로 등록되었습니다.`);
        setView('list');
        fetchStores();
    } catch (e: any) {
        alert(`일괄 등록 실패: ${e.message}`);
    }
  };

  const handleSampleDownload = () => {
      // In a real app, this would point to a file in Supabase Storage or public assets
      alert("Supabase Storage 'resources' 버킷에 'store_upload_sample.xlsx' 파일을 업로드한 후 URL을 연결해야 합니다.\n현재는 안내 메시지만 출력됩니다.");
  };

  // --- Table Columns ---
  const columns: Column<Store>[] = [
    { header: 'No', accessor: 'id', width: '60px' },
    { header: '소속시장', accessor: 'marketName' },
    { header: '상가명', accessor: 'name' },
    { header: '담당자', accessor: 'managerName' },
    { header: '연락처', accessor: 'managerPhone' },
    { header: '상태', accessor: (s) => (
       <span className={s.status === '사용' ? 'text-green-400' : 'text-red-400'}>{s.status}</span>
    )},
  ];

  // --- Market Modal Columns ---
  const marketColumns: Column<Market>[] = [
    { header: '시장명', accessor: 'name' },
    { header: '주소', accessor: 'address' },
    { header: '담당자', accessor: 'managerName' },
    { header: '선택', accessor: (item) => (
        <Button variant="primary" onClick={() => handleMarketSelect(item)} className="px-2 py-1 text-xs">선택</Button>
    ), width: '80px' }
  ];

  // --- Pagination Data ---
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = stores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(stores.length / ITEMS_PER_PAGE);

  // Market Modal Pagination
  const modalIndexOfLast = marketModalPage * MODAL_ITEMS_PER_PAGE;
  const modalIndexOfFirst = modalIndexOfLast - MODAL_ITEMS_PER_PAGE;
  const modalCurrentMarkets = marketList.slice(modalIndexOfFirst, modalIndexOfLast);
  const modalTotalPages = Math.ceil(marketList.length / MODAL_ITEMS_PER_PAGE);


  // --- VIEW: FORM ---
  if (view === 'form') {
    return (
      <>
        <PageHeader title={selectedStore ? "상가 수정" : "상가 등록"} />
        <form onSubmit={handleSave}>
          <FormSection title={selectedStore ? "상가 수정" : "상가 등록"}>
            {/* 1. 소속 시장 (Required) */}
            <FormRow label="소속 시장" required>
               <div className="flex gap-2 w-full">
                 <InputGroup 
                    value={selectedMarketForForm?.name || ''} 
                    placeholder="시장 선택" 
                    readOnly 
                    onClick={openMarketModal} 
                    className="cursor-pointer"
                 />
                 <Button type="button" variant="secondary" onClick={openMarketModal}>찾기</Button>
               </div>
            </FormRow>

            {/* 2. 상가명 (Required) */}
            <FormRow label="상가명" required>
               <InputGroup 
                 value={formData.name || ''} 
                 onChange={(e) => setFormData({...formData, name: e.target.value})} 
                 placeholder="상가명 입력"
               />
            </FormRow>

            {/* 3. 담당자 정보 */}
            <FormRow label="담당자">
               <InputGroup 
                 value={formData.managerName || ''} 
                 onChange={(e) => setFormData({...formData, managerName: e.target.value})} 
               />
            </FormRow>
            <FormRow label="담당자 연락처">
               <InputGroup 
                 value={formData.managerPhone || ''} 
                 onChange={(e) => setFormData({...formData, managerPhone: e.target.value})} 
               />
            </FormRow>

            {/* 4. 기기 정보 (선택, 수정 가능) */}
            <FormRow label="수신기 MAC (4자리)">
               <InputGroup 
                 value={formData.receiverMac || ''} 
                 onChange={(e) => setFormData({...formData, receiverMac: e.target.value})} 
                 placeholder="예: 1A2B"
                 maxLength={4}
               />
            </FormRow>
            <FormRow label="중계기 ID (2자리)">
               <InputGroup 
                 value={formData.repeaterId || ''} 
                 onChange={(e) => setFormData({...formData, repeaterId: e.target.value})} 
                 placeholder="예: 01"
                 maxLength={2}
               />
            </FormRow>
            <FormRow label="감지기 번호 (2자리)">
               <InputGroup 
                 value={formData.detectorId || ''} 
                 onChange={(e) => setFormData({...formData, detectorId: e.target.value})} 
                 placeholder="예: 05"
                 maxLength={2}
               />
            </FormRow>
            <FormRow label="모드">
               <SelectGroup 
                  options={[{value:'복합',label:'복합'}, {value:'열',label:'열'}, {value:'연기',label:'연기'}]}
                  value={formData.mode || '복합'}
                  onChange={(e) => setFormData({...formData, mode: e.target.value as any})}
               />
            </FormRow>

            {/* 5. 비고 */}
            <FormRow label="비고" className="col-span-1 md:col-span-2">
               <InputGroup 
                 value={formData.memo || ''} 
                 onChange={(e) => setFormData({...formData, memo: e.target.value})} 
               />
            </FormRow>

            {/* 6. 이미지 (공통 규칙) */}
            <FormRow label="상가 이미지" className="col-span-1 md:col-span-2">
                <div className="flex flex-col gap-2 w-full">
                   <InputGroup 
                      ref={fileInputRef}
                      type="file" 
                      onChange={handleFileChange}
                      onClick={handleFileClick}
                      className="border-0 p-0 text-slate-300 w-full" 
                   />
                   {(formData.storeImage || storeImageFile) && (
                      <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded border border-slate-600 w-fit">
                         <Paperclip size={14} className="text-slate-400" />
                         <span 
                            onClick={() => formData.storeImage && window.open(formData.storeImage, '_blank')}
                            className={`text-sm ${formData.storeImage ? 'text-blue-400 cursor-pointer hover:underline' : 'text-slate-300'}`}
                            title={formData.storeImage ? "클릭하여 다운로드" : "저장 전 파일입니다"}
                         >
                            {getFileName()}
                         </span>
                         <button type="button" onClick={handleRemoveFile} className="text-red-400 hover:text-red-300 ml-2 p-1 rounded hover:bg-slate-600 transition-colors">
                            <X size={16} />
                         </button>
                      </div>
                   )}
                </div>
            </FormRow>

            {/* 7. 상가 사용여부 (Required) */}
            <FormRow label="상가 사용여부" required className="col-span-1 md:col-span-2">
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
          </FormSection>

          <div className="flex justify-center gap-3 mt-8">
             <Button type="submit" variant="primary" className="w-32">{selectedStore ? '수정' : '등록'}</Button>
             {selectedStore && (
               <Button type="button" variant="danger" onClick={handleDelete} className="w-32">삭제</Button>
             )}
             <Button type="button" variant="secondary" onClick={() => setView('list')} className="w-32">취소</Button>
          </div>
        </form>

        {/* Market Select Modal */}
        <Modal isOpen={isMarketModalOpen} onClose={() => setIsMarketModalOpen(false)} title="소속 시장 선택" width="max-w-3xl">
           <SearchFilterBar onSearch={fetchMarkets}>
              <InputGroup 
                 label="시장명" 
                 value={marketSearchName} 
                 onChange={(e) => setMarketSearchName(e.target.value)} 
                 placeholder="시장명 검색"
              />
           </SearchFilterBar>
           <DataTable columns={marketColumns} data={modalCurrentMarkets} />
           <Pagination 
              totalItems={marketList.length} itemsPerPage={MODAL_ITEMS_PER_PAGE} currentPage={marketModalPage} onPageChange={setMarketModalPage} 
           />
        </Modal>
      </>
    );
  }

  // --- VIEW: EXCEL ---
  if (view === 'excel') {
    return (
      <>
        <PageHeader title="상가 엑셀 신규 등록" />
        <FormSection title="엑셀 일괄 등록">
            {/* 1. 소속 시장 선택 */}
            <FormRow label="소속 시장" required className="col-span-1 md:col-span-2">
               <div className="flex gap-2 w-full max-w-md">
                 <InputGroup 
                    value={excelMarket?.name || ''} 
                    placeholder="등록할 시장을 선택하세요" 
                    readOnly 
                    onClick={openMarketModal} 
                    className="cursor-pointer"
                 />
                 <Button type="button" variant="secondary" onClick={openMarketModal}>찾기</Button>
               </div>
            </FormRow>

            {/* 2. 파일 선택 */}
            <FormRow label="엑셀 파일 선택" required className="col-span-1 md:col-span-2">
                <div className="flex flex-col gap-2">
                   <InputGroup 
                      type="file" 
                      accept=".xlsx, .xls"
                      onChange={handleExcelFileChange}
                      className="border-0 p-0 text-slate-300 w-full"
                   />
                   <p className="text-xs text-slate-400">
                     * 수신기MAC(4자리), 중계기ID(2자리), 감지기번호(2자리), 모드(복합/열/연기) 컬럼을 포함해야 합니다.
                   </p>
                </div>
            </FormRow>

            {/* 3. 샘플 다운로드 */}
            <FormRow label="샘플 양식" className="col-span-1 md:col-span-2">
                <Button type="button" variant="secondary" onClick={handleSampleDownload} icon={<Upload size={14} />}>
                   엑셀 샘플 다운로드
                </Button>
            </FormRow>
        </FormSection>

        {/* 미리보기 테이블 */}
        {excelData.length > 0 && (
          <div className="mt-8">
             <h3 className="text-lg font-bold text-slate-200 mb-2">등록 미리보기 ({excelData.length}건)</h3>
             <DataTable 
               columns={[
                  {header:'상가명', accessor:'name'},
                  {header:'담당자', accessor:'managerName'},
                  {header:'연락처', accessor:'managerPhone'},
                  {header:'수신기MAC', accessor:'receiverMac'},
                  {header:'중계기ID', accessor:'repeaterId'},
                  {header:'감지기번호', accessor:'detectorId'},
                  {header:'모드', accessor:'mode'},
               ]}
               data={excelData.slice(0, 50)} // Preview only first 50
             />
             {excelData.length > 50 && <p className="text-center text-slate-500 text-sm mt-2">...외 {excelData.length - 50}건</p>}
          </div>
        )}

        <div className="flex justify-center gap-3 mt-8">
            <Button type="button" variant="primary" onClick={handleExcelSave} className="w-32" disabled={excelData.length === 0}>일괄 등록</Button>
            <Button type="button" variant="secondary" onClick={() => setView('list')} className="w-32">취소</Button>
        </div>

        {/* Market Select Modal (Reused) */}
        <Modal isOpen={isMarketModalOpen} onClose={() => setIsMarketModalOpen(false)} title="소속 시장 선택" width="max-w-3xl">
           <SearchFilterBar onSearch={fetchMarkets}>
              <InputGroup 
                 label="시장명" 
                 value={marketSearchName} 
                 onChange={(e) => setMarketSearchName(e.target.value)} 
                 placeholder="시장명 검색"
              />
           </SearchFilterBar>
           <DataTable columns={marketColumns} data={modalCurrentMarkets} />
           <Pagination 
              totalItems={marketList.length} itemsPerPage={MODAL_ITEMS_PER_PAGE} currentPage={marketModalPage} onPageChange={setMarketModalPage} 
           />
        </Modal>
      </>
    );
  }

  // --- VIEW: LIST ---
  return (
    <>
      <PageHeader title="상가 관리" />
      <SearchFilterBar onSearch={handleSearch} onReset={handleReset} isFiltered={isFiltered}>
         <InputGroup 
            label="주소" 
            value={searchAddress} 
            onChange={(e) => setSearchAddress(e.target.value)} 
            placeholder="주소 입력"
         />
         <InputGroup 
            label="시장명" 
            value={searchMarket} 
            onChange={(e) => setSearchMarket(e.target.value)} 
            placeholder="시장명 입력"
         />
         <InputGroup 
            label="상가명" 
            value={searchStore} 
            onChange={(e) => setSearchStore(e.target.value)} 
            placeholder="상가명 입력"
         />
      </SearchFilterBar>

      <div className="flex justify-between items-center mb-2">
         <span className="text-sm text-slate-400">
           전체 <strong className="text-blue-400">{stores.length}</strong> 건 
           (페이지 {currentPage}/{totalPages || 1})
         </span>
         <div className="flex gap-2">
            <Button variant="success" onClick={handleListExcelDownload} icon={<Paperclip size={16} />}>엑셀 다운로드</Button>
            <Button variant="secondary" onClick={handleExcelRegister} icon={<Upload size={16} />}>엑셀 신규 등록</Button>
            <Button variant="primary" onClick={handleRegister}>신규 등록</Button>
         </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading...</div>
      ) : (
        <DataTable columns={[
          { header: 'No', accessor: 'id', width: '60px' },
          { header: '소속시장', accessor: 'marketName' },
          { header: '상가명', accessor: 'name' },
          { header: '담당자', accessor: 'managerName' },
          { header: '연락처', accessor: 'managerPhone' },
          { header: '상태', accessor: (s) => (
             <span className={s.status === '사용' ? 'text-green-400' : 'text-red-400'}>{s.status}</span>
          )},
        ]} data={currentItems} onRowClick={handleEdit} />
      )}

      <Pagination 
        totalItems={stores.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </>
  );
};