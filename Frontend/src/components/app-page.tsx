export default function AppPage({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <>
            <div className={`flex w-full h-full flex-col mt-14 pb-22 p-8 overflow-y-auto sp-page-anim ${className}`}>
                {children}
            </div>
        </>
    );
}