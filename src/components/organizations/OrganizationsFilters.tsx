import FilterDropdown from "@/components/FilterDropdown";
import SearchBar from "@/components/SearchBar";

type FilterOption = { label: string; value: string };

interface OrganizationsFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  planFilter: string;
  onPlanFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  healthFilter: string;
  onHealthFilterChange: (value: string) => void;
  riskFilter: string;
  onRiskFilterChange: (value: string) => void;
  planOptions: FilterOption[];
  statusOptions: FilterOption[];
  healthOptions: FilterOption[];
  riskOptions: FilterOption[];
}

export function OrganizationsFilters({
  searchInput,
  onSearchInputChange,
  planFilter,
  onPlanFilterChange,
  statusFilter,
  onStatusFilterChange,
  healthFilter,
  onHealthFilterChange,
  riskFilter,
  onRiskFilterChange,
  planOptions,
  statusOptions,
  healthOptions,
  riskOptions,
}: OrganizationsFiltersProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Search</label>
        <SearchBar
          value={searchInput}
          onChange={onSearchInputChange}
          placeholder="Search by name, slug, or billing email"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <FilterDropdown label="Plan" value={planFilter} onChange={onPlanFilterChange} options={planOptions} />
        <FilterDropdown label="Status" value={statusFilter} onChange={onStatusFilterChange} options={statusOptions} />
        <FilterDropdown label="Health" value={healthFilter} onChange={onHealthFilterChange} options={healthOptions} />
        <FilterDropdown label="Risk" value={riskFilter} onChange={onRiskFilterChange} options={riskOptions} />
      </div>
    </div>
  );
}
