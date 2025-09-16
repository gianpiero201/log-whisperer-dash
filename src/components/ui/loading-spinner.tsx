import React from 'react';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Size of the spinner
     */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    /**
     * Color variant of the spinner
     */
    variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'white' | 'current';
    /**
     * Text to show alongside the spinner
     */
    text?: string;
    /**
     * Show text below the spinner instead of beside it
     */
    vertical?: boolean;
}

const sizeClasses = {
    xs: 'h-3 w-3 border',
    sm: 'h-4 w-4 border',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2',
    xl: 'h-12 w-12 border-2',
    xxl: 'h-16 w-16 border-2',
};

const variantClasses = {
    default: 'text-blue-600 border-blue-600',
    secondary: 'text-gray-500 border-gray-500',
    destructive: 'text-red-600 border-red-600',
    success: 'text-green-600 border-green-600',
    warning: 'text-yellow-600 border-yellow-600',
    white: 'text-white border-white',
    current: 'text-current border-current',
};

const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    xxl: 'text-xl',
};

export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
    ({
        size = 'md',
        variant = 'default',
        text,
        vertical = false,
        className = '',
        ...props
    }, ref) => {
        const spinnerClasses = [
            'animate-spin rounded-full border-solid border-r-transparent',
            sizeClasses[size],
            variantClasses[variant],
            className
        ].filter(Boolean).join(' ');

        const spinnerElement = (
            <div
                className={spinnerClasses}
                role="status"
                aria-label="Loading"
                {...props}
                ref={ref}
            >
                <span className="sr-only">Loading...</span>
            </div>
        );

        if (!text) {
            return spinnerElement;
        }

        const containerClasses = vertical
            ? 'flex flex-col items-center gap-3'
            : 'flex items-center gap-2';

        const textClasses = [
            'text-gray-600',
            textSizeClasses[size]
        ].join(' ');

        return (
            <div className={containerClasses}>
                {spinnerElement}
                <span className={textClasses}>
                    {text}
                </span>
            </div>
        );
    }
);

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;

// Additional loading components for specific use cases

/**
 * Full page loading overlay
 */
export const LoadingOverlay: React.FC<{
    text?: string;
    size?: LoadingSpinnerProps['size'];
}> = ({ text = 'Loading...', size = 'xl' }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6 shadow-xl">
            <LoadingSpinner size={size} text={text} vertical />
        </div>
    </div>
);

/**
 * Loading button state
 */
export const LoadingButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    children: React.ReactNode;
}> = ({ loading = false, disabled, children, className = '', ...props }) => (
    <button
        className={`relative ${className}`}
        disabled={disabled || loading}
        {...props}
    >
        {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="sm" variant="white" />
            </span>
        )}
        <span className={loading ? 'invisible' : ''}>
            {children}
        </span>
    </button>
);

/**
 * Loading card placeholder
 */
export const LoadingCard: React.FC<{
    text?: string;
    height?: string;
}> = ({ text = 'Loading content...', height = 'h-64' }) => (
    <div className={`${height} flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50`}>
        <LoadingSpinner text={text} vertical />
    </div>
);

/**
 * Skeleton loader for text content
 */
export const LoadingSkeleton: React.FC<{
    lines?: number;
    className?: string;
}> = ({ lines = 3, className = '' }) => (
    <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
            <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                {index === lines - 1 && (
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                )}
            </div>
        ))}
    </div>
);

/**
 * Loading dots animation
 */
export const LoadingDots: React.FC<{
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}> = ({ size = 'md', className = '' }) => {
    const dotSizes = {
        sm: 'w-1 h-1',
        md: 'w-2 h-2',
        lg: 'w-3 h-3'
    };

    const dotSize = dotSizes[size];

    return (
        <div className={`flex space-x-1 ${className}`}>
            {[0, 1, 2].map((index) => (
                <div
                    key={index}
                    className={`${dotSize} bg-gray-600 rounded-full animate-bounce`}
                    style={{
                        animationDelay: `${index * 0.1}s`,
                        animationDuration: '0.8s'
                    }}
                />
            ))}
        </div>
    );
};