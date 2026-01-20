import React, { useState, useEffect, useRef } from 'react';
import { 
  PageHeader, SearchFilterBar, InputGroup, SelectGroup,
  Button, DataTable, Pagination, ActionBar, FormSection, FormRow, Column, AddressInput, UI_STYLES
} from '../components/CommonUI';
import { Market, Distributor } from '../types';
import { MarketAPI, DistributorAPI } from '../services/api';
import { exportToExcel } from '../utils/excel';
import { X, Paperclip } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const MarketManagement: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 총판 목록 (드롭다운용)
  const [distributorOptions, setDistributorOptions] = useState<{value: string | number, label: string}[]>([]);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);

  // 검색 상태 관리
  const [searchName, setSearchName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchManager, setSearchManager] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  
  // --- 폼 입력 상태 (Form Input State) ---
  const [formData, setFormData] = useState<Partial<Market>>({});
  
  // 이미지 파일 상태
  const [mapImageFile, setMapImageFile] = useState<File | null>(null);
  // 파일 입력 요소 참조 (초기화용)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SMS 목록 관리 (Edit Mode 전용)
  const [smsFireList, setSmsFireList] = useState<string[]>([]);
  const [smsFaultList, setSmsFaultList] = useState<string[]>([]);
  const [tempSmsFire, setTempSmsFire] = useState('');
  const [tempSmsFault, setTempSmsFault] = useState('');

  // 초기 데이터 로드 (시장 목록 + 총판 목록)
  const initData = async () => {
    setLoading(true);
    try {
      // 1. 시장 목록 로드
      const mData = await MarketAPI.getList();
      setMarkets(mData);

      // 2. 총판 목록 로드 ('사용' 중인 총판만)
      const dData = await DistributorAPI.getList();
      const activeDistributors = dData
        .filter(d => d.status === '사용')
        .map(d => ({ value: d.id, label: d.name }));
      
      setDistributorOptions([{ value: '', label: '총판 선택' }, ...activeDistributors]);

    } catch (e) {
      alert('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // 시장 목록 조회 (검색 시)
  const fetchMarkets = async (overrides?: { name?: string, address?: string, managerName?: string }) => {
    setLoading(true);
    try {
      const query = {
        name: overrides?.name !== undefined ? overrides.name : searchName,
        address: overrides?.address !== undefined ? overrides.address : searchAddress,
        managerName: overrides?.managerName !== undefined ? overrides.managerName : searchManager
      };
      const data = await MarketAPI.getList(query);
      setMarkets(data);
      setCurrentPage(1);
    } catch (e) {
      alert('목록 갱신 실패');
    } finally {
      setLoading(false);
    }
  };

  // 검색 핸들러
  const handleSearch = () => {
    setIsFiltered(true);
    fetchMarkets();
  };

  const handleReset = () => {
    setSearchName('');
    setSearchAddress('');
    setSearchManager('');
    setIsFiltered(false);
    fetchMarkets({ name: '', address: '', managerName: '' });
  };

  // --- Form Handlers ---
  const handleRegister = () => { 
    setSelectedMarket(null);
    // 폼 초기화
    setFormData({
      distributorId: undefined,
      name: '',
      address: '',
      addressDetail: '',
      latitude: '',
      longitude: '',
      managerName: '',
      managerPhone: '',
      managerEmail: '',
      memo: '',
      enableMarketSms: '사용',
      enableStoreSms: '사용',
      enableMultiMedia: '사용',
      multiMediaType: '복합',
      usageStatus: '사용',
      enableDeviceFaultSms: '사용',
      enableCctvUrl: '사용',
      status: 'Normal'
    });
    setSmsFireList([]);
    setSmsFaultList([]);
    setMapImageFile(null); 
    if (fileInputRef.current) fileInputRef.current.value = ''; // 파일 입력 초기화
    setView('form'); 
  };
  
  const handleEdit = (market: Market) => { 
    setSelectedMarket(market);
    setFormData({ ...market });
    setSmsFireList(market.smsFire || []);
    setSmsFaultList(market.smsFault || []);
    setMapImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = ''; // 파일 입력 초기화
    setView('form'); 
  };
  
  // [규칙 3] 이미지가 등록된 상태에서 '파일 선택' 클릭 시 경고
  const handleFileClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // 이미 DB에 저장된 이미지가 있거나(formData.mapImage), 현재 선택된 파일이 있으면(mapImageFile)
    if (formData.mapImage || mapImageFile) {
      e.preventDefault(); // 파일 선택창 열림 방지
      alert("등록된 이미지를 삭제해 주세요.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMapImageFile(e.target.files[0]);
    }
  };

  // [규칙 2] 이미지 삭제 처리 (X 버튼)
  const handleRemoveFile = () => {
    if (confirm("이미지를 삭제하시겠습니까?")) {
        setFormData({ ...formData, mapImage: undefined }); // DB URL 제거
        setMapImageFile(null); // 새로 선택한 파일 제거
        if (fileInputRef.current) fileInputRef.current.value = ''; // input value 초기화
    }
  };

  // [규칙 4] 이미지 파일 다운로드 (파일명 클릭)
  const getFileName = () => {
     if (mapImageFile) return mapImageFile.name;
     if (formData.mapImage) {
        try {
           // URL에서 파일명만 추출 및 디코딩
           const url = new URL(formData.mapImage);
           return decodeURIComponent(url.pathname.split('/').pop() || 'image.jpg');
        } catch {
           return '시장지도_이미지.jpg';
        }
     }
     return '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수값 검증
    if (!formData.distributorId) { alert('총판을 선택해주세요.'); return; }
    if (!formData.name) { alert('시장명을 입력해주세요.'); return; }
    if (!formData.address) { alert('주소를 입력해주세요.'); return; }

    try {
      // 1. 이미지 업로드 처리
      let uploadedImageUrl = formData.mapImage; // 기존 이미지 URL 유지
      if (mapImageFile) {
        uploadedImageUrl = await MarketAPI.uploadMapImage(mapImageFile);
      }

      // 2. 선택 입력 항목의 빈 문자열 처리
      const cleanFormData = { ...formData };
      if (cleanFormData.latitude === '') cleanFormData.latitude = undefined;
      if (cleanFormData.longitude === '') cleanFormData.longitude = undefined;
      if (cleanFormData.managerName === '') cleanFormData.managerName = undefined;
      if (cleanFormData.managerPhone === '') cleanFormData.managerPhone = undefined;
      if (cleanFormData.managerEmail === '') cleanFormData.managerEmail = undefined;
      if (cleanFormData.memo === '') cleanFormData.memo = undefined;

      const newMarket: Market = {
        ...cleanFormData as Market,
        id: selectedMarket?.id || 0,
        smsFire: smsFireList,
        smsFault: smsFaultList,
        mapImage: uploadedImageUrl, // 최종 이미지 URL 적용
        status: selectedMarket?.status || 'Normal',
      };

      await MarketAPI.save(newMarket);
      alert('저장되었습니다.');
      setView('list');
      fetchMarkets();
    } catch (e: any) {
      console.error(e);
      alert(`저장 실패: ${e.message || '알 수 없는 오류가 발생했습니다.'}`);
    }
  };

  // SMS 목록 추가/삭제 핸들러
  const addSms = (type: 'fire' | 'fault') => {
    if (type === 'fire') {
        if(tempSmsFire) {
            setSmsFireList([...smsFireList, tempSmsFire]);
            setTempSmsFire('');
        }
    } else {
        if(tempSmsFault) {
            setSmsFaultList([...smsFaultList, tempSmsFault]);
            setTempSmsFault('');
        }
    }
  };

  const removeSms = (type: 'fire' | 'fault', index: number) => {
    if (type === 'fire') {
        setSmsFireList(smsFireList.filter((_, i) => i !== index));
    } else {
        setSmsFaultList(smsFaultList.filter((_, i) => i !== index));
    }
  };

  const handleExcel = () => {
    const excelData = markets.map((m, index) => ({
      'No': index + 1,
      '시장명': m.name,
      '주소': `${m.address} ${m.addressDetail || ''}`,
      '담당자': m.managerName,
      '담당자전화': m.managerPhone,
      '상태': m.usageStatus || '사용'
    }));
    exportToExcel(excelData, '시장관리_목록');
  };

  // -- Table Columns --
  const columns: Column<Market>[] = [
    { header: 'No', accessor: 'id', width: '60px' },
    { header: '총판명', accessor: (m) => {
       const dist = distributorOptions.find(d => d.value === m.distributorId);
       return dist ? dist.label : '-';
    }},
    { header: '시장명', accessor: 'name' },
    { header: '담당자명', accessor: (m) => m.managerName || '-' },
    { header: '담당자전화', accessor: (m) => m.managerPhone || '-' },
    { header: '주소', accessor: (m) => `${m.address} ${m.addressDetail || ''}` },
  ];

  // -- Pagination Logic --
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = markets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(markets.length / ITEMS_PER_PAGE);

  // --- Helper for Radio Inputs ---
  const RadioButtons = ({ name, value, onChange, options }: { name: string, value: string | undefined, onChange: (v: string) => void, options: string[] }) => (
    <div className={`${UI_STYLES.input} flex gap-4 text-slate-300 items-center`}>
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer hover:text-white">
          <input 
            type="radio" 
            name={name} 
            value={opt} 
            checked={value === opt} 
            onChange={() => onChange(opt)} 
            className="accent-blue-500" 
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );

  if (view === 'form') {
    return (
      <>
        <PageHeader title={selectedMarket ? "시장 수정" : "시장 등록"} />
        <form onSubmit={handleSave}>
          <FormSection title={selectedMarket ? "시장 수정" : "시장 등록"}>
              {/* Row 1: 총판, 시장명 */}
              <FormRow label="총판" required>
                <SelectGroup 
                   options={distributorOptions as any}
                   value={formData.distributorId || ''}
                   onChange={(e) => setFormData({...formData, distributorId: Number(e.target.value)})}
                />
              </FormRow>
              <FormRow label="시장명" required>
                <InputGroup 
                  value={formData.name || ''} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </FormRow>
              
              {/* Row 2: 주소 (Full Width) */}
              <div className="col-span-1 md:col-span-2">
                <AddressInput 
                   label="주소"
                   required
                   address={formData.address || ''}
                   addressDetail={formData.addressDetail || ''}
                   onAddressChange={(val) => setFormData({...formData, address: val})}
                   onDetailChange={(val) => setFormData({...formData, addressDetail: val})}
                />
              </div>

              {/* Row 3: 위도, 경도 */}
              <FormRow label="위도">
                 <InputGroup 
                    value={formData.latitude || ''} 
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})} 
                 />
              </FormRow>
              <FormRow label="경도">
                 <InputGroup 
                    value={formData.longitude || ''} 
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})} 
                 />
              </FormRow>

              {/* Row 4: 담당자, 담당자 전화 */}
              <FormRow label="담당자">
                <InputGroup 
                  value={formData.managerName || ''} 
                  onChange={(e) => setFormData({...formData, managerName: e.target.value})} 
                />
              </FormRow>
              <FormRow label="담당자 전화">
                <InputGroup 
                  value={formData.managerPhone || ''} 
                  onChange={(e) => setFormData({...formData, managerPhone: e.target.value})} 
                />
              </FormRow>

              {/* Row 5: 담당자 이메일 */}
              <FormRow label="담당자 E-mail" className="col-span-1 md:col-span-2">
                <InputGroup 
                  value={formData.managerEmail || ''} 
                  onChange={(e) => setFormData({...formData, managerEmail: e.target.value})} 
                />
              </FormRow>

              {/* 시장지도 이미지 (단일 파일 등록 규칙 적용) */}
              <FormRow label="시장지도이미지" className="col-span-1 md:col-span-2">
                {selectedMarket && <p className="text-xs text-red-400 mb-2">* 등록 후 수정 시에만 추가 가능</p>}
                
                <div className="flex flex-col gap-2 w-full">
                   {/* 파일 입력 창 (파일이 있으면 클릭 방지) */}
                   <InputGroup 
                      ref={fileInputRef}
                      type="file" 
                      onChange={handleFileChange}
                      onClick={handleFileClick}
                      className="border-0 p-0 text-slate-300 w-full" 
                   />

                   {/* [규칙 2, 4] 파일이 존재할 경우: 파일명(다운로드 링크) + X 버튼 표시 */}
                   {(formData.mapImage || mapImageFile) && (
                      <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded border border-slate-600 w-fit">
                         <Paperclip size={14} className="text-slate-400" />
                         <span 
                            onClick={() => formData.mapImage && window.open(formData.mapImage, '_blank')}
                            className={`text-sm ${formData.mapImage ? 'text-blue-400 cursor-pointer hover:underline' : 'text-slate-300'}`}
                            title={formData.mapImage ? "클릭하여 다운로드" : "저장 전 파일입니다"}
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

              {/* --- 수정 모드 전용 항목 (SMS) --- */}
              {selectedMarket && (
                <>
                   {/* 화재발생시 SMS */}
                   <FormRow label="화재발생시 SMS" className="col-span-1 md:col-span-2">
                      <p className="text-xs text-red-400 mb-2">* 등록 후 수정 시에만 추가 가능</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                           <InputGroup 
                             placeholder="휴대폰 번호 입력" 
                             value={tempSmsFire}
                             onChange={(e) => setTempSmsFire(e.target.value)}
                           />
                           <Button type="button" variant="secondary" onClick={() => addSms('fire')} className="whitespace-nowrap">추가</Button>
                        </div>
                        <div className="bg-slate-900 border border-slate-600 rounded p-2 max-h-32 overflow-y-auto custom-scrollbar">
                           {smsFireList.length === 0 && <span className="text-slate-500 text-sm">등록된 번호가 없습니다.</span>}
                           {smsFireList.map((num, idx) => (
                             <div key={idx} className="flex justify-between items-center py-1 px-2 border-b border-slate-700/50 last:border-0">
                               <span className="text-slate-200">{num}</span>
                               <button type="button" onClick={() => removeSms('fire', idx)} className="text-red-400 hover:text-red-300 text-sm">삭제</button>
                             </div>
                           ))}
                        </div>
                      </div>
                   </FormRow>

                   {/* 고장발생시 SMS */}
                   <FormRow label="고장발생시 SMS" className="col-span-1 md:col-span-2">
                      <p className="text-xs text-red-400 mb-2">* 등록 후 수정 시에만 추가 가능</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                           <InputGroup 
                             placeholder="휴대폰 번호 입력" 
                             value={tempSmsFault}
                             onChange={(e) => setTempSmsFault(e.target.value)}
                           />
                           <Button type="button" variant="secondary" onClick={() => addSms('fault')} className="whitespace-nowrap">추가</Button>
                        </div>
                        <div className="bg-slate-900 border border-slate-600 rounded p-2 max-h-32 overflow-y-auto custom-scrollbar">
                           {smsFaultList.length === 0 && <span className="text-slate-500 text-sm">등록된 번호가 없습니다.</span>}
                           {smsFaultList.map((num, idx) => (
                             <div key={idx} className="flex justify-between items-center py-1 px-2 border-b border-slate-700/50 last:border-0">
                               <span className="text-slate-200">{num}</span>
                               <button type="button" onClick={() => removeSms('fault', idx)} className="text-red-400 hover:text-red-300 text-sm">삭제</button>
                             </div>
                           ))}
                        </div>
                      </div>
                   </FormRow>
                </>
              )}

              {/* 비고 */}
              <FormRow label="비고" className="col-span-1 md:col-span-2">
                 <InputGroup 
                   value={formData.memo || ''} 
                   onChange={(e) => setFormData({...formData, memo: e.target.value})} 
                 />
              </FormRow>

              {/* --- 설정 옵션 (Radio Buttons) --- */}
              <FormRow label="시장전체 문자전송여부" className="col-span-1 md:col-span-2">
                 <RadioButtons 
                    name="enableMarketSms"
                    value={formData.enableMarketSms} 
                    onChange={(v) => setFormData({...formData, enableMarketSms: v as any})}
                    options={['사용', '미사용']}
                 />
              </FormRow>
              <FormRow label="상가주인 문자전송여부" className="col-span-1 md:col-span-2">
                 <RadioButtons 
                    name="enableStoreSms"
                    value={formData.enableStoreSms} 
                    onChange={(v) => setFormData({...formData, enableStoreSms: v as any})}
                    options={['사용', '미사용']}
                 />
              </FormRow>
              <FormRow label="다매체전송 여부" className="col-span-1 md:col-span-2">
                 <RadioButtons 
                    name="enableMultiMedia"
                    value={formData.enableMultiMedia} 
                    onChange={(v) => setFormData({...formData, enableMultiMedia: v as any})}
                    options={['사용', '미사용']}
                 />
              </FormRow>
              <FormRow label="다매체 타입" className="col-span-1 md:col-span-2">
                 <RadioButtons 
                    name="multiMediaType"
                    value={formData.multiMediaType} 
                    onChange={(v) => setFormData({...formData, multiMediaType: v as any})}
                    options={['복합', '열', '연기']}
                 />
              </FormRow>
              <FormRow label="시장 사용여부" className="col-span-1 md:col-span-2">
                 <RadioButtons 
                    name="usageStatus"
                    value={formData.usageStatus} 
                    onChange={(v) => {
                      // Prompt: 사용여부 '미사용' 설정 시 경고창 띄우기
                      if (v === '미사용') {
                        alert("미사용으로 변경하면 상가, 기기도 모두 미사용으로 바뀝니다.");
                      }
                      setFormData({...formData, usageStatus: v as any});
                    }}
                    options={['사용', '미사용']}
                 />
              </FormRow>
              <FormRow label="기기고장 문자전송여부" className="col-span-1 md:col-span-2">
                 <RadioButtons 
                    name="enableDeviceFaultSms"
                    value={formData.enableDeviceFaultSms} 
                    onChange={(v) => setFormData({...formData, enableDeviceFaultSms: v as any})}
                    options={['사용', '미사용']}
                 />
              </FormRow>
              <FormRow label="화재문자시 CCTV URL 포함여부" className="col-span-1 md:col-span-2">
                 <RadioButtons 
                    name="enableCctvUrl"
                    value={formData.enableCctvUrl} 
                    onChange={(v) => setFormData({...formData, enableCctvUrl: v as any})}
                    options={['사용', '미사용']}
                 />
              </FormRow>

          </FormSection>

          <div className="flex justify-center gap-3 mt-8">
             <Button type="submit" variant="primary" className="w-32">{selectedMarket ? '수정' : '신규등록'}</Button>
             <Button type="button" variant="secondary" onClick={() => setView('list')} className="w-32">취소</Button>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader title="시장 관리" />
      <SearchFilterBar onSearch={handleSearch} onReset={handleReset} isFiltered={isFiltered}>
        <InputGroup 
          label="시장명" 
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="시장명 입력" 
        />
        <InputGroup 
          label="주소" 
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          placeholder="주소 입력" 
        />
        <InputGroup 
          label="담당자" 
          value={searchManager}
          onChange={(e) => setSearchManager(e.target.value)}
          placeholder="담당자 입력" 
        />
      </SearchFilterBar>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-400">
          전체 <strong className="text-blue-400">{markets.length}</strong> 건
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
        totalItems={markets.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </>
  );
};