export default function EducatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-start py-8 px-4">
      {children}
    </div>
  );
} 