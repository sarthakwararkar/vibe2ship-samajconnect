import React from "react";
import clsx from "clsx";

export function Input({ label, error, className, ...props }) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-primary">{label}</label>}
      <input
        className={clsx("glass-input", error && "border-red-500 focus:border-red-500 focus:shadow-red-200/50", className)}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, className, rows = 4, ...props }) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-primary">{label}</label>}
      <textarea
        rows={rows}
        className={clsx("glass-input resize-none", error && "border-red-500 focus:border-red-500 focus:shadow-red-200/50", className)}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-primary">{label}</label>}
      <select
        className={clsx(
          "glass-input appearance-none bg-no-repeat", 
          error && "border-red-500 focus:border-red-500 focus:shadow-red-200/50", 
          className
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%234B5563' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function Switch({ label, checked, onChange, className, ...props }) {
  return (
    <label className={clsx("flex items-center gap-3 cursor-pointer select-none", className)}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
          {...props}
        />
        <div className={clsx(
          "w-10 h-6 rounded-full transition-colors duration-200",
          checked ? "bg-indigo-500" : "bg-gray-300"
        )}></div>
        <div className={clsx(
          "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm",
          checked && "transform translate-x-4"
        )}></div>
      </div>
      {label && <span className="text-sm font-medium text-primary">{label}</span>}
    </label>
  );
}
