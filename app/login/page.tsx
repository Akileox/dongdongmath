import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black relative overflow-hidden">
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black opacity-80" />

            {/* Decorative 'Track' Lines */}
            <div className="absolute inset-0 opacity-20 transform -skew-x-12">
                <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white/10" />
                <div className="absolute left-2/4 top-0 bottom-0 w-px bg-white/10" />
                <div className="absolute left-3/4 top-0 bottom-0 w-px bg-white/10" />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2 font-sans tracking-tight">DONGDONG MATH</h1>
                    <p className="text-gray-400 text-sm">Team DJ : The Winning Pace</p>
                </div>

                <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl">
                    <div className="bg-white/95 rounded-lg p-1">
                        <LoginForm />
                    </div>
                </div>

                <p className="mt-8 text-xs text-gray-500">
                    &copy; 2025 TEAM DJ Math Institute.
                </p>
            </div>
        </main>
    )
}
