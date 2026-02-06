"use client";

import React from 'react';
import DatePicker, { registerLocale, DatePickerProps } from "react-datepicker";
import { th } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { getYear, getMonth, format } from "date-fns";

// Register Thai locale
registerLocale("th", th);

interface DatePickerThProps extends Omit<DatePickerProps, "onChange"> {
    label?: string;
    error?: string;
    onChange: (date: Date | null) => void;
    // Add any other specific props we need
}

export function DatePickerTh({
    label,
    error,
    onChange,
    selected,
    className,
    ...props
}: DatePickerThProps) {

    // Custom header to display Buddhist Year (Year + 543)
    const renderCustomHeader = ({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
    }: any) => {
        const dateObj = new Date(date);
        const currentYear = getYear(dateObj);
        const buddhistYear = currentYear + 543;
        const months = [
            "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
        ];

        return (
            <div className="flex items-center justify-between px-2 py-2">
                <button
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    type="button"
                    className="btn btn-xs btn-ghost"
                >
                    {"<"}
                </button>
                <div className="flex gap-2 items-center font-bold text-base-content">
                    <span>{months[getMonth(dateObj)]}</span>
                    <span>{buddhistYear}</span>
                </div>
                <button
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    type="button"
                    className="btn btn-xs btn-ghost"
                >
                    {">"}
                </button>
            </div>
        );
    };

    // Custom formatter for the input display to show Buddhist Year
    // react-datepicker uses standard formatting. We can't easily override the input string *inside* the input without controlled 'value' string,
    // but react-datepicker manages that.
    // However, we can use the `dateFormat` prop with a string.
    // Standard `th` locale usually formats to Gregorian. 
    // To show 2567 in the input box, we might need a workaround or accept Gregorian in the input box for now.
    // BUT, the user requested "Form กรอกข้อมูล... ให้เป็นแบบไทย (พ.ศ.)".
    // So the input box MUST show 2567.

    // Workaround: Use text input that parses?
    // Let's try to just render the calendar with B.E. header first, which is a big step.
    // Changing the input value format often requires messing with the internal date parsing which is risky.
    // Let's stick to the header visualization first.

    const formatThaiDate = (date: Date | null | undefined) => {
        if (!date) return "";
        const gregYear = getYear(date);
        const thaiYear = gregYear + 543;
        // Format as dd/MM/yyyy but replace year
        const dateStr = format(date, "dd/MM/yyyy");
        return dateStr.replace(String(gregYear), String(thaiYear));
    };

    return (
        <div className="form-control w-full">
            {label && (
                <label className="label">
                    <span className="label-text">{label}</span>
                </label>
            )}
            <div className="relative">
                <DatePicker
                    selected={selected}
                    onChange={onChange as any}
                    locale="th"
                    // Override the display value to show B.E.
                    value={formatThaiDate(selected)}
                    // Prevent typing to avoid parsing issues
                    readOnly={true} // or use strict parsing logic later if requested
                    renderCustomHeader={renderCustomHeader}
                    className={`input input-bordered w-full ${error ? "input-error" : ""} ${className}`}
                    {...(props as any)}
                />
            </div>
            {error && <span className="text-error text-xs mt-1">{error}</span>}
        </div>
    );
}
