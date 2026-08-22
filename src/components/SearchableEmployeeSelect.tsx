import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, User, ChevronDown, Building, Briefcase, MapPin, UserCheck, UserX } from 'lucide-react';
import { Employee } from '../types';

export interface SearchableEmployeeSelectProps {
  employees: Employee[];
  value: string;
  onChange: (employeeId: string, employee?: Employee) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  allowClear?: boolean;
  emptyOptionLabel?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  showInactiveTag?: boolean;
  filterDepartment?: string;
  filterBranch?: string;
  onlyActive?: boolean;
  id?: string;
}

export const SearchableEmployeeSelect: React.FC<SearchableEmployeeSelectProps> = ({
  employees = [],
  value,
  onChange,
  placeholder = 'Search by name, ID (e.g. RS001), dept...',
  label,
  required = false,
  allowClear = false,
  emptyOptionLabel = '-- Keep Unassigned / None --',
  disabled = false,
  className = '',
  buttonClassName = '',
  showInactiveTag = true,
  filterDepartment,
  filterBranch,
  onlyActive = false,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Selected employee lookup
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === value);
  }, [employees, value]);

  // Filtered employees list based on search and optional filters
  const filteredEmployees = useMemo(() => {
    let list = employees;

    if (onlyActive) {
      list = list.filter(e => e.isActive !== false);
    }

    if (filterDepartment && filterDepartment !== 'All') {
      list = list.filter(e => e.department === filterDepartment);
    }

    if (filterBranch && filterBranch !== 'All') {
      list = list.filter(e => (e.branch || 'Main Branch') === filterBranch);
    }

    if (!searchQuery.trim()) {
      return list;
    }

    const q = searchQuery.toLowerCase().trim();
    return list.filter(e => {
      const matchName = e.name.toLowerCase().includes(q);
      const matchId = e.id.toLowerCase().includes(q);
      const matchDept = (e.department || '').toLowerCase().includes(q);
      const matchDesig = (e.designation || '').toLowerCase().includes(q);
      const matchBranch = (e.branch || '').toLowerCase().includes(q);
      const matchPhone = (e.mobileNo || e.personalMobileNo || '').toLowerCase().includes(q);

      return matchName || matchId || matchDept || matchDesig || matchBranch || matchPhone;
    });
  }, [employees, onlyActive, filterDepartment, filterBranch, searchQuery]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalItems = allowClear ? filteredEmployees.length + 1 : filteredEmployees.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1 < totalItems ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, totalItems - 1)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allowClear && highlightedIndex === 0) {
        handleSelect('');
      } else {
        const itemIdx = allowClear ? highlightedIndex - 1 : highlightedIndex;
        if (filteredEmployees[itemIdx]) {
          handleSelect(filteredEmployees[itemIdx].id, filteredEmployees[itemIdx]);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelect = (empId: string, emp?: Employee) => {
    onChange(empId, emp);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div className={`relative font-sans ${className}`} ref={containerRef} id={id}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs">
            {label} {required && <span className="text-rose-600 dark:text-rose-400">*</span>}
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            {filteredEmployees.length} Available
          </span>
        </div>
      )}

      {/* Main Trigger Button / Box */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full text-left bg-slate-50 hover:bg-white dark:bg-[#0b1812] dark:hover:bg-[#11221b] border ${
          isOpen ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-white' : 'border-slate-300 dark:border-[#1e3a2f]'
        } rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2 shadow-3xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedEmployee ? (
            <>
              <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-3xs">
                {selectedEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap flex-1">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  {selectedEmployee.name}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-200 dark:bg-[#193328] text-slate-700 dark:text-emerald-300 rounded">
                  {selectedEmployee.id}
                </span>
                {selectedEmployee.department && (
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded">
                    {selectedEmployee.department}
                  </span>
                )}
                {showInactiveTag && selectedEmployee.isActive === false && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-700 rounded">
                    Inactive
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <User className="w-4 h-4 shrink-0" />
              <span className="truncate">{placeholder}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedEmployee && allowClear && (
            <span
              onClick={handleClear}
              className="p-1 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              title="Clear Selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0e1d16] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-80 animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header Input */}
          <div className="p-2 border-b border-slate-100 dark:border-[#1e3a2f] bg-slate-50/80 dark:bg-[#11221b] shrink-0">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type name, ID (RS001), dept, branch..."
                className="w-full pl-8.5 pr-8 py-2 bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Employee Options List */}
          <div ref={listRef} className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-[#193328]/50 p-1">
            {/* Optional None / Clear Item */}
            {allowClear && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full px-3 py-2.5 text-left text-xs font-semibold flex items-center justify-between rounded-xl transition-all cursor-pointer ${
                  !value ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-[#142820]'
                } ${highlightedIndex === 0 ? 'ring-1 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' : ''}`}
              >
                <span className="flex items-center gap-2 italic">
                  <UserX className="w-3.5 h-3.5 text-slate-400" />
                  {emptyOptionLabel}
                </span>
                {!value && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            )}

            {filteredEmployees.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  No employees matching "{searchQuery}"
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Try searching by employee ID, first name, last name, or department.
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-2.5 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              filteredEmployees.map((emp, index) => {
                const isSelected = emp.id === value;
                const isHighlighted = (allowClear ? index + 1 : index) === highlightedIndex;

                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleSelect(emp.id, emp)}
                    className={`w-full px-3 py-2 text-left rounded-xl transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : isHighlighted
                        ? 'bg-emerald-50 dark:bg-[#162c22] text-slate-900 dark:text-slate-100'
                        : 'hover:bg-slate-50 dark:hover:bg-[#11221b] text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-white text-emerald-700'
                            : 'bg-emerald-700/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {emp.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                            {emp.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded ${
                              isSelected
                                ? 'bg-emerald-800 text-emerald-100'
                                : 'bg-slate-100 dark:bg-[#1e3a2f] text-slate-700 dark:text-emerald-300'
                            }`}
                          >
                            {emp.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] opacity-80 mt-0.5 truncate">
                          {emp.designation && <span>{emp.designation}</span>}
                          {emp.department && (
                            <span>• <strong className="font-semibold">{emp.department}</strong></span>
                          )}
                          {emp.branch && (
                            <span className="hidden sm:inline">• {emp.branch}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {showInactiveTag && emp.isActive === false && (
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-black rounded ${
                            isSelected ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          Inactive
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Footer with Total Count */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-[#0b1812] border-t border-slate-100 dark:border-[#1e3a2f] flex items-center justify-between text-[10px] text-slate-400">
            <span>Showing {filteredEmployees.length} of {employees.length} employees</span>
            <span className="hidden sm:inline">Use ↑ ↓ arrows & Enter to select</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableEmployeeSelect;
