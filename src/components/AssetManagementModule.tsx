import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Laptop, 
  Phone, 
  Tablet, 
  Car, 
  Key, 
  HardDrive, 
  ShieldAlert, 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  FileSpreadsheet, 
  Printer, 
  Download, 
  RefreshCw, 
  DollarSign, 
  AlertTriangle, 
  Calendar, 
  Building, 
  ChevronRight, 
  User, 
  FileText, 
  Edit3, 
  Trash2, 
  Tag,
  ShieldCheck,
  Check,
  X,
  Boxes
} from 'lucide-react';
import { CompanyAsset, Employee, AssetMaintenanceLog, AssetAllocationHistory, UserRole } from '../types';

interface AssetManagementModuleProps {
  employees: Employee[];
  language?: 'en' | 'hi';
  userRole?: UserRole;
}

export default function AssetManagementModule({ employees, language = 'en', userRole = 'super_admin' }: AssetManagementModuleProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'allocations' | 'maintenance' | 'history' | 'analytics'>('inventory');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Active items for modals
  const [selectedAsset, setSelectedAsset] = useState<CompanyAsset | null>(null);

  // Form states
  const [newAsset, setNewAsset] = useState<Partial<CompanyAsset>>({
    assetTag: '',
    name: '',
    category: 'Laptop',
    serialNumber: '',
    brand: '',
    model: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    warrantyExpiryDate: '',
    vendorName: '',
    condition: 'Good',
    status: 'Available',
    notes: ''
  });

  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    assignedDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    notes: ''
  });

  const [returnForm, setReturnForm] = useState({
    returnedDate: new Date().toISOString().split('T')[0],
    condition: 'Good' as CompanyAsset['condition'],
    hasCharger: true,
    hasBagAccessories: true,
    notes: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    issueDescription: '',
    loggedDate: new Date().toISOString().split('T')[0],
    vendorName: '',
    cost: 0,
    status: 'Open' as AssetMaintenanceLog['status'],
    notes: ''
  });

  // Load / Store assets
  const [assets, setAssets] = useState<CompanyAsset[]>(() => {
    const saved = localStorage.getItem('payroll_company_assets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse assets from localStorage', e);
      }
    }
    return [
      {
        id: 'AST-001',
        assetTag: 'AST-LAP-001',
        name: 'Dell Latitude 3420 Laptop',
        category: 'Laptop',
        serialNumber: 'DL3420X9912',
        brand: 'Dell',
        model: 'Latitude 3420 (i5 11th Gen, 16GB RAM)',
        purchaseDate: '2024-04-15',
        purchasePrice: 62000,
        warrantyExpiryDate: '2027-04-15',
        vendorName: 'CompuTech Solutions',
        assignedToEmployeeId: 'EMP002',
        assignedToEmployeeName: 'Sunita Sharma',
        assignedDate: '2025-06-16',
        condition: 'Good',
        status: 'Assigned',
        notes: 'Includes original 65W USB-C charger and laptop bag.',
        allocationHistory: [
          {
            id: 'HIS-001',
            assetId: 'AST-001',
            employeeId: 'EMP002',
            employeeName: 'Sunita Sharma',
            assignedDate: '2025-06-16',
            assignedCondition: 'New',
            handoverNotes: 'Handed over on onboarding.',
            status: 'Active'
          }
        ]
      },
      {
        id: 'AST-002',
        assetTag: 'AST-MOB-002',
        name: 'Samsung Galaxy M14 5G',
        category: 'Mobile Phone',
        serialNumber: 'SSG5G88102',
        brand: 'Samsung',
        model: 'Galaxy M14 5G (128GB)',
        purchaseDate: '2024-08-10',
        purchasePrice: 14500,
        warrantyExpiryDate: '2025-08-10',
        vendorName: 'Samsung Official Store',
        assignedToEmployeeId: 'EMP001',
        assignedToEmployeeName: 'Rajesh Kumar',
        assignedDate: '2025-01-11',
        condition: 'Good',
        status: 'Assigned',
        notes: 'Company SIM inserted for site co-ordination.',
        allocationHistory: [
          {
            id: 'HIS-002',
            assetId: 'AST-002',
            employeeId: 'EMP001',
            employeeName: 'Rajesh Kumar',
            assignedDate: '2025-01-11',
            assignedCondition: 'New',
            handoverNotes: 'Site supervision official mobile.',
            status: 'Active'
          }
        ]
      },
      {
        id: 'AST-003',
        assetTag: 'AST-VEH-001',
        name: 'Hero Splendor Plus (CG 04 XY 1234)',
        category: 'Vehicle',
        serialNumber: 'ENG9981273',
        brand: 'Hero',
        model: 'Splendor Plus 110cc',
        purchaseDate: '2023-01-20',
        purchasePrice: 78000,
        warrantyExpiryDate: '2028-01-20',
        vendorName: 'Raipur Auto Dealer',
        condition: 'Good',
        status: 'Available',
        notes: 'Stored at Main Yard. Helmet & key in office safe.',
        allocationHistory: []
      },
      {
        id: 'AST-004',
        assetTag: 'AST-TAB-001',
        name: 'Apple iPad 10th Gen',
        category: 'Tablet',
        serialNumber: 'APL9822101',
        brand: 'Apple',
        model: 'iPad 10th Gen 64GB Wi-Fi',
        purchaseDate: '2025-02-01',
        purchasePrice: 38000,
        warrantyExpiryDate: '2026-02-01',
        vendorName: 'Imagine Apple Reseller',
        condition: 'New',
        status: 'Available',
        notes: 'Unassigned in IT Store. Comes with Apple Pencil.',
        allocationHistory: []
      },
      {
        id: 'AST-005',
        assetTag: 'AST-PER-001',
        name: 'Logitech MK270 Wireless Keyboard & Mouse',
        category: 'Peripheral',
        serialNumber: 'LGT7722109',
        brand: 'Logitech',
        model: 'MK270 Combo',
        purchaseDate: '2024-11-05',
        purchasePrice: 1800,
        warrantyExpiryDate: '2027-11-05',
        vendorName: 'CompuTech Solutions',
        condition: 'Damaged',
        status: 'Maintenance',
        notes: 'Mouse scroll wheel erratic. Under repair ticket #MT-881.',
        maintenanceLogs: [
          {
            id: 'MNT-001',
            assetId: 'AST-005',
            issueDescription: 'Mouse scroll wheel slipping & key stuck',
            loggedDate: '2026-08-01',
            vendorName: 'Logitech Care Center',
            cost: 350,
            status: 'In Progress',
            notes: 'Awaiting warranty replacement module.'
          }
        ]
      }
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('payroll_company_assets', JSON.stringify(assets));
  }, [assets]);

  // Key Statistics
  const totalAssetsCount = assets.length;
  const totalValuation = assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
  const assignedAssetsCount = assets.filter(a => a.status === 'Assigned').length;
  const availableAssetsCount = assets.filter(a => a.status === 'Available').length;
  const maintenanceAssetsCount = assets.filter(a => a.status === 'Maintenance').length;

  const today = new Date();
  const expiringWarrantyAssets = assets.filter(a => {
    if (!a.warrantyExpiryDate) return false;
    const exp = new Date(a.warrantyExpiryDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 60;
  });

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = 
        asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.assignedToEmployeeName && asset.assignedToEmployeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.brand && asset.brand.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || asset.status === selectedStatus;
      const matchesCondition = selectedCondition === 'All' || asset.condition === selectedCondition;

      return matchesSearch && matchesCategory && matchesStatus && matchesCondition;
    });
  }, [assets, searchTerm, selectedCategory, selectedStatus, selectedCondition]);

  // Category Icon helper
  const getCategoryIcon = (category: CompanyAsset['category']) => {
    switch (category) {
      case 'Laptop': return <Laptop className="w-5 h-5 text-emerald-600" />;
      case 'Mobile Phone': return <Phone className="w-5 h-5 text-blue-600" />;
      case 'Tablet': return <Tablet className="w-5 h-5 text-purple-600" />;
      case 'Vehicle': return <Car className="w-5 h-5 text-amber-600" />;
      case 'ID Card / Key': return <Key className="w-5 h-5 text-rose-600" />;
      case 'Peripheral': return <HardDrive className="w-5 h-5 text-indigo-600" />;
      case 'Furniture': return <Boxes className="w-5 h-5 text-teal-600" />;
      case 'Tools / Machinery': return <Wrench className="w-5 h-5 text-orange-600" />;
      default: return <Package className="w-5 h-5 text-slate-600" />;
    }
  };

  // Status Badge helper
  const getStatusBadge = (status: CompanyAsset['status']) => {
    switch (status) {
      case 'Assigned':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Assigned</span>;
      case 'Available':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Available</span>;
      case 'Maintenance':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1"><Wrench className="w-3 h-3" /> Maintenance</span>;
      case 'Scrapped':
        return <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1"><XCircle className="w-3 h-3" /> Scrapped</span>;
    }
  };

  // Condition Badge helper
  const getConditionBadge = (condition: CompanyAsset['condition']) => {
    switch (condition) {
      case 'New':
        return <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✨ New</span>;
      case 'Good':
        return <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">👍 Good</span>;
      case 'Damaged':
        return <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">⚠️ Damaged</span>;
      case 'In Repair':
        return <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">🔧 In Repair</span>;
    }
  };

  // Handlers
  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.assetTag || !newAsset.name || !newAsset.serialNumber) {
      alert('Please fill in required fields: Asset Tag, Name, and Serial Number');
      return;
    }

    const created: CompanyAsset = {
      id: `AST-${Date.now().toString().slice(-4)}`,
      assetTag: newAsset.assetTag,
      name: newAsset.name,
      category: newAsset.category || 'Laptop',
      serialNumber: newAsset.serialNumber,
      brand: newAsset.brand || '',
      model: newAsset.model || '',
      purchaseDate: newAsset.purchaseDate || new Date().toISOString().split('T')[0],
      purchasePrice: Number(newAsset.purchasePrice) || 0,
      warrantyExpiryDate: newAsset.warrantyExpiryDate || '',
      vendorName: newAsset.vendorName || '',
      condition: newAsset.condition || 'New',
      status: 'Available',
      notes: newAsset.notes || '',
      allocationHistory: [],
      maintenanceLogs: []
    };

    setAssets([created, ...assets]);
    setIsRegisterModalOpen(false);
    setNewAsset({
      assetTag: '',
      name: '',
      category: 'Laptop',
      serialNumber: '',
      brand: '',
      model: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 0,
      warrantyExpiryDate: '',
      vendorName: '',
      condition: 'Good',
      status: 'Available',
      notes: ''
    });
  };

  const handleAssignAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !assignForm.employeeId) {
      alert('Please select an employee');
      return;
    }

    const emp = employees.find(e => e.id === assignForm.employeeId);
    if (!emp) return;

    const newHistory: AssetAllocationHistory = {
      id: `HIS-${Date.now().toString().slice(-4)}`,
      assetId: selectedAsset.id,
      employeeId: emp.id,
      employeeName: emp.name,
      assignedDate: assignForm.assignedDate,
      assignedCondition: selectedAsset.condition,
      handoverNotes: assignForm.notes,
      status: 'Active'
    };

    const updated = assets.map(ast => {
      if (ast.id === selectedAsset.id) {
        return {
          ...ast,
          status: 'Assigned' as const,
          assignedToEmployeeId: emp.id,
          assignedToEmployeeName: emp.name,
          assignedDate: assignForm.assignedDate,
          expectedReturnDate: assignForm.expectedReturnDate,
          notes: assignForm.notes ? `${ast.notes || ''}\n[Allocated]: ${assignForm.notes}` : ast.notes,
          allocationHistory: [newHistory, ...(ast.allocationHistory || [])]
        };
      }
      return ast;
    });

    setAssets(updated);
    setIsAssignModalOpen(false);
    setAssignForm({ employeeId: '', assignedDate: new Date().toISOString().split('T')[0], expectedReturnDate: '', notes: '' });
  };

  const handleReturnAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    const updated = assets.map(ast => {
      if (ast.id === selectedAsset.id) {
        const historyUpdated = (ast.allocationHistory || []).map(h => {
          if (h.status === 'Active') {
            return {
              ...h,
              status: 'Returned' as const,
              returnedDate: returnForm.returnedDate,
              returnedCondition: returnForm.condition,
              returnNotes: returnForm.notes
            };
          }
          return h;
        });

        return {
          ...ast,
          status: (returnForm.condition === 'In Repair' || returnForm.condition === 'Damaged') ? ('Maintenance' as const) : ('Available' as const),
          condition: returnForm.condition,
          assignedToEmployeeId: undefined,
          assignedToEmployeeName: undefined,
          assignedDate: undefined,
          expectedReturnDate: undefined,
          notes: `${ast.notes || ''}\n[Returned ${returnForm.returnedDate}]: Condition: ${returnForm.condition}. ${returnForm.notes}`,
          allocationHistory: historyUpdated
        };
      }
      return ast;
    });

    setAssets(updated);
    setIsReturnModalOpen(false);
  };

  const handleAddMaintenanceLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !maintenanceForm.issueDescription) {
      alert('Please specify issue description');
      return;
    }

    const newLog: AssetMaintenanceLog = {
      id: `MNT-${Date.now().toString().slice(-4)}`,
      assetId: selectedAsset.id,
      issueDescription: maintenanceForm.issueDescription,
      loggedDate: maintenanceForm.loggedDate,
      vendorName: maintenanceForm.vendorName,
      cost: Number(maintenanceForm.cost) || 0,
      status: maintenanceForm.status,
      notes: maintenanceForm.notes
    };

    const updated = assets.map(ast => {
      if (ast.id === selectedAsset.id) {
        return {
          ...ast,
          status: maintenanceForm.status === 'Resolved' ? ('Available' as const) : ('Maintenance' as const),
          condition: maintenanceForm.status === 'Resolved' ? ('Good' as const) : ('In Repair' as const),
          maintenanceLogs: [newLog, ...(ast.maintenanceLogs || [])]
        };
      }
      return ast;
    });

    setAssets(updated);
    setIsMaintenanceModalOpen(false);
    setMaintenanceForm({ issueDescription: '', loggedDate: new Date().toISOString().split('T')[0], vendorName: '', cost: 0, status: 'Open', notes: '' });
  };

  const exportCSV = () => {
    const headers = ['Asset Tag', 'Asset Name', 'Category', 'Serial No', 'Brand', 'Purchase Price (₹)', 'Status', 'Condition', 'Assigned Employee', 'Assigned Date'];
    const rows = assets.map(a => [
      a.assetTag,
      `"${a.name}"`,
      a.category,
      a.serialNumber,
      a.brand || '-',
      a.purchasePrice || 0,
      a.status,
      a.condition,
      a.assignedToEmployeeName || 'Unassigned',
      a.assignedDate || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Asset_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#03442a] via-[#025234] to-[#012e1b] text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest rounded-full font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Asset & IT Inventory Desk
              </span>
              <span className="px-2.5 py-0.5 bg-slate-900/60 text-slate-300 text-[10px] font-mono rounded-md border border-slate-700">
                Role: {userRole.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Package className="w-8 h-8 text-emerald-400 shrink-0" />
              Company Asset Management
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl font-medium">
              Centralized hardware asset tracking, IT device allocations, warranty schedules, maintenance logs, and employee handover certifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={exportCSV}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs hover:shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              Export Register CSV
            </button>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Register New Asset
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-1">
            <span>Total Asset Inventory</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{totalAssetsCount}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">Valuation: ₹{totalValuation.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-1">
            <span>Assigned to Staff</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{assignedAssetsCount}</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalAssetsCount > 0 ? (assignedAssetsCount / totalAssetsCount) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-1">
            <span>Available in Store</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{availableAssetsCount}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">Ready for allocation</p>
        </div>

        <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-1">
            <span>Maintenance / Repairs</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{maintenanceAssetsCount}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">Under service / repair</p>
        </div>

        <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] p-4 rounded-2xl shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-1">
            <span>Warranty Expiring (60d)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{expiringWarrantyAssets.length}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">Warranty renewal alerts</p>
        </div>
      </div>

      {/* Main Content Area with Navigation Sub-Tabs */}
      <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-5 shadow-xs space-y-5">
        
        {/* Navigation Sub-Tabs Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#1e3a2f] pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Package className="w-4 h-4" />
              Asset Inventory ({assets.length})
            </button>

            <button
              onClick={() => setActiveTab('allocations')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'allocations'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Active Allocations ({assignedAssetsCount})
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'maintenance'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Maintenance & Repairs ({maintenanceAssetsCount})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Allocation Audit History
            </button>
          </div>

          {/* View Mode Controls */}
          {activeTab === 'inventory' && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Grid Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Detailed Table
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Asset Inventory */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-[#1e3a2f]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Tag, Name, Serial No, Brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Mobile Phone">Mobile Phone</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="ID Card / Key">ID Card / Key</option>
                  <option value="Peripheral">Peripheral</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Tools / Machinery">Tools / Machinery</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Available">Available in Store</option>
                  <option value="Assigned">Assigned to Staff</option>
                  <option value="Maintenance">Maintenance / Repair</option>
                  <option value="Scrapped">Scrapped</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  <option value="All">All Conditions</option>
                  <option value="New">✨ New</option>
                  <option value="Good">👍 Good</option>
                  <option value="Damaged">⚠️ Damaged</option>
                  <option value="In Repair">🔧 In Repair</option>
                </select>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssets.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-[#1e3a2f]">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No company assets found matching your criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting search filters or register a new asset above.</p>
                  </div>
                ) : (
                  filteredAssets.map(asset => (
                    <div 
                      key={asset.id} 
                      className="bg-white dark:bg-[#0f1d17] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-4 shadow-3xs hover:shadow-md transition-all duration-200 space-y-3 relative group"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                            {getCategoryIcon(asset.category)}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-black text-slate-400 block tracking-wider uppercase">
                              {asset.assetTag}
                            </span>
                            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">
                              {asset.name}
                            </h3>
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(asset.status)}
                        </div>
                      </div>

                      {/* Specs / Meta */}
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] space-y-1.5 font-sans">
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Serial / IMEI:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{asset.serialNumber}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Brand / Model:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{asset.brand || '-'} {asset.model ? `(${asset.model})` : ''}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Condition:</span>
                          <span>{getConditionBadge(asset.condition)}</span>
                        </div>
                        {asset.purchasePrice ? (
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Purchase Cost:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{asset.purchasePrice.toLocaleString('en-IN')}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Allocation Info */}
                      {asset.status === 'Assigned' ? (() => {
                        const assignedEmp = employees.find(e => e.id === asset.assignedToEmployeeId || e.name === asset.assignedToEmployeeName);
                        const isInactive = assignedEmp ? assignedEmp.isActive === false : false;
                        return (
                          <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            isInactive 
                              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60' 
                              : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40'
                          }`}>
                            <div className="flex items-center gap-2">
                              <User className={`w-4 h-4 ${isInactive ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] uppercase font-bold block ${isInactive ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                    Assigned Staff
                                  </span>
                                  {isInactive && (
                                    <span className="px-1 py-0.2 bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 text-[8px] font-black rounded-xs">
                                      INACTIVE / EXITED
                                    </span>
                                  )}
                                </div>
                                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                  {asset.assignedToEmployeeName}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono font-bold ${isInactive ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                              {asset.assignedDate}
                            </span>
                          </div>
                        );
                      })() : (
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>Current Allocation:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Unassigned (In Store)</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                        {asset.status === 'Available' && (
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setIsAssignModalOpen(true);
                            }}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Assign / Handover
                          </button>
                        )}

                        {asset.status === 'Assigned' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setIsReturnModalOpen(true);
                              }}
                              className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Return Asset
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setIsReceiptModalOpen(true);
                              }}
                              title="Print Handover Certificate"
                              className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsMaintenanceModalOpen(true);
                          }}
                          className="py-1.5 px-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Log Service
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Table View */
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1e3a2f]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-[#1e3a2f]">
                    <tr>
                      <th className="py-3.5 px-4">Tag & Name</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Serial / IMEI</th>
                      <th className="py-3.5 px-4">Valuation</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Condition</th>
                      <th className="py-3.5 px-4">Allocated Staff</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {filteredAssets.map(asset => (
                      <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              {getCategoryIcon(asset.category)}
                            </div>
                            <div>
                              <span className="font-mono text-[10px] font-bold text-slate-400 block">{asset.assetTag}</span>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100">{asset.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">{asset.category}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">{asset.serialNumber}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {asset.purchasePrice ? `₹${asset.purchasePrice.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(asset.status)}</td>
                        <td className="py-3.5 px-4">{getConditionBadge(asset.condition)}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-800 dark:text-slate-200">
                          {asset.assignedToEmployeeName ? (() => {
                            const assignedEmp = employees.find(e => e.id === asset.assignedToEmployeeId || e.name === asset.assignedToEmployeeName);
                            const isInactive = assignedEmp ? assignedEmp.isActive === false : false;
                            return (
                              <div className="flex items-center gap-1.5">
                                <span>{asset.assignedToEmployeeName}</span>
                                {isInactive && (
                                  <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[9px] font-black uppercase rounded border border-rose-300 dark:border-rose-800">
                                    Exited / Inactive
                                  </span>
                                )}
                              </div>
                            );
                          })() : <span className="text-slate-400 font-normal italic">Unassigned</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {asset.status === 'Available' && (
                              <button
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setIsAssignModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-all text-[11px] cursor-pointer"
                              >
                                Assign
                              </button>
                            )}
                            {asset.status === 'Assigned' && (
                              <button
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setIsReturnModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-all text-[11px] cursor-pointer"
                              >
                                Return
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setIsMaintenanceModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                              title="Log Maintenance"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Active Allocations */}
        {activeTab === 'allocations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Active Employee Asset Allocations ({assignedAssetsCount})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.filter(a => a.status === 'Assigned').length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                  No active asset allocations at present.
                </div>
              ) : (
                assets.filter(a => a.status === 'Assigned').map(asset => {
                  const assignedEmp = employees.find(e => e.id === asset.assignedToEmployeeId || e.name === asset.assignedToEmployeeName);
                  const isEmpInactive = assignedEmp ? assignedEmp.isActive === false : false;

                  return (
                    <div key={asset.id} className={`bg-white dark:bg-[#0f1d17] border p-4 rounded-2xl space-y-3 ${
                      isEmpInactive 
                        ? 'border-rose-300 dark:border-rose-900/80 shadow-xs shadow-rose-950/10' 
                        : 'border-slate-200 dark:border-[#1e3a2f]'
                    }`}>
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            isEmpInactive 
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' 
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {asset.assignedToEmployeeName?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{asset.assignedToEmployeeName}</h4>
                              {isEmpInactive && (
                                <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[9px] font-black uppercase rounded border border-rose-300 dark:border-rose-800">
                                  Exited / Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">Emp ID: {asset.assignedToEmployeeId}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsReceiptModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          Handover Slip
                        </button>
                      </div>

                      {isEmpInactive && (
                        <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs flex items-center justify-between text-rose-800 dark:text-rose-200 font-bold">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span>Staff inactive / exited! Collect asset for offboarding clearance.</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setIsReturnModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] cursor-pointer shrink-0 ml-2"
                          >
                            Initiate Return
                          </button>
                        </div>
                      )}

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Asset Tag / Name</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{asset.assetTag} - {asset.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Serial No</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{asset.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Assigned Date</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{asset.assignedDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Expected Return</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{asset.expectedReturnDate || 'Permanent'}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setSelectedAsset(asset);
                          setIsReturnModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Initiate Return / Release
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        )}

        {/* Tab 3: Maintenance & Repairs */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                Asset Maintenance & Repair Log
              </h3>
            </div>

            <div className="space-y-3">
              {assets.filter(a => (a.maintenanceLogs && a.maintenanceLogs.length > 0) || a.status === 'Maintenance').length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No maintenance or repair records currently logged.
                </div>
              ) : (
                assets.filter(a => (a.maintenanceLogs && a.maintenanceLogs.length > 0) || a.status === 'Maintenance').map(asset => (
                  <div key={asset.id} className="bg-white dark:bg-[#0f1d17] border border-amber-200/60 dark:border-amber-900/40 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{asset.assetTag} - {asset.name}</h4>
                          <p className="text-[10px] text-slate-400 font-mono">Serial: {asset.serialNumber}</p>
                        </div>
                      </div>
                      {getStatusBadge(asset.status)}
                    </div>

                    {/* Maintenance Log entries */}
                    <div className="space-y-2">
                      {asset.maintenanceLogs?.map(log => (
                        <div key={log.id} className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 text-xs space-y-1">
                          <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                            <span>Issue: {log.issueDescription}</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">Cost: ₹{(log.cost || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Vendor: {log.vendorName || 'In-House'}</span>
                            <span>Logged: {log.loggedDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Audit History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Complete Asset Allocation History Log
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1e3a2f]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-[#1e3a2f]">
                  <tr>
                    <th className="py-3 px-4">Asset Tag</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Handover Date</th>
                    <th className="py-3 px-4">Return Date</th>
                    <th className="py-3 px-4">Condition</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  {assets.flatMap(a => (a.allocationHistory || []).map(h => ({ ...h, assetTag: a.assetTag, assetName: a.name }))).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No allocation history recorded yet.</td>
                    </tr>
                  ) : (
                    assets.flatMap(a => (a.allocationHistory || []).map(h => ({ ...h, assetTag: a.assetTag, assetName: a.name }))).map(hist => (
                      <tr key={hist.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{hist.assetTag}</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-slate-100">{hist.employeeName}</td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{hist.assignedDate}</td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{hist.returnedDate || 'Active'}</td>
                        <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{hist.assignedCondition}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            hist.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {hist.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* REGISTER NEW ASSET MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e3a2f] pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Register New Company Asset
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterAsset} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Asset Tag ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. AST-LAP-003"
                    value={newAsset.assetTag}
                    onChange={(e) => setNewAsset({ ...newAsset, assetTag: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Asset Category *</label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-bold"
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Mobile Phone">Mobile Phone</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="ID Card / Key">ID Card / Key</option>
                    <option value="Peripheral">Peripheral</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Tools / Machinery">Tools / Machinery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Asset Name / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Lenovo ThinkPad E14"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Serial / IMEI Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-8821903"
                    value={newAsset.serialNumber}
                    onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Brand / Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Dell / Samsung"
                    value={newAsset.brand}
                    onChange={(e) => setNewAsset({ ...newAsset, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={newAsset.purchasePrice}
                    onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Warranty Expiry Date</label>
                  <input
                    type="date"
                    value={newAsset.warrantyExpiryDate}
                    onChange={(e) => setNewAsset({ ...newAsset, warrantyExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a2f] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save & Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN ASSET MODAL */}
      {isAssignModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e3a2f] pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Handover Asset to Employee
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Selected Asset</span>
              <p className="font-black text-slate-900 dark:text-slate-100">{selectedAsset.assetTag} - {selectedAsset.name}</p>
              <p className="text-[10px] text-slate-500 font-mono">Serial: {selectedAsset.serialNumber}</p>
            </div>

            <form onSubmit={handleAssignAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Select Staff / Employee *</label>
                <select
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-bold text-xs"
                >
                  <option value="">-- Choose Employee --</option>
                  <optgroup label="🟢 Active Employees">
                    {employees.filter(emp => emp.isActive !== false).map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.id}) - {emp.department}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🔴 Inactive / Exited Employees">
                    {employees.filter(emp => emp.isActive === false).map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.id}) - {emp.department} [INACTIVE / EXITED]
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Handover Date *</label>
                  <input
                    type="date"
                    value={assignForm.assignedDate}
                    onChange={(e) => setAssignForm({ ...assignForm, assignedDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Expected Return Date</label>
                  <input
                    type="date"
                    value={assignForm.expectedReturnDate}
                    onChange={(e) => setAssignForm({ ...assignForm, expectedReturnDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Handover Notes / Accessories</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Handed over with charger, bag, and wireless mouse."
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a2f] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN ASSET MODAL */}
      {isReturnModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e3a2f] pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
                Return & Inspect Asset
              </h3>
              <button onClick={() => setIsReturnModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Assignment</span>
              <p className="font-extrabold text-slate-900 dark:text-slate-100">{selectedAsset.assignedToEmployeeName} ({selectedAsset.assignedToEmployeeId})</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">{selectedAsset.assetTag} - {selectedAsset.name}</p>
            </div>

            <form onSubmit={handleReturnAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Return Date *</label>
                <input
                  type="date"
                  value={returnForm.returnedDate}
                  onChange={(e) => setReturnForm({ ...returnForm, returnedDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Returned Condition *</label>
                <select
                  value={returnForm.condition}
                  onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-bold"
                >
                  <option value="Good">👍 Good (Normal wear & tear)</option>
                  <option value="New">✨ Like New</option>
                  <option value="Damaged">⚠️ Damaged (Needs repair)</option>
                  <option value="In Repair">🔧 Sent for Repair</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Inspection Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Scratches on back cover, charger returned safely."
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a2f] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Process Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAINTENANCE MODAL */}
      {isMaintenanceModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e3a2f] pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                Log Maintenance / Service Ticket
              </h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaintenanceLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Issue Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Battery drainage issue / Screen damage"
                  value={maintenanceForm.issueDescription}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issueDescription: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Service Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. Dell Authorized Care"
                    value={maintenanceForm.vendorName}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vendorName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Repair Cost (₹)</label>
                  <input
                    type="number"
                    value={maintenanceForm.cost}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a2f] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Maintenance Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE HANDOVER RECEIPT MODAL */}
      {isReceiptModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 relative animate-scaleIn print:m-0 print:p-0">
            <button 
              onClick={() => setIsReceiptModalOpen(false)} 
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-800 cursor-pointer print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Slip */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider">Company Asset Handover Slip</h2>
                <p className="text-xs text-slate-500 font-mono">Document Ref: ACK/{selectedAsset.assetTag}/{selectedAsset.assignedDate}</p>
              </div>
              <div className="text-right text-xs font-mono">
                <span className="font-bold block">Rathi Buildmart Pvt. Ltd.</span>
                <span className="text-slate-500">Date: {selectedAsset.assignedDate}</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Staff</span>
                  <p className="font-extrabold text-sm text-slate-900">{selectedAsset.assignedToEmployeeName}</p>
                  <p className="font-mono text-slate-500">Emp ID: {selectedAsset.assignedToEmployeeId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Asset Description</span>
                  <p className="font-extrabold text-sm text-slate-900">{selectedAsset.name}</p>
                  <p className="font-mono text-slate-500">Tag: {selectedAsset.assetTag}</p>
                </div>
              </div>

              <div className="space-y-2 border border-slate-200 p-4 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-slate-500">Serial / IMEI:</span>
                  <span className="font-mono font-bold">{selectedAsset.serialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold">{selectedAsset.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Handover Condition:</span>
                  <span className="font-bold">{selectedAsset.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Handover Notes:</span>
                  <span className="font-medium text-slate-700">{selectedAsset.notes || 'N/A'}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 italic bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p>Declaration: I hereby acknowledge receipt of the above hardware asset in good working condition. I agree to maintain it safely and return it upon request or employment cessation.</p>
              </div>

              {/* Signature Blocks */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-bold">
                <div>
                  <div className="border-b border-slate-400 mb-2 h-10"></div>
                  <span>Employee Signature</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 mb-2 h-10"></div>
                  <span>IT Asset Manager Signature</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Handover Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
