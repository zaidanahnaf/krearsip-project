import React from "react";

interface SkeletonTableProps {
    rows?: number;
    cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 5 }: SkeletonTableProps) {
    return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid grid-cols-1">
                {/* Header Skeleton */}
                <div className="grid"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))` }}>
                    {[...Array(cols)].map((_, i) => (
                        <div
                            key={i}
                            className="py-3 px-4 bg-slate-50 border-b border-slate-200"
                        >
                            <div className="h-4 w-24 bg-slate-200 rounded-md animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {[...Array(rows)].map((_, r) => (
                    <div
                        key={r}
                        className="grid border-b border-slate-100 last:border-none"
                        style={{ gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))` }}
                    >
                        {[...Array(cols)].map((_, c) => (
                            <div key={c} className="py-3 px-4">
                                <div className="h-4 w-full bg-slate-200 rounded-md animate-pulse" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
