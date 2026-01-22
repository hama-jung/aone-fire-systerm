import React, { useState, useEffect, useRef } from 'react';
import { 
  PageHeader, SearchFilterBar, InputGroup, 
  Button, DataTable, Pagination, ActionBar, FormSection, FormRow, Column, AddressInput, UI_STYLES, ITEMS_PER_PAGE,
  formatPhoneNumber, handlePhoneKeyDown, StatusRadioGroup
} from '../components/CommonUI';
import { Market } from '../types';
import { MarketAPI } from '../services/api';
import { exportToExcel } from '../utils/excel';
import { Search, Upload, Paperclip, X } from 'lucide-react';

export const MarketManagement: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(false);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);

  // 검색 상태 관리
  const [searchName, setSearchName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchManager, setSearchManager] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  
  // 폼 입력 상태
  const [formData, setFormData] = useState<Partial<Market>>({});
  const [mapImageFile, setMapImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      alert('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  // 검색
  const handleSearch = () => {
    setIsFiltered(true);
    fetchMarkets();
  };

  // 초기화 (전체보기)
  const handleReset = () => {
    setSearchName('');
    setSearchAddress('');
    setSearchManager('');
    setIsFiltered(false);
    fetchMarkets({ name: '', address: '', managerName: '' });
  };

  const handleRegister = () => { 
    setSelectedMarket(null);
    setFormData({ 
      status: 'Normal',
      usageStatus: '사용',
      enableMarketSms: '미사용',
      enableStoreSms: '미사용'
    });
    setMapImageFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
    setView('form'); 
  };
  
  const handleEdit = (market: Market) => { 
    setSelectedMarket(market);
    setFormData({ ...market });
    setMapImageFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
    setView('form'); 
  };
  
  const handleExcel = () => {
    const excelData = markets.map((m, index) => ({
      'No': index + 1,
      '시장명': m.name,
      '주소': `${m.address} ${m.addressDetail || ''}`.trim(),
      '담당자명': m.managerName,
      '담당자연락처': m.managerPhone,
      '상태': m.status
    }));
    exportToExcel(excelData, '시장관리_목록');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) { alert('시장명을 입력해주세요.'); return; }
    if (!formData.address) { alert('주소를 입력해주세요.'); return; }

    try {
      let uploadedUrl = formData.mapImage;
      if (mapImageFile) {
        uploadedUrl = await MarketAPI.uploadMapImage(mapImageFile);
      }

      // 폼 데이터 구성
      const newMarket: Market = {
        ...formData as Market,
        id: selectedMarket?.id || 0,
        mapImage: uploadedUrl,
        // status is monitoring status, usually not edited manually unless for testing, preserve or default
        status: selectedMarket?.status || 'Normal',
      };

      await MarketAPI.save(newMarket);
      alert('저장되었습니다.');
      setView('list');
      fetchMarkets();
    } catch (e: any) {
      alert('저장 실패: ' + e.message);
    }
  };

  const handleDelete = async () => {
    if(selectedMarket && confirm('정말 삭제하시겠습니까?')) {
        try {
            await MarketAPI.delete(selectedMarket.id);
            alert('삭제되었습니다.');
            setView('list');
            fetchMarkets();
        } catch(e) {
            alert('삭제 실패');
        }
    }
  };

  // Image Handling
  const handleFileSelectClick = () => {
    if (formData.mapImage || mapImageFile) {
      alert("등록된 이미지를 삭제해 주세요.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMapImageFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (confirm("이미지를 삭제하시겠습니까?")) {
        setFormData({ ...formData, mapImage: undefined });
        setMapImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFileName = () => {
     if (mapImageFile) return mapImageFile.name;
     if (formData.mapImage) {
        try {
           const url = new URL(formData.mapImage);
           return decodeURIComponent(url.pathname.split('/').pop() || 'image.jpg');
        } catch {
           return '지도_이미지.jpg';
        }
     }
     return '';
  };

  const handleDownload = async () => {
    if (mapImageFile) {
        const url = URL.createObjectURL(mapImageFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = mapImageFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
    }
    if (formData.mapImage) {
        window.open(formData.mapImage, '_blank');
    }
  };

  const columns: Column<Market>[] = [
    { header: 'No', accessor: (_, idx) => idx + 1, width: '60px' },
    { header: '시장명', accessor: 'name' },
    { header: '주소', accessor: (m) => `${m.address} ${m.addressDetail || ''}` },
    { header: '담당자명', accessor: 'managerName' },
    { header: '담당자연락처', accessor: (m) => formatPhoneNumber(m.managerPhone) },
    { header: '상태', accessor: (m: Market) => (
      <span className={`whitespace-nowrap ${m.status === 'Fire' ? 'text-red-400 font-bold' : (m.status === 'Error' ? 'text-orange-400' : 'text-slate-400')}`}>
        {m.status}
      </span>
    )},
  ];

  // -- Pagination Logic --
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = markets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(markets.length / ITEMS_PER_PAGE);

  if (view === 'form') {
    return (
      <>
        <PageHeader title={selectedMarket ? "시장 수정" : "시장 등록"} />
        <form onSubmit={handleSave}>
          <FormSection title="시장 정보">
              <FormRow label="시장명" required>
                <InputGroup 
                  value={formData.name || ''} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </FormRow>
              
              <div className="col-span-1 md:col-span-2">
                <AddressInput 
                   label="주소"
                   required
                   address={formData.address || ''}
                   addressDetail={formData.addressDetail || ''}
                   onAddressChange={(val) => setFormData(prev => ({...prev, address: val}))}
                   onDetailChange={(val) => setFormData(prev => ({...prev, addressDetail: val}))}
                   onCoordinateChange={(lat, lng) => setFormData(prev => ({...prev, latitude: lat, longitude: lng}))}
                />
              </div>

              <FormRow label="위도">
                 <InputGroup 
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    placeholder="위도" 
                 />
              </FormRow>

              <FormRow label="경도">
                 <InputGroup 
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    placeholder="경도" 
                 />
              </FormRow>

              <FormRow label="담당자명">
                <InputGroup 
                  value={formData.managerName || ''} 
                  onChange={(e) => setFormData({...formData, managerName: e.target.value})} 
                />
              </FormRow>

              <FormRow label="담당자 연락처">
                <InputGroup 
                  value={formData.managerPhone || ''} 
                  onChange={(e) => setFormData({...formData, managerPhone: e.target.value})}
                  onKeyDown={handlePhoneKeyDown}
                  inputMode="numeric"
                  placeholder="숫자만 입력"
                  maxLength={13} 
                />
              </FormRow>

              <FormRow label="사용여부">
                 <StatusRadioGroup 
                    label="" 
                    name="usageStatus"
                    value={formData.usageStatus}
                    onChange={(val) => setFormData({...formData, usageStatus: val as any})}
                 />
              </FormRow>

              <FormRow label="시장지도 이미지" className="col-span-1 md:col-span-2">
                 <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden" 
                            accept="image/*"
                        />
                        <Button type="button" variant="secondary" onClick={handleFileSelectClick} icon={<Upload size={16} />}>
                            파일 선택
                        </Button>
                        
                        {(formData.mapImage || mapImageFile) && (
                            <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded border border-slate-600">
                            <Paperclip size={14} className="text-slate-400" />
                            <span 
                                onClick={handleDownload}
                                className={`text-sm ${formData.mapImage || mapImageFile ? 'text-blue-400 cursor-pointer hover:underline' : 'text-slate-300'}`}
                                title="클릭하여 다운로드"
                            >
                                {getFileName()}
                            </span>
                            <button type="button" onClick={handleRemoveFile} className="text-red-400 hover:text-red-300 ml-2 p-1 rounded hover:bg-slate-600 transition-colors">
                                <X size={16} />
                            </button>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">최대 10MB, jpg/png/gif 지원</p>
                 </div>
              </FormRow>
          </FormSection>

          <div className="flex justify-center gap-3 mt-8">
             <Button type="submit" variant="primary" className="w-32">{selectedMarket ? '수정' : '등록'}</Button>
             {selectedMarket && <Button type="button" variant="danger" onClick={handleDelete} className="w-32">삭제</Button>}
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
          전체 <span className="text-blue-400">{markets.length}</span> 건
          (페이지 {currentPage})
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