import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertConfig {
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
}

export interface EnhancedAlertProps {
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    onOrderConfirmed?: () => void;
    confirmText?: string;
}

export default function EnhancedAlert({
    isOpen,
    type,
    title,
    message,
    onClose,
    onConfirm,
    onOrderConfirmed,
    confirmText = title === "Sign In Required" ? "Please sign in" : "OK"
}: EnhancedAlertProps) {
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
        } else {
            const timer = setTimeout(() => {
                setMounted(false);
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="w-12 h-12 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-12 h-12 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
            case 'info':
            default:
                return <Info className="w-12 h-12 text-blue-500" />;
        }
    };

    const getStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-800',
                    buttonBg: 'bg-green-600 hover:bg-green-700'
                };
            case 'error':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    buttonBg: 'bg-red-600 hover:bg-red-700'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    buttonBg: 'bg-yellow-600 hover:bg-yellow-700'
                };
            default:
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-800',
                    buttonBg: 'bg-blue-600 hover:bg-blue-700'
                };
        }
    };

    const styles = getStyles();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 transition-opacity duration-200"
                onClick={() => {
                    if (title === "Order Submitted") {
                        navigate('/');
                    }
                    onClose();
                }}
            />

            <div className={`relative w-full max-w-md rounded-lg border ${styles.bg} ${styles.border} shadow-lg`}>
                <button
                    onClick={() => {
                        if (title === "Order Submitted") {
                            navigate('/');
                        }
                        onClose();
                    }}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    <div className="flex items-center mb-4">
                        {getIcon()}
                        <h2 className={`ml-3 text-xl font-semibold ${type === 'error' ? 'text-black' : styles.text}`}>
                            {title}
                        </h2>
                    </div>

                    <p className="text-black mb-6 font-semibold">
                        {message}
                    </p>

                    <div className="flex gap-3 justify-end">
                        {title === "Sign In Required" ? (
                            <button
                                onClick={() => {
                                    onClose();
                                    setTimeout(() => {
                                        navigate('/sign-in');
                                    }, 50);
                                }}
                                className={`px-4 py-2 rounded-md text-white ${styles.buttonBg} transition-colors`}
                            >
                                {confirmText}
                            </button>
                        ) : (
                            <>
                                {title === "Logged Out" && (
                                    <button
                                        onClick={() => {
                                            navigate('/sign-in');
                                            onClose();
                                        }}
                                        className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                    >
                                        Sign In
                                    </button>
                                )}
                                {title === "Order Submitted" && (
                                    <button
                                        onClick={() => {
                                            navigate('/order-history');
                                            onClose();
                                        }}
                                        className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                    >
                                        View Orders
                                    </button>
                                )}
                                {title !== "Logged Out" && title !== "Order Submitted" && (
                                    <button
                                        onClick={() => {
                                            onConfirm?.();
                                            onOrderConfirmed?.();
                                            onClose();
                                        }}
                                        className={`px-4 py-2 rounded-md text-white ${styles.buttonBg} transition-colors`}
                                    >
                                        {confirmText}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
