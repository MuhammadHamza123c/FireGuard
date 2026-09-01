import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/[0.03] rounded-full blur-[100px]" />
      </div>

      <Sidebar />

      <main className="ml-20 relative z-10">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
