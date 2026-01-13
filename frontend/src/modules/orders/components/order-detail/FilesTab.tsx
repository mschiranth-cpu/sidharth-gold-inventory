/**
 * ============================================
 * FILES TAB - ORDER DETAIL PAGE
 * ============================================
 *
 * Gallery of uploaded photos organized by category
 * with lightbox view and download functionality.
 * Supports department-level filtering for work files.
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { format, parseISO } from 'date-fns';
import { OrderFile } from '../../types';

// Lazy load CADFilePreview to avoid Three.js loading issues
const CADFilePreview = lazy(() =>
  import('../../../../components/files/CADFilePreview').then((mod) => ({
    default: mod.CADFilePreview,
  }))
);

interface FilesTabProps {
  files: OrderFile[];
  canUpload: boolean;
  onUpload?: () => void;
  onDelete?: (fileId: string) => void;
}

type FileCategory = 'all' | 'product' | 'department' | 'completion' | 'reference' | 'other';

// Department display names
const DEPARTMENT_DISPLAY_NAMES: Record<string, string> = {
  CAD: 'CAD Design',
  PRINT: '3D Print',
  CASTING: 'Casting',
  FILLING: 'Filling',
  MEENA: 'Meena Work',
  POLISH_1: 'Polish 1',
  SETTING: 'Stone Setting',
  POLISH_2: 'Polish 2',
  ADDITIONAL: 'Finishing Touch',
};

// Photo category to human-readable labels
const PHOTO_CATEGORY_LABELS: Record<string, string> = {
  // CAD Department
  topView: 'Top View Render',
  sideView: 'Side View Render',
  perspectiveView: 'Perspective View Render',
  detailViews: 'Detail View',
  cadFile: 'CAD Model File',
  technicalDrawing: 'Technical Drawing',
  // 3D Print Department
  printedModel: 'Printed Model',
  printQuality: 'Print Quality Check',
  supportRemoval: 'Support Removal',
  // Casting Department
  waxModel: 'Wax Model',
  castingResult: 'Casting Result',
  roughCasting: 'Rough Casting',
  // Filing Department
  filedPiece: 'Filed Piece',
  shapeRefinement: 'Shape Refinement',
  // Meena Department
  meenaWork: 'Meena Work',
  colorDetails: 'Color Details',
  // Polish Department
  polishedPiece: 'Polished Piece',
  finishQuality: 'Finish Quality',
  // Setting Department
  stonesSetting: 'Stones Setting',
  settingDetail: 'Setting Detail',
  // General
  beforePhoto: 'Before Photo',
  afterPhoto: 'After Photo',
  progressPhoto: 'Progress Photo',
  qualityCheck: 'Quality Check',
  reference: 'Reference',
};

const FilesTab: React.FC<FilesTabProps> = ({ files, canUpload, onUpload, onDelete }) => {
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showDepartmentFilter, setShowDepartmentFilter] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<OrderFile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Enhanced Lightbox State (Phase 12)
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [showCADViewer, setShowCADViewer] = useState(false);

  const categories: { value: FileCategory; label: string; icon: React.ReactNode }[] = [
    {
      value: 'all',
      label: 'All Files',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      value: 'product',
      label: 'Product Photos',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      value: 'department',
      label: 'Department Photos',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      value: 'completion',
      label: 'Completion Photos',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      value: 'reference',
      label: 'Reference',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
  ];

  // Get unique departments from files
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    files.forEach((f) => {
      if (f.category === 'department' && f.departmentName) {
        depts.add(f.departmentName);
      }
    });
    return Array.from(depts).sort((a, b) => {
      // Sort by department order
      const order = [
        'CAD',
        'PRINT',
        'CASTING',
        'FILLING',
        'MEENA',
        'POLISH_1',
        'SETTING',
        'POLISH_2',
        'ADDITIONAL',
      ];
      return order.indexOf(a) - order.indexOf(b);
    });
  }, [files]);

  // Count files per department
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    files.forEach((f) => {
      if (f.category === 'department') {
        counts.all = (counts.all || 0) + 1;
        if (f.departmentName) {
          counts[f.departmentName] = (counts[f.departmentName] || 0) + 1;
        }
      }
    });
    return counts;
  }, [files]);

  // Filter files based on category and department
  const filteredFiles = useMemo(() => {
    let result = files;

    // First filter by main category
    if (selectedCategory !== 'all') {
      result = result.filter((f) => f.category === selectedCategory);
    }

    // Then filter by department if department category is selected
    if (selectedCategory === 'department' && selectedDepartment !== 'all') {
      result = result.filter((f) => f.departmentName === selectedDepartment);
    }

    return result;
  }, [files, selectedCategory, selectedDepartment]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check if file is a CAD file (3D model)
  const isCADFile = (file: OrderFile): boolean => {
    const extension = file.filename.split('.').pop()?.toLowerCase() || '';
    const cadExtensions = ['stl', 'obj', '3dm', 'gltf', 'glb', 'step', 'stp', 'iges', 'igs'];
    return cadExtensions.includes(extension);
  };

  const getCategoryLabel = (category: string) => {
    return categories.find((c) => c.value === category)?.label || category;
  };

  // Get human-readable label for file
  const getFileDisplayName = (file: OrderFile): string => {
    // For reference files, keep the original numbered filename (e.g., "Reference Image 1")
    if (file.category === 'reference' && file.filename.toLowerCase().includes('reference')) {
      return file.filename;
    }

    // Try to extract category from filename (e.g., "topView_1234567.jpg" -> "topView")
    const filenameMatch = file.filename.match(/^([a-zA-Z]+)_\d+/);
    if (filenameMatch && filenameMatch[1]) {
      const categoryKey = filenameMatch[1];
      const label = PHOTO_CATEGORY_LABELS[categoryKey];
      if (label) {
        return label;
      }
    }

    // Check if filename contains known patterns (but not for reference category)
    if (file.category !== 'reference') {
      for (const [key, label] of Object.entries(PHOTO_CATEGORY_LABELS)) {
        if (file.filename.toLowerCase().includes(key.toLowerCase())) {
          return label;
        }
      }
    }

    // Check file extension for CAD files
    const extension = file.filename.split('.').pop()?.toLowerCase() || '';
    const cadExtensions: Record<string, string> = {
      stl: 'CAD Model File (STL)',
      obj: 'CAD Model File (OBJ)',
      '3dm': 'CAD Model File (3DM)',
      step: 'CAD Model File (STEP)',
      stp: 'CAD Model File (STEP)',
      iges: 'CAD Model File (IGES)',
      igs: 'CAD Model File (IGES)',
      dwg: 'CAD Drawing (DWG)',
      dxf: 'CAD Drawing (DXF)',
    };
    if (cadExtensions[extension]) {
      return cadExtensions[extension];
    }

    // Check for temp files (uploaded CAD files often have temp prefix)
    if (file.filename.startsWith('temp') && file.fileType === 'document') {
      // Try to determine type from size or just label as CAD file
      return 'CAD Model File';
    }

    // Fallback to formatted filename
    return (
      file.filename
        .replace(/[_-]/g, ' ')
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/\d{10,}/g, '') // Remove long numbers (timestamps)
        .trim() || file.filename
    );
  };

  // Estimate file size from base64 URL if size is 0
  const getDisplaySize = (file: OrderFile): number => {
    if (file.size > 0) return file.size;

    // Estimate size from base64 URL (base64 is ~4/3 of original size)
    if (file.url.startsWith('data:')) {
      const base64Part = file.url.split(',')[1] || '';
      return Math.round((base64Part.length * 3) / 4);
    }

    return 0;
  };

  // Get department display name
  const getDepartmentDisplayName = (deptName: string): string => {
    return DEPARTMENT_DISPLAY_NAMES[deptName] || deptName;
  };

  // Get badge color based on department
  const getDepartmentBadgeColor = (deptName: string): string => {
    const colors: Record<string, string> = {
      CAD: 'bg-purple-100 text-purple-700',
      PRINT: 'bg-blue-100 text-blue-700',
      CASTING: 'bg-orange-100 text-orange-700',
      FILLING: 'bg-amber-100 text-amber-700',
      MEENA: 'bg-pink-100 text-pink-700',
      POLISH_1: 'bg-cyan-100 text-cyan-700',
      SETTING: 'bg-emerald-100 text-emerald-700',
      POLISH_2: 'bg-teal-100 text-teal-700',
      ADDITIONAL: 'bg-gray-100 text-gray-700',
      reference: 'bg-indigo-100 text-indigo-700',
    };
    return colors[deptName] || 'bg-gray-100 text-gray-700';
  };

  const handleDownload = (file: OrderFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCategoryClick = (category: FileCategory) => {
    setSelectedCategory(category);
    if (category === 'department') {
      setShowDepartmentFilter(true);
    } else {
      setShowDepartmentFilter(false);
      setSelectedDepartment('all');
    }
  };

  // ============================================
  // ENHANCED LIGHTBOX FUNCTIONALITY (Phase 12)
  // ============================================

  // Get only image files for navigation
  const imageFiles = useMemo(() => {
    return filteredFiles.filter((f) => f.fileType === 'image');
  }, [filteredFiles]);

  // Open lightbox with specific image
  const openLightbox = useCallback(
    (file: OrderFile) => {
      const index = imageFiles.findIndex((f) => f.id === file.id);
      setLightboxImage(file);
      setCurrentImageIndex(index);
      setZoomLevel(1);
    },
    [imageFiles]
  );

  // Close lightbox
  const closeLightbox = useCallback(() => {
    setLightboxImage(null);
    setZoomLevel(1);
    setShowCADViewer(false);
  }, []);

  // Navigate to previous image
  const showPreviousImage = useCallback(() => {
    if (imageFiles.length === 0) return;
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : imageFiles.length - 1;
    setCurrentImageIndex(newIndex);
    const prevImage = imageFiles[newIndex];
    if (prevImage) setLightboxImage(prevImage);
    setZoomLevel(1);
  }, [imageFiles, currentImageIndex]);

  // Navigate to next image
  const showNextImage = useCallback(() => {
    if (imageFiles.length === 0) return;
    const newIndex = currentImageIndex < imageFiles.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    const nextImage = imageFiles[newIndex];
    if (nextImage) setLightboxImage(nextImage);
    setZoomLevel(1);
  }, [imageFiles, currentImageIndex]);

  // Zoom in
  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  }, []);

  // Zoom out
  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  // Reset zoom
  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Keyboard shortcuts for lightbox
  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          showPreviousImage();
          break;
        case 'ArrowRight':
          showNextImage();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
        case '_':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, closeLightbox, showPreviousImage, showNextImage, zoomIn, zoomOut, resetZoom]);

  // ============================================
  // END ENHANCED LIGHTBOX FUNCTIONALITY
  // ============================================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Main Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const count =
                cat.value === 'all'
                  ? files.length
                  : files.filter((f) => f.category === cat.value).length;

              const isSelected = selectedCategory === cat.value;
              const hasDepartmentFilter = cat.value === 'department' && count > 0;

              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryClick(cat.value)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      isSelected
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                    }
                  `}
                >
                  {cat.icon}
                  <span className="hidden sm:inline">{cat.label}</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-xs">{count}</span>
                  {hasDepartmentFilter && (
                    <svg
                      className={`w-3 h-3 ml-0.5 transition-transform ${
                        isSelected && showDepartmentFilter ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            {canUpload && (
              <button
                onClick={onUpload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload
              </button>
            )}
          </div>
        </div>

        {/* Department Sub-filter (only visible when Department Photos is selected) */}
        {selectedCategory === 'department' &&
          showDepartmentFilter &&
          availableDepartments.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-indigo-200">
              <button
                onClick={() => setSelectedDepartment('all')}
                className={`
                px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${
                  selectedDepartment === 'all'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
              >
                All Departments ({departmentCounts.all || 0})
              </button>
              {availableDepartments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`
                  px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${
                    selectedDepartment === dept
                      ? 'bg-indigo-500 text-white'
                      : getDepartmentBadgeColor(dept) + ' hover:opacity-80'
                  }
                `}
                >
                  {getDepartmentDisplayName(dept)} ({departmentCounts[dept] || 0})
                </button>
              ))}
            </div>
          )}
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-gray-900 font-medium mb-1">No files yet</h3>
          <p className="text-gray-500 text-sm mb-4">
            {selectedCategory === 'all'
              ? 'No files have been uploaded for this order.'
              : selectedDepartment !== 'all'
              ? `No files from ${getDepartmentDisplayName(selectedDepartment)} yet.`
              : `No ${getCategoryLabel(selectedCategory).toLowerCase()} uploaded yet.`}
          </p>
          {canUpload && (
            <button
              onClick={onUpload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Upload First File
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {file.fileType === 'image' ? (
                <button onClick={() => openLightbox(file)} className="w-full aspect-square">
                  <img
                    src={file.thumbnailUrl || file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                  />
                </button>
              ) : isCADFile(file) ? (
                <button
                  onClick={() => {
                    setLightboxImage(file);
                    setShowCADViewer(true);
                  }}
                  className="w-full aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors"
                >
                  {/* 3D Cube Icon */}
                  <svg
                    className="w-16 h-16 text-indigo-500 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span className="text-sm font-medium text-indigo-700">3D Model</span>
                  <span className="text-xs text-indigo-500 mt-1">Click to view</span>
                </button>
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-gray-50">
                  <svg
                    className="w-12 h-12 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              )}

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {file.fileType === 'image' && (
                  <button
                    onClick={() => openLightbox(file)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                >
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
                {canUpload && (
                  <button
                    onClick={() => onDelete?.(file.id)}
                    className="p-2 bg-white rounded-full hover:bg-red-50"
                  >
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Category Badge */}
              <div className="absolute top-2 left-2">
                <span
                  className={`px-2 py-0.5 backdrop-blur-sm text-xs font-medium rounded-full ${
                    file.departmentName
                      ? getDepartmentBadgeColor(file.departmentName)
                      : 'bg-white/90 text-gray-700'
                  }`}
                >
                  {file.departmentName
                    ? getDepartmentDisplayName(file.departmentName)
                    : file.category}
                </span>
              </div>

              {/* File Info */}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
                  {getFileDisplayName(file)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatFileSize(getDisplaySize(file))} •{' '}
                  {format(parseISO(file.uploadedAt), 'MMM dd')}
                </p>
                {file.uploadedBy && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">by {file.uploadedBy}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
          {filteredFiles.map((file) => (
            <div key={file.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {file.fileType === 'image' ? (
                  <img
                    src={file.thumbnailUrl || file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => openLightbox(file)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{getFileDisplayName(file)}</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {file.departmentName && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDepartmentBadgeColor(
                        file.departmentName
                      )}`}
                    >
                      {getDepartmentDisplayName(file.departmentName)}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {formatFileSize(getDisplaySize(file))}
                  </span>
                  {file.uploadedBy && (
                    <span className="text-xs text-gray-500">by {file.uploadedBy}</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {format(parseISO(file.uploadedAt), 'MMM dd, yyyy h:mm a')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
                {canUpload && (
                  <button
                    onClick={() => onDelete?.(file.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================ */}
      {/* ENHANCED LIGHTBOX (Phase 12) */}
      {/* ============================================ */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Backdrop - clicking outside closes */}
          <div className="absolute inset-0" onClick={closeLightbox} />

          {/* Close button - Mobile responsive */}
          <button
            onClick={closeLightbox}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 p-2 sm:p-3 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 z-20 transition-all"
            aria-label="Close lightbox (ESC)"
          >
            <svg
              className="w-5 sm:w-6 h-5 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Navigation - Previous - Mobile responsive */}
          {imageFiles.length > 1 && (
            <>
              <button
                onClick={showPreviousImage}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 z-20 transition-all"
                aria-label="Previous image (←)"
              >
                <svg
                  className="w-5 sm:w-6 h-5 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Navigation - Next - Mobile responsive */}
              <button
                onClick={showNextImage}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 z-20 transition-all"
                aria-label="Next image (→)"
              >
                <svg
                  className="w-5 sm:w-6 h-5 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Zoom Controls - Top Left (Only for images) - Mobile responsive */}
          {!showCADViewer && (
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex flex-col gap-1.5 sm:gap-2 z-20">
              <button
                onClick={zoomIn}
                className="p-1.5 sm:p-2.5 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-all"
                aria-label="Zoom in (+)"
              >
                <svg
                  className="w-4 sm:w-5 h-4 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                  />
                </svg>
              </button>
              <button
                onClick={zoomOut}
                className="p-1.5 sm:p-2.5 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-all"
                aria-label="Zoom out (-)"
              >
                <svg
                  className="w-4 sm:w-5 h-4 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6"
                  />
                </svg>
              </button>
              <button
                onClick={resetZoom}
                className="p-1.5 sm:p-2.5 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-all"
                aria-label="Reset zoom (0)"
              >
                <svg
                  className="w-4 sm:w-5 h-4 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Zoom Level Indicator (Only for images) - Responsive */}
          {!showCADViewer && (
            <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/50 backdrop-blur-sm text-white text-xs sm:text-sm rounded-full z-20">
              {Math.round(zoomLevel * 100)}%
            </div>
          )}

          {/* Image Counter - Responsive */}
          {imageFiles.length > 1 && (
            <div className="absolute top-2 sm:top-4 right-14 sm:right-20 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/50 backdrop-blur-sm text-white text-xs sm:text-sm rounded-full z-20">
              {currentImageIndex + 1} / {imageFiles.length}
            </div>
          )}

          {/* Main Content - Image or CAD Viewer */}
          {showCADViewer && isCADFile(lightboxImage) ? (
            <div className="relative z-10 w-full h-full">
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                      <p className="text-white">Loading 3D Viewer...</p>
                    </div>
                  </div>
                }
              >
                <CADFilePreview fileUrl={lightboxImage.url} fileName={lightboxImage.filename} />
              </Suspense>
            </div>
          ) : (
            <div className="relative z-10 max-w-full max-h-full overflow-auto">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.filename}
                className="transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center',
                  maxWidth: zoomLevel > 1 ? 'none' : '100%',
                  maxHeight: zoomLevel > 1 ? 'none' : '100%',
                }}
              />
            </div>
          )}

          {/* Image Info - Bottom - Responsive */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl bg-black/70 backdrop-blur-sm text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm z-20 flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            {lightboxImage.departmentName && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDepartmentBadgeColor(
                  lightboxImage.departmentName
                )}`}
              >
                {getDepartmentDisplayName(lightboxImage.departmentName)}
              </span>
            )}
            <span className="font-medium">{getFileDisplayName(lightboxImage)}</span>
            {lightboxImage.uploadedBy && (
              <span className="text-white/70">• {lightboxImage.uploadedBy}</span>
            )}
          </div>

          {/* Download Button - Bottom Right - Responsive */}
          <button
            onClick={() => handleDownload(lightboxImage)}
            className="absolute bottom-4 right-2 sm:right-4 p-2 sm:p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 z-20 transition-all"
            aria-label="Download image"
          >
            <svg
              className="w-4 sm:w-5 h-4 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>

          {/* Keyboard Shortcuts Hint - Bottom Left */}
          <div className="absolute bottom-4 left-4 px-3 py-2 bg-black/50 backdrop-blur-sm text-white text-xs rounded-lg z-20 hidden md:block">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white/20 rounded">ESC</kbd>
                <span className="text-white/70">Close</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white/20 rounded">← →</kbd>
                <span className="text-white/70">Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white/20 rounded">+ - 0</kbd>
                <span className="text-white/70">Zoom</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesTab;
