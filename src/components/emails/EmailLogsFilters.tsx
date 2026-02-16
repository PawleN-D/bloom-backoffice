import FilterDropdown from "@/components/FilterDropdown";

interface Option {
  label: string;
  value: string;
}

interface EmailLogsFiltersProps {
  status: string;
  organization: string;
  template: string;
  range: string;
  statusOptions: Option[];
  orgOptions: Option[];
  templateOptions: Option[];
  rangeOptions: Option[];
  onStatusChange: (value: string) => void;
  onOrganizationChange: (value: string) => void;
  onTemplateChange: (value: string) => void;
  onRangeChange: (value: string) => void;
}

export function EmailLogsFilters({
  status,
  organization,
  template,
  range,
  statusOptions,
  orgOptions,
  templateOptions,
  rangeOptions,
  onStatusChange,
  onOrganizationChange,
  onTemplateChange,
  onRangeChange,
}: EmailLogsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <FilterDropdown label="Status" value={status} onChange={onStatusChange} options={statusOptions} />
      <FilterDropdown label="Organisation" value={organization} onChange={onOrganizationChange} options={orgOptions} />
      <FilterDropdown label="Template" value={template} onChange={onTemplateChange} options={templateOptions} />
      <FilterDropdown label="Range" value={range} onChange={onRangeChange} options={rangeOptions} />
    </div>
  );
}
