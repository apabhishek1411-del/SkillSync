/**
 * SkillSphere Logo — SVG orbit-ring mark
 * Props:
 *   variant: 'dark' | 'light' (default: 'dark')
 *   showText: boolean (default: true)
 *   size: 'sm' | 'md' | 'lg' (default: 'md')
 */
export default function Logo({ variant = 'dark', showText = true, size = 'md' }) {
    const sizes = {
        sm: { icon: 28, text: 'text-lg',  gap: 'gap-1.5' },
        md: { icon: 36, text: 'text-xl',  gap: 'gap-2'   },
        lg: { icon: 48, text: 'text-3xl', gap: 'gap-3'   },
    };
    const s = sizes[size] || sizes.md;
    const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';
    const subColor  = variant === 'light' ? 'text-white/70' : 'text-primary-600';

    return (
        <span className={`inline-flex items-center ${s.gap}`}>
            {/* SVG Mark */}
            <svg
                width={s.icon}
                height={s.icon}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                {/* Outer ring */}
                <circle cx="24" cy="24" r="22" stroke="url(#ring-outer)" strokeWidth="2.5" opacity="0.4" />
                {/* Mid ring */}
                <circle cx="24" cy="24" r="15" stroke="url(#ring-mid)" strokeWidth="2" opacity="0.65" />
                {/* Core circle */}
                <circle cx="24" cy="24" r="10" fill="url(#core-fill)" />
                {/* S letterform */}
                <text
                    x="24" y="29"
                    textAnchor="middle"
                    fontFamily="Inter, system-ui, sans-serif"
                    fontWeight="800"
                    fontSize="13"
                    fill="white"
                >S</text>
                {/* Orbit dots */}
                <circle cx="24" cy="2"  r="2.5" fill="url(#dot-fill)" />
                <circle cx="46" cy="24" r="2.5" fill="url(#dot-fill)" opacity="0.7" />
                <circle cx="24" cy="46" r="2.5" fill="url(#dot-fill)" opacity="0.5" />
                <circle cx="2"  cy="24" r="2.5" fill="url(#dot-fill)" opacity="0.3" />
                {/* Gradient defs */}
                <defs>
                    <linearGradient id="ring-outer" x1="0" y1="0" x2="48" y2="48">
                        <stop offset="0%"   stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="ring-mid" x1="0" y1="0" x2="48" y2="48">
                        <stop offset="0%"   stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="core-fill" x1="0" y1="0" x2="48" y2="48">
                        <stop offset="0%"   stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="dot-fill" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%"   stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Wordmark */}
            {showText && (
                <span className={`font-black tracking-tight leading-none ${s.text} ${textColor}`}>
                    Skill<span className={subColor}>Sphere</span>
                </span>
            )}
        </span>
    );
}
