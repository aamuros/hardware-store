// Skeleton loading components for better UX
import React from 'react';

// Base skeleton with pulse animation
const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse bg-neutral-200 rounded ${className}`}
    {...props}
  />
);

// Product card skeleton
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  </div>
);

// Product grid skeleton (multiple cards)
export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

// Category card skeleton
export const CategoryCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
);

// Category list skeleton
export const CategoryListSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CategoryCardSkeleton key={i} />
    ))}
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr className="border-b">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead>
        <tr className="bg-neutral-50">
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-4 py-3">
              <Skeleton className="h-4 w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

// Order card skeleton
export const OrderCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="flex justify-between items-center pt-2 border-t">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>
  </div>
);

// Order list skeleton
export const OrderListSkeleton = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <OrderCardSkeleton key={i} />
    ))}
  </div>
);

// Dashboard stats skeleton
export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

// Product detail skeleton
export const ProductDetailSkeleton = () => (
  <div className="max-w-4xl mx-auto">
    <div className="grid md:grid-cols-2 gap-8">
      <Skeleton className="h-96 w-full rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-10 w-32" />
        <div className="flex space-x-4 pt-4">
          <Skeleton className="h-12 w-32 rounded-md" />
          <Skeleton className="h-12 w-40 rounded-md" />
        </div>
      </div>
    </div>
  </div>
);

// Form field skeleton
export const FormFieldSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-full rounded-md" />
  </div>
);

// Form skeleton
export const FormSkeleton = ({ fields = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <FormFieldSkeleton key={i} />
    ))}
    <Skeleton className="h-10 w-32 rounded-md mt-4" />
  </div>
);

// Page header skeleton
export const PageHeaderSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-72" />
  </div>
);

// Inline text skeleton
export const TextSkeleton = ({ width = 'w-24' }) => (
  <Skeleton className={`h-4 ${width} inline-block`} />
);

export default Skeleton;
