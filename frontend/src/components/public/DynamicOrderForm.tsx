import React from "react";
import type { OrderField, OrderFieldOption } from "../../types";

interface DynamicOrderFormProps {
  fields: OrderField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  errors?: Record<string, string>;
}

/** Normalize options — supports string[] or {label, value}[] */
function getOptions(field: OrderField): OrderFieldOption[] {
  if (!field.options) return [];
  if (Array.isArray(field.options)) {
    if (field.options.length === 0) return [];
    if (typeof field.options[0] === "string") {
      return (field.options as string[]).map((opt) => ({ label: opt, value: opt }));
    }
    return field.options as OrderFieldOption[];
  }
  return [];
}

export default function DynamicOrderForm({ fields, values, onChange, errors }: DynamicOrderFormProps) {
  // Filter visible fields based on showIf conditions
  const visibleFields = fields.filter((field) => {
    if (!field.showIf || !field.showIf.field) return true;
    const parentValue = values[field.showIf.field];
    return String(parentValue) === String(field.showIf.equals);
  });

  const renderField = (field: OrderField) => {
    const value = values[field.key] ?? field.defaultValue ?? "";
    const error = errors?.[field.key];
    const baseInputClass =
      "w-full px-3 py-2 bg-white/5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500";
    const errorClass = error ? "border-red-500 focus:border-red-500" : "";
    const label = (
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    );

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.key}>
            {label}
            <textarea
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={`${baseInputClass} ${errorClass} resize-none`}
              rows={3}
            />
            {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.key}>
            {label}
            <select
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              className={`${baseInputClass} ${errorClass}`}
            >
              <option value="">{field.placeholder || `Select ${field.label}`}</option>
              {getOptions(field).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
          </div>
        );

      case "radio":
        return (
          <div key={field.key}>
            {label}
            <div className="flex flex-wrap gap-3 mt-1">
              {getOptions(field).map((opt) => (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`radio-${field.key}`}
                    value={opt.value}
                    checked={String(value) === String(opt.value)}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.key}>
            {label}
            <div className="flex flex-wrap gap-3 mt-1">
              {getOptions(field).map((opt) => {
                const checked = Array.isArray(value) && value.includes(opt.value);
                return (
                  <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      value={opt.value}
                      checked={checked}
                      onChange={(e) => {
                        const arr = Array.isArray(value) ? [...value] : [];
                        if (e.target.checked) {
                          arr.push(opt.value);
                        } else {
                          const idx = arr.indexOf(opt.value);
                          if (idx > -1) arr.splice(idx, 1);
                        }
                        onChange(field.key, arr);
                      }}
                      className="text-blue-500 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                  </label>
                );
              })}
            </div>
            {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
          </div>
        );

      case "hidden":
        return null;

      // text, number, url, email, date, time, password
      default: {
        const inputType = field.type === "number" ? "number" : field.type === "url" ? "url" : field.type === "email" ? "email" : field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "password" ? "password" : "text";
        return (
          <div key={field.key}>
            {label}
            <input
              type={inputType}
              value={value}
              onChange={(e) => {
                const newVal = field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
                onChange(field.key, newVal);
              }}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              className={`${baseInputClass} ${errorClass}`}
            />
            {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
          </div>
        );
      }
    }
  };

  if (visibleFields.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleFields.map(renderField)}
    </div>
  );
}

/**
 * Validates orderFields values and returns an errors object.
 * Keys with error messages are invalid.
 */
export function validateOrderFields(fields: OrderField[], values: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    // Skip hidden fields
    if (field.type === "hidden") continue;

    // Check showIf condition
    if (field.showIf?.field) {
      const parentValue = values[field.showIf.field];
      if (String(parentValue) !== String(field.showIf.equals)) continue;
    }

    const value = values[field.key] ?? field.defaultValue ?? "";

    // Required check
    if (field.required) {
      if (value === "" || value === null || value === undefined) {
        errors[field.key] = `${field.label} is required`;
        continue;
      }
      if (field.type === "checkbox" && Array.isArray(value) && value.length === 0) {
        errors[field.key] = `Select at least one ${field.label}`;
        continue;
      }
    }

    // Skip further validation if empty (non-required fields)
    if (value === "" || value === null || value === undefined) continue;

    // URL validation
    if (field.type === "url" && typeof value === "string") {
      try {
        new URL(value);
      } catch {
        errors[field.key] = `${field.label} must be a valid URL`;
        continue;
      }
    }

    // Number min/max
    if (field.type === "number" && typeof value === "number") {
      if (field.validation?.min !== undefined && value < field.validation.min) {
        errors[field.key] = `${field.label} must be at least ${field.validation.min}`;
        continue;
      }
      if (field.validation?.max !== undefined && value > field.validation.max) {
        errors[field.key] = `${field.label} must be at most ${field.validation.max}`;
        continue;
      }
    }

    // Regex pattern
    if (field.validation?.pattern && typeof value === "string") {
      try {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          errors[field.key] = `${field.label} format is invalid`;
          continue;
        }
      } catch {
        // Invalid regex in schema — skip
      }
    }
  }

  return errors;
}
