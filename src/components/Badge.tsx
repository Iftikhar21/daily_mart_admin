import React from 'react';

interface BadgeProps {
    type: 'default' | 'success' | 'danger' | 'warning' | 'info';
    text: string;
    icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ type, text, icon }) => {
    const typeClasses = {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        danger: 'bg-red-100 text-red-800',
        warning: 'bg-yellow-100 text-yellow-800',
        info: 'bg-blue-100 text-blue-800'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeClasses[type]}`}>
            {icon && <span className="mr-1">{icon}</span>}
            {text}
        </span>
    );
};

export default Badge;