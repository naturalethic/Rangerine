export default function ({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-zinc-700">
            <div className="text-orange-600 text-6xl font-sacramento mb-10">
                Tangerine
            </div>
            {children}
        </div>
    );
}
