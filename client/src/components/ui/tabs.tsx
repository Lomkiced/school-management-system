// FILE: client/src/components/ui/tabs.tsx
// Simple Tabs component for the UI

import * as React from 'react';
import { cn } from '../../lib/utils';

interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
    children: React.ReactNode;
}

interface TabsListProps {
    className?: string;
    children: React.ReactNode;
}

interface TabsTriggerProps {
    value: string;
    className?: string;
    children: React.ReactNode;
}

interface TabsContentProps {
    value: string;
    className?: string;
    children: React.ReactNode;
}

const TabsContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
} | null>(null);

const useTabsContext = () => {
    const context = React.useContext(TabsContext);
    if (!context) {
        throw new Error('Tabs components must be used within a Tabs provider');
    }
    return context;
};

export const Tabs = ({ value, onValueChange, className, children }: TabsProps) => {
    return (
        <TabsContext.Provider value={{ value, onValueChange }}>
            <div className={cn('w-full', className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

export const TabsList = ({ className, children }: TabsListProps) => {
    return (
        <div
            className={cn(
                'inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500',
                className
            )}
            role="tablist"
        >
            {children}
        </div>
    );
};

export const TabsTrigger = ({ value, className, children }: TabsTriggerProps) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isSelected = selectedValue === value;

    return (
        <button
            role="tab"
            aria-selected={isSelected}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                isSelected
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900',
                className
            )}
            onClick={() => onValueChange(value)}
        >
            {children}
        </button>
    );
};

export const TabsContent = ({ value, className, children }: TabsContentProps) => {
    const { value: selectedValue } = useTabsContext();

    if (selectedValue !== value) {
        return null;
    }

    return (
        <div
            role="tabpanel"
            className={cn(
                'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2',
                className
            )}
        >
            {children}
        </div>
    );
};
