import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, UI_STYLES } from './CommonUI';
import { Market, Detector, Receiver, Repeater } from '../types';
import { DetectorAPI, ReceiverAPI, RepeaterAPI } from '../services/api';
import { X, Settings, Monitor, Map as MapIcon, Save, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface VisualMapConsoleProps {
  market: Market;
  initialMode?: 'monitoring' | 'edit';
  onClose: () => void;
}

export const VisualMapConsole: React.FC<VisualMapConsoleProps> = ({ market, initialMode = 'monitoring', onClose }) => {
  const [mode, setMode] = useState<'monitoring' | 'edit'>(initialMode);
  
  // Device Lists
  const [detectors, setDetectors] = useState<Detector[]>([]);
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [repeaters, setRepeaters] = useState<Repeater[]>([]);
  const [loading, setLoading] = useState(true);

  // Dragging State
  const [draggedItem, setDraggedItem] = useState<{ type: 'detector'|'receiver'|'repeater', id: number } | null>(null);

  // Alert Action Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAlertDevice, setSelectedAlertDevice] = useState<any>(null);

  // Load Data
  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true);
      try {
        const [detData, rcvData, rptData] = await Promise.all([
          DetectorAPI.getList({ marketName: market.name }),
          ReceiverAPI.getList({ marketName: market.name }),
          RepeaterAPI.getList({ marketName: market.name })
        ]);
        setDetectors(detData);
        setReceivers(rcvData);
        setRepeaters(rptData);
      } catch (e) {
        console.error("Failed to load devices for map", e);
      } finally {
        setLoading(false);
      }
    };
    loadDevices();
  }, [market.name]);

  // --- Drag & Drop Logic ---
  const handleDragStart = (e: React.DragEvent, type: 'detector'|'receiver'|'repeater', id: number) => {
    if (mode !== 'edit') return;
    setDraggedItem({ type, id });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (mode !== 'edit' || !draggedItem) return;
    e.preventDefault();

    const mapRect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - mapRect.left) / mapRect.width) * 100;
    const y = ((e.clientY - mapRect.top) / mapRect.height) * 100;

    // Optimistic Update & API Call
    if (draggedItem.type === 'detector') {
      setDetectors(prev => prev.map(d => d.id === draggedItem.id ? { ...d, x_pos: x, y_pos: y } : d));
      await DetectorAPI.saveCoordinates(draggedItem.id, x, y);
    } else if (draggedItem.type === 'receiver') {
      setReceivers(prev => prev.map(r => r.id === draggedItem.id ? { ...r, x_pos: x, y_pos: y } : r));
      await ReceiverAPI.saveCoordinates(draggedItem.id, x, y);
    } else if (draggedItem.type === 'repeater') {
      setRepeaters(prev => prev.map(r => r.id === draggedItem.id ? { ...r, x_pos: x, y_pos: y } : r));
      await RepeaterAPI.saveCoordinates(draggedItem.id, x, y);
    }

    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (mode === 'edit') e.preventDefault();
  };

  // --- Interaction Logic ---
  const handleDeviceClick = (device: any, type: string) => {
    if (mode === 'edit') return; // Edit mode: click does nothing (drag handles it)
    
    // Monitoring mode: Show Action Modal
    setSelectedAlertDevice({ ...device, type });
    setActionModalOpen(true);
  };

  const handleActionComplete = (action: string) => {
    alert(`${action} 처리가 완료되었습니다.`);
    setActionModalOpen(false);
    // In a real app, refresh data here
  };

  // --- Rendering Helpers ---
  const renderIcon = (item: any, type: 'detector'|'receiver'|'repeater') => {
    const isPlaced = item.x_pos !== undefined && item.x_pos !== null;
    const isFire = item.status === '화재' || item.status === 'Fire';
    const isError = item.status === '고장' || item.status === 'Error' || item.status === '에러';
    
    // Style based on type
    let shapeClass = "rounded-full"; // Detector: Circle
    let label = item.detectorId || item.repeaterId || "R";
    
    if (type === 'receiver') {
        shapeClass = "rounded-sm"; // Receiver: Square
        label = "M";
    } else if (type === 'repeater') {
        shapeClass = "rounded-md"; // Repeater: Rounded Square
        label = item.repeaterId;
    }

    let colorClass = "bg-green-600 border-green-400";
    if (isFire) colorClass = "bg-red-600 border-red-400 animate-pulse";
    else if (isError) colorClass = "bg-orange-500 border-orange-300";

    return (
      <div
        key={`${type}-${item.id}`}
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125
            ${mode === 'edit' ? 'cursor-move' : ''} group z-10
        `}
        style={{ left: `${item.x_pos}%`, top: `${item.y_pos}%` }}
        draggable={mode === 'edit'}
        onDragStart={(e) => handleDragStart(e, type, item.id)}
        onClick={() => handleDeviceClick(item, type)}
      >
        {isFire && <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>}
        
        <div className={`
            relative w-8 h-8 ${shapeClass} border-2 shadow-lg flex items-center justify-center text-xs font-bold text-white
            ${colorClass}
        `}>
            {label}
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
            {type === 'detector' ? `감지기 ${item.detectorId}` : (type === 'repeater' ? `중계기 ${item.repeaterId}` : `수신기`)}
            <br/>
            {item.status}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 shadow-md z-20">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MapIcon className="text-blue-400" />
                    {market.name} <span className="text-slate-400 text-sm font-normal">통합 관제 맵</span>
                </h2>
                <div className="flex bg-slate-700 rounded-lg p-1 border border-slate-600">
                    <button 
                        onClick={() => setMode('monitoring')}
                        className={`px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${mode === 'monitoring' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                    >
                        <Monitor size={14} /> 관제모드
                    </button>
                    <button 
                        onClick={() => setMode('edit')}
                        className={`px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${mode === 'edit' ? 'bg-orange-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                    >
                        <Settings size={14} /> 편집모드
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex gap-4 text-xs font-medium bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>정상</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>화재</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>고장</span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* Map Area */}
            <div 
                className="flex-1 relative bg-[#1a1a1a] overflow-hidden flex items-center justify-center select-none"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {market.mapImage ? (
                    <div className="relative w-full h-full">
                        <img 
                            src={market.mapImage} 
                            alt="Map" 
                            className="w-full h-full object-contain pointer-events-none"
                        />
                        {/* Render Placed Devices */}
                        {receivers.filter(d => d.x_pos).map(d => renderIcon(d, 'receiver'))}
                        {repeaters.filter(d => d.x_pos).map(d => renderIcon(d, 'repeater'))}
                        {detectors.filter(d => d.x_pos).map(d => renderIcon(d, 'detector'))}
                    </div>
                ) : (
                    <div className="text-center text-slate-500">
                        <MapIcon size={64} className="mx-auto mb-4 opacity-20" />
                        <p>등록된 도면 이미지가 없습니다.</p>
                        {mode === 'edit' && <p className="text-sm mt-2 text-blue-400">현장 관리에서 이미지를 등록해주세요.</p>}
                    </div>
                )}
            </div>

            {/* Sidebar (Only in Edit Mode) */}
            {mode === 'edit' && (
                <div className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col shadow-xl z-20">
                    <div className="p-4 border-b border-slate-700 font-bold text-white flex justify-between items-center">
                        <span>미배치 기기 목록</span>
                        <span className="text-xs font-normal text-slate-400 bg-slate-900 px-2 py-0.5 rounded">Drag & Drop</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                        {/* Receivers */}
                        <div>
                            <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">수신기 (Square)</div>
                            {receivers.filter(d => !d.x_pos).length === 0 && <div className="text-xs text-slate-600 pl-2">모두 배치됨</div>}
                            {receivers.filter(d => !d.x_pos).map(d => (
                                <div key={d.id} draggable onDragStart={(e) => handleDragStart(e, 'receiver', d.id)} className="bg-slate-700 p-2 rounded mb-2 cursor-move hover:bg-slate-600 border border-slate-600 flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                                    <span className="text-sm">MAC: {d.macAddress}</span>
                                </div>
                            ))}
                        </div>

                        {/* Repeaters */}
                        <div>
                            <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">중계기 (Rounded)</div>
                            {repeaters.filter(d => !d.x_pos).length === 0 && <div className="text-xs text-slate-600 pl-2">모두 배치됨</div>}
                            {repeaters.filter(d => !d.x_pos).map(d => (
                                <div key={d.id} draggable onDragStart={(e) => handleDragStart(e, 'repeater', d.id)} className="bg-slate-700 p-2 rounded mb-2 cursor-move hover:bg-slate-600 border border-slate-600 flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-md"></div>
                                    <span className="text-sm">ID: {d.repeaterId}</span>
                                </div>
                            ))}
                        </div>

                        {/* Detectors */}
                        <div>
                            <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">감지기 (Circle)</div>
                            {detectors.filter(d => !d.x_pos).length === 0 && <div className="text-xs text-slate-600 pl-2">모두 배치됨</div>}
                            {detectors.filter(d => !d.x_pos).map(d => (
                                <div key={d.id} draggable onDragStart={(e) => handleDragStart(e, 'detector', d.id)} className="bg-slate-700 p-2 rounded mb-2 cursor-move hover:bg-slate-600 border border-slate-600 flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-xs truncate">{d.receiverMac}-{d.repeaterId}-{d.detectorId}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Action Modal */}
        {actionModalOpen && selectedAlertDevice && (
            <Modal isOpen={actionModalOpen} onClose={() => setActionModalOpen(false)} title="기기 상세 및 제어" width="max-w-md">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 bg-slate-900 p-4 rounded border border-slate-700">
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold text-white
                            ${selectedAlertDevice.status === '화재' ? 'bg-red-600 animate-pulse' : 'bg-green-600'}
                        `}>
                            {selectedAlertDevice.detectorId || selectedAlertDevice.repeaterId || 'M'}
                        </div>
                        <div>
                            <div className="text-lg font-bold text-white">
                                {selectedAlertDevice.stores && selectedAlertDevice.stores.length > 0 ? selectedAlertDevice.stores[0].name : '위치 미지정'}
                            </div>
                            <div className="text-sm text-slate-400">
                                {selectedAlertDevice.type === 'detector' ? '화재감지기' : (selectedAlertDevice.type === 'repeater' ? '중계기' : '수신기')}
                                <span className="mx-2">|</span>
                                상태: <span className={selectedAlertDevice.status === '화재' ? 'text-red-400 font-bold' : 'text-green-400'}>{selectedAlertDevice.status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-3 rounded text-sm text-slate-300 border border-slate-600">
                        <p>MAC: {selectedAlertDevice.receiverMac}</p>
                        {selectedAlertDevice.repeaterId && <p>중계기 ID: {selectedAlertDevice.repeaterId}</p>}
                        {selectedAlertDevice.detectorId && <p>감지기 ID: {selectedAlertDevice.detectorId}</p>}
                        <p className="mt-2 text-xs text-slate-500">{selectedAlertDevice.memo || '비고 없음'}</p>
                    </div>

                    <div className="flex gap-2 justify-end mt-2">
                        {selectedAlertDevice.status === '화재' || selectedAlertDevice.status === '고장' ? (
                            <>
                                <Button variant="danger" onClick={() => handleActionComplete('오탐')}>오탐 처리</Button>
                                <Button variant="primary" onClick={() => handleActionComplete('복구')}>상태 복구</Button>
                            </>
                        ) : (
                            <Button variant="secondary" disabled>정상 상태</Button>
                        )}
                        <Button variant="secondary" onClick={() => setActionModalOpen(false)}>닫기</Button>
                    </div>
                </div>
            </Modal>
        )}
    </div>
  );
};
