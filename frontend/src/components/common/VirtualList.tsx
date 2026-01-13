/**
 * ============================================
 * VIRTUAL LIST COMPONENT
 * ============================================
 *
 * Virtual scrolling for large lists using react-window.
 * Only renders visible items for optimal performance.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { memo, useCallback, CSSProperties } from 'react';
import { FixedSizeList, VariableSizeList, areEqual } from 'react-window';
import type { ListChildComponentProps } from 'react-window';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

export interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  className?: string;
  overscanCount?: number;
  onItemsRendered?: (props: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => void;
  width?: number | string;
  emptyMessage?: string;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
}

interface RowData<T> {
  items: T[];
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
}

// ============================================
// FIXED SIZE VIRTUAL LIST
// ============================================

function FixedRow<T>({ data, index, style }: ListChildComponentProps<RowData<T>>) {
  const { items, renderItem } = data;
  const item = items[index];
  if (item === undefined) return null;

  return <>{renderItem(item, index, style)}</>;
}

const MemoizedFixedRow = memo(FixedRow, areEqual) as typeof FixedRow;

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscanCount = 5,
  onItemsRendered,
  width = '100%',
  emptyMessage = 'No items to display',
  loading = false,
  loadingComponent,
}: VirtualListProps<T>) {
  // Handle empty state
  if (items.length === 0 && !loading) {
    return (
      <div
        className={clsx('flex items-center justify-center text-gray-500', className)}
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  // Handle loading state
  if (loading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  // Fixed size list (constant item height)
  if (typeof itemHeight === 'number') {
    return (
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width={width}
        className={className}
        overscanCount={overscanCount}
        onItemsRendered={onItemsRendered}
        itemData={{
          items,
          renderItem: renderItem as (
            item: unknown,
            index: number,
            style: CSSProperties
          ) => React.ReactNode,
        }}
      >
        {MemoizedFixedRow as React.ComponentType<ListChildComponentProps<RowData<unknown>>>}
      </FixedSizeList>
    );
  }

  // Variable size list (dynamic item height)
  return (
    <VariableSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      className={className}
      overscanCount={overscanCount}
      onItemsRendered={onItemsRendered}
      itemData={{
        items,
        renderItem: renderItem as (
          item: unknown,
          index: number,
          style: CSSProperties
        ) => React.ReactNode,
      }}
    >
      {MemoizedFixedRow as React.ComponentType<ListChildComponentProps<RowData<unknown>>>}
    </VariableSizeList>
  );
}

// ============================================
// VIRTUAL TABLE
// ============================================

export interface VirtualTableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: number | string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface VirtualTableProps<T> {
  items: T[];
  columns: VirtualTableColumn<T>[];
  height: number;
  rowHeight?: number;
  headerHeight?: number;
  className?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  onRowClick?: (item: T, index: number) => void;
  selectedIndex?: number;
  loading?: boolean;
  emptyMessage?: string;
}

export function VirtualTable<T extends Record<string, any>>({
  items,
  columns,
  height,
  rowHeight = 48,
  headerHeight = 48,
  className,
  rowClassName,
  onRowClick,
  selectedIndex,
  loading = false,
  emptyMessage = 'No data available',
}: VirtualTableProps<T>) {
  const renderRow = useCallback(
    (item: T, index: number, style: CSSProperties) => {
      const isSelected = selectedIndex === index;
      const rowClass =
        typeof rowClassName === 'function' ? rowClassName(item, index) : rowClassName;

      return (
        <div
          style={style}
          className={clsx(
            'flex items-center border-b border-gray-100 px-4',
            onRowClick && 'cursor-pointer hover:bg-gray-50',
            isSelected && 'bg-gold-50',
            rowClass
          )}
          onClick={() => onRowClick?.(item, index)}
        >
          {columns.map((column) => {
            const value = column.key in item ? item[column.key as keyof T] : null;

            return (
              <div
                key={String(column.key)}
                className={clsx('truncate', column.className)}
                style={{
                  width: column.width,
                  flex: column.width ? undefined : 1,
                }}
              >
                {column.render ? column.render(item, index) : String(value ?? '')}
              </div>
            );
          })}
        </div>
      );
    },
    [columns, onRowClick, rowClassName, selectedIndex]
  );

  return (
    <div className={clsx('border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Table Header */}
      <div
        className="flex items-center bg-gray-50 border-b border-gray-200 px-4 font-medium text-gray-700"
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className={clsx('truncate', column.headerClassName)}
            style={{
              width: column.width,
              flex: column.width ? undefined : 1,
            }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtualized Rows */}
      <VirtualList
        items={items}
        height={height - headerHeight}
        itemHeight={rowHeight}
        renderItem={renderRow}
        loading={loading}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}

// ============================================
// INFINITE SCROLL LIST
// ============================================

export interface InfiniteScrollListProps<T> extends VirtualListProps<T> {
  hasMore: boolean;
  loadMore: () => void;
  loadingMore?: boolean;
  loadMoreThreshold?: number;
}

export function InfiniteScrollList<T>({
  items,
  hasMore,
  loadMore,
  loadingMore = false,
  loadMoreThreshold = 5,
  onItemsRendered,
  ...props
}: InfiniteScrollListProps<T>) {
  const handleItemsRendered = useCallback(
    (renderProps: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => {
      onItemsRendered?.(renderProps);

      // Load more when approaching the end
      if (
        hasMore &&
        !loadingMore &&
        renderProps.visibleStopIndex >= items.length - loadMoreThreshold
      ) {
        loadMore();
      }
    },
    [hasMore, loadingMore, loadMore, items.length, loadMoreThreshold, onItemsRendered]
  );

  return <VirtualList {...props} items={items} onItemsRendered={handleItemsRendered} />;
}

// ============================================
// AUTO-SIZER WRAPPER
// ============================================

interface AutoSizerProps {
  children: (size: { width: number; height: number }) => React.ReactNode;
  className?: string;
}

export function AutoSizer({ children, className }: AutoSizerProps) {
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    resizeObserver.observe(container);

    // Initial size
    const rect = container.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={clsx('w-full h-full', className)}>
      {size.width > 0 && size.height > 0 && children(size)}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export { FixedSizeList, VariableSizeList } from 'react-window';
